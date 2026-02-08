/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add indexes for all foreign keys to improve query performance
    - Optimize RLS policies by using `(select auth.uid())` instead of `auth.uid()`
    - Fix function search_path mutability
  
  2. Security Improvements
    - Consolidate multiple permissive policies into single policies
    - Ensure proper access control while maintaining performance
  
  3. Changes Applied
    - Add 10 foreign key indexes
    - Update 20+ RLS policies for better performance
    - Consolidate 15+ duplicate policies
    - Fix 3 function search paths
*/

-- =============================================
-- PART 1: ADD INDEXES FOR FOREIGN KEYS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_free_trial_requests_user_id 
  ON free_trial_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_free_trial_requests_approved_by 
  ON free_trial_requests(approved_by);

CREATE INDEX IF NOT EXISTS idx_position_credits_user_id 
  ON position_credits(user_id);

CREATE INDEX IF NOT EXISTS idx_positions_account_id 
  ON positions(account_id);

CREATE INDEX IF NOT EXISTS idx_positions_signal_id 
  ON positions(signal_id);

CREATE INDEX IF NOT EXISTS idx_positions_user_id 
  ON positions(user_id);

CREATE INDEX IF NOT EXISTS idx_pre_alerts_signal_id 
  ON pre_alerts(signal_id);

CREATE INDEX IF NOT EXISTS idx_pre_alerts_user_id 
  ON pre_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_referral_links_referred_user_id 
  ON referral_links(referred_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_links_referrer_id 
  ON referral_links(referrer_id);

CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id 
  ON trading_accounts(user_id);

-- =============================================
-- PART 2: FIX FUNCTION SEARCH PATHS
-- =============================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM referral_system WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION create_referral_code_for_user(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code text;
BEGIN
  v_code := generate_referral_code();
  
  INSERT INTO referral_system (user_id, referral_code)
  VALUES (p_user_id, v_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN v_code;
END;
$$;

-- =============================================
-- PART 3: DROP OLD POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can manage own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Super admins can manage all accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Super admins can view all accounts" ON trading_accounts;

DROP POLICY IF EXISTS "Users can view own credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can view all credits" ON position_credits;

DROP POLICY IF EXISTS "Users can manage own positions" ON positions;
DROP POLICY IF EXISTS "Super admins can manage all positions" ON positions;
DROP POLICY IF EXISTS "Super admins can view all positions" ON positions;

DROP POLICY IF EXISTS "Users can view own referral data" ON referral_system;
DROP POLICY IF EXISTS "Super admins can view all referral data" ON referral_system;
DROP POLICY IF EXISTS "Users can create own referral code" ON referral_system;
DROP POLICY IF EXISTS "Users can update own referral data" ON referral_system;
DROP POLICY IF EXISTS "Super admins can manage all referral data" ON referral_system;

DROP POLICY IF EXISTS "Users can view own referral links" ON referral_links;
DROP POLICY IF EXISTS "Super admins can manage all referral links" ON referral_links;

DROP POLICY IF EXISTS "Users can view own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users can create trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Super admins can manage all trial requests" ON free_trial_requests;

DROP POLICY IF EXISTS "Everyone can read admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can manage settings" ON admin_settings;

DROP POLICY IF EXISTS "Users can view own pre-alerts" ON pre_alerts;

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

DROP POLICY IF EXISTS "Authenticated users can view active signals" ON signals;
DROP POLICY IF EXISTS "Super admins can view all signals" ON signals;

-- =============================================
-- PART 4: CREATE OPTIMIZED CONSOLIDATED POLICIES
-- =============================================

-- trading_accounts policies
CREATE POLICY "Users and admins can view accounts"
  ON trading_accounts FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users and admins can insert accounts"
  ON trading_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users and admins can update accounts"
  ON trading_accounts FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users and admins can delete accounts"
  ON trading_accounts FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

-- position_credits policies
CREATE POLICY "Users and admins can view credits"
  ON position_credits FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

-- positions policies
CREATE POLICY "Users and admins can view positions"
  ON positions FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users and admins can insert positions"
  ON positions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users and admins can update positions"
  ON positions FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users and admins can delete positions"
  ON positions FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

-- referral_system policies
CREATE POLICY "Users and admins can view referral data"
  ON referral_system FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users and admins can insert referral data"
  ON referral_system FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users and admins can update referral data"
  ON referral_system FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

-- referral_links policies
CREATE POLICY "Users and admins can view referral links"
  ON referral_links FOR SELECT
  TO authenticated
  USING (
    referrer_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

-- free_trial_requests policies
CREATE POLICY "Users and admins can view trial requests"
  ON free_trial_requests FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users and admins can create trial requests"
  ON free_trial_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()::text::uuid)
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Admins can manage trial requests"
  ON free_trial_requests FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()))
  WITH CHECK ((SELECT is_super_admin()));

-- admin_settings policies
CREATE POLICY "Everyone can read settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON admin_settings FOR ALL
  TO authenticated
  USING ((SELECT is_super_admin()))
  WITH CHECK ((SELECT is_super_admin()));

-- pre_alerts policies
CREATE POLICY "Users can view own pre-alerts"
  ON pre_alerts FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text::uuid));

-- user_profiles policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- signals policies
CREATE POLICY "Users and admins can view signals"
  ON signals FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR (SELECT is_super_admin())
  );

-- =============================================
-- VERIFICATION COMMENTS
-- =============================================

COMMENT ON INDEX idx_free_trial_requests_user_id IS 'Performance: Index for foreign key lookups';
COMMENT ON INDEX idx_position_credits_user_id IS 'Performance: Index for foreign key lookups';
COMMENT ON INDEX idx_positions_user_id IS 'Performance: Index for foreign key lookups';
COMMENT ON INDEX idx_trading_accounts_user_id IS 'Performance: Index for foreign key lookups';
