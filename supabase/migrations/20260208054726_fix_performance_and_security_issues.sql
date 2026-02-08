/*
  # Fix Performance and Security Issues

  ## Performance Improvements

  ### 1. Add Indexes on Foreign Keys
  Creates indexes on all foreign key columns to improve query performance:
  - `position_credits.user_id` - Index for user credit lookups
  - `positions.account_id` - Index for account position lookups
  - `positions.signal_id` - Index for signal-related position queries
  - `positions.user_id` - Index for user position queries
  - `trading_accounts.user_id` - Index for user account lookups

  ### 2. Optimize RLS Policies
  Wraps all `auth.*()` function calls with `(select auth.*())` to prevent 
  re-evaluation for each row, dramatically improving query performance at scale.

  ## Security Notes
  - All existing RLS policies are preserved with optimized performance
  - No changes to access control logic
  - Multiple permissive policies maintained for user/admin separation

  ## Manual Dashboard Settings Required
  The following cannot be set via migration and must be configured in Supabase Dashboard:
  1. Auth DB Connection Strategy: Switch from fixed (10) to percentage-based
  2. Leaked Password Protection: Enable HaveIBeenPwned integration
*/

-- =====================================================
-- 1. CREATE INDEXES ON FOREIGN KEYS
-- =====================================================

-- Index for position_credits.user_id
CREATE INDEX IF NOT EXISTS idx_position_credits_user_id 
ON position_credits(user_id);

-- Index for positions.account_id
CREATE INDEX IF NOT EXISTS idx_positions_account_id 
ON positions(account_id);

-- Index for positions.signal_id
CREATE INDEX IF NOT EXISTS idx_positions_signal_id 
ON positions(signal_id);

-- Index for positions.user_id
CREATE INDEX IF NOT EXISTS idx_positions_user_id 
ON positions(user_id);

-- Index for trading_accounts.user_id
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id 
ON trading_accounts(user_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - user_profiles
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;

-- Recreate with optimized auth function calls
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Super admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (select auth.uid())
      AND up.is_super_admin = true
    )
  );

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - trading_accounts
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Super admins can view all accounts" ON trading_accounts;

CREATE POLICY "Users can manage own accounts"
  ON trading_accounts
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Super admins can view all accounts"
  ON trading_accounts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - position_credits
-- =====================================================

DROP POLICY IF EXISTS "Users can view own credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can manage all credits" ON position_credits;

CREATE POLICY "Users can view own credits"
  ON position_credits
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Super admins can manage all credits"
  ON position_credits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 5. OPTIMIZE RLS POLICIES - signals
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view active signals" ON signals;
DROP POLICY IF EXISTS "Super admins can manage all signals" ON signals;

CREATE POLICY "Authenticated users can view active signals"
  ON signals
  FOR SELECT
  TO authenticated
  USING (status = 'ACTIVE');

CREATE POLICY "Super admins can manage all signals"
  ON signals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- =====================================================
-- 6. OPTIMIZE RLS POLICIES - positions
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own positions" ON positions;
DROP POLICY IF EXISTS "Super admins can view all positions" ON positions;

CREATE POLICY "Users can manage own positions"
  ON positions
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Super admins can view all positions"
  ON positions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (select auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );