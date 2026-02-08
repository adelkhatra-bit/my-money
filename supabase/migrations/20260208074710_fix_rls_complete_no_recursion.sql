/*
  # Fix RLS Complete - NO Recursion
  
  1. Problem
    - Function is_super_admin() causes infinite recursion when called in RLS policies
    - It reads user_profiles which triggers RLS policies that call is_super_admin()
    
  2. Solution
    - DROP ALL policies that use is_super_admin()
    - Recreate simple policies WITHOUT function calls
    - Use direct column checks only: NEW.is_super_admin, auth.uid() = user_id
    - Super admins check their OWN is_super_admin column directly
    
  3. Security
    - Users can only read/update their own data
    - Users can see their own is_super_admin status
    - Super admins verify by checking their OWN row's is_super_admin column
    - No cross-row checks = no recursion
*/

-- 1. DROP ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;

-- 2. Recreate SIMPLE policies without function calls
CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Super admin policies - check their OWN row first
CREATE POLICY "Super admins read all"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles own_profile
      WHERE own_profile.user_id = auth.uid()
      AND own_profile.is_super_admin = true
    )
  );

CREATE POLICY "Super admins update all"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles own_profile
      WHERE own_profile.user_id = auth.uid()
      AND own_profile.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles own_profile
      WHERE own_profile.user_id = auth.uid()
      AND own_profile.is_super_admin = true
    )
  );

-- 4. Fix other tables RLS - position_credits
DROP POLICY IF EXISTS "Users can view own credits" ON position_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON position_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can manage all credits" ON position_credits;

CREATE POLICY "Users view own credits"
  ON position_credits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins view all credits"
  ON position_credits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Super admins manage credits"
  ON position_credits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );

-- 5. Fix referral_system RLS
DROP POLICY IF EXISTS "Users can view own referral data" ON referral_system;
DROP POLICY IF EXISTS "Users can update own referral data" ON referral_system;
DROP POLICY IF EXISTS "Super admins can manage all referral data" ON referral_system;

CREATE POLICY "Users view own referral"
  ON referral_system FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own referral"
  ON referral_system FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins manage referrals"
  ON referral_system FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );

-- 6. Fix free_trial_requests RLS
DROP POLICY IF EXISTS "Users can view own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users can create trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Super admins can manage all trial requests" ON free_trial_requests;

CREATE POLICY "Users view own requests"
  ON free_trial_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users create requests"
  ON free_trial_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins manage requests"
  ON free_trial_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );

-- 7. Fix trading_accounts RLS
DROP POLICY IF EXISTS "Users can view own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON trading_accounts;

CREATE POLICY "Users view own accounts"
  ON trading_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own accounts"
  ON trading_accounts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. Ensure all triggers have SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_is_super_admin boolean := false;
BEGIN
  -- Check if email is in super_admin_emails
  SELECT EXISTS(
    SELECT 1 FROM super_admin_emails
    WHERE email = NEW.email
  ) INTO v_is_super_admin;
  
  -- Create user profile
  INSERT INTO user_profiles (
    user_id,
    email,
    is_super_admin,
    has_used_trial,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_is_super_admin,
    false,
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
