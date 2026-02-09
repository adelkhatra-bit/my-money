/*
  # Fix create_position_with_lock Return Format

  1. Problem
    - Function returns UUID
    - Frontend expects JSON object with {success, position, message}

  2. Solution
    - Change return type to JSON
    - Return proper object structure
    - Handle errors consistently
*/

DROP FUNCTION IF EXISTS create_position_with_lock(UUID, UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC);

CREATE OR REPLACE FUNCTION create_position_with_lock(
  p_user_id UUID,
  p_account_id UUID,
  p_signal_id UUID,
  p_market TEXT,
  p_platform TEXT,
  p_direction TEXT,
  p_entry_price NUMERIC,
  p_stop_loss NUMERIC,
  p_take_profit_1 NUMERIC,
  p_take_profit_2 NUMERIC,
  p_position_size NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position_id UUID;
  v_has_open BOOLEAN;
  v_existing_position_id UUID;
  v_new_position RECORD;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM positions 
    WHERE user_id = p_user_id 
    AND account_id = p_account_id 
    AND status = 'OPEN'
  ) INTO v_has_open;
  
  IF v_has_open THEN
    SELECT id INTO v_existing_position_id
    FROM positions 
    WHERE user_id = p_user_id 
    AND account_id = p_account_id 
    AND status = 'OPEN'
    LIMIT 1;
    
    RETURN json_build_object(
      'success', false,
      'error', 'POSITION_EXISTS',
      'message', 'Une position est déjà ouverte',
      'existing_position_id', v_existing_position_id
    );
  END IF;
  
  INSERT INTO positions (
    user_id, account_id, signal_id, market, platform, direction,
    entry_price, stop_loss, take_profit_1, take_profit_2, position_size, status
  ) VALUES (
    p_user_id, p_account_id, p_signal_id, p_market, p_platform, p_direction,
    p_entry_price, p_stop_loss, p_take_profit_1, p_take_profit_2, p_position_size, 'OPEN'
  )
  RETURNING * INTO v_new_position;
  
  RETURN json_build_object(
    'success', true,
    'position', row_to_json(v_new_position),
    'message', 'Position créée avec succès'
  );
END;
$$;
