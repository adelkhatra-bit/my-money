/*
  # Création des tables manquantes pour le système de crédits

  1. Nouvelles Tables
    - `free_trial_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence vers user_profiles)
      - `status` (text: pending, approved, rejected)
      - `requested_at` (timestamptz)
      - `handled_at` (timestamptz, nullable)
      - `handled_by` (uuid, nullable, référence vers user_profiles)
      - `credits_granted` (int, nullable)
    
    - `referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, référence vers user_profiles)
      - `referred_id` (uuid, référence vers user_profiles)
      - `status` (text: pending, validated, rejected)
      - `bonus_granted` (bool, default false)
      - `created_at` (timestamptz)
      - `validated_at` (timestamptz, nullable)
    
    - `admin_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique)
      - `setting_value` (jsonb)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Activation RLS sur toutes les tables
    - Politiques d'accès appropriées
*/

-- Table free_trial_requests
CREATE TABLE IF NOT EXISTS free_trial_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  handled_at timestamptz,
  handled_by uuid REFERENCES user_profiles(id),
  credits_granted int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE free_trial_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trial requests"
  ON free_trial_requests FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE id = free_trial_requests.user_id
  ));

CREATE POLICY "Users can create own trial requests"
  ON free_trial_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE id = free_trial_requests.user_id
  ));

CREATE POLICY "Super admins can manage all trial requests"
  ON free_trial_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );

-- Table referrals
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  bonus_granted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  validated_at timestamptz,
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE id = referrals.referrer_id OR id = referrals.referred_id
  ));

CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admins can manage all referrals"
  ON referrals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );

-- Table admin_settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage settings"
  ON admin_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Everyone can read public settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (true);

-- Insérer les paramètres par défaut
INSERT INTO admin_settings (setting_key, setting_value)
VALUES
  ('free_trial_enabled', '{"enabled": true, "credits": 5}'::jsonb),
  ('referral_system', '{"enabled": true, "referrer_bonus": 5, "referred_bonus": 3, "max_per_month": 50}'::jsonb),
  ('super_admin_code', '{"code": "2709"}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_free_trial_requests_user_id ON free_trial_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_free_trial_requests_status ON free_trial_requests(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
