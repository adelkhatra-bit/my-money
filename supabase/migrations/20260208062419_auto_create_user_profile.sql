/*
  # Auto-create user profile on signup
  
  1. Function to create user profile
    - Automatically creates a user_profile when a new user signs up
    - Uses trigger on auth.users table
    
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only creates profile for the new user
*/

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, is_super_admin)
  VALUES (NEW.id, NEW.email, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();