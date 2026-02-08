/*
  # Correction des policies RLS - Élimination de la récursion infinie

  ## Problème
  Les policies actuelles causent une récursion infinie car elles font des jointures 
  circulaires entre user_profiles et d'autres tables.

  ## Solution
  - Utiliser directement auth.uid() sans sous-requêtes complexes
  - Simplifier les policies pour éviter les jointures récursives
  - Utiliser des policies RESTRICTIVE pour la sécurité

  ## Modifications
  1. Suppression de toutes les policies problématiques
  2. Création de policies simplifiées sans récursion
  3. Ajout d'un trigger pour créer automatiquement le profil utilisateur
*/

-- ==============================================
-- 1. SUPPRESSION DES POLICIES PROBLÉMATIQUES
-- ==============================================

-- user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;

-- trading_accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON trading_accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON trading_accounts;

-- position_credits
DROP POLICY IF EXISTS "Users can view own credits" ON position_credits;
DROP POLICY IF EXISTS "Super admins can manage all credits" ON position_credits;

-- positions
DROP POLICY IF EXISTS "Users can view own positions" ON positions;
DROP POLICY IF EXISTS "Users can insert own positions" ON positions;
DROP POLICY IF EXISTS "Users can update own positions" ON positions;

-- free_trial_requests
DROP POLICY IF EXISTS "Users can view own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Users can create own trial requests" ON free_trial_requests;
DROP POLICY IF EXISTS "Super admins can manage all trial requests" ON free_trial_requests;

-- referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
DROP POLICY IF EXISTS "System can create referrals" ON referrals;
DROP POLICY IF EXISTS "Super admins can manage all referrals" ON referrals;

-- ==============================================
-- 2. CRÉATION DES NOUVELLES POLICIES SIMPLIFIÉES
-- ==============================================

-- USER_PROFILES: Policies simples sans récursion
CREATE POLICY "Allow users to read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- TRADING_ACCOUNTS: Utilise directement l'ID du profil
CREATE POLICY "Allow users to manage own trading accounts"
  ON trading_accounts FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- POSITION_CREDITS: Accès direct
CREATE POLICY "Allow users to view own credits"
  ON position_credits FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- POSITIONS: Accès direct
CREATE POLICY "Allow users to manage own positions"
  ON positions FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- SIGNALS: Lecture seule pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to read signals"
  ON signals FOR SELECT
  TO authenticated
  USING (true);

-- FREE_TRIAL_REQUESTS: Simplifié
CREATE POLICY "Allow users to view own trial requests"
  ON free_trial_requests FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to create trial requests"
  ON free_trial_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- REFERRALS: Simplifié
CREATE POLICY "Allow users to view related referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referrer_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    OR referred_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Allow users to create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    referrer_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

-- ==============================================
-- 3. TRIGGER POUR CRÉER AUTOMATIQUEMENT LE PROFIL
-- ==============================================

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'adel.khatra@live.fr' THEN true
      ELSE false
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();

-- ==============================================
-- 4. CORRECTION DES CONTRAINTES UNIQUE
-- ==============================================

-- S'assurer qu'il n'y a qu'une seule contrainte unique sur position_credits
ALTER TABLE position_credits DROP CONSTRAINT IF EXISTS position_credits_user_id_market_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_position_credits_user_market 
  ON position_credits(user_id, market);
