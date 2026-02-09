/*
  # Add Market and Platform Preferences

  1. Changes
    - Add `last_market` column to user_settings (stores last selected market)
    - Add `last_platform` column to user_settings (stores last selected platform)

  2. Notes
    - Allows users to retain their market/platform selection between sessions
    - Optional fields with default values
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'last_market'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN last_market text DEFAULT 'BTC';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'last_platform'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN last_platform text DEFAULT 'binance';
  END IF;
END $$;
