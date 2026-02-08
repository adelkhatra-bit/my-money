/*
  # Consolidate RLS Policies to Fix Multiple Permissive Policy Warnings
  
  This migration consolidates multiple permissive policies per table into single
  policies that handle both regular user access and super admin access.
  
  ## Changes Made
  
  1. **user_profiles table**
     - Drops: "Users can read own profile" and "Super admins can read all profiles"
     - Creates: Single SELECT policy allowing users to read their own profile OR super admins to read all
  
  2. **trading_accounts table**
     - Drops: "Users can manage own accounts" and "Super admins can view all accounts"
     - Creates: Consolidated policies for SELECT, INSERT, UPDATE, DELETE
  
  3. **position_credits table**
     - Drops: "Users can view own credits" and "Super admins can manage all credits"
     - Creates: Consolidated policies for SELECT, INSERT, UPDATE, DELETE
  
  4. **positions table**
     - Drops: "Users can manage own positions" and "Super admins can view all positions"
     - Creates: Consolidated policies for SELECT, INSERT, UPDATE, DELETE
  
  5. **signals table**
     - Drops: "Authenticated users can view active signals" and "Super admins can manage all signals"
     - Creates: Consolidated policies for SELECT, INSERT, UPDATE, DELETE
  
  ## Security Notes
  
  - All policies maintain the same security posture as before
  - Super admin checks use subqueries for optimal performance
  - Regular users can only access their own data
  - Super admins can access all data
  - Signal viewing allows all authenticated users to see ACTIVE signals
*/

-- ============================================================================
-- user_profiles: Consolidate policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can read own profile or super admins can read all"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND up.is_super_admin = true
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- trading_accounts: Consolidate policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Super admins can view all accounts" ON trading_accounts;

CREATE POLICY "Users can view own accounts or super admins can view all"
  ON trading_accounts
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Users can insert own accounts"
  ON trading_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own accounts"
  ON trading_accounts
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own accounts"
  ON trading_accounts
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- position_credits: Consolidate policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can manage all credits" ON position_credits;

CREATE POLICY "Users can view own credits or super admins can view all"
  ON position_credits
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can insert credits"
  ON position_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can update credits"
  ON position_credits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can delete credits"
  ON position_credits
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- ============================================================================
-- positions: Consolidate policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own positions" ON positions;
DROP POLICY IF EXISTS "Super admins can view all positions" ON positions;

CREATE POLICY "Users can view own positions or super admins can view all"
  ON positions
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Users can insert own positions"
  ON positions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own positions"
  ON positions
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own positions"
  ON positions
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- signals: Consolidate policies
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view active signals" ON signals;
DROP POLICY IF EXISTS "Super admins can manage all signals" ON signals;

CREATE POLICY "Users can view active signals or super admins can view all"
  ON signals
  FOR SELECT
  TO authenticated
  USING (
    status = 'ACTIVE'
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can insert signals"
  ON signals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can update signals"
  ON signals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can delete signals"
  ON signals
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );
