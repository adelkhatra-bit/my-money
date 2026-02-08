# 🧪 Guide de Test Complet

## Préparation

### 1. Lancer l'Application
```bash
npm start
```
L'application s'ouvrira sur `http://localhost:3000`

### 2. Créer un Email de Test
Pour tester en tant que super admin, utilisez un de ces emails:
- `adelkhatra@gmail.com`
- `adelkhatra@hotmail.com`
- `adel.khatra@gmail.com`

Ou ajoutez votre email dans la base de données:
```sql
INSERT INTO super_admin_emails (email) VALUES ('votre.email@example.com');
```

## 📋 Tests à Effectuer

### Test 1: Inscription et Profil (Utilisateur Normal)

**Objectif**: Vérifier que l'inscription fonctionne sans erreur de récursion

1. Cliquer sur "Sign Up"
2. S'inscrire avec un email normal (ex: `test@example.com`)
3. Vérifier qu'aucune erreur "infinite recursion" n'apparaît
4. Après connexion, aller sur `/profil`
5. Vérifier que le profil s'affiche correctement avec:
   - Email correct
   - Statut "👤 Utilisateur"
   - Section "Mes Crédits" (vide au début)
   - Bouton "🎁 Demander Mon Cadeau" visible

**✅ Résultat attendu**: Profil affiché sans erreur, bouton cadeau visible

### Test 2: Demander le Test Gratuit

**Objectif**: Vérifier que la demande de test gratuit fonctionne

1. Sur la page `/profil`, cliquer sur "🎁 Demander Mon Cadeau"
2. Attendre le message de confirmation
3. Vérifier le message: "✅ Votre demande a été soumise"
4. Le bouton devrait disparaître ou être désactivé
5. La demande est maintenant en attente d'approbation

**✅ Résultat attendu**: Message de succès, demande enregistrée

### Test 3: Inscription Super Admin

**Objectif**: Vérifier l'attribution automatique du statut super admin

1. Se déconnecter
2. S'inscrire avec `adelkhatra@gmail.com` (ou email configuré)
3. Après connexion, aller sur `/profil`
4. Vérifier le statut "👑 Super Admin"
5. Vérifier que le bouton "Super Admin Panel" est visible
6. Cliquer dessus pour accéder à `/admin`

**✅ Résultat attendu**: Statut super admin attribué automatiquement

### Test 4: Panel Super Admin - Vue Utilisateurs

**Objectif**: Vérifier l'accès et l'affichage du panel admin

1. Sur `/admin`, vérifier l'affichage des statistiques:
   - Nombre d'utilisateurs
   - Trades total
   - Demandes en attente
2. Onglet "Utilisateurs" actif par défaut
3. Tableau affichant tous les utilisateurs avec:
   - Email
   - Statut (Admin/User)
   - Stats trading (Trades, Wins, Losses, Winrate, PnL)
   - Crédits actuels
   - Bouton "+ Crédits"

**✅ Résultat attendu**: Panel admin accessible, données affichées

### Test 5: Approuver une Demande de Test Gratuit

**Objectif**: Vérifier le flux complet d'approbation

1. Sur `/admin`, cliquer sur l'onglet "Demandes de Test"
2. Voir la demande du Test 2 dans la liste
3. Cliquer sur "✓ Approuver"
4. Confirmer l'action
5. Vérifier le message de succès
6. La demande disparaît de la liste

**Vérification côté utilisateur**:
1. Se déconnecter du super admin
2. Se connecter avec le compte utilisateur du Test 2
3. Aller sur `/profil`
4. Vérifier que les crédits sont affichés:
   - Marché: ALL
   - 5 positions disponibles
   - Badge "bonus" visible
5. Le bouton "Demander Mon Cadeau" a disparu

**✅ Résultat attendu**: Demande approuvée, crédits attribués, utilisateur notifié

### Test 6: Attribution Manuelle de Crédits

**Objectif**: Tester l'attribution manuelle par le super admin

1. En tant que super admin sur `/admin`
2. Onglet "Utilisateurs"
3. Trouver un utilisateur
4. Cliquer sur "+ Crédits"
5. Dans le modal:
   - Sélectionner "BTC"
   - Entrer 10 crédits
   - Valider
6. Vérifier le message de succès
7. Vérifier que les crédits BTC apparaissent dans le tableau

**Vérification côté utilisateur**:
1. Se connecter avec ce compte
2. Aller sur `/profil`
3. Vérifier l'affichage de la carte BTC avec 10 positions

**✅ Résultat attendu**: Crédits ajoutés et visibles

### Test 7: Création d'un Compte de Trading

**Objectif**: Vérifier la création de compte sans erreur

1. Se connecter en tant qu'utilisateur normal
2. Aller sur `/accounts`
3. Cliquer sur "+ Ajouter un compte"
4. Remplir le formulaire:
   - Nom: "Binance BTC"
   - Plateforme: Binance
   - Marché: BTC
   - Devise: USD
   - Capital: Sélectionner 1000 USD
   - Vérifier que les pertes max se calculent auto
   - Risque par trade: laisser 0.5%
5. Cliquer sur "Créer le compte"
6. Vérifier le message de succès
7. Le compte apparaît dans la liste avec statut "Actif"

**✅ Résultat attendu**: Compte créé sans erreur, calculs automatiques corrects

### Test 8: Système de Parrainage

**Objectif**: Vérifier le système de parrainage

1. Aller sur `/referral`
2. Vérifier l'affichage:
   - Code de parrainage unique
   - Statistiques (0 au début)
   - Lien de parrainage
   - Boutons de partage
3. Cliquer sur "📋 Copier"
4. Vérifier que le lien est copié
5. Partager sur une plateforme (test)

**✅ Résultat attendu**: Page parrainage fonctionnelle, lien généré

### Test 9: Refuser une Demande de Test Gratuit

**Objectif**: Tester le refus d'une demande

1. Créer un nouveau compte utilisateur
2. Demander le test gratuit
3. Se connecter en super admin
4. Aller sur "Demandes de Test"
5. Cliquer sur "✗ Refuser"
6. Confirmer
7. La demande disparaît
8. Se reconnecter en utilisateur
9. Vérifier qu'aucun crédit n'a été ajouté
10. Le bouton "Demander Mon Cadeau" reste visible (peut refaire une demande)

**✅ Résultat attendu**: Demande refusée, pas de crédits attribués

### Test 10: Tentative de Double Demande

**Objectif**: Vérifier qu'un utilisateur ne peut pas abuser du système

1. Avec un compte qui a déjà reçu le test gratuit (Test 5)
2. Aller sur `/profil`
3. Vérifier que le bouton "Demander Mon Cadeau" n'existe plus
4. Si on essaie d'appeler `request_free_trial()` manuellement via console:
```javascript
supabase.rpc('request_free_trial').then(console.log)
```
5. Vérifier le message d'erreur: "You have already used your free trial"

**✅ Résultat attendu**: Impossible de demander 2 fois

## 🔍 Tests Techniques (Base de Données)

### Test 11: Vérifier les Politiques RLS

Ouvrir l'éditeur SQL Supabase et exécuter:

```sql
-- Vérifier qu'il n'y a pas de récursion
SELECT * FROM user_profiles LIMIT 5;

-- Vérifier la fonction is_super_admin
SELECT is_super_admin();

-- Voir les super admins configurés
SELECT * FROM super_admin_emails;

-- Voir les crédits de tous les utilisateurs
SELECT
  up.email,
  pc.market,
  pc.bonus_credits,
  pc.purchased_credits,
  pc.used_credits,
  pc.remaining_credits
FROM user_profiles up
LEFT JOIN position_credits pc ON pc.user_id = up.id
ORDER BY up.created_at DESC;

-- Voir les demandes en attente
SELECT
  ft.id,
  up.email,
  ft.status,
  ft.created_at
FROM free_trial_requests ft
JOIN user_profiles up ON up.id = ft.user_id
ORDER BY ft.created_at DESC;
```

**✅ Résultat attendu**: Toutes les requêtes s'exécutent sans erreur

### Test 12: Vérifier le Trigger Referral

```sql
-- Créer un utilisateur de test directement dans auth.users
-- (Simuler une inscription)
-- Vérifier qu'un code de parrainage est automatiquement créé

SELECT
  up.email,
  rs.referral_code,
  rs.referrals_count
FROM user_profiles up
JOIN referral_system rs ON rs.user_id = up.id
ORDER BY up.created_at DESC
LIMIT 5;
```

**✅ Résultat attendu**: Code de parrainage créé automatiquement pour chaque nouveau profil

## 🚨 Tests d'Erreur

### Test 13: Accès Non Autorisé

1. Se connecter en tant qu'utilisateur normal
2. Essayer d'accéder directement à `/admin`
3. Vérifier la redirection vers `/`
4. Essayer d'appeler `approve_free_trial()` via console:
```javascript
supabase.rpc('approve_free_trial', {
  request_id: 'any-uuid',
  credits_to_grant: 5
}).then(console.log)
```
5. Vérifier l'erreur: "Unauthorized: Super admin access required"

**✅ Résultat attendu**: Accès refusé, erreur claire

### Test 14: Données Invalides

1. Essayer de créer un compte de trading avec capital < 200
2. Vérifier le message d'erreur
3. Essayer d'ajouter des crédits négatifs (via console super admin)
4. Vérifier que c'est refusé

**✅ Résultat attendu**: Validations fonctionnelles

## 📊 Checklist Finale

Avant de considérer que tout fonctionne:

- [ ] Inscription utilisateur sans erreur récursion
- [ ] Profil utilisateur s'affiche correctement
- [ ] Bouton "Demander Mon Cadeau" visible et fonctionnel
- [ ] Super admin auto-attribué aux emails configurés
- [ ] Panel super admin accessible
- [ ] Onglet "Demandes de Test" fonctionnel
- [ ] Approbation de demande fonctionne
- [ ] Crédits apparaissent après approbation
- [ ] Attribution manuelle de crédits fonctionne
- [ ] Refus de demande fonctionne
- [ ] Double demande impossible
- [ ] Création compte trading sans erreur
- [ ] Système de parrainage fonctionnel
- [ ] Accès non autorisé bloqué
- [ ] Toutes les requêtes SQL passent
- [ ] Build npm réussit
- [ ] Aucune erreur console critique

## 🎯 Si Tout Fonctionne

**Félicitations!** La plateforme est opérationnelle pour:
- Gestion des utilisateurs
- Système de crédits
- Test gratuit contrôlé
- Attribution manuelle
- Panel super admin

**Prochaines étapes**:
1. Intégrer les données de marché réelles
2. Implémenter le trading bot avec signaux
3. Ajouter Stripe pour les paiements
4. Développer le système de positions
5. Créer l'historique des trades

## 🆘 Si Problème Persiste

**Erreur de récursion toujours présente**:
```sql
-- Vérifier les triggers
SELECT * FROM information_schema.triggers
WHERE event_object_table = 'user_profiles';

-- Vérifier les fonctions
SELECT proname, prosecdef FROM pg_proc
WHERE proname LIKE '%super_admin%' OR proname LIKE '%referral%';

-- prosecdef doit être TRUE pour les fonctions SECURITY DEFINER
```

**Profil introuvable**:
```sql
-- Vérifier que le profil existe
SELECT * FROM user_profiles WHERE email = 'votre@email.com';

-- Si absent, vérifier le trigger
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Crédits non mis à jour**:
```sql
-- Vérifier la structure
\d position_credits

-- La colonne remaining_credits doit être GENERATED ALWAYS AS
```
