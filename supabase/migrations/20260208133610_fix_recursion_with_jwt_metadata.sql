/*
  # Fix Recursion Using JWT Metadata
  
  1. Problem
    - RLS policies that read user_profiles cause infinite recursion
    - Even checking "own_profile" triggers recursion
    
  2. Solution
    - Store is_super_admin flag in auth.users.raw_app_meta_data
    - Use auth.jwt() in RLS policies (NO database reads!)
    - Update trigger to set metadata on user creation
    
  3. Security
    - raw_app_meta_data cannot be modified by users
    - Only triggers/functions with SECURITY DEFINER can modify it
    - Safe to use in RLS policies
*/

-- 1. DROP all problematic policies
DROP POLICY IF EXISTS "Super admins read all" ON user_profiles;
DROP POLICY IF EXISTS "Super admins update all" ON user_profiles;
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;

-- 2. Create NEW policies using JWT metadata
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    (auth.jwt()->>'is_super_admin')::boolean = true
  );

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (auth.jwt()->>'is_super_admin')::boolean = true
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    (auth.jwt()->>'is_super_admin')::boolean = true
  );

-- 3. Update trigger to set JWT metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_is_super_admin boolean := false;
BEGIN
  -- Check if email is in super_admin_emails
  SELECT EXISTS(
    SELECT 1 FROM super_admin_emails
    WHERE email = NEW.email
  ) INTO v_is_super_admin;
  
  -- Set metadata in auth.users (this is what auth.jwt() reads!)
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('is_super_admin', v_is_super_admin)
  WHERE id = NEW.id;
  
  -- Create user profile
  INSERT INTO user_profiles (
    user_id,
    email,
    is_super_admin,
    has_used_trial,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_is_super_admin,
    false,
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- 4. For existing users, sync metadata
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT user_id, is_super_admin 
    FROM user_profiles
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('is_super_admin', r.is_super_admin)
    WHERE id = r.user_id;
  END LOOP;
END $$;

-- 5. Fix other tables to use JWT metadata
DROP POLICY IF EXISTS "Super admins view all credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins manage credits" ON position_credits;

CREATE POLICY "Super admins manage all credits"
  ON position_credits FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (auth.jwt()->>'is_super_admin')::boolean = true
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    (auth.jwt()->>'is_super_admin')::boolean = true
  );

-- 6. Fix referral_system
DROP POLICY IF EXISTS "Super admins manage referrals" ON referral_system;

CREATE POLICY "Users manage own referral"
  ON referral_system FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (auth.jwt()->>'is_super_admin')::boolean = true
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    (auth.jwt()->>'is_super_admin')::boolean = true
  );

-- 7. Fix free_trial_requests
DROP POLICY IF EXISTS "Super admins manage requests" ON free_trial_requests;

CREATE POLICY "Users manage trial requests"
  ON free_trial_requests FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (auth.jwt()->>'is_super_admin')::boolean = true
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    (auth.jwt()->>'is_super_admin')::boolean = true
  );

-- 8. Fix trading_accounts (simpler policy)
DROP POLICY IF EXISTS "Users manage own accounts" ON trading_accounts;

CREATE POLICY "Users manage accounts"
  ON trading_accounts FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (auth.jwt()->>'is_super_admin')::boolean = true
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    (auth.jwt()->>'is_super_admin')::boolean = true
  );
