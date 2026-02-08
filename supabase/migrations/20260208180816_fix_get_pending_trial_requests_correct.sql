/*
  # Fix Get Pending Trial Requests - Correct Version

  ## Changes
  - Fix the function to use correct user_profiles.id reference
  - Return proper data with all needed information
*/

DROP FUNCTION IF EXISTS get_pending_trial_requests();

CREATE OR REPLACE FUNCTION get_pending_trial_requests()
RETURNS TABLE (
  request_id uuid,
  user_profile_id uuid,
  user_email text,
  requested_at timestamptz,
  trial_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_is_super_admin boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT is_super_admin INTO v_is_super_admin
  FROM user_profiles
  WHERE user_profiles.user_id = v_user_id;

  IF NOT COALESCE(v_is_super_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Super admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    ftr.id as request_id,
    up.id as user_profile_id,
    up.email as user_email,
    ftr.requested_at,
    (SELECT COUNT(*) FROM free_trial_requests WHERE user_id = up.id) as trial_count
  FROM free_trial_requests ftr
  INNER JOIN user_profiles up ON up.id = ftr.user_id
  WHERE ftr.status = 'pending'
  ORDER BY ftr.requested_at ASC;
END;
$$;