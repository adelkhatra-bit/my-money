/*
  # Add User Preferences Persistence

  1. Changes
    - Add `last_timeframe` column to user_settings (stores last selected timeframe)
    - Add `last_account_id` column to user_settings (stores last active trading account)

  2. Notes
    - Allows users to retain their complete trading context between sessions
    - Optional fields with default values
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'last_timeframe'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN last_timeframe text DEFAULT '5m';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'last_account_id'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN last_account_id uuid;
  END IF;
END $$;
