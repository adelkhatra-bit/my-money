/*
  # Création table user_preferences et amélioration positions

  1. Nouvelle table user_preferences
    - Sauvegarde compte actif, marché, plateforme, timeframe
    - Persiste entre les sessions
    - RLS: user peut lire/modifier uniquement ses préférences

  2. Ajout colonnes positions
    - realized_pnl: PnL réalisé à la clôture
    - be_moved: flag si SL déplacé au break-even
    - tp1_reached: flag si TP1 atteint

  3. Index performance
    - Index sur (user_id, status) pour requêtes positions ouvertes
    - Index sur (user_id, account_id, status) pour historique

  4. Sécurité
    - RLS strict sur user_preferences
    - Fonction helper pour vérifier position unique
*/

-- Table user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_account_id UUID REFERENCES trading_accounts(id) ON DELETE SET NULL,
  last_market TEXT DEFAULT 'BTC',
  last_platform TEXT DEFAULT 'binance',
  last_timeframe TEXT DEFAULT '5m',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_account ON user_preferences(active_account_id);

-- Colonnes supplémentaires positions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'realized_pnl'
  ) THEN
    ALTER TABLE positions ADD COLUMN realized_pnl DECIMAL(20, 8) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'be_moved'
  ) THEN
    ALTER TABLE positions ADD COLUMN be_moved BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'tp1_reached'
  ) THEN
    ALTER TABLE positions ADD COLUMN tp1_reached BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'tp1_reached_at'
  ) THEN
    ALTER TABLE positions ADD COLUMN tp1_reached_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'close_reason'
  ) THEN
    ALTER TABLE positions ADD COLUMN close_reason TEXT;
  END IF;
END $$;

-- Index positions pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_positions_user_status ON positions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_user_account_status ON positions(user_id, account_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_exit_time ON positions(exit_time DESC NULLS LAST);

-- RLS user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own preferences" ON user_preferences;
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction: vérifier position unique
CREATE OR REPLACE FUNCTION check_user_has_open_position(p_user_id UUID, p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM positions
  WHERE user_id = p_user_id
    AND account_id = p_account_id
    AND status = 'OPEN';
  
  RETURN v_count > 0;
END;
$$;

-- Fonction: obtenir stats compte
CREATE OR REPLACE FUNCTION get_account_stats(p_user_id UUID, p_account_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_trades', COUNT(*),
    'wins', COUNT(*) FILTER (WHERE realized_pnl > 0),
    'losses', COUNT(*) FILTER (WHERE realized_pnl < 0),
    'total_gains', COALESCE(SUM(realized_pnl) FILTER (WHERE realized_pnl > 0), 0),
    'total_losses', COALESCE(ABS(SUM(realized_pnl)) FILTER (WHERE realized_pnl < 0), 0),
    'realized_pnl', COALESCE(SUM(realized_pnl), 0),
    'winrate', CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE realized_pnl > 0)::DECIMAL / COUNT(*)) * 100, 1)
      ELSE 0 
    END
  )
  INTO v_stats
  FROM positions
  WHERE user_id = p_user_id
    AND account_id = p_account_id
    AND status IN ('CLOSED', 'STOPPED');
  
  RETURN v_stats;
END;
$$;

-- Fonction: calculer PnL position ouverte
CREATE OR REPLACE FUNCTION calculate_position_pnl(
  p_entry_price DECIMAL,
  p_current_price DECIMAL,
  p_direction TEXT,
  p_quantity DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_pnl DECIMAL;
BEGIN
  IF p_direction = 'LONG' THEN
    v_pnl := (p_current_price - p_entry_price) * p_quantity;
  ELSE
    v_pnl := (p_entry_price - p_current_price) * p_quantity;
  END IF;
  
  RETURN v_pnl;
END;
$$;

-- Trigger: update updated_at sur user_preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();
