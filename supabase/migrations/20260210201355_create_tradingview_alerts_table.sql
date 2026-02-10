/*
  # Create TradingView Alerts Table

  1. New Tables
    - `tradingview_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `symbol` (text) - The trading symbol (MNQ, NAS100, etc.)
      - `timeframe` (text) - Timeframe (1, 5, 15, 30, etc.)
      - `side` (text) - LONG or SHORT
      - `entry` (numeric) - Entry price
      - `sl` (numeric) - Stop loss price
      - `tp1` (numeric, nullable) - First take profit
      - `tp2` (numeric, nullable) - Second take profit
      - `status` (text) - pending, confirmed, rejected, executed
      - `bot_response` (jsonb, nullable) - Bot analysis and decision
      - `created_at` (timestamptz)
      - `processed_at` (timestamptz, nullable)
  
  2. Security
    - Enable RLS on `tradingview_alerts` table
    - Add policy for users to read their own alerts
    - Add policy for service role to insert alerts (for webhook)
  
  3. Indexes
    - Index on user_id for fast lookups
    - Index on status for filtering
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS tradingview_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  timeframe text NOT NULL,
  side text NOT NULL CHECK (side IN ('LONG', 'SHORT')),
  entry numeric NOT NULL,
  sl numeric NOT NULL,
  tp1 numeric,
  tp2 numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'executed')),
  bot_response jsonb,
  raw_payload jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tradingview_alerts_user_id ON tradingview_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_tradingview_alerts_status ON tradingview_alerts(status);
CREATE INDEX IF NOT EXISTS idx_tradingview_alerts_created_at ON tradingview_alerts(created_at DESC);

ALTER TABLE tradingview_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON tradingview_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON tradingview_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);