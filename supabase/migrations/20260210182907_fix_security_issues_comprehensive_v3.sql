/*
  # Fix Security and Performance Issues - Comprehensive

  ## 1. Add Missing Indexes on Foreign Keys
    - `admin_logs.target_user_id` - for user lookup in admin logs
    - `free_trial_requests.handled_by` - for admin query performance
    - `future_entries.account_id` - for account-based queries
    - `future_entries.user_id` - for user-based queries
    - `position_history.position_id` - for position history lookups
    - `positions.signal_id` - for signal-based position queries
    - `referrals.referred_id` - for referral tracking
    - `user_preferences.active_account_id` - for account preferences

  ## 2. Optimize RLS Policies
    - Fix `admin_logs` policies to use `(select auth.uid())`
    - Fix `position_history` policies to use `(select auth.uid())`
    - Fix `topstep_connections` policies to use `(select auth.uid())`

  ## 3. Fix Function Security
    - Add `SET search_path = public` to all functions to prevent search path hijacking

  ## Notes
    - Unused indexes are kept as they may be used in the future
    - Auth DB connection strategy requires manual configuration in Supabase dashboard
    - Leaked password protection should be enabled in Auth settings
*/

-- ============================================================================
-- STEP 1: Add Missing Indexes on Foreign Keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user_id 
ON public.admin_logs(target_user_id);

CREATE INDEX IF NOT EXISTS idx_free_trial_requests_handled_by 
ON public.free_trial_requests(handled_by);

CREATE INDEX IF NOT EXISTS idx_future_entries_account_id 
ON public.future_entries(account_id);

CREATE INDEX IF NOT EXISTS idx_future_entries_user_id 
ON public.future_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_position_history_position_id 
ON public.position_history(position_id);

CREATE INDEX IF NOT EXISTS idx_positions_signal_id 
ON public.positions(signal_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referred_id 
ON public.referrals(referred_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_active_account_id 
ON public.user_preferences(active_account_id);

-- ============================================================================
-- STEP 2: Optimize RLS Policies - admin_logs
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can view all logs" ON public.admin_logs;
CREATE POLICY "Super admins can view all logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can create logs" ON public.admin_logs;
CREATE POLICY "Super admins can create logs"
  ON public.admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- ============================================================================
-- STEP 3: Optimize RLS Policies - position_history
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own position history" ON public.position_history;
CREATE POLICY "Users can view own position history"
  ON public.position_history
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "System can insert position history" ON public.position_history;
CREATE POLICY "System can insert position history"
  ON public.position_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- STEP 4: Optimize RLS Policies - topstep_connections
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own connections" ON public.topstep_connections;
CREATE POLICY "Users can view own connections"
  ON public.topstep_connections
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own connections" ON public.topstep_connections;
CREATE POLICY "Users can insert own connections"
  ON public.topstep_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own connections" ON public.topstep_connections;
CREATE POLICY "Users can update own connections"
  ON public.topstep_connections
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own connections" ON public.topstep_connections;
CREATE POLICY "Users can delete own connections"
  ON public.topstep_connections
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- STEP 5: Drop triggers that depend on functions
-- ============================================================================

DROP TRIGGER IF EXISTS check_single_open_position ON public.positions;

-- ============================================================================
-- STEP 6: Drop and recreate functions with proper search_path
-- ============================================================================

DROP FUNCTION IF EXISTS public.reset_user_credits(uuid);
CREATE FUNCTION public.reset_user_credits(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
  SET position_credits = 3
  WHERE id = target_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.create_position_with_lock(uuid, uuid, text, text, numeric, integer, numeric, numeric, uuid);
CREATE FUNCTION public.create_position_with_lock(
  p_user_id uuid,
  p_account_id uuid,
  p_symbol text,
  p_direction text,
  p_entry_price numeric,
  p_position_size integer,
  p_stop_loss numeric DEFAULT NULL,
  p_take_profit numeric DEFAULT NULL,
  p_signal_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position_id uuid;
  v_result json;
BEGIN
  INSERT INTO public.positions (
    user_id,
    account_id,
    symbol,
    direction,
    entry_price,
    position_size,
    stop_loss,
    take_profit,
    signal_id,
    status
  ) VALUES (
    p_user_id,
    p_account_id,
    p_symbol,
    p_direction,
    p_entry_price,
    p_position_size,
    p_stop_loss,
    p_take_profit,
    p_signal_id,
    'open'
  )
  RETURNING id INTO v_position_id;

  SELECT json_build_object(
    'success', true,
    'position_id', v_position_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

DROP FUNCTION IF EXISTS public.calculate_position_pnl(uuid, numeric);
CREATE FUNCTION public.calculate_position_pnl(
  position_id uuid,
  current_price numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_price numeric;
  v_direction text;
  v_position_size integer;
  v_pnl numeric;
BEGIN
  SELECT entry_price, direction, position_size
  INTO v_entry_price, v_direction, v_position_size
  FROM public.positions
  WHERE id = position_id;

  IF v_direction = 'long' THEN
    v_pnl := (current_price - v_entry_price) * v_position_size;
  ELSE
    v_pnl := (v_entry_price - current_price) * v_position_size;
  END IF;

  RETURN v_pnl;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_reset_user_positions(uuid);
CREATE FUNCTION public.admin_reset_user_positions(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.positions WHERE user_id = target_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_reset_user_wallet(uuid, numeric);
CREATE FUNCTION public.admin_reset_user_wallet(
  target_user_id uuid,
  new_balance numeric DEFAULT 10000
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.trading_accounts
  SET balance = new_balance
  WHERE user_id = target_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_force_close_position(uuid, numeric);
CREATE FUNCTION public.admin_force_close_position(
  position_id uuid,
  close_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.positions
  SET 
    status = 'closed',
    exit_price = close_price,
    closed_at = now()
  WHERE id = position_id;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_get_system_stats();
CREATE FUNCTION public.admin_get_system_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.user_profiles),
    'active_positions', (SELECT COUNT(*) FROM public.positions WHERE status = 'open'),
    'total_positions', (SELECT COUNT(*) FROM public.positions),
    'pending_trials', (SELECT COUNT(*) FROM public.free_trial_requests WHERE status = 'pending')
  ) INTO v_result;

  RETURN v_result;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_reset_account(uuid);
CREATE FUNCTION public.admin_reset_account(target_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.positions WHERE account_id = target_account_id;
  UPDATE public.trading_accounts SET balance = 10000 WHERE id = target_account_id;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_purge_old_signals(integer);
CREATE FUNCTION public.admin_purge_old_signals(days_old integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.signal_history
  WHERE created_at < NOW() - (days_old || ' days')::interval;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

DROP FUNCTION IF EXISTS public.cleanup_ghost_positions();
CREATE FUNCTION public.cleanup_ghost_positions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.positions
  WHERE status = 'open'
  AND created_at < NOW() - interval '7 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

DROP FUNCTION IF EXISTS public.ensure_single_open_position();
CREATE FUNCTION public.ensure_single_open_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'open' THEN
    UPDATE public.positions
    SET status = 'closed', exit_price = NEW.entry_price, closed_at = NOW()
    WHERE user_id = NEW.user_id
    AND account_id = NEW.account_id
    AND symbol = NEW.symbol
    AND status = 'open'
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.request_free_trial(text, text, text);
CREATE FUNCTION public.request_free_trial(
  p_email text,
  p_full_name text,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  INSERT INTO public.free_trial_requests (
    email,
    full_name,
    reason,
    status
  ) VALUES (
    p_email,
    p_full_name,
    p_reason,
    'pending'
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

-- ============================================================================
-- STEP 7: Recreate the trigger
-- ============================================================================

CREATE TRIGGER check_single_open_position
  BEFORE INSERT OR UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_open_position();