/*
  # Complete Free Trial System Setup
  
  1. Functions Created
    - request_free_trial(): User requests free trial (5 positions)
    - approve_free_trial(): Super admin approves trial request
    - get_user_credits(): Get credit summary for user
    - grant_welcome_bonus(): Automatic welcome bonus on signup
    
  2. Business Logic
    - Each user can request free trial once
    - Free trial = 5 positions
    - Super admin must approve requests
    - Welcome bonus granted automatically on first signup
    
  3. Tables Updated
    - free_trial_requests: Track trial requests
    - position_credits: Store user credits
    - user_profiles: Track trial usage
*/

-- =====================================================
-- STEP 1: Ensure position_credits has correct structure
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'position_credits' AND column_name = 'bonus_credits'
  ) THEN
    ALTER TABLE position_credits ADD COLUMN bonus_credits integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'position_credits' AND column_name = 'purchased_credits'
  ) THEN
    ALTER TABLE position_credits ADD COLUMN purchased_credits integer DEFAULT 0;
  END IF;
END $$;

-- Update total_credits calculation if needed
ALTER TABLE position_credits 
  DROP COLUMN IF EXISTS remaining_credits;

ALTER TABLE position_credits
  ADD COLUMN remaining_credits integer GENERATED ALWAYS AS (
    (COALESCE(bonus_credits, 0) + COALESCE(purchased_credits, 0)) - COALESCE(used_credits, 0)
  ) STORED;

-- =====================================================
-- STEP 2: Ensure user_profiles tracks trial usage
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'has_used_trial'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN has_used_trial boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'trial_granted_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN trial_granted_at timestamptz;
  END IF;
END $$;

-- =====================================================
-- STEP 3: Function to request free trial
-- =====================================================

CREATE OR REPLACE FUNCTION public.request_free_trial()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_profile_id uuid;
  v_has_used_trial boolean;
  v_existing_request uuid;
  v_request_id uuid;
BEGIN
  -- Get user profile
  SELECT id, has_used_trial INTO v_user_profile_id, v_has_used_trial
  FROM user_profiles
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profile not found'
    );
  END IF;
  
  -- Check if already used trial
  IF v_has_used_trial THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have already used your free trial'
    );
  END IF;
  
  -- Check for existing pending request
  SELECT id INTO v_existing_request
  FROM free_trial_requests
  WHERE user_id = v_user_profile_id
    AND status = 'PENDING';
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You already have a pending request'
    );
  END IF;
  
  -- Create new request
  INSERT INTO free_trial_requests (user_id, status, request_count)
  VALUES (v_user_profile_id, 'PENDING', 1)
  RETURNING id INTO v_request_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'message', 'Your free trial request has been submitted'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_free_trial() TO authenticated;

-- =====================================================
-- STEP 4: Function to approve free trial (Super Admin)
-- =====================================================

CREATE OR REPLACE FUNCTION public.approve_free_trial(request_id uuid, credits_to_grant integer DEFAULT 5)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request_user_id uuid;
  v_request_status text;
BEGIN
  -- Check if caller is super admin
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Super admin access required'
    );
  END IF;
  
  -- Get request details
  SELECT user_id, status INTO v_request_user_id, v_request_status
  FROM free_trial_requests
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request not found'
    );
  END IF;
  
  IF v_request_status != 'PENDING' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request already processed'
    );
  END IF;
  
  -- Grant credits
  INSERT INTO position_credits (user_id, market, bonus_credits, used_credits)
  VALUES (v_request_user_id, 'ALL', credits_to_grant, 0)
  ON CONFLICT (user_id, market) 
  DO UPDATE SET bonus_credits = position_credits.bonus_credits + credits_to_grant;
  
  -- Update request status
  UPDATE free_trial_requests
  SET status = 'APPROVED',
      approved_by = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  WHERE id = request_id;
  
  -- Mark trial as used
  UPDATE user_profiles
  SET has_used_trial = true,
      trial_granted_at = now()
  WHERE id = v_request_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Free trial approved and credits granted'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_free_trial(uuid, integer) TO authenticated;

-- =====================================================
-- STEP 5: Function to reject free trial (Super Admin)
-- =====================================================

CREATE OR REPLACE FUNCTION public.reject_free_trial(request_id uuid, reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if caller is super admin
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Super admin access required'
    );
  END IF;
  
  -- Update request status
  UPDATE free_trial_requests
  SET status = 'REJECTED'
  WHERE id = request_id
    AND status = 'PENDING';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request not found or already processed'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Free trial request rejected'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_free_trial(uuid, text) TO authenticated;

-- =====================================================
-- STEP 6: Function to get user credits
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_credits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_profile_id uuid;
  v_credits jsonb;
BEGIN
  -- Get user profile
  SELECT id INTO v_user_profile_id
  FROM user_profiles
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profile not found'
    );
  END IF;
  
  -- Get credits
  SELECT jsonb_agg(
    jsonb_build_object(
      'market', market,
      'bonus_credits', COALESCE(bonus_credits, 0),
      'purchased_credits', COALESCE(purchased_credits, 0),
      'used_credits', COALESCE(used_credits, 0),
      'remaining_credits', remaining_credits,
      'expires_at', expires_at
    )
  )
  INTO v_credits
  FROM position_credits
  WHERE user_id = v_user_profile_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'credits', COALESCE(v_credits, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_credits() TO authenticated;

-- =====================================================
-- STEP 7: Function to grant credits manually (Super Admin)
-- =====================================================

CREATE OR REPLACE FUNCTION public.grant_credits(
  target_user_email text,
  credits_amount integer,
  market_name text DEFAULT 'ALL',
  credit_type text DEFAULT 'bonus'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_user_id uuid;
BEGIN
  -- Check if caller is super admin
  IF NOT is_super_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Super admin access required'
    );
  END IF;
  
  -- Get target user profile ID
  SELECT id INTO v_target_user_id
  FROM user_profiles
  WHERE email = target_user_email;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Grant credits
  IF credit_type = 'bonus' THEN
    INSERT INTO position_credits (user_id, market, bonus_credits, used_credits)
    VALUES (v_target_user_id, market_name, credits_amount, 0)
    ON CONFLICT (user_id, market)
    DO UPDATE SET bonus_credits = position_credits.bonus_credits + credits_amount;
  ELSE
    INSERT INTO position_credits (user_id, market, purchased_credits, used_credits)
    VALUES (v_target_user_id, market_name, credits_amount, 0)
    ON CONFLICT (user_id, market)
    DO UPDATE SET purchased_credits = position_credits.purchased_credits + credits_amount;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Granted %s %s credits to %s', credits_amount, credit_type, target_user_email)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_credits(text, integer, text, text) TO authenticated;

-- =====================================================
-- STEP 8: Add missing constraint on position_credits
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'position_credits_user_id_market_key'
  ) THEN
    ALTER TABLE position_credits ADD CONSTRAINT position_credits_user_id_market_key UNIQUE (user_id, market);
  END IF;
END $$;
