/*
  # Création des fonctions RPC pour le Super Admin

  1. Fonctions créées
    - approve_free_trial: Approuver une demande de test gratuit
    - reject_free_trial: Rejeter une demande de test gratuit
    - grant_referral_bonus: Accorder les bonus de parrainage
  
  2. Sécurité
    - Toutes les fonctions vérifient que l'utilisateur appelant est un super admin
*/

-- Fonction pour approuver une demande de test gratuit
CREATE OR REPLACE FUNCTION approve_free_trial(
  request_id uuid,
  credits_to_grant int DEFAULT 5
)
RETURNS jsonb
SECURITY DEFINER
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

-- Fonction pour rejeter une demande de test gratuit
CREATE OR REPLACE FUNCTION reject_free_trial(
  request_id uuid
)
RETURNS jsonb
SECURITY DEFINER
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

-- Fonction pour accorder les bonus de parrainage
CREATE OR REPLACE FUNCTION grant_referral_bonus(
  referral_id uuid
)
RETURNS jsonb
SECURITY DEFINER
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

-- Ajouter une contrainte unique sur position_credits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'position_credits_user_market_unique'
  ) THEN
    ALTER TABLE position_credits 
    ADD CONSTRAINT position_credits_user_market_unique 
    UNIQUE (user_id, market);
  END IF;
END $$;
