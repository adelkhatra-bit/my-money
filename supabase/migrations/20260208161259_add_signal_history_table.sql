/*
  # Ajouter table historique des signaux

  1. Nouvelle table
    - `signal_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers user_profiles)
      - `signal_id` (uuid, foreign key vers signals)
      - `market` (text)
      - `platform` (text)
      - `timeframe` (text)
      - `direction` (text) 
      - `entry_price` (numeric)
      - `stop_loss` (numeric)
      - `take_profit_1` (numeric)
      - `take_profit_2` (numeric)
      - `lots` (numeric)
      - `status` (text) - pris/raté/expiré
      - `result` (text) - gagnant/perdant/breakeven/en_cours
      - `pnl` (numeric)
      - `accepted_at` (timestamptz)
      - `closed_at` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Users can only read their own signal history
*/

CREATE TABLE IF NOT EXISTS signal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES signals(id) ON DELETE SET NULL,
  market text NOT NULL,
  platform text NOT NULL,
  timeframe text NOT NULL,
  direction text NOT NULL,
  entry_price numeric,
  stop_loss numeric NOT NULL,
  take_profit_1 numeric NOT NULL,
  take_profit_2 numeric,
  lots numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pris',
  result text DEFAULT 'en_cours',
  pnl numeric DEFAULT 0,
  accepted_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE signal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own signal history"
  ON signal_history
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own signal history"
  ON signal_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own signal history"
  ON signal_history
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid()));
