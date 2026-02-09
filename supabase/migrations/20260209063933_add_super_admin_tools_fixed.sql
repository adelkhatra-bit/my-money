/*
  # Super Admin Tools - Fonctions de gestion complètes

  1. Nouvelles fonctions RPC
    - `admin_reset_user_positions` - Supprime toutes les positions d'un utilisateur
    - `admin_reset_user_wallet` - Remet à zéro et recalcule le wallet d'un utilisateur
    - `admin_force_close_position` - Ferme une position de force
    - `admin_get_system_stats` - Récupère les statistiques système globales
    - `admin_reset_account` - Reset complet d'un compte trading
    - `admin_purge_old_signals` - Nettoie les anciens signaux expirés

  2. Sécurité
    - Toutes les fonctions requièrent is_super_admin = true
    - Logs d'audit pour toutes les actions admin
*/

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  details text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view all logs" ON admin_logs;
CREATE POLICY "Super admins can view all logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can create logs" ON admin_logs;
CREATE POLICY "Super admins can create logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );

CREATE OR REPLACE FUNCTION admin_reset_user_positions(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count int;
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Accès refusé: super_admin requis';
  END IF;

  DELETE FROM positions
  WHERE user_id = target_user_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM position_history
  WHERE user_id = target_user_id;

  result := json_build_object(
    'success', true,
    'deleted_positions', deleted_count,
    'user_id', target_user_id
  );

  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'reset_user_positions', target_user_id, result::text);

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_reset_user_wallet(target_user_id uuid, target_market text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Accès refusé: super_admin requis';
  END IF;

  UPDATE user_wallets
  SET credits = 0
  WHERE user_id = target_user_id
  AND market = target_market;

  DELETE FROM credit_transactions
  WHERE user_id = target_user_id
  AND market = target_market;

  result := json_build_object(
    'success', true,
    'user_id', target_user_id,
    'market', target_market
  );

  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'reset_user_wallet', target_user_id, result::text);

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_force_close_position(position_id uuid, exit_price numeric, close_reason text DEFAULT 'ADMIN_FORCE')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pos record;
  realized_pnl numeric;
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Accès refusé: super_admin requis';
  END IF;

  SELECT * INTO pos FROM positions WHERE id = position_id;

  IF pos IS NULL THEN
    RAISE EXCEPTION 'Position non trouvée';
  END IF;

  IF pos.status != 'open' THEN
    RAISE EXCEPTION 'Position déjà fermée';
  END IF;

  IF pos.direction = 'LONG' THEN
    realized_pnl := (exit_price - pos.entry_price) * pos.position_size;
  ELSE
    realized_pnl := (pos.entry_price - exit_price) * pos.position_size;
  END IF;

  UPDATE positions
  SET
    status = 'closed',
    exit_price = exit_price,
    realized_pnl = realized_pnl,
    close_reason = close_reason,
    closed_at = now(),
    updated_at = now()
  WHERE id = position_id;

  INSERT INTO position_history (
    position_id, account_id, market, platform, direction,
    entry_price, exit_price, position_size, realized_pnl, close_reason, closed_at
  )
  VALUES (
    pos.id, pos.account_id, pos.market, pos.platform, pos.direction,
    pos.entry_price, exit_price, pos.position_size, realized_pnl, close_reason, now()
  );

  result := json_build_object(
    'success', true,
    'position_id', position_id,
    'realized_pnl', realized_pnl,
    'close_reason', close_reason
  );

  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'force_close_position', pos.user_id, result::text);

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_get_system_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  total_users int;
  total_accounts int;
  total_positions int;
  open_positions int;
  total_trades int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Accès refusé: super_admin requis';
  END IF;

  SELECT COUNT(*) INTO total_users FROM user_profiles;
  SELECT COUNT(*) INTO total_accounts FROM trading_accounts WHERE status = 'active';
  SELECT COUNT(*) INTO total_positions FROM positions;
  SELECT COUNT(*) INTO open_positions FROM positions WHERE status = 'open';
  SELECT COUNT(*) INTO total_trades FROM positions WHERE status = 'closed';

  result := json_build_object(
    'total_users', total_users,
    'total_accounts', total_accounts,
    'total_positions', total_positions,
    'open_positions', open_positions,
    'total_trades', total_trades,
    'timestamp', now()
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_reset_account(account_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  account record;
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Accès refusé: super_admin requis';
  END IF;

  SELECT * INTO account FROM trading_accounts WHERE id = account_id;

  IF account IS NULL THEN
    RAISE EXCEPTION 'Compte non trouvé';
  END IF;

  DELETE FROM positions WHERE account_id = account_id;
  DELETE FROM position_history WHERE account_id = account_id;

  UPDATE trading_accounts
  SET
    current_balance = initial_balance,
    total_pnl = 0,
    updated_at = now()
  WHERE id = account_id;

  result := json_build_object(
    'success', true,
    'account_id', account_id,
    'market', account.market,
    'platform', account.platform
  );

  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'reset_account', account.user_id, result::text);

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_purge_old_signals(days_old int DEFAULT 7)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count int;
  result json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_super_admin = true) THEN
    RAISE EXCEPTION 'Accès refusé: super_admin requis';
  END IF;

  DELETE FROM signal_history
  WHERE created_at < (now() - (days_old || ' days')::interval);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  result := json_build_object(
    'success', true,
    'deleted_signals', deleted_count,
    'days_old', days_old
  );

  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'purge_old_signals', NULL, result::text);

  RETURN result;
END;
$$;