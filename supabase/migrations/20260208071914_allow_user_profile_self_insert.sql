/*
  # Allow users to create their own profile
  
  1. Changes
    - Add INSERT policy for users to create their own profile entry if it doesn't exist
  
  2. Security
    - Users can only create a profile for their own user_id (auth.uid())
    - Maintains existing SELECT and UPDATE policies
*/

-- Drop existing policy if it exists to recreate it properly
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Allow users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());