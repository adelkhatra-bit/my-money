/*
  # Fix Positions RLS Policies

  ## Problem
  - positions.user_id references user_profiles.id (NOT auth.uid())
  - positions.account_id references trading_accounts.id
  - trading_accounts.user_id references user_profiles.id (NOT auth.uid())
  - Current policies incorrectly compare with auth.uid() directly
  - This prevents users from creating positions
  
  ## Solution
  - Update policies to properly link through user_profiles table
  - For user positions: check through trading_accounts → user_profiles → auth.uid()
  - For super admin: check user_profiles.user_id = auth.uid() (not id = auth.uid())
*/

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Users manage own positions" ON positions;
DROP POLICY IF EXISTS "Super admins manage all positions" ON positions;

-- Create corrected policy for normal users
CREATE POLICY "Users can manage own positions"
  ON positions
  FOR ALL
  TO authenticated
  USING (
    -- Check if the position belongs to a trading account owned by the user
    EXISTS (
      SELECT 1 
      FROM trading_accounts ta
      JOIN user_profiles up ON ta.user_id = up.id
      WHERE ta.id = positions.account_id
      AND up.user_id = auth.uid()
    )
    OR
    -- Direct check via user_id if account_id is null
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same check for inserts/updates
    EXISTS (
      SELECT 1 
      FROM trading_accounts ta
      JOIN user_profiles up ON ta.user_id = up.id
      WHERE ta.id = positions.account_id
      AND up.user_id = auth.uid()
    )
    OR
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Create corrected policy for super admins
CREATE POLICY "Super admins can manage all positions"
  ON positions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );