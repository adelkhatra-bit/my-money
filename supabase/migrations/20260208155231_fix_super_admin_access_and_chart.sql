/*
  # Correction Accès Super Admin et Affichage Graphiques

  1. Problème Résolu
    - Les Super Admins ne pouvaient pas voir les demandes de test en attente
    - La politique RLS ne permettait qu'aux utilisateurs de voir leurs propres demandes
    
  2. Changements
    - Ajout d'une politique RLS permettant aux super admins de voir TOUTES les demandes
    - Ajout d'une politique pour que les super admins puissent gérer les demandes
    
  3. Sécurité
    - Vérification que l'utilisateur est super admin via user_profiles.is_super_admin
    - Seuls les super admins peuvent voir et modifier les demandes des autres utilisateurs
*/

-- Politique pour que les super admins puissent voir TOUTES les demandes
CREATE POLICY "Super admins can view all trial requests"
  ON free_trial_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );

-- Politique pour que les super admins puissent mettre à jour les demandes
CREATE POLICY "Super admins can update trial requests"
  ON free_trial_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_super_admin = true
    )
  );
