/*
  # Fix Security - Step 2: Optimize RLS Policies

  1. Optimize auth.uid() calls with SELECT caching
    - future_entries policies
    - user_preferences policies
*/

DROP POLICY IF EXISTS "Users can view own future entries" ON future_entries;
CREATE POLICY "Users can view own future entries"
  ON future_entries
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own future entries" ON future_entries;
CREATE POLICY "Users can create own future entries"
  ON future_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own future entries" ON future_entries;
CREATE POLICY "Users can update own future entries"
  ON future_entries
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own future entries" ON future_entries;
CREATE POLICY "Users can delete own future entries"
  ON future_entries
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can read own preferences" ON user_preferences;
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
  );
