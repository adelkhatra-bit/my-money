/*
  # Remove Recursive Super Admin Policy - FINAL FIX

  ## Problem
  - "Super admins can manage all profiles" policy contains recursive subquery
  - This causes infinite recursion when trying to read user_profiles
  
  ## Solution
  - Remove the recursive policy completely
  - Super admin operations will use RPC functions with SECURITY DEFINER
  - Keep only simple, non-recursive policies
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON user_profiles;

-- Verify we only have non-recursive policies now
-- Current policies should be:
-- 1. "Authenticated users can read all profiles" - USING (true)
-- 2. "Users can insert own profile" - WITH CHECK (user_id = auth.uid())
-- 3. "Users can update own profile" - USING/WITH CHECK (user_id = auth.uid())