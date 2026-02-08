/*
  # Add function to get pending trial requests with user info

  1. Purpose
    - Create RPC function to retrieve all pending free trial requests
    - Include user email and profile information
    - Ensure super admins can access this data
    
  2. Changes
    - CREATE FUNCTION get_pending_trial_requests()
    - Returns table with request details and user information
*/

CREATE OR REPLACE FUNCTION get_pending_trial_requests()
RETURNS TABLE (
  request_id uuid,
  user_profile_id uuid,
  user_email text,
  requested_at timestamptz,
  trial_count int,
  user_created_at timestamptz
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  RETURN QUERY
  SELECT 
    ftr.id as request_id,
    ftr.user_id as user_profile_id,
    up.email as user_email,
    ftr.requested_at,
    COALESCE(
      (SELECT COUNT(*)::int 
       FROM free_trial_requests ftr2 
       WHERE ftr2.user_id = ftr.user_id),
      0
    ) as trial_count,
    up.created_at as user_created_at
  FROM free_trial_requests ftr
  INNER JOIN user_profiles up ON ftr.user_id = up.id
  WHERE ftr.status = 'pending'
  ORDER BY ftr.requested_at DESC;
END;
$$;