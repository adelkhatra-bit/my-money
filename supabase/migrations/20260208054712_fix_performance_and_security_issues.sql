/*
  # Fix Performance and Security Issues

  1. Performance Improvements
    - Add indexes on all foreign key columns for optimal query performance:
      * position_credits.user_id
      * positions.account_id
      * positions.signal_id
      * positions.user_id
      * trading_accounts.user_id
    - These indexes will dramatically improve JOIN performance and foreign key lookups

  2. Security Improvements - RLS Policy Optimization
    - Replace `auth.uid()` with `(select auth.uid())` in all RLS policies
    - This prevents re-evaluation of auth functions for each row, improving performance at scale
    - Affects all policies across:
      * user_profiles (3 policies)
      * trading_accounts (2 policies)
      * position_credits (2 policies)
      * signals (1 policy)
      * positions (2 policies)

  3. Important Notes
    - Indexes are created with IF NOT EXISTS to ensure idempotency
    - All RLS policies are dropped and recreated with optimized queries
    - No data loss occurs during this migration
    - Performance will improve significantly on tables with many rows
*/

-- ============================================================================
-- PART 1: ADD INDEXES ON FOREIGN KEYS
-- ============================================================================

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

-- ============================================================================
-- PART 2: OPTIMIZE RLS POLICIES - USER_PROFILES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;

-- Recreate with optimized auth calls
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Super admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND is_super_admin = true
    )
  );

-- ============================================================================
-- PART 3: OPTIMIZE RLS POLICIES - TRADING_ACCOUNTS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Super admins can view all accounts" ON trading_accounts;

-- Recreate with optimized auth calls
CREATE POLICY "Users can manage own accounts"
  ON trading_accounts FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Super admins can view all accounts"
  ON trading_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND is_super_admin = true
    )
  );

-- ============================================================================
-- PART 4: OPTIMIZE RLS POLICIES - POSITION_CREDITS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can manage all credits" ON position_credits;

-- Recreate with optimized auth calls
CREATE POLICY "Users can view own credits"
  ON position_credits FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Super admins can manage all credits"
  ON position_credits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND is_super_admin = true
    )
  );

-- ============================================================================
-- PART 5: OPTIMIZE RLS POLICIES - SIGNALS
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Super admins can manage all signals" ON signals;

-- Recreate with optimized auth calls
CREATE POLICY "Super admins can manage all signals"
  ON signals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND is_super_admin = true
    )
  );

-- ============================================================================
-- PART 6: OPTIMIZE RLS POLICIES - POSITIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own positions" ON positions;
DROP POLICY IF EXISTS "Super admins can view all positions" ON positions;

-- Recreate with optimized auth calls
CREATE POLICY "Users can manage own positions"
  ON positions FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Super admins can view all positions"
  ON positions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (select auth.uid()) AND is_super_admin = true
    )
  );
