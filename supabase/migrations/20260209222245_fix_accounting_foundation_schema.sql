/*
  # Fix Accounting Foundation Schema - BLOC B
  
  1. Modifications trading_accounts
    - Ajouter `initial_balance` (numeric) - Capital de départ fixe
    - Ajouter `current_balance` (numeric) - Capital actuel (initial + realized_pnl)
    - Ajouter `total_pnl` (numeric) - Total PnL réalisé cumulé
    - Migrer `capital` → `initial_balance` pour cohérence
  
  2. Modifications positions
    - Ajouter `unrealized_pnl` (numeric) - PnL non réalisé (calcul temps réel)
    - Standardiser status : OPEN, CLOSED, STOPPED
    - Vérifier closed_at existe
  
  3. Création position_history
    - Historique complet des positions fermées
    - Permet audit et reconstruction stats
    - Timestamp + raison de clôture
  
  4. Nettoyage
    - Fonction cleanup automatique des positions incohérentes
    - Garantie une seule position OPEN par compte
  
  IMPORTANT:
  - Migration non destructive
  - Données existantes préservées
  - Valeurs par défaut sécurisées
*/

-- =====================================================
-- 1. MODIFICATIONS TRADING_ACCOUNTS
-- =====================================================

-- Ajouter colonnes manquantes (si elles n'existent pas déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trading_accounts' AND column_name = 'initial_balance'
  ) THEN
    ALTER TABLE trading_accounts ADD COLUMN initial_balance numeric DEFAULT 0;
    
    -- Migrer capital → initial_balance pour comptes existants
    UPDATE trading_accounts SET initial_balance = capital WHERE initial_balance = 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trading_accounts' AND column_name = 'current_balance'
  ) THEN
    ALTER TABLE trading_accounts ADD COLUMN current_balance numeric DEFAULT 0;
    
    -- Initialiser current_balance = initial_balance pour comptes existants
    UPDATE trading_accounts SET current_balance = initial_balance WHERE current_balance = 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trading_accounts' AND column_name = 'total_pnl'
  ) THEN
    ALTER TABLE trading_accounts ADD COLUMN total_pnl numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trading_accounts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE trading_accounts ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- =====================================================
-- 2. MODIFICATIONS POSITIONS
-- =====================================================

-- Ajouter unrealized_pnl si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'unrealized_pnl'
  ) THEN
    ALTER TABLE positions ADD COLUMN unrealized_pnl numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE positions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE positions ADD COLUMN closed_at timestamptz;
  END IF;
END $$;

-- Standardiser les status existants (minuscules → MAJUSCULES)
UPDATE positions SET status = 'OPEN' WHERE LOWER(status) = 'open' AND status != 'OPEN';
UPDATE positions SET status = 'CLOSED' WHERE LOWER(status) = 'closed' AND status != 'CLOSED';
UPDATE positions SET status = 'STOPPED' WHERE LOWER(status) = 'stopped' AND status != 'STOPPED';

-- =====================================================
-- 3. CRÉATION TABLE POSITION_HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS position_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id uuid REFERENCES positions(id) ON DELETE CASCADE,
  account_id uuid REFERENCES trading_accounts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  market text NOT NULL,
  platform text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry_price numeric NOT NULL,
  exit_price numeric NOT NULL,
  position_size numeric NOT NULL,
  realized_pnl numeric NOT NULL,
  close_reason text NOT NULL,
  tp1_reached boolean DEFAULT false,
  be_moved boolean DEFAULT false,
  entry_time timestamptz NOT NULL,
  closed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_position_history_account ON position_history(account_id);
CREATE INDEX IF NOT EXISTS idx_position_history_closed ON position_history(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_position_history_user ON position_history(user_id);

-- RLS pour position_history
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own position history"
  ON position_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert position history"
  ON position_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. FONCTION NETTOYAGE AUTOMATIQUE
-- =====================================================

-- Fonction pour nettoyer les positions incohérentes
CREATE OR REPLACE FUNCTION cleanup_ghost_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Marquer comme CLOSED les positions avec exit_price mais status = OPEN
  UPDATE positions
  SET 
    status = 'CLOSED',
    closed_at = COALESCE(closed_at, exit_time, now())
  WHERE status = 'OPEN' 
    AND exit_price IS NOT NULL;
  
  -- Marquer comme CLOSED les positions très anciennes (>7 jours) encore OPEN
  UPDATE positions
  SET 
    status = 'CLOSED',
    close_reason = 'AUTO_CLEANUP',
    closed_at = now()
  WHERE status = 'OPEN' 
    AND entry_time < now() - INTERVAL '7 days';
    
  RAISE NOTICE 'Nettoyage positions fantômes effectué';
END;
$$;

-- Fonction pour garantir UNE SEULE position OPEN par compte
CREATE OR REPLACE FUNCTION ensure_single_open_position()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  existing_count integer;
BEGIN
  IF NEW.status = 'OPEN' THEN
    SELECT COUNT(*) INTO existing_count
    FROM positions
    WHERE account_id = NEW.account_id
      AND status = 'OPEN'
      AND id != NEW.id;
    
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'Une position est déjà ouverte pour ce compte. Fermez-la avant d''en ouvrir une nouvelle.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour vérifier au INSERT et UPDATE
DROP TRIGGER IF EXISTS check_single_open_position ON positions;
CREATE TRIGGER check_single_open_position
  BEFORE INSERT OR UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_open_position();

-- =====================================================
-- 5. INDEX PERFORMANCE
-- =====================================================

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_positions_status_account ON positions(account_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_status_user ON positions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_active ON trading_accounts(user_id, is_active);
