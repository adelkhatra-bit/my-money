/*
  # Add Action History Tracking

  1. New Tables
    - `action_history`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - User who performed the action
      - `action_type` (text) - Type of action (SCAN, SIGNAL_GENERATED, SIGNAL_ACCEPTED, SIGNAL_DISMISSED, POSITION_OPENED, POSITION_CLOSED, TP_HIT, SL_HIT)
      - `market` (text) - Market symbol (BTC, EUR_USD, etc.)
      - `platform` (text) - Trading platform (binance, meta_trader, etc.)
      - `details` (jsonb) - Additional details about the action
      - `created_at` (timestamp) - When the action occurred

  2. Security
    - Enable RLS on `action_history` table
    - Add policy for users to insert their own history
    - Add policy for users to read their own history
    - Add policy for super admins to read all history

  3. Indexes
    - Index on user_id for faster queries
    - Index on created_at for chronological sorting
    - Index on action_type for filtering
*/

CREATE TABLE IF NOT EXISTS action_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  market text,
  platform text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_history_user_id ON action_history(user_id);
CREATE INDEX IF NOT EXISTS idx_action_history_created_at ON action_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_history_action_type ON action_history(action_type);

ALTER TABLE action_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own action history"
  ON action_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read own action history"
  ON action_history
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can read all action history"
  ON action_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );