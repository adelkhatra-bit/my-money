/*
  # Fix User Profile Creation Issues

  1. Nettoyage
    - Suppression des politiques RLS dupliquées sur user_profiles
    
  2. Amélioration
    - Création d'un trigger automatique pour créer le profil utilisateur lors de l'inscription
    - Cela évite les erreurs de création manuelle de profil
    
  3. Sécurité
    - Maintien des politiques RLS pour la lecture et mise à jour
    - Le trigger s'exécute avec les privilèges nécessaires
*/

-- Nettoyer les politiques dupliquées
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Créer une politique unique et claire pour l'insertion
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Créer une fonction pour auto-créer le profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- S'assurer que tous les utilisateurs existants ont un profil
INSERT INTO public.user_profiles (user_id, email, is_super_admin)
SELECT 
  au.id,
  au.email,
  false
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.user_id = au.id
WHERE up.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
