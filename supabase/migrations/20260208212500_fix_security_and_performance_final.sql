/*
  # Fix All Security and Performance Issues - Final

  ## 1. Add Missing Indexes on Foreign Keys
  ## 2. Optimize RLS Policies (Auth Function Initialization)
  ## 3. Remove Unused Indexes
  ## 4. Remove Duplicate Indexes
  ## 5. Fix Function Search Path Issues
  ## 6. Fix RLS Policy Always True for referrals
*/

-- =====================================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_free_trial_requests_handled_by 
  ON public.free_trial_requests(handled_by);

CREATE INDEX IF NOT EXISTS idx_positions_account_id 
  ON public.positions(account_id);

CREATE INDEX IF NOT EXISTS idx_positions_signal_id 
  ON public.positions(signal_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referred_id 
  ON public.referrals(referred_id);

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_signal_history_signal_id;
DROP INDEX IF EXISTS public.idx_signal_history_user_id;
DROP INDEX IF EXISTS public.idx_action_history_user_id;
DROP INDEX IF EXISTS public.idx_action_history_created_at;
DROP INDEX IF EXISTS public.idx_action_history_action_type;

-- =====================================================
-- 3. REMOVE DUPLICATE INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_position_credits_user_market;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - admin_settings
-- =====================================================

DROP POLICY IF EXISTS "Super admins can manage all settings" ON public.admin_settings;

CREATE POLICY "Super admins can manage all settings"
  ON public.admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 5. OPTIMIZE RLS POLICIES - free_trial_requests
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own trial requests" ON public.free_trial_requests;
DROP POLICY IF EXISTS "Super admins can manage all trial requests" ON public.free_trial_requests;

CREATE POLICY "Users can manage own trial requests"
  ON public.free_trial_requests
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Super admins can manage all trial requests"
  ON public.free_trial_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 6. OPTIMIZE RLS POLICIES - position_credits
-- =====================================================

DROP POLICY IF EXISTS "Users can view own credits" ON public.position_credits;
DROP POLICY IF EXISTS "Super admins can manage all credits" ON public.position_credits;

CREATE POLICY "Users can view own credits"
  ON public.position_credits
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Super admins can manage all credits"
  ON public.position_credits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 7. OPTIMIZE RLS POLICIES - referrals
-- =====================================================

DROP POLICY IF EXISTS "Users can view related referrals" ON public.referrals;
DROP POLICY IF EXISTS "Super admins can manage all referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;

CREATE POLICY "Users can view related referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (referrer_id = (select auth.uid()) OR referred_id = (select auth.uid()));

CREATE POLICY "Users can create referrals"
  ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referrer_id = (select auth.uid()));

CREATE POLICY "Super admins can manage all referrals"
  ON public.referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 8. OPTIMIZE RLS POLICIES - signal_history
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own signal history" ON public.signal_history;
DROP POLICY IF EXISTS "Super admins can manage all signal history" ON public.signal_history;

CREATE POLICY "Users can manage own signal history"
  ON public.signal_history
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Super admins can manage all signal history"
  ON public.signal_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 9. OPTIMIZE RLS POLICIES - signals
-- =====================================================

DROP POLICY IF EXISTS "Super admins can manage all signals" ON public.signals;

CREATE POLICY "Super admins can manage all signals"
  ON public.signals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 10. OPTIMIZE RLS POLICIES - user_profiles
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 11. OPTIMIZE RLS POLICIES - action_history
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own action history" ON public.action_history;
DROP POLICY IF EXISTS "Users can read own action history" ON public.action_history;
DROP POLICY IF EXISTS "Super admins can read all action history" ON public.action_history;

CREATE POLICY "Users can insert own action history"
  ON public.action_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own action history"
  ON public.action_history
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Super admins can read all action history"
  ON public.action_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 12. OPTIMIZE RLS POLICIES - trading_accounts
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own trading accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Super admins can manage all trading accounts" ON public.trading_accounts;

CREATE POLICY "Users can manage own trading accounts"
  ON public.trading_accounts
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Super admins can manage all trading accounts"
  ON public.trading_accounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 13. OPTIMIZE RLS POLICIES - user_settings
-- =====================================================

DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

CREATE POLICY "Users can read own settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 14. OPTIMIZE RLS POLICIES - positions
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own positions" ON public.positions;
DROP POLICY IF EXISTS "Super admins can manage all positions" ON public.positions;

CREATE POLICY "Users can manage own positions"
  ON public.positions
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Super admins can manage all positions"
  ON public.positions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 15. FIX FUNCTION SEARCH PATH ISSUES
-- =====================================================

DROP FUNCTION IF EXISTS public.get_user_stats(uuid);

CREATE FUNCTION public.get_user_stats(p_user_id uuid)
RETURNS TABLE (
  total_positions bigint,
  open_positions bigint,
  closed_positions bigint,
  total_pnl numeric,
  win_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_positions,
    COUNT(*) FILTER (WHERE status = 'OPEN')::bigint as open_positions,
    COUNT(*) FILTER (WHERE status IN ('CLOSED', 'TP1_HIT', 'TP2_HIT', 'SL_HIT'))::bigint as closed_positions,
    COALESCE(SUM(pnl), 0) as total_pnl,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status IN ('CLOSED', 'TP1_HIT', 'TP2_HIT', 'SL_HIT')) > 0 THEN
        (COUNT(*) FILTER (WHERE status IN ('TP1_HIT', 'TP2_HIT') AND pnl > 0)::numeric / 
         COUNT(*) FILTER (WHERE status IN ('CLOSED', 'TP1_HIT', 'TP2_HIT', 'SL_HIT'))::numeric) * 100
      ELSE 0
    END as win_rate
  FROM public.positions
  WHERE user_id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.request_free_trial(text, text);

CREATE FUNCTION public.request_free_trial(
  p_market text,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_request_id uuid;
  v_existing_request uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  SELECT id INTO v_existing_request
  FROM public.free_trial_requests
  WHERE user_id = v_user_id
    AND market = p_market
    AND status = 'PENDING';

  IF v_existing_request IS NOT NULL THEN
    RAISE EXCEPTION 'You already have a pending trial request for this market';
  END IF;

  INSERT INTO public.free_trial_requests (user_id, market, reason, status)
  VALUES (v_user_id, p_market, p_reason, 'PENDING')
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_settings_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
