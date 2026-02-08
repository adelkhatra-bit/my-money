/*
  # Ajout de la fonction pour supprimer tous les trades d'un utilisateur
  
  1. Nouvelle fonction RPC
    - `delete_user_trades(target_user_id)` - Supprime tous les trades (positions) d'un utilisateur
    - Réservé aux super admins
    - Supprime toutes les positions (OPEN et CLOSED) de l'utilisateur
    - Remet à zéro les used_credits dans position_credits
  
  2. Sécurité
    - Seuls les super admins peuvent exécuter cette fonction
    - Vérifie que l'utilisateur qui exécute est bien super_admin
*/

-- Fonction pour supprimer tous les trades d'un utilisateur
CREATE OR REPLACE FUNCTION delete_user_trades(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_id uuid;
  is_admin boolean;
  deleted_count integer;
BEGIN
  -- Récupérer l'ID de l'utilisateur qui appelle la fonction
  calling_user_id := auth.uid();
  
  -- Vérifier que l'utilisateur est authentifié
  IF calling_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Non authentifié'
    );
  END IF;
  
  -- Vérifier que l'utilisateur qui appelle est super admin
  SELECT is_super_admin INTO is_admin
  FROM user_profiles
  WHERE id = calling_user_id;
  
  IF NOT COALESCE(is_admin, false) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Accès refusé - Super admin uniquement'
    );
  END IF;
  
  -- Supprimer toutes les positions de l'utilisateur cible
  DELETE FROM positions
  WHERE user_id = target_user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Remettre à zéro les used_credits pour cet utilisateur
  UPDATE position_credits
  SET used_credits = 0
  WHERE user_id = target_user_id;
  
  -- Supprimer l'historique des actions de trading
  DELETE FROM action_history
  WHERE user_id = target_user_id
  AND action_type IN ('POSITION_OPENED', 'POSITION_CLOSED', 'SIGNAL_ACCEPTED', 'SIGNAL_DECLINED', 'SIGNAL_DISMISSED');
  
  RETURN json_build_object(
    'success', true,
    'deleted_positions', deleted_count,
    'message', 'Tous les trades ont été supprimés avec succès'
  );
END;
$$;