/*
  # Add Quick Reset Open Positions Function

  1. New Function
    - reset_open_positions_only: Delete only OPEN positions for a user
    
  2. Purpose
    - Quick cleanup of stuck open positions
    - Preserve history (keep CLOSED positions)
    - Faster than full reset
    
  3. Security
    - User can only reset their own open positions
    - Closed positions preserved
*/

-- Function to delete only OPEN positions for a user
CREATE OR REPLACE FUNCTION reset_open_positions_only(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Delete only OPEN positions for this user
  DELETE FROM positions
  WHERE user_id = p_user_id
  AND status = 'OPEN';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Reset used credits for all markets
  UPDATE position_credits
  SET used_credits = 0
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'deleted_open_positions', v_deleted_count,
    'message', 'Open positions deleted, history preserved'
  );
END;
$$;