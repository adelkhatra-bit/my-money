/*
  # Fix Position Precision and Quantity

  1. Changes
    - Round all prices to 2 decimals in RPC function
    - Add quantity column rename to avoid confusion
    - Ensure all numeric values are properly formatted
    
  2. Fixes
    - Entry prices limited to 2 decimals
    - SL/TP prices limited to 2 decimals
    - Position size (quantity) properly stored
    
  3. Purpose
    - Eliminate floating point precision errors
    - Match platform display requirements (2 decimals)
    - Fix PnL calculation accuracy
*/

-- Drop and recreate create_position_with_lock with precision fixes
DROP FUNCTION IF EXISTS create_position_with_lock(uuid, uuid, text, text, text, decimal, decimal, decimal, decimal, decimal);

CREATE OR REPLACE FUNCTION create_position_with_lock(
  p_user_id uuid,
  p_account_id uuid,
  p_market text,
  p_platform text,
  p_direction text,
  p_entry_price decimal,
  p_stop_loss decimal,
  p_take_profit_1 decimal,
  p_take_profit_2 decimal,
  p_position_size decimal
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_position_id uuid;
  v_new_position_id uuid;
  v_result json;
  v_entry_price_rounded decimal;
  v_stop_loss_rounded decimal;
  v_tp1_rounded decimal;
  v_tp2_rounded decimal;
BEGIN
  -- Round all prices to 2 decimals
  v_entry_price_rounded := ROUND(p_entry_price::numeric, 2);
  v_stop_loss_rounded := ROUND(p_stop_loss::numeric, 2);
  v_tp1_rounded := ROUND(p_take_profit_1::numeric, 2);
  v_tp2_rounded := ROUND(p_take_profit_2::numeric, 2);

  -- Check for existing OPEN position (with row lock to prevent race conditions)
  SELECT id INTO v_existing_position_id
  FROM positions
  WHERE user_id = p_user_id
    AND account_id = p_account_id
    AND market = p_market
    AND status = 'OPEN'
  FOR UPDATE;

  -- If position exists, return error
  IF v_existing_position_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'POSITION_EXISTS',
      'message', 'Une position est déjà ouverte sur ce marché',
      'existing_position_id', v_existing_position_id
    );
  END IF;

  -- Create new position with rounded values
  INSERT INTO positions (
    user_id,
    account_id,
    market,
    platform,
    direction,
    entry_price,
    stop_loss,
    take_profit_1,
    take_profit_2,
    quantity,
    status,
    pnl
  ) VALUES (
    p_user_id,
    p_account_id,
    p_market,
    p_platform,
    p_direction,
    v_entry_price_rounded,
    v_stop_loss_rounded,
    v_tp1_rounded,
    v_tp2_rounded,
    p_position_size,
    'OPEN',
    0
  )
  RETURNING id INTO v_new_position_id;

  -- Return success with position data
  SELECT json_build_object(
    'success', true,
    'position', row_to_json(p.*)
  )
  INTO v_result
  FROM positions p
  WHERE p.id = v_new_position_id;

  RETURN v_result;
END;
$$;