/*
  # Add Referral and Free Trial System

  1. New Tables
    - referral_system
      - id (uuid, primary key)
      - user_id (uuid, references user_profiles)
      - referral_code (text, unique) - code unique pour partager
      - referrals_count (integer) - nombre de filleuls
      - bonus_credits_earned (integer) - crédits bonus gagnés
      - created_at (timestamptz)
    - referral_links
      - id (uuid, primary key)
      - referrer_id (uuid, references user_profiles)
      - referred_user_id (uuid, references user_profiles)
      - status (text) - "PENDING", "VALIDATED", "CREDITED"
      - bonus_credited (boolean)
      - created_at (timestamptz)
    - free_trial_requests
      - id (uuid, primary key)
      - user_id (uuid, references user_profiles)
      - status (text) - "PENDING", "APPROVED", "REJECTED"
      - request_count (integer) - nombre de demandes
      - approved_by (uuid, references user_profiles)
      - created_at (timestamptz)
    - admin_settings
      - id (uuid, primary key)
      - setting_key (text, unique)
      - setting_value (jsonb)
      - updated_at (timestamptz)
    - pre_alerts
      - id (uuid, primary key)
      - signal_id (uuid, references signals)
      - user_id (uuid, references user_profiles)
      - market (text)
      - platform (text)
      - expected_direction (text)
      - alert_time (timestamptz)
      - status (text) - "SENT", "CONFIRMED", "EXPIRED"
      - created_at (timestamptz)
      
  2. Modifications
    - Add fields to position_credits for bonus tracking
    - Add fields to user_profiles for trial status
    
  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Referral System Table
CREATE TABLE IF NOT EXISTS referral_system (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  referral_code text UNIQUE NOT NULL,
  referrals_count integer DEFAULT 0,
  bonus_credits_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referral_system ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral data"
  ON referral_system FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all referral data"
  ON referral_system FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Referral Links Table
CREATE TABLE IF NOT EXISTS referral_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VALIDATED', 'CREDITED')),
  bonus_credited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_user_id)
);

ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral links"
  ON referral_links FOR SELECT
  TO authenticated
  USING (
    referrer_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all referral links"
  ON referral_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Free Trial Requests Table
CREATE TABLE IF NOT EXISTS free_trial_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  request_count integer DEFAULT 1,
  approved_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE free_trial_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trial requests"
  ON free_trial_requests FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trial requests"
  ON free_trial_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all trial requests"
  ON free_trial_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read admin settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage settings"
  ON admin_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Pre-alerts Table
CREATE TABLE IF NOT EXISTS pre_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id uuid REFERENCES signals(id),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  market text NOT NULL,
  platform text NOT NULL,
  expected_direction text,
  alert_time timestamptz DEFAULT now(),
  status text DEFAULT 'SENT' CHECK (status IN ('SENT', 'CONFIRMED', 'EXPIRED')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pre_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pre-alerts"
  ON pre_alerts FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Add bonus tracking to position_credits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'position_credits' AND column_name = 'bonus_credits'
  ) THEN
    ALTER TABLE position_credits ADD COLUMN bonus_credits integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'position_credits' AND column_name = 'purchased_credits'
  ) THEN
    ALTER TABLE position_credits ADD COLUMN purchased_credits integer DEFAULT 0;
  END IF;
END $$;

-- Add trial fields to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'has_used_trial'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN has_used_trial boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'trial_granted_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN trial_granted_at timestamptz;
  END IF;
END $$;

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value) VALUES
('free_trial_enabled', '{"enabled": true, "positions": 5}'::jsonb),
('referral_enabled', '{"enabled": true, "referrer_bonus": 5, "referred_bonus": 3, "max_bonus_per_month": 50}'::jsonb),
('auto_approve_first_trial', '{"enabled": true}'::jsonb),
('pricing_packs', '{"starter": {"positions": 10, "price": 29}, "trader": {"positions": 15, "price": 39}, "pro": {"positions": 30, "price": 69}, "elite": {"positions": 50, "price": 99}}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create referral code on user profile creation
CREATE OR REPLACE FUNCTION create_referral_code_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := generate_referral_code();
    SELECT EXISTS(SELECT 1 FROM referral_system WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  INSERT INTO referral_system (user_id, referral_code)
  VALUES (NEW.id, new_code);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_referral_code ON user_profiles;
CREATE TRIGGER trigger_create_referral_code
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_code_for_user();