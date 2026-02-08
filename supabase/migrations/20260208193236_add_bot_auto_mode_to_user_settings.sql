/*
  # Add bot auto mode to user settings

  1. Changes
    - Add `bot_auto_mode` column to `user_settings` table
      - Stores whether the bot is active for this user
      - Allows bot state to persist across sessions and page navigation
      - Default is false (bot off by default)
  
  2. Purpose
    - Enables users to keep their bot running even when navigating to other pages
    - Bot state is saved and restored automatically
    - Users can disable the bot anytime they want
*/

-- Add bot_auto_mode column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'bot_auto_mode'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN bot_auto_mode boolean DEFAULT false;
  END IF;
END $$;