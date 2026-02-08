/*
  # Fix Referral Trigger Recursion
  
  1. Problem
    - The trigger function create_referral_code_for_user() doesn't have SECURITY DEFINER
    - When it tries to INSERT into referral_system, RLS policies check is_super_admin()
    - is_super_admin() reads user_profiles, triggering RLS policies
    - This creates infinite recursion
    
  2. Solution
    - Add SECURITY DEFINER to the trigger function
    - This allows it to bypass RLS and avoid recursion
*/

-- Recreate the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_referral_code_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  -- Generate unique referral code
  LOOP
    new_code := generate_referral_code();
    SELECT EXISTS(SELECT 1 FROM referral_system WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Insert referral system entry
  INSERT INTO referral_system (user_id, referral_code, referrals_count, bonus_credits_earned)
  VALUES (NEW.id, new_code, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_create_referral_code ON user_profiles;
CREATE TRIGGER trigger_create_referral_code
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_code_for_user();

-- Also ensure generate_referral_code function exists and is secure
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;
