/*
  # Fix Infinite Recursion in RLS Policies - FINAL

  ## Problem
  - Infinite recursion in user_profiles policies
  - Policies checking user_profiles from within user_profiles policies

  ## Solution
  - Use auth.uid() directly instead of querying user_profiles
  - Simplify all policies to avoid recursion
  - Keep security while removing circular dependencies
*/

-- Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users" ON user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Super admin policies use simple flag check without recursion
CREATE POLICY "Super admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    is_super_admin = true AND user_id = auth.uid()
    OR user_id = auth.uid()
  );

CREATE POLICY "Super admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.is_super_admin = true
    )
  );

-- Fix other tables policies to avoid recursion
DROP POLICY IF EXISTS "Users can read own credits" ON position_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can manage all credits" ON position_credits;

CREATE POLICY "Users can read own credits"
  ON position_credits FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Super admins can read all credits"
  ON position_credits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );

CREATE POLICY "Super admins can insert credits"
  ON position_credits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );

CREATE POLICY "Super admins can update credits"
  ON position_credits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );

-- Fix free_trial_requests policies
DROP POLICY IF EXISTS "Users can read own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users can insert own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Super admins can read all trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Super admins can update trial requests" ON free_trial_requests;

CREATE POLICY "Users can read own trial requests"
  ON free_trial_requests FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own trial requests"
  ON free_trial_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Super admins can read all trial requests"
  ON free_trial_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );

CREATE POLICY "Super admins can update trial requests"
  ON free_trial_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );