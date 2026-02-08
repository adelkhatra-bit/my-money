/*
  # Fix Trading Accounts RLS Policies

  ## Problem
  - trading_accounts.user_id references user_profiles.id (NOT auth.uid())
  - Current policies compare user_id = auth.uid() which fails
  - This prevents users from creating their own trading accounts
  
  ## Solution
  - Update policies to properly link through user_profiles table
  - user_id should match the profile id of the authenticated user
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users manage own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Super admins manage all accounts" ON trading_accounts;

-- Create corrected policies
CREATE POLICY "Users can manage own trading accounts"
  ON trading_accounts
  FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all trading accounts"
  ON trading_accounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );