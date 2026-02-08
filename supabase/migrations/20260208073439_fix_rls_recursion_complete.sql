/*
  # Fix Infinite Recursion in RLS and Super Admin Setup

  1. Problem Fixed
    - Infinite recursion in user_profiles RLS policies
    - "Profil introuvable" error due to RLS recursion
    - Missing super admin setup
    
  2. Solution
    - Drop all policies that depend on is_super_admin()
    - Create secure is_super_admin() function with SECURITY DEFINER
    - Recreate all policies to avoid recursion
    - Create function to set super admin by email
*/

-- =====================================================
-- STEP 1: Drop all policies that use is_super_admin()
-- =====================================================

-- Drop user_profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;

-- Drop trading_accounts policies
DROP POLICY IF EXISTS "Users can manage own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Super admins can view all accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users and admins can view accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users and admins can insert accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users and admins can update accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users and admins can delete accounts" ON trading_accounts;

-- Drop position_credits policies
DROP POLICY IF EXISTS "Users can view own credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can manage all credits" ON position_credits;
DROP POLICY IF EXISTS "Users and admins can view credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can insert credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can update credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can delete credits" ON position_credits;

-- Drop positions policies
DROP POLICY IF EXISTS "Users can manage own positions" ON positions;
DROP POLICY IF EXISTS "Super admins can view all positions" ON positions;
DROP POLICY IF EXISTS "Users and admins can view positions" ON positions;
DROP POLICY IF EXISTS "Users and admins can insert positions" ON positions;
DROP POLICY IF EXISTS "Users and admins can update positions" ON positions;
DROP POLICY IF EXISTS "Users and admins can delete positions" ON positions;

-- Drop signals policies
DROP POLICY IF EXISTS "Authenticated users can view active signals" ON signals;
DROP POLICY IF EXISTS "Super admins can manage all signals" ON signals;
DROP POLICY IF EXISTS "Super admins can insert signals" ON signals;
DROP POLICY IF EXISTS "Super admins can update signals" ON signals;
DROP POLICY IF EXISTS "Super admins can delete signals" ON signals;
DROP POLICY IF EXISTS "Users and admins can view signals" ON signals;

-- Drop referral_system policies
DROP POLICY IF EXISTS "Users can view own referral data" ON referral_system;
DROP POLICY IF EXISTS "Users can insert own referral data" ON referral_system;
DROP POLICY IF EXISTS "Users can update own referral data" ON referral_system;

-- Drop referral_links policies
DROP POLICY IF EXISTS "Users and admins can view referral links" ON referral_links;

-- Drop free_trial_requests policies
DROP POLICY IF EXISTS "Users and admins can view trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users and admins can create trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Admins can manage trial requests" ON free_trial_requests;

-- Drop admin_settings policies
DROP POLICY IF EXISTS "Everyone can read settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON admin_settings;

-- Drop pre_alerts policies
DROP POLICY IF EXISTS "Users can view own pre-alerts" ON pre_alerts;

-- =====================================================
-- STEP 2: Drop and recreate is_super_admin function
-- =====================================================

DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles
    WHERE user_id = auth.uid() 
    AND is_super_admin = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- =====================================================
-- STEP 3: Create function to set super admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_super_admin_by_email(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE user_profiles
  SET is_super_admin = true
  WHERE email = admin_email;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No user found with email: %', admin_email;
  END IF;
END;
$$;

-- =====================================================
-- STEP 4: Recreate user_profiles policies (NO RECURSION)
-- =====================================================

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Super admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT is_super_admin()));

CREATE POLICY "Super admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()))
  WITH CHECK ((SELECT is_super_admin()));

-- =====================================================
-- STEP 5: Recreate trading_accounts policies
-- =====================================================

CREATE POLICY "Users can view own accounts"
  ON trading_accounts
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can insert own accounts"
  ON trading_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can update own accounts"
  ON trading_accounts
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can delete own accounts"
  ON trading_accounts
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

-- =====================================================
-- STEP 6: Recreate position_credits policies
-- =====================================================

CREATE POLICY "Users can view own credits"
  ON position_credits
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Super admins can insert credits"
  ON position_credits
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()));

CREATE POLICY "Super admins can update credits"
  ON position_credits
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()))
  WITH CHECK ((SELECT is_super_admin()));

CREATE POLICY "Super admins can delete credits"
  ON position_credits
  FOR DELETE
  TO authenticated
  USING ((SELECT is_super_admin()));

-- =====================================================
-- STEP 7: Recreate positions policies
-- =====================================================

CREATE POLICY "Users can view own positions"
  ON positions
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can insert own positions"
  ON positions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can update own positions"
  ON positions
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can delete own positions"
  ON positions
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

-- =====================================================
-- STEP 8: Recreate signals policies
-- =====================================================

CREATE POLICY "Authenticated users can view active signals"
  ON signals
  FOR SELECT
  TO authenticated
  USING (status = 'ACTIVE' OR (SELECT is_super_admin()));

CREATE POLICY "Super admins can insert signals"
  ON signals
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_super_admin()));

CREATE POLICY "Super admins can update signals"
  ON signals
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()))
  WITH CHECK ((SELECT is_super_admin()));

CREATE POLICY "Super admins can delete signals"
  ON signals
  FOR DELETE
  TO authenticated
  USING ((SELECT is_super_admin()));

-- =====================================================
-- STEP 9: Recreate referral_system policies
-- =====================================================

CREATE POLICY "Users can view own referral data"
  ON referral_system
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can insert own referral data"
  ON referral_system
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can update own referral data"
  ON referral_system
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

-- =====================================================
-- STEP 10: Recreate referral_links policies
-- =====================================================

CREATE POLICY "Users can view own referral links"
  ON referral_links
  FOR SELECT
  TO authenticated
  USING (
    referrer_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

-- =====================================================
-- STEP 11: Recreate free_trial_requests policies
-- =====================================================

CREATE POLICY "Users can view own trial requests"
  ON free_trial_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
    OR (SELECT is_super_admin())
  );

CREATE POLICY "Users can create trial requests"
  ON free_trial_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Admins can manage trial requests"
  ON free_trial_requests
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_super_admin()))
  WITH CHECK ((SELECT is_super_admin()));

-- =====================================================
-- STEP 12: Recreate pre_alerts policies
-- =====================================================

CREATE POLICY "Users can view own pre-alerts"
  ON pre_alerts
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid()))
  );

-- =====================================================
-- STEP 13: Recreate admin_settings policies
-- =====================================================

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
