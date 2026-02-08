/*
  # Fix ALL RLS Policies - Comprehensive Cleanup v2

  ## Problem
  Multiple tables have duplicate or incorrect RLS policies that:
  - Compare user_id = auth.uid() when user_id is user_profiles.id
  - Have duplicate policies from multiple migrations
  - Use incorrect field comparisons for super admin checks
  
  ## Solution
  Clean up ALL policies and create correct ones for:
  - admin_settings
  - free_trial_requests
  - position_credits
  - referrals
  - signal_history
  - signals
*/

-- ============================================
-- ADMIN SETTINGS
-- ============================================
DROP POLICY IF EXISTS "Super admins manage settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can manage settings" ON admin_settings;
DROP POLICY IF EXISTS "Super admins can manage all settings" ON admin_settings;

CREATE POLICY "Super admins can manage all settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );

-- ============================================
-- FREE TRIAL REQUESTS
-- ============================================
DROP POLICY IF EXISTS "Users manage own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users can read own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users can insert own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Super admins manage all trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Super admins can read all trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Super admins can update trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users can manage own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Super admins can manage all trial requests" ON free_trial_requests;

CREATE POLICY "Users can manage own trial requests"
  ON free_trial_requests
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

CREATE POLICY "Super admins can manage all trial requests"
  ON free_trial_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );

-- ============================================
-- POSITION CREDITS
-- ============================================
DROP POLICY IF EXISTS "Users view own credits" ON position_credits;
DROP POLICY IF EXISTS "Users can read own credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins manage all credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can read all credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can update credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can insert credits" ON position_credits;
DROP POLICY IF EXISTS "Users can view own credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can manage all credits" ON position_credits;

CREATE POLICY "Users can view own credits"
  ON position_credits
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all credits"
  ON position_credits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );

-- ============================================
-- REFERRALS
-- ============================================
DROP POLICY IF EXISTS "Users view related referrals" ON referrals;
DROP POLICY IF EXISTS "Users create referrals" ON referrals;
DROP POLICY IF EXISTS "Users can view related referrals" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
DROP POLICY IF EXISTS "Super admins can manage all referrals" ON referrals;

CREATE POLICY "Users can view related referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (
    referrer_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
    OR
    referred_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can manage all referrals"
  ON referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );

-- ============================================
-- SIGNAL HISTORY
-- ============================================
DROP POLICY IF EXISTS "Users read own signal history" ON signal_history;
DROP POLICY IF EXISTS "Users insert own signal history" ON signal_history;
DROP POLICY IF EXISTS "Users update own signal history" ON signal_history;
DROP POLICY IF EXISTS "Users can manage own signal history" ON signal_history;
DROP POLICY IF EXISTS "Super admins can manage all signal history" ON signal_history;

CREATE POLICY "Users can manage own signal history"
  ON signal_history
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

CREATE POLICY "Super admins can manage all signal history"
  ON signal_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );

-- ============================================
-- SIGNALS
-- ============================================
DROP POLICY IF EXISTS "Super admins manage signals" ON signals;
DROP POLICY IF EXISTS "Super admins can manage all signals" ON signals;
DROP POLICY IF EXISTS "Users can view active signals" ON signals;

CREATE POLICY "Super admins can manage all signals"
  ON signals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  );

CREATE POLICY "Users can view signals"
  ON signals
  FOR SELECT
  TO authenticated
  USING (
    status = 'active' OR status = 'pending'
  );