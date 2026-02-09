/*
  # Fix Security - Step 4: Fix Function Search Paths

  1. Drop triggers first
  2. Drop and recreate functions with SECURITY DEFINER and explicit search_path
*/

DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;

DROP FUNCTION IF EXISTS clean_expired_future_entries();
DROP FUNCTION IF EXISTS reset_user_positions(UUID);
DROP FUNCTION IF EXISTS reset_user_credits(UUID, TEXT);
DROP FUNCTION IF EXISTS reset_trading_accounts(UUID);
DROP FUNCTION IF EXISTS reset_user_data_complete(UUID);
DROP FUNCTION IF EXISTS reset_open_positions_only(UUID);
DROP FUNCTION IF EXISTS create_position_with_lock(UUID, UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS check_user_has_open_position(UUID, UUID);
DROP FUNCTION IF EXISTS get_account_stats(UUID, UUID);
DROP FUNCTION IF EXISTS calculate_position_pnl(TEXT, NUMERIC, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS update_user_preferences_updated_at();
DROP FUNCTION IF EXISTS request_free_trial(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS delete_user_trades(UUID);

CREATE OR REPLACE FUNCTION clean_expired_future_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM future_entries
  WHERE valid_until < now();
END;
$$;

CREATE OR REPLACE FUNCTION reset_user_positions(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM positions WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION reset_user_credits(target_user_id UUID, target_market TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE position_credits
  SET credits_remaining = initial_credits
  WHERE user_id = target_user_id AND market = target_market;
END;
$$;

CREATE OR REPLACE FUNCTION reset_trading_accounts(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE trading_accounts
  SET balance_current = capital
  WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION reset_user_data_complete(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM positions WHERE user_id = target_user_id;
  DELETE FROM signal_history WHERE user_id = target_user_id;
  DELETE FROM action_history WHERE user_id = target_user_id;
  
  UPDATE position_credits
  SET credits_remaining = initial_credits
  WHERE user_id = target_user_id;
  
  UPDATE trading_accounts
  SET balance_current = capital
  WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION reset_open_positions_only(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM positions 
  WHERE user_id = target_user_id 
  AND status = 'OPEN';
END;
$$;

CREATE OR REPLACE FUNCTION create_position_with_lock(
  p_user_id UUID,
  p_account_id UUID,
  p_signal_id UUID,
  p_market TEXT,
  p_platform TEXT,
  p_direction TEXT,
  p_entry_price NUMERIC,
  p_stop_loss NUMERIC,
  p_take_profit_1 NUMERIC,
  p_take_profit_2 NUMERIC,
  p_position_size NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position_id UUID;
  v_has_open BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM positions 
    WHERE user_id = p_user_id 
    AND account_id = p_account_id 
    AND status = 'OPEN'
  ) INTO v_has_open;
  
  IF v_has_open THEN
    RAISE EXCEPTION 'User already has an open position';
  END IF;
  
  INSERT INTO positions (
    user_id, account_id, signal_id, market, platform, direction,
    entry_price, stop_loss, take_profit_1, take_profit_2, position_size, status
  ) VALUES (
    p_user_id, p_account_id, p_signal_id, p_market, p_platform, p_direction,
    p_entry_price, p_stop_loss, p_take_profit_1, p_take_profit_2, p_position_size, 'OPEN'
  )
  RETURNING id INTO v_position_id;
  
  RETURN v_position_id;
END;
$$;

CREATE OR REPLACE FUNCTION check_user_has_open_position(target_user_id UUID, target_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM positions 
    WHERE user_id = target_user_id 
    AND account_id = target_account_id 
    AND status = 'OPEN'
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_account_stats(target_user_id UUID, target_account_id UUID)
RETURNS TABLE(
  total_trades BIGINT,
  wins BIGINT,
  losses BIGINT,
  total_pnl NUMERIC,
  win_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_trades,
    COUNT(*) FILTER (WHERE pnl > 0)::BIGINT as wins,
    COUNT(*) FILTER (WHERE pnl < 0)::BIGINT as losses,
    COALESCE(SUM(pnl), 0) as total_pnl,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE pnl > 0)::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 0
    END as win_rate
  FROM positions
  WHERE user_id = target_user_id
    AND account_id = target_account_id
    AND status IN ('CLOSED', 'STOPPED', 'TP1_HIT', 'TP2_HIT', 'SL_HIT')
    AND exit_time IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_position_pnl(
  p_direction TEXT,
  p_entry_price NUMERIC,
  p_exit_price NUMERIC,
  p_position_size NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_direction = 'LONG' THEN
    RETURN (p_exit_price - p_entry_price) * p_position_size;
  ELSE
    RETURN (p_entry_price - p_exit_price) * p_position_size;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION request_free_trial(
  p_user_id UUID,
  p_market TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO free_trial_requests (user_id, market, reason, status)
  VALUES (p_user_id, p_market, p_reason, 'PENDING')
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_user_trades(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM positions WHERE user_id = target_user_id;
  DELETE FROM signal_history WHERE user_id = target_user_id;
  DELETE FROM action_history WHERE user_id = target_user_id;
END;
$$;

CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();
