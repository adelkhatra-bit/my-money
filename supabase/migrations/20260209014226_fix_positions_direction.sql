/*
  # Fix Positions Direction

  1. Fix Direction Logic
    - Recalcule la direction de toutes les positions basé sur TP vs Entry
    - Si TP1 < Entry → SHORT
    - Si TP1 > Entry → LONG
  
  2. Security
    - Aucun changement RLS
*/

-- Corriger toutes les positions avec direction incorrecte
UPDATE positions
SET direction = CASE
  WHEN take_profit_1 > entry_price THEN 'LONG'
  WHEN take_profit_1 < entry_price THEN 'SHORT'
  ELSE direction
END
WHERE (
  (direction = 'LONG' AND take_profit_1 < entry_price)
  OR
  (direction = 'SHORT' AND take_profit_1 > entry_price)
);

-- Log des corrections
DO $$
DECLARE
  fixed_count INT;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM positions
  WHERE (
    (direction = 'LONG' AND take_profit_1 < entry_price)
    OR
    (direction = 'SHORT' AND take_profit_1 > entry_price)
  );
  
  IF fixed_count > 0 THEN
    RAISE NOTICE 'Fixed % positions with incorrect direction', fixed_count;
  ELSE
    RAISE NOTICE 'All positions have correct direction';
  END IF;
END $$;
