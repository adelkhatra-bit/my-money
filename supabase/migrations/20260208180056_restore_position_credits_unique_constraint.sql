/*
  # Restore Position Credits Unique Constraint

  ## Changes Applied
  
  ### 1. Restore Unique Constraint
  - Re-add the unique constraint on (user_id, market) for position_credits table
  - This ensures each user can only have one credit record per market
  
  ## Notes
  - The constraint was accidentally removed in the previous migration
  - All existing data is preserved
  - This is critical for data integrity
*/

-- Restore the unique constraint on user_id and market
-- This prevents duplicate credit records for the same user and market
ALTER TABLE position_credits
  ADD CONSTRAINT position_credits_user_market_unique 
  UNIQUE (user_id, market);