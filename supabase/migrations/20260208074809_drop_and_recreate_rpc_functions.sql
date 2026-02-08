/*
  # Drop and Recreate All RPC Functions
  
  1. Drop all existing functions
  2. Recreate with correct signatures
  3. All use SECURITY DEFINER
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS request_free_trial();
DROP FUNCTION IF EXISTS approve_free_trial(uuid, integer);
DROP FUNCTION IF EXISTS reject_free_trial(uuid);
DROP FUNCTION IF EXISTS grant_credits(text, integer, text, text);
DROP FUNCTION IF EXISTS get_user_credits();

-- 1. Request Free Trial
CREATE FUNCTION public.request_free_trial()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_has_used_trial boolean;
  v_existing_request uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  
  SELECT has_used_trial INTO v_has_used_trial
  FROM user_profiles
  WHERE user_id = v_user_id;
  
  IF v_has_used_trial THEN
    RETURN json_build_object('error', 'You have already used your free trial');
  END IF;
  
  SELECT id INTO v_existing_request
  FROM free_trial_requests
  WHERE user_id = v_user_id AND status = 'PENDING';
  
  IF v_existing_request IS NOT NULL THEN
    RETURN json_build_object('error', 'You already have a pending request');
  END IF;
  
  INSERT INTO free_trial_requests (user_id, status, requested_at)
  VALUES (v_user_id, 'PENDING', NOW());
  
  RETURN json_build_object('success', true, 'message', 'Your request has been submitted');
END;
$$;

-- 2. Approve Free Trial
CREATE FUNCTION public.approve_free_trial(
  request_id uuid,
  credits_to_grant integer DEFAULT 5
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_request_user_id uuid;
  v_admin_user_id uuid;
  v_is_admin boolean;
BEGIN
  v_admin_user_id := auth.uid();
  
  SELECT is_super_admin INTO v_is_admin
  FROM user_profiles
  WHERE user_id = v_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;
  
  SELECT user_id INTO v_request_user_id
  FROM free_trial_requests
  WHERE id = request_id AND status = 'PENDING';
  
  IF v_request_user_id IS NULL THEN
    RETURN json_build_object('error', 'Request not found');
  END IF;
  
  UPDATE free_trial_requests
  SET status = 'APPROVED', approved_at = NOW(), approved_by = v_admin_user_id
  WHERE id = request_id;
  
  UPDATE user_profiles
  SET has_used_trial = true
  WHERE user_id = v_request_user_id;
  
  INSERT INTO position_credits (user_id, market, bonus_credits, purchased_credits, used_credits)
  VALUES (v_request_user_id, 'ALL', credits_to_grant, 0, 0)
  ON CONFLICT (user_id, market) DO UPDATE
  SET bonus_credits = position_credits.bonus_credits + credits_to_grant;
  
  RETURN json_build_object('success', true, 'message', 'Trial approved');
END;
$$;

-- 3. Reject Free Trial
CREATE FUNCTION public.reject_free_trial(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_admin_user_id uuid;
  v_is_admin boolean;
BEGIN
  v_admin_user_id := auth.uid();
  
  SELECT is_super_admin INTO v_is_admin
  FROM user_profiles
  WHERE user_id = v_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;
  
  UPDATE free_trial_requests
  SET status = 'REJECTED', approved_at = NOW(), approved_by = v_admin_user_id
  WHERE id = request_id AND status = 'PENDING';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Request not found');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Request rejected');
END;
$$;

-- 4. Grant Credits
CREATE FUNCTION public.grant_credits(
  target_user_email text,
  credits_amount integer,
  market_name text,
  credit_type text DEFAULT 'bonus'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_admin_user_id uuid;
  v_is_admin boolean;
  v_target_user_id uuid;
BEGIN
  v_admin_user_id := auth.uid();
  
  SELECT is_super_admin INTO v_is_admin
  FROM user_profiles
  WHERE user_id = v_admin_user_id;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;
  
  SELECT user_id INTO v_target_user_id
  FROM user_profiles
  WHERE email = target_user_email;
  
  IF v_target_user_id IS NULL THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  IF credit_type = 'bonus' THEN
    INSERT INTO position_credits (user_id, market, bonus_credits, purchased_credits, used_credits)
    VALUES (v_target_user_id, market_name, credits_amount, 0, 0)
    ON CONFLICT (user_id, market) DO UPDATE
    SET bonus_credits = position_credits.bonus_credits + credits_amount;
  ELSE
    INSERT INTO position_credits (user_id, market, bonus_credits, purchased_credits, used_credits)
    VALUES (v_target_user_id, market_name, 0, credits_amount, 0)
    ON CONFLICT (user_id, market) DO UPDATE
    SET purchased_credits = position_credits.purchased_credits + credits_amount;
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Credits granted');
END;
$$;

-- 5. Get User Credits
CREATE FUNCTION public.get_user_credits()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_credits json;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  
  SELECT json_agg(
    json_build_object(
      'market', market,
      'bonus_credits', bonus_credits,
      'purchased_credits', purchased_credits,
      'used_credits', used_credits,
      'remaining_credits', remaining_credits
    )
  ) INTO v_credits
  FROM position_credits
  WHERE user_id = v_user_id;
  
  RETURN json_build_object('success', true, 'credits', COALESCE(v_credits, '[]'::json));
END;
$$;

GRANT EXECUTE ON FUNCTION request_free_trial() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_free_trial(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_free_trial(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_credits(text, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_credits() TO authenticated;
