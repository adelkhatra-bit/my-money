/*
  # Create Trial Approval Functions

  ## Functions Created
  - approve_free_trial: Approve a free trial request and grant credits
  - reject_free_trial: Reject a free trial request
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS approve_free_trial(uuid, integer);
DROP FUNCTION IF EXISTS reject_free_trial(uuid);

-- Function to approve free trial
CREATE OR REPLACE FUNCTION approve_free_trial(
  request_id uuid,
  credits_to_grant integer DEFAULT 5
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_is_super_admin boolean;
  v_request_user_id uuid;
  v_request_status text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT is_super_admin INTO v_is_super_admin
  FROM user_profiles
  WHERE user_profiles.user_id = v_user_id;

  IF NOT COALESCE(v_is_super_admin, false) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT user_id, status INTO v_request_user_id, v_request_status
  FROM free_trial_requests
  WHERE id = request_id;

  IF v_request_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request_status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Request already processed');
  END IF;

  UPDATE free_trial_requests
  SET 
    status = 'approved',
    handled_at = now(),
    handled_by = v_user_id,
    credits_granted = credits_to_grant
  WHERE id = request_id;

  INSERT INTO position_credits (user_id, market, total_credits, used_credits)
  VALUES (v_request_user_id, 'BTC', credits_to_grant, 0)
  ON CONFLICT (user_id, market) 
  DO UPDATE SET total_credits = position_credits.total_credits + credits_to_grant;

  RETURN json_build_object('success', true, 'credits_granted', credits_to_grant);
END;
$$;

-- Function to reject free trial
CREATE OR REPLACE FUNCTION reject_free_trial(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_is_super_admin boolean;
  v_request_user_id uuid;
  v_request_status text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT is_super_admin INTO v_is_super_admin
  FROM user_profiles
  WHERE user_profiles.user_id = v_user_id;

  IF NOT COALESCE(v_is_super_admin, false) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT user_id, status INTO v_request_user_id, v_request_status
  FROM free_trial_requests
  WHERE id = request_id;

  IF v_request_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request_status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Request already processed');
  END IF;

  UPDATE free_trial_requests
  SET 
    status = 'rejected',
    handled_at = now(),
    handled_by = v_user_id
  WHERE id = request_id;

  RETURN json_build_object('success', true);
END;
$$;