# ⚠️ CORRECTION DES PROBLÈMES DE SÉCURITÉ SUPABASE

## 🔴 IMPORTANT : CES RÉGLAGES NE PEUVENT PAS ÊTRE FAITS PAR CODE

Ces deux problèmes de sécurité doivent être réglés **manuellement dans le Dashboard Supabase**.
Aucun code, migration ou configuration locale ne peut les corriger.

---

## 1️⃣ Auth DB Connection Strategy (Stratégie de connexion)

### Problème
La stratégie de connexion Auth est configurée en "Fixed: 10" au lieu de "Percentage-based"

### Solution (étapes exactes)

1. **Ouvre ton Dashboard Supabase**
   - Va sur: https://supabase.com/dashboard
   - Connecte-toi

2. **Sélectionne ton projet**
   - Projet: `dxxazrdqqsmsolutdefq` OU `mbjaaoaykszqkdkcynsz`

3. **Navigation**
   - Clique sur **Settings** (⚙️ en bas à gauche)
   - Puis **Database**
   - Puis **Connection Pooling**

4. **Modifier la stratégie Auth**
   - Trouve la section "Auth Pool"
   - Change de **"Fixed: 10"** vers **"Percentage: 15%"**
   - Clique sur **Save** / **Enregistrer**

✅ **Résultat attendu**: Auth DB Connection Strategy passera en "Percentage-based"

---

## 2️⃣ Leaked Password Protection (Protection mots de passe compromis)

### Problème
La protection contre les mots de passe compromis n'est pas activée

### Solution (étapes exactes)

1. **Ouvre ton Dashboard Supabase**
   - Va sur: https://supabase.com/dashboard

2. **Sélectionne ton projet**
   - Projet: `dxxazrdqqsmsolutdefq` OU `mbjaaoaykszqkdkcynsz`

3. **Navigation**
   - Clique sur **Authentication** (🔐)
   - Puis **Policies**
   - Ou **Settings** sous Authentication

4. **Activer la protection**
   - Cherche "Password Requirements" ou "Breached Password Protection"
   - Active l'option **"Check for breached passwords"**
   - Clique sur **Save**

✅ **Résultat attendu**: Les nouveaux mots de passe seront vérifiés contre la base de données HaveIBeenPwned

---

## ℹ️ Pourquoi ces réglages ne peuvent pas être faits par code ?

Ces paramètres contrôlent:
- L'infrastructure de connexion à la base de données (pooling)
- Les politiques de sécurité au niveau du serveur Auth

Ils sont gérés par Supabase au niveau de l'infrastructure, pas au niveau de l'application.

**Aucune migration SQL, aucun fichier .env, aucun code JavaScript ne peut les modifier.**

---

## ✅ Après avoir fait ces modifications

1. Retourne dans ton tableau de bord Supabase
2. Va dans **Settings** → **General** → **Security**
3. Vérifie que les 2 alertes ont disparu

---

## 🚀 Ensuite, tu pourras continuer le développement

Une fois ces paramètres corrigés dans le dashboard, ton application sera sécurisée et tu pourras:
- Implémenter le système de crédits
- Ajouter les signaux de trading
- Créer le Super Admin
- Activer le système de parrainage

**Besoin d'aide pour ces fonctionnalités ? Dis-moi et je les implémente.**
