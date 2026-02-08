/*
  # Add Unique Constraint to Position Credits

  ## Changes
  - Add unique constraint on (user_id, market) if it doesn't exist
  - This ensures one credit record per user per market
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'idx_position_credits_user_market'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_position_credits_user_market 
      ON position_credits(user_id, market);
  END IF;
END $$;