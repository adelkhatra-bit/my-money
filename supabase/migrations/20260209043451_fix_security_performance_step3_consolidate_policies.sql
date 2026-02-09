/*
  # Fix Security - Step 3: Consolidate Multiple Permissive Policies

  1. Consolidate Policies
    - action_history: Merge admin + user policies
    - free_trial_requests: Merge admin + user policies
    - position_credits: Merge admin + user policies
    - positions: Merge admin + user policies
    - referrals: Merge admin + user policies
    - signal_history: Merge admin + user policies
    - signals: Merge all read policies
    - trading_accounts: Merge admin + user policies
*/

DROP POLICY IF EXISTS "Super admins can read all action history" ON action_history;
DROP POLICY IF EXISTS "Users can read own action history" ON action_history;

CREATE POLICY "Users and admins can read action history"
  ON action_history
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users can manage own trial requests" ON free_trial_requests;

CREATE POLICY "Users and admins manage trial requests"
  ON free_trial_requests
  FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all credits" ON position_credits;
DROP POLICY IF EXISTS "Users can view own credits" ON position_credits;

CREATE POLICY "Users and admins view credits"
  ON position_credits
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all positions" ON positions;
DROP POLICY IF EXISTS "Users can manage own positions" ON positions;

CREATE POLICY "Users and admins manage positions"
  ON positions
  FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all referrals" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
DROP POLICY IF EXISTS "Users can view related referrals" ON referrals;

CREATE POLICY "Users and admins manage referrals"
  ON referrals
  FOR ALL
  TO authenticated
  USING (
    referrer_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    referred_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  )
  WITH CHECK (
    referrer_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all signal history" ON signal_history;
DROP POLICY IF EXISTS "Users can manage own signal history" ON signal_history;

CREATE POLICY "Users and admins manage signal history"
  ON signal_history
  FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users read signals" ON signals;
DROP POLICY IF EXISTS "Super admins can manage all signals" ON signals;
DROP POLICY IF EXISTS "Users can view signals" ON signals;

CREATE POLICY "All authenticated users view signals"
  ON signals
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admins can manage all trading accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can manage own trading accounts" ON trading_accounts;

CREATE POLICY "Users and admins manage trading accounts"
  ON trading_accounts
  FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND is_super_admin = true
    )
  );
