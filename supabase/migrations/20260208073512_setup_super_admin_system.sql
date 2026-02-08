/*
  # Setup Super Admin System
  
  1. Create Super Admin Configuration
    - Table to store authorized super admin emails
    - Function to automatically grant super admin on signup
    - Update trigger to check authorized emails
    
  2. Initial Configuration
    - Add authorized super admin emails
    - These emails will automatically become super admin on signup
*/

-- =====================================================
-- STEP 1: Create super admin configuration table
-- =====================================================

CREATE TABLE IF NOT EXISTS super_admin_emails (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  added_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- No RLS needed - accessed only by SECURITY DEFINER functions

-- =====================================================
-- STEP 2: Insert authorized super admin emails
-- =====================================================

-- Add the admin email (based on context, appears to be adelkhatra)
-- Note: Update this with the actual email address
INSERT INTO super_admin_emails (email) VALUES
  ('adelkhatra@gmail.com'),
  ('adelkhatra@hotmail.com'),
  ('adel.khatra@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- STEP 3: Update user profile creation trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_super_admin boolean;
BEGIN
  -- Check if email is in super admin list
  SELECT EXISTS (
    SELECT 1 FROM super_admin_emails WHERE email = NEW.email
  ) INTO v_is_super_admin;
  
  -- Create profile with appropriate super admin flag
  INSERT INTO public.user_profiles (user_id, email, is_super_admin)
  VALUES (NEW.id, NEW.email, v_is_super_admin)
  ON CONFLICT (user_id) DO UPDATE
  SET is_super_admin = v_is_super_admin;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 4: Create function to add super admin email
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_super_admin_email(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Add email to authorized list
  INSERT INTO super_admin_emails (email)
  VALUES (admin_email)
  ON CONFLICT (email) DO NOTHING;
  
  -- Update existing user if they exist
  UPDATE user_profiles
  SET is_super_admin = true
  WHERE email = admin_email;
END;
$$;

-- =====================================================
-- STEP 5: Create function to remove super admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.remove_super_admin_email(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Remove from authorized list
  DELETE FROM super_admin_emails WHERE email = admin_email;
  
  -- Update existing user
  UPDATE user_profiles
  SET is_super_admin = false
  WHERE email = admin_email;
END;
$$;

-- =====================================================
-- STEP 6: Create function to list super admin emails
-- =====================================================

CREATE OR REPLACE FUNCTION public.list_super_admin_emails()
RETURNS TABLE (email text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT sae.email, sae.created_at
  FROM super_admin_emails sae
  ORDER BY sae.created_at;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_super_admin_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_super_admin_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_super_admin_emails() TO authenticated;
