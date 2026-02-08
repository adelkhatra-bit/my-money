/*
  # Suppression de la policy récursive sur user_profiles

  ## Problème
  La policy "Users can read own profile or super admins can read all" 
  contient une sous-requête sur user_profiles qui cause une récursion infinie.

  ## Solution
  - Supprimer cette policy problématique
  - Garder uniquement les policies simples sans récursion
*/

-- Supprimer la policy récursive
DROP POLICY IF EXISTS "Users can read own profile or super admins can read all" ON user_profiles;

-- Vérifier qu'on a bien les policies simples
-- (elles existent déjà depuis la migration précédente)
-- "Allow users to read own profile" - simple, pas de récursion
-- "Allow users to insert own profile" - simple, pas de récursion
-- "Allow users to update own profile" - simple, pas de récursion
