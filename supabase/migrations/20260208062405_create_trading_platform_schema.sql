/*
  # Trading Platform Complete Schema
  
  1. New Tables
    - users (authentication, managed by Supabase Auth)
    - user_profiles
      - user_id (uuid, references auth.users)
      - email (text)
      - is_super_admin (boolean)
      - created_at (timestamptz)
    - trading_accounts
      - id (uuid, primary key)
      - user_id (uuid, references user_profiles)
      - name (text) - e.g., "Binance Personal", "FTMO 50k"
      - platform (text) - e.g., "binance", "bybit", "ftmo", "topstep"
      - market (text) - e.g., "BTC", "NASDAQ", "GOLD"
      - capital (decimal) - account balance
      - risk_per_trade_percent (decimal) - default risk %
      - max_daily_loss (decimal)
      - max_total_loss (decimal)
      - is_active (boolean)
      - created_at (timestamptz)
    - position_credits
      - id (uuid, primary key)
      - user_id (uuid, references user_profiles)
      - market (text) - e.g., "BTC", "NASDAQ", "GOLD"
      - total_credits (integer) - total positions purchased
      - used_credits (integer) - positions consumed
      - remaining_credits (integer) - computed
      - expires_at (timestamptz, nullable)
      - created_at (timestamptz)
    - signals
      - id (uuid, primary key)
      - market (text)
      - platform (text)
      - timeframe (text) - e.g., "5m", "15m", "1h"
      - direction (text) - "LONG" or "SHORT"
      - entry_min (decimal)
      - entry_max (decimal)
      - stop_loss (decimal)
      - take_profit_1 (decimal)
      - take_profit_2 (decimal, nullable)
      - confidence (integer) - 0-100
      - risk_reward (decimal)
      - reasons (jsonb) - array of confirmation reasons
      - status (text) - "PENDING", "ACTIVE", "EXPIRED", "CANCELLED"
      - valid_until (timestamptz)
      - created_at (timestamptz)
    - positions
      - id (uuid, primary key)
      - user_id (uuid, references user_profiles)
      - account_id (uuid, references trading_accounts)
      - signal_id (uuid, references signals)
      - market (text)
      - platform (text)
      - direction (text)
      - entry_price (decimal)
      - stop_loss (decimal)
      - take_profit_1 (decimal)
      - take_profit_2 (decimal, nullable)
      - position_size (decimal) - lots/contracts
      - status (text) - "OPEN", "TP1_HIT", "TP2_HIT", "SL_HIT", "BE", "CLOSED"
      - entry_time (timestamptz)
      - exit_time (timestamptz, nullable)
      - exit_price (decimal, nullable)
      - pnl (decimal, nullable)
      - pnl_percent (decimal, nullable)
      - user_modified (boolean) - did user change risk settings?
      - created_at (timestamptz)
    - market_config
      - id (uuid, primary key)
      - market (text, unique)
      - is_24_7 (boolean) - crypto = true, others = false
      - trading_hours (jsonb) - schedule by day
      - timezone (text)
      - tick_size (decimal)
      - point_value (decimal)
      - min_lot_size (decimal)
    - platform_config
      - id (uuid, primary key)
      - platform (text)
      - market (text)
      - data_source_url (text)
      - graduation (text) - price formatting rules
      - fees (jsonb)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for super admin access
    
  3. Important Notes
    - All positions consume 1 credit when created
    - Signals expire after validity period
    - Super admin can manage all users and credits
    - Market hours are validated before signal generation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Trading Accounts Table
CREATE TABLE IF NOT EXISTS trading_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  platform text NOT NULL,
  market text NOT NULL,
  capital decimal NOT NULL DEFAULT 0,
  risk_per_trade_percent decimal NOT NULL DEFAULT 0.5,
  max_daily_loss decimal,
  max_total_loss decimal,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own accounts"
  ON trading_accounts FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all accounts"
  ON trading_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Position Credits Table
CREATE TABLE IF NOT EXISTS position_credits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  market text NOT NULL,
  total_credits integer NOT NULL DEFAULT 0,
  used_credits integer NOT NULL DEFAULT 0,
  remaining_credits integer GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE position_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON position_credits FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all credits"
  ON position_credits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Signals Table
CREATE TABLE IF NOT EXISTS signals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  market text NOT NULL,
  platform text NOT NULL,
  timeframe text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry_min decimal NOT NULL,
  entry_max decimal NOT NULL,
  stop_loss decimal NOT NULL,
  take_profit_1 decimal NOT NULL,
  take_profit_2 decimal,
  confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  risk_reward decimal NOT NULL,
  reasons jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active signals"
  ON signals FOR SELECT
  TO authenticated
  USING (status = 'ACTIVE');

CREATE POLICY "Super admins can manage all signals"
  ON signals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Positions Table
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id uuid REFERENCES trading_accounts(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES signals(id),
  market text NOT NULL,
  platform text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry_price decimal NOT NULL,
  stop_loss decimal NOT NULL,
  take_profit_1 decimal NOT NULL,
  take_profit_2 decimal,
  position_size decimal NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'TP1_HIT', 'TP2_HIT', 'SL_HIT', 'BE', 'CLOSED')),
  entry_time timestamptz DEFAULT now(),
  exit_time timestamptz,
  exit_price decimal,
  pnl decimal,
  pnl_percent decimal,
  user_modified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own positions"
  ON positions FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all positions"
  ON positions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Market Config Table
CREATE TABLE IF NOT EXISTS market_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  market text UNIQUE NOT NULL,
  is_24_7 boolean DEFAULT false,
  trading_hours jsonb DEFAULT '{}'::jsonb,
  timezone text DEFAULT 'UTC',
  tick_size decimal DEFAULT 0.01,
  point_value decimal DEFAULT 1.0,
  min_lot_size decimal DEFAULT 0.01
);

ALTER TABLE market_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read market config"
  ON market_config FOR SELECT
  TO authenticated
  USING (true);

-- Platform Config Table
CREATE TABLE IF NOT EXISTS platform_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform text NOT NULL,
  market text NOT NULL,
  data_source_url text,
  graduation text,
  fees jsonb DEFAULT '{}'::jsonb,
  UNIQUE(platform, market)
);

ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read platform config"
  ON platform_config FOR SELECT
  TO authenticated
  USING (true);

-- Insert default market configurations
INSERT INTO market_config (market, is_24_7, tick_size, point_value, timezone) VALUES
('BTC', true, 0.01, 1.0, 'UTC'),
('ETH', true, 0.01, 1.0, 'UTC'),
('NASDAQ', false, 0.25, 5.0, 'America/New_York'),
('GOLD', false, 0.1, 100.0, 'America/New_York')
ON CONFLICT (market) DO NOTHING;

-- Insert default platform configurations
INSERT INTO platform_config (platform, market, data_source_url, graduation) VALUES
('binance', 'BTC', 'wss://stream.binance.com:9443/ws/btcusdt@kline_1m', 'BTCUSDT'),
('binance', 'ETH', 'wss://stream.binance.com:9443/ws/ethusdt@kline_1m', 'ETHUSDT'),
('bybit', 'BTC', 'wss://stream.bybit.com/v5/public/linear', 'BTCUSDT'),
('coinbase', 'BTC', 'wss://ws-feed.exchange.coinbase.com', 'BTC-USD')
ON CONFLICT (platform, market) DO NOTHING;