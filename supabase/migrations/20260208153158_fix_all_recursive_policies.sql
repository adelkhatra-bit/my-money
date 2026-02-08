/*
  # Correction complète de toutes les policies récursives

  ## Problème
  Toutes les policies qui font référence à user_profiles dans leurs conditions
  causent une récursion infinie.

  ## Solution
  1. Créer une fonction helper pour vérifier le statut super admin
  2. Supprimer toutes les policies récursives
  3. Créer des policies simples sans récursion
*/

-- 1. Créer une fonction sécurisée pour vérifier le statut super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  );
$$;

-- 2. Fonction pour obtenir l'ID du profil de l'utilisateur courant
CREATE OR REPLACE FUNCTION current_user_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 3. Supprimer TOUTES les policies récursives

-- position_credits
DROP POLICY IF EXISTS "Users can view own credits or super admins can view all" ON position_credits;
DROP POLICY IF EXISTS "Super admins can insert credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can update credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can delete credits" ON position_credits;

-- positions
DROP POLICY IF EXISTS "Users can view own positions or super admins can view all" ON positions;

-- trading_accounts
DROP POLICY IF EXISTS "Users can view own accounts or super admins can view all" ON trading_accounts;

-- signals
DROP POLICY IF EXISTS "Super admins can insert signals" ON signals;
DROP POLICY IF EXISTS "Super admins can update signals" ON signals;
DROP POLICY IF EXISTS "Super admins can delete signals" ON signals;
DROP POLICY IF EXISTS "Users can view active signals or super admins can view all" ON signals;

-- 4. Créer des policies simples SANS RÉCURSION

-- POSITION_CREDITS: Lecture simple
CREATE POLICY "Users view own credits"
  ON position_credits FOR SELECT
  TO authenticated
  USING (user_id = current_user_profile_id() OR is_super_admin());

-- POSITION_CREDITS: Super admin peut tout faire
CREATE POLICY "Super admins manage all credits"
  ON position_credits FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- POSITIONS: Lecture et gestion
CREATE POLICY "Users view own positions"
  ON positions FOR SELECT
  TO authenticated
  USING (user_id = current_user_profile_id() OR is_super_admin());

CREATE POLICY "Super admins manage all positions"
  ON positions FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- TRADING_ACCOUNTS: Lecture et gestion
CREATE POLICY "Users view own accounts"
  ON trading_accounts FOR SELECT
  TO authenticated
  USING (user_id = current_user_profile_id() OR is_super_admin());

CREATE POLICY "Super admins manage all accounts"
  ON trading_accounts FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- SIGNALS: Lecture pour tous, gestion par super admin
CREATE POLICY "All users read signals"
  ON signals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins manage signals"
  ON signals FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- FREE_TRIAL_REQUESTS: Déjà corrigées, pas de changement

-- REFERRALS: Déjà corrigées, pas de changement

-- ADMIN_SETTINGS: Déjà corrigées, pas de changement
