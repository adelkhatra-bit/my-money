/*
  # Add Topstep Connections Table

  1. New Tables
    - `topstep_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `platform` (text) - topstep, ftmo, apex
      - `broker` (text) - tradovate, rithmic, cqg
      - `is_connected` (boolean)
      - `credentials_encrypted` (jsonb) - encrypted credentials
      - `last_connected_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `topstep_connections` table
    - Add policy for authenticated users to manage their own connections

  3. Indexes
    - Index on user_id for fast lookups
*/

CREATE TABLE IF NOT EXISTS topstep_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL DEFAULT 'topstep',
  broker text NOT NULL DEFAULT 'tradovate',
  is_connected boolean DEFAULT false,
  credentials_encrypted jsonb DEFAULT '{}'::jsonb,
  last_connected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE topstep_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON topstep_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON topstep_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON topstep_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON topstep_connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_topstep_connections_user_id ON topstep_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_topstep_connections_is_connected ON topstep_connections(user_id, is_connected);
