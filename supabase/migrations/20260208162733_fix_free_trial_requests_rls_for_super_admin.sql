/*
  # Fix Free Trial Requests RLS for Super Admin

  1. Problem
    - Super Admin cannot see pending free trial requests
    - RLS policies are blocking access even for super admins
    
  2. Solution
    - Add policy to allow super admins to read all free trial requests
    - Ensure super admins can update requests when approving/rejecting
    
  3. Changes
    - DROP existing restrictive policies on free_trial_requests
    - CREATE new policies that allow:
      - Super admins: full access (select, insert, update)
      - Regular users: can only insert their own requests and view their own
*/

-- Drop existing policies on free_trial_requests
DROP POLICY IF EXISTS "Users can view own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users can create own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Admins can view all trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Admins can update trial requests" ON free_trial_requests;

-- Create new comprehensive policies

-- Super admins can do everything
CREATE POLICY "Super admins have full access to trial requests"
  ON free_trial_requests
  FOR ALL
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

-- Users can view their own trial requests
CREATE POLICY "Users can view own trial requests"
  ON free_trial_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
    )
  );

-- Users can insert their own trial requests
CREATE POLICY "Users can create own trial requests"
  ON free_trial_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
    )
  );