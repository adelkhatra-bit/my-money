/*
  # Fix User Profiles RLS Policies

  ## Issues Fixed
  
  ### 1. RLS Policies Using Wrong Column
  - Policies were checking `id = auth.uid()` but should check `user_id = auth.uid()`
  - The `id` column is auto-generated, `user_id` is the foreign key to auth.users
  
  ### 2. Missing Unique Constraint
  - Add unique constraint on user_id to prevent duplicate profiles

  ## Changes Applied
  - Add unique constraint on user_id
  - Recreate correct RLS policies using user_id
  - Update trigger function with better error handling
*/

-- Add unique constraint on user_id (should reference auth.users.id uniquely)
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_unique;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);

-- Drop all existing RLS policies on user_profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON user_profiles;

-- Recreate RLS policies with correct column (user_id instead of id)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Add super admin policy
CREATE POLICY "Super admins can manage all profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (select auth.uid())
      AND up.is_super_admin = true
    )
  );

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'adel.khatra@live.fr' THEN true
      ELSE false
    END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();