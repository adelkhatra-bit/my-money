/*
  # Correction des problèmes de sécurité

  1. Ajout d'index manquants pour les foreign keys
  2. Optimisation des politiques RLS avec (select auth.uid())
  3. Correction des fonctions RPC avec search_path sécurisé
  4. Consolidation des politiques permissives multiples
  
  2. Sécurité
    - Amélioration des performances RLS
    - Protection contre les injections de search_path
    - Consolidation des politiques
*/

-- 1. Ajouter index manquant pour handled_by foreign key
CREATE INDEX IF NOT EXISTS idx_free_trial_requests_handled_by 
ON free_trial_requests(handled_by);

-- 2. Drop et recréer les politiques RLS avec optimisation (select auth.uid())

-- Politiques free_trial_requests
DROP POLICY IF EXISTS "Users can view own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users can create own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Super admins can manage all trial requests" ON free_trial_requests;

CREATE POLICY "Users can view own trial requests"
  ON free_trial_requests FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE id = free_trial_requests.user_id
  ));

CREATE POLICY "Users can create own trial requests"
  ON free_trial_requests FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles WHERE id = free_trial_requests.user_id
  ));

CREATE POLICY "Super admins can manage all trial requests"
  ON free_trial_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- Politiques referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
DROP POLICY IF EXISTS "System can create referrals" ON referrals;
DROP POLICY IF EXISTS "Super admins can manage all referrals" ON referrals;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (
    SELECT user_id FROM user_profiles 
    WHERE id = referrals.referrer_id OR id = referrals.referred_id
  ));

-- Politique INSERT restrictive avec vérification que l'utilisateur existe
CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    referrer_id IN (
      SELECT id FROM user_profiles WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins can manage all referrals"
  ON referrals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- Politiques admin_settings
DROP POLICY IF EXISTS "Super admins can manage settings" ON admin_settings;
DROP POLICY IF EXISTS "Everyone can read public settings" ON admin_settings;

CREATE POLICY "Super admins can manage settings"
  ON admin_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = (SELECT auth.uid())
      AND user_profiles.is_super_admin = true
    )
  );

-- Politique séparée en lecture seule pour les utilisateurs normaux
CREATE POLICY "Authenticated users can read public settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (
    setting_key IN ('free_trial_enabled', 'referral_system')
  );

-- 3. Recréer les fonctions RPC avec search_path sécurisé

-- Fonction approve_free_trial
CREATE OR REPLACE FUNCTION approve_free_trial(
  request_id uuid,
  credits_to_grant int DEFAULT 5
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_request_user_id uuid;
  v_is_super_admin boolean;
  v_market text;
BEGIN
  SELECT is_super_admin INTO v_is_super_admin
  FROM user_profiles
  WHERE user_id = auth.uid();

  IF NOT v_is_super_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  SELECT user_id INTO v_request_user_id
  FROM free_trial_requests
  WHERE id = request_id;

  IF v_request_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Demande introuvable');
  END IF;

  UPDATE free_trial_requests
  SET 
    status = 'approved',
    handled_at = now(),
    handled_by = (SELECT id FROM user_profiles WHERE user_id = auth.uid()),
    credits_granted = credits_to_grant
  WHERE id = request_id;

  FOR v_market IN SELECT unnest(ARRAY['BTC', 'ETH', 'NASDAQ', 'GOLD']) LOOP
    INSERT INTO position_credits (user_id, market, total_credits, used_credits)
    VALUES (v_request_user_id, v_market, credits_to_grant, 0)
    ON CONFLICT (user_id, market) 
    DO UPDATE SET total_credits = position_credits.total_credits + credits_to_grant;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message', 'Demande approuvée');
END;
$$;

-- Fonction reject_free_trial
CREATE OR REPLACE FUNCTION reject_free_trial(
  request_id uuid
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_super_admin boolean;
BEGIN
  SELECT is_super_admin INTO v_is_super_admin
  FROM user_profiles
  WHERE user_id = auth.uid();

  IF NOT v_is_super_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;

  UPDATE free_trial_requests
  SET 
    status = 'rejected',
    handled_at = now(),
    handled_by = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  WHERE id = request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Demande introuvable');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Demande rejetée');
END;
$$;

-- Fonction grant_referral_bonus
CREATE OR REPLACE FUNCTION grant_referral_bonus(
  referral_id uuid
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_referrer_id uuid;
  v_referred_id uuid;
  v_referrer_bonus int;
  v_referred_bonus int;
  v_settings jsonb;
BEGIN
  SELECT setting_value INTO v_settings
  FROM admin_settings
  WHERE setting_key = 'referral_system';

  v_referrer_bonus := (v_settings->>'referrer_bonus')::int;
  v_referred_bonus := (v_settings->>'referred_bonus')::int;

  SELECT referrer_id, referred_id INTO v_referrer_id, v_referred_id
  FROM referrals
  WHERE id = referral_id AND status = 'pending';

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Parrainage introuvable ou déjà validé');
  END IF;

  UPDATE referrals
  SET 
    status = 'validated',
    validated_at = now(),
    bonus_granted = true
  WHERE id = referral_id;

  INSERT INTO position_credits (user_id, market, total_credits, used_credits)
  VALUES (v_referrer_id, 'BTC', v_referrer_bonus, 0)
  ON CONFLICT (user_id, market) 
  DO UPDATE SET total_credits = position_credits.total_credits + v_referrer_bonus;

  INSERT INTO position_credits (user_id, market, total_credits, used_credits)
  VALUES (v_referred_id, 'BTC', v_referred_bonus, 0)
  ON CONFLICT (user_id, market) 
  DO UPDATE SET total_credits = position_credits.total_credits + v_referred_bonus;

  RETURN jsonb_build_object('success', true, 'message', 'Bonus accordés');
END;
$$;

-- 4. Ajouter des commentaires pour expliquer les index "non utilisés"
COMMENT ON INDEX idx_free_trial_requests_user_id IS 
  'Index pour améliorer les requêtes de demandes de test par utilisateur';
COMMENT ON INDEX idx_free_trial_requests_status IS 
  'Index pour filtrer rapidement les demandes par statut (pending/approved/rejected)';
COMMENT ON INDEX idx_referrals_referrer_id IS 
  'Index pour améliorer les requêtes de parrainages par parrain';
COMMENT ON INDEX idx_referrals_referred_id IS 
  'Index pour améliorer les requêtes de parrainages par filleul';
COMMENT ON INDEX idx_referrals_status IS 
  'Index pour filtrer rapidement les parrainages par statut';
COMMENT ON INDEX idx_position_credits_user_id IS 
  'Index pour améliorer les requêtes de crédits par utilisateur';
COMMENT ON INDEX idx_positions_account_id IS 
  'Index pour améliorer les requêtes de positions par compte';
COMMENT ON INDEX idx_positions_signal_id IS 
  'Index pour améliorer les requêtes de positions par signal';
COMMENT ON INDEX idx_positions_user_id IS 
  'Index pour améliorer les requêtes de positions par utilisateur';
COMMENT ON INDEX idx_trading_accounts_user_id IS 
  'Index pour améliorer les requêtes de comptes de trading par utilisateur';
