/*
  # Suppression des positions en doublon + Contraintes

  ## Corrections

  ### 1. Suppression des doublons
  - Identifie et supprime les positions OPEN en doublon
  - Garde uniquement la position la plus récente pour chaque compte/marché
  - Protège contre les futures duplications

  ### 2. Contrainte unique sur positions
  - Ajoute un index unique partiel
  - Une seule position OPEN par compte/marché
  - Empêche la création de nouveaux doublons

  ### 3. Table future_entries
  - Nouvelle table pour les zones d'entrée anticipées
  - Permet de sauvegarder les opportunités futures
  - RLS activé avec policies appropriées
*/

-- Supprimer les positions OPEN en doublon en gardant la plus récente
DELETE FROM positions
WHERE id IN (
  SELECT p1.id
  FROM positions p1
  INNER JOIN (
    SELECT account_id, market, MAX(created_at) as max_created
    FROM positions
    WHERE status = 'OPEN'
    GROUP BY account_id, market
    HAVING COUNT(*) > 1
  ) p2 ON p1.account_id = p2.account_id 
     AND p1.market = p2.market 
     AND p1.created_at < p2.max_created
  WHERE p1.status = 'OPEN'
);

-- Créer un index unique partiel pour éviter les doublons de positions OPEN
CREATE UNIQUE INDEX IF NOT EXISTS unique_open_position_per_account_market 
ON positions (account_id, market, status)
WHERE status = 'OPEN';

-- Créer la table pour les futures zones d'entrée potentielles
CREATE TABLE IF NOT EXISTS future_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  market text NOT NULL,
  platform text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry_min numeric NOT NULL,
  entry_max numeric NOT NULL,
  stop_loss numeric NOT NULL,
  take_profit_1 numeric NOT NULL,
  take_profit_2 numeric,
  confidence numeric DEFAULT 0,
  valid_until timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_entry_zone CHECK (entry_min <= entry_max),
  CONSTRAINT valid_long_setup CHECK (
    (direction = 'LONG' AND take_profit_1 > entry_max AND entry_min > stop_loss) OR
    (direction = 'SHORT' AND take_profit_1 < entry_min AND entry_max < stop_loss)
  )
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_future_entries_user_market 
ON future_entries(user_id, market, valid_until);

CREATE INDEX IF NOT EXISTS idx_future_entries_account 
ON future_entries(account_id, valid_until);

-- RLS sur future_entries
ALTER TABLE future_entries ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: utilisateurs peuvent voir leurs propres entrées
CREATE POLICY "Users can view own future entries"
ON future_entries FOR SELECT
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM user_profiles WHERE id = future_entries.user_id
));

-- Policy INSERT: utilisateurs peuvent créer leurs propres entrées
CREATE POLICY "Users can create own future entries"
ON future_entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM user_profiles WHERE id = future_entries.user_id
));

-- Policy UPDATE: utilisateurs peuvent modifier leurs propres entrées
CREATE POLICY "Users can update own future entries"
ON future_entries FOR UPDATE
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM user_profiles WHERE id = future_entries.user_id
))
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM user_profiles WHERE id = future_entries.user_id
));

-- Policy DELETE: utilisateurs peuvent supprimer leurs propres entrées
CREATE POLICY "Users can delete own future entries"
ON future_entries FOR DELETE
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM user_profiles WHERE id = future_entries.user_id
));

-- Fonction pour nettoyer automatiquement les entrées expirées
CREATE OR REPLACE FUNCTION clean_expired_future_entries()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM future_entries
  WHERE valid_until < now() - interval '24 hours';
END;
$$;
