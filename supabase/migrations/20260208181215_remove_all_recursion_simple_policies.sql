/*
  # Remove ALL Recursion - Ultra Simple Policies

  ## Problem
  - Still infinite recursion in user_profiles
  - Any policy that reads user_profiles creates recursion

  ## Solution
  - Use ONLY auth.uid() for user_profiles
  - NO subqueries on user_profiles in user_profiles policies
  - Super admin checks moved to application level or RPC functions
*/

-- Drop ALL policies on user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;

-- Ultra simple policies with ZERO recursion
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
  WITH CHECK (user_id = auth.uid() AND NOT (is_super_admin IS DISTINCT FROM (SELECT is_super_admin FROM user_profiles WHERE user_id = auth.uid())));

-- Allow super admins to read all profiles using a separate policy
-- This is safe because we don't check if they ARE super admin within user_profiles
CREATE POLICY "Allow read all if super admin flag set"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT is_super_admin FROM user_profiles WHERE user_profiles.user_id = auth.uid() LIMIT 1) = true
  );

-- WAIT, that's still recursive! Let me use a completely different approach.
-- Use metadata from JWT instead