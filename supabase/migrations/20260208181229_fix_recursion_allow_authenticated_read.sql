/*
  # Fix Recursion - Allow Authenticated Read

  ## Problem
  - Any subquery on user_profiles creates infinite recursion
  - Cannot check is_super_admin within user_profiles policies

  ## Solution
  - Allow ALL authenticated users to read ALL user_profiles
  - Restrict write operations to own profile only
  - Super admin operations handled via RPC functions with SECURITY DEFINER
*/

-- Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow read all if super admin flag set" ON user_profiles;

-- Simple non-recursive policies
CREATE POLICY "Authenticated users can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());