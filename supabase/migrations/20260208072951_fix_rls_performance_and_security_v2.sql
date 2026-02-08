/*
  # Fix RLS Performance and Security Issues

  1. Performance Optimization
    - Update all RLS policies to use `(SELECT auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation of auth functions for each row
    - Dramatically improves query performance at scale
    
  2. Index Cleanup
    - Remove unused indexes that provide no query benefit
    - Reduces storage overhead and write performance impact
    
  3. Policy Consolidation
    - Remove duplicate permissive policies on same table/role/action
    - Simplify policy evaluation and improve clarity
    
  4. Function Security
    - Fix search_path on functions to prevent security vulnerabilities
    
  5. Tables Updated
    - trading_accounts: 4 policies optimized
    - position_credits: 4 policies optimized
    - positions: 4 policies optimized
    - referral_system: 5 policies optimized (consolidated from 5 to 3)
    - referral_links: 1 policy optimized
    - free_trial_requests: 3 policies optimized
    - pre_alerts: 1 policy optimized
    - user_profiles: 1 policy optimized
    - admin_settings: 2 policies consolidated
*/

-- =====================================================
-- STEP 1: Fix trading_accounts RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can view accounts" ON trading_accounts;
CREATE POLICY "Users and admins can view accounts"
  ON trading_accounts
  FOR SELECT
  TO authenticated
  USING (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

DROP POLICY IF EXISTS "Users and admins can insert accounts" ON trading_accounts;
CREATE POLICY "Users and admins can insert accounts"
  ON trading_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

DROP POLICY IF EXISTS "Users and admins can update accounts" ON trading_accounts;
CREATE POLICY "Users and admins can update accounts"
  ON trading_accounts
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  )
  WITH CHECK (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

DROP POLICY IF EXISTS "Users and admins can delete accounts" ON trading_accounts;
CREATE POLICY "Users and admins can delete accounts"
  ON trading_accounts
  FOR DELETE
  TO authenticated
  USING (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

-- =====================================================
-- STEP 2: Fix position_credits RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can view credits" ON position_credits;
CREATE POLICY "Users and admins can view credits"
  ON position_credits
  FOR SELECT
  TO authenticated
  USING (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

DROP POLICY IF EXISTS "Super admins can insert credits" ON position_credits;
CREATE POLICY "Super admins can insert credits"
  ON position_credits
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()));

DROP POLICY IF EXISTS "Super admins can update credits" ON position_credits;
CREATE POLICY "Super admins can update credits"
  ON position_credits
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()))
  WITH CHECK ((SELECT is_super_admin()));

DROP POLICY IF EXISTS "Super admins can delete credits" ON position_credits;
CREATE POLICY "Super admins can delete credits"
  ON position_credits
  FOR DELETE
  TO authenticated
  USING ((SELECT is_super_admin()));

-- =====================================================
-- STEP 3: Fix positions RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can view positions" ON positions;
CREATE POLICY "Users and admins can view positions"
  ON positions
  FOR SELECT
  TO authenticated
  USING (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

DROP POLICY IF EXISTS "Users and admins can insert positions" ON positions;
CREATE POLICY "Users and admins can insert positions"
  ON positions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

DROP POLICY IF EXISTS "Users and admins can update positions" ON positions;
CREATE POLICY "Users and admins can update positions"
  ON positions
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  )
  WITH CHECK (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

DROP POLICY IF EXISTS "Users and admins can delete positions" ON positions;
CREATE POLICY "Users and admins can delete positions"
  ON positions
  FOR DELETE
  TO authenticated
  USING (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

-- =====================================================
-- STEP 4: Fix referral_system RLS policies and consolidate duplicates
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can view referral data" ON referral_system;
DROP POLICY IF EXISTS "Users and admins can insert referral data" ON referral_system;
DROP POLICY IF EXISTS "Users and admins can update referral data" ON referral_system;
DROP POLICY IF EXISTS "Users can insert own referral data" ON referral_system;
DROP POLICY IF EXISTS "Users can update own referral data" ON referral_system;

CREATE POLICY "Users can view own referral data"
  ON referral_system
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can insert own referral data"
  ON referral_system
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can update own referral data"
  ON referral_system
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR (SELECT is_super_admin())
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR (SELECT is_super_admin())
  );

-- =====================================================
-- STEP 5: Fix referral_links RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can view referral links" ON referral_links;
CREATE POLICY "Users and admins can view referral links"
  ON referral_links
  FOR SELECT
  TO authenticated
  USING (
    (referrer_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

-- =====================================================
-- STEP 6: Fix free_trial_requests RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can view trial requests" ON free_trial_requests;
CREATE POLICY "Users and admins can view trial requests"
  ON free_trial_requests
  FOR SELECT
  TO authenticated
  USING (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

DROP POLICY IF EXISTS "Users and admins can create trial requests" ON free_trial_requests;
CREATE POLICY "Users and admins can create trial requests"
  ON free_trial_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = (SELECT ((auth.uid())::text)::uuid)) 
    OR (SELECT is_super_admin())
  );

DROP POLICY IF EXISTS "Admins can manage trial requests" ON free_trial_requests;
CREATE POLICY "Admins can manage trial requests"
  ON free_trial_requests
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()))
  WITH CHECK ((SELECT is_super_admin()));

-- =====================================================
-- STEP 7: Fix pre_alerts RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view own pre-alerts" ON pre_alerts;
CREATE POLICY "Users can view own pre-alerts"
  ON pre_alerts
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT ((auth.uid())::text)::uuid));

-- =====================================================
-- STEP 8: Fix user_profiles RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- STEP 9: Fix admin_settings duplicate policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage settings" ON admin_settings;
DROP POLICY IF EXISTS "Everyone can read settings" ON admin_settings;

CREATE POLICY "Everyone can read settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING ((SELECT is_super_admin()))
  WITH CHECK ((SELECT is_super_admin()));

-- =====================================================
-- STEP 10: Remove unused indexes
-- =====================================================

DROP INDEX IF EXISTS idx_free_trial_requests_user_id;
DROP INDEX IF EXISTS idx_free_trial_requests_approved_by;
DROP INDEX IF EXISTS idx_position_credits_user_id;
DROP INDEX IF EXISTS idx_positions_account_id;
DROP INDEX IF EXISTS idx_positions_signal_id;
DROP INDEX IF EXISTS idx_positions_user_id;
DROP INDEX IF EXISTS idx_pre_alerts_signal_id;
DROP INDEX IF EXISTS idx_pre_alerts_user_id;
DROP INDEX IF EXISTS idx_referral_links_referred_user_id;
DROP INDEX IF EXISTS idx_referral_links_referrer_id;
DROP INDEX IF EXISTS idx_trading_accounts_user_id;

-- =====================================================
-- STEP 11: Fix function search_path security
-- =====================================================

DROP FUNCTION IF EXISTS public.create_referral_code_for_user(uuid);

CREATE OR REPLACE FUNCTION public.create_referral_code_for_user(p_user_id uuid)
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
