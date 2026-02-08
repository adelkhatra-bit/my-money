/*
  # Création des fonctions RPC manquantes

  ## Nouvelles Fonctions
  
  1. `request_free_trial()`
     - Permet à un utilisateur de demander un test gratuit
     - Vérifie qu'il n'a pas déjà fait de demande
     - Crée une demande en statut 'pending'
  
  2. `get_user_stats(user_profile_id UUID)`
     - Retourne les statistiques d'un utilisateur
     - Total trades, wins, losses, PnL
  
  ## Sécurité
  - Toutes les fonctions vérifient l'authentification
  - Les fonctions admin vérifient le statut super_admin
*/

-- Fonction pour demander un test gratuit
CREATE OR REPLACE FUNCTION request_free_trial()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_existing_request record;
BEGIN
  -- Récupérer l'ID de l'utilisateur authentifié
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  -- Récupérer le profil utilisateur
  SELECT id INTO v_profile_id
  FROM user_profiles
  WHERE user_id = v_user_id;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profil introuvable');
  END IF;

  -- Vérifier si une demande existe déjà
  SELECT * INTO v_existing_request
  FROM free_trial_requests
  WHERE user_id = v_profile_id
  LIMIT 1;

  IF v_existing_request.id IS NOT NULL THEN
    IF v_existing_request.status = 'pending' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vous avez déjà une demande en attente');
    ELSIF v_existing_request.status = 'approved' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vous avez déjà utilisé votre test gratuit');
    END IF;
  END IF;

  -- Créer une nouvelle demande
  INSERT INTO free_trial_requests (user_id, status)
  VALUES (v_profile_id, 'pending');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Demande de test gratuit envoyée avec succès!'
  );
END;
$$;

-- Fonction pour obtenir les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_stats(user_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
  v_total_trades int;
  v_wins int;
  v_losses int;
  v_total_pnl numeric;
  v_winrate numeric;
BEGIN
  -- Vérifier l'authentification
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifié');
  END IF;

  -- Compter les trades
  SELECT COUNT(*) INTO v_total_trades
  FROM positions
  WHERE user_id = user_profile_id;

  -- Compter les wins
  SELECT COUNT(*) INTO v_wins
  FROM positions
  WHERE user_id = user_profile_id
  AND (status = 'TP1_HIT' OR status = 'TP2_HIT');

  -- Compter les losses
  SELECT COUNT(*) INTO v_losses
  FROM positions
  WHERE user_id = user_profile_id
  AND status = 'SL_HIT';

  -- Calculer le PnL total
  SELECT COALESCE(SUM(pnl), 0) INTO v_total_pnl
  FROM positions
  WHERE user_id = user_profile_id;

  -- Calculer le winrate
  IF v_total_trades > 0 THEN
    v_winrate := (v_wins::numeric / v_total_trades::numeric) * 100;
  ELSE
    v_winrate := 0;
  END IF;

  RETURN jsonb_build_object(
    'totalTrades', v_total_trades,
    'wins', v_wins,
    'losses', v_losses,
    'winrate', ROUND(v_winrate, 2),
    'totalPnL', ROUND(v_total_pnl, 2)
  );
END;
$$;