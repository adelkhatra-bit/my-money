# 🚀 Guide de Démarrage Rapide - Plateforme de Trading IA

## ✅ Votre plateforme est DÉJÀ OPÉRATIONNELLE !

Le serveur tourne actuellement sur **http://localhost:3000**

---

## 📋 Ce qui fonctionne MAINTENANT

### 1. Créer un Compte
1. Allez sur http://localhost:3000
2. Cliquez sur "S'inscrire"
3. Entrez votre email et mot de passe
4. Vous êtes automatiquement connecté

### 2. Demander votre Cadeau de Bienvenue
1. Allez dans **Profil** (icône utilisateur dans la navbar)
2. Cliquez sur **"Demander Mon Cadeau (5 positions)"**
3. Votre demande est envoyée au Super Admin

### 3. Devenir Super Admin (pour tester)
1. Dans **Profil**, cliquez sur l'icône 🔐 en haut à droite
2. Entrez le code: **2709**
3. Cliquez sur "Valider"
4. Vous avez maintenant accès au panel Super Admin

### 4. Approuver votre propre demande (en tant que Super Admin)
1. Allez dans **Super Admin** (nouveau lien dans la navbar)
2. Cliquez sur l'onglet **"Demandes de Test"**
3. Approuvez votre demande
4. Vous recevez automatiquement 5 crédits BTC

### 5. Créer un Compte de Trading
1. Allez dans **Mes Comptes**
2. Cliquez sur **"+ Ajouter un compte"**
3. Remplissez le formulaire:
   - Nom: "Mon premier compte"
   - Plateforme: Binance (pour BTC)
   - Marché: BTC
   - Capital: Choisissez un montant (ex: 1000 USD)
   - Le reste est auto-calculé
4. Cliquez sur **"Créer le compte"**

### 6. Commencer à Trader
1. Allez dans **Dashboard**
2. Cliquez sur **"Commencer à trader"** (ou allez directement sur /trading)
3. Le graphique s'affiche avec BTC par défaut
4. Cliquez sur **"Scanner"** pour lancer une analyse
5. Le bot va analyser le marché et proposer un signal si les conditions sont réunies

---

## 🎯 Fonctionnalités Disponibles

### Dashboard Principal (/)
- Vue d'ensemble des crédits par marché
- Demande de cadeau de bienvenue
- Actions rapides (Trading, Comptes, Parrainage)

### Trading Dashboard (/trading)
- Graphique en temps réel
- Sélection marché (BTC, ETH, NASDAQ, GOLD)
- Sélection plateforme
- Timeframes multiples (1m, 5m, 15m, 1h, 4h)
- Mode Auto (scan automatique toutes les 30s)
- Scanner manuel
- Détection automatique des horaires de marché
- Pré-alertes (5 min avant le signal)
- Signaux confirmés avec popup
- Tracé automatique sur le graphique
- Stats en temps réel (Balance, PnL, Trades, Winrate)

### Mes Comptes (/accounts)
- Création de comptes multiples
- Différentes plateformes (Binance, FTMO, TopStep, etc.)
- Configuration du capital et du risque
- Activation/désactivation des comptes

### Parrainage (/referral)
- Lien de parrainage unique
- Partage sur réseaux sociaux
- Stats: filleuls, validés, positions gagnées
- +5 positions par filleul validé
- +3 positions pour le filleul

### Profil (/profil)
- Informations personnelles
- Crédits par marché
- Demande de test gratuit
- Accès Super Admin (code secret)

### Super Admin (/admin)
- **Réservé aux Super Admins**
- Gestion des utilisateurs
- Stats globales
- Ajout de crédits manuellement
- Approbation/rejet des demandes de test gratuit
- Vue détaillée de chaque utilisateur

---

## 🔧 Commandes Utiles

### Démarrer le serveur (déjà en cours)
```bash
npm start
```

### Compiler le projet
```bash
npm run build
```

### Stopper le serveur
```
Ctrl + C dans le terminal
```

---

## 🎮 Scénario de Test Complet

### Étape 1: Inscription
1. http://localhost:3000/signup
2. Email: test@example.com
3. Mot de passe: Test123456
4. Inscription réussie → redirection vers Dashboard

### Étape 2: Devenir Super Admin
1. /profil
2. Icône 🔐
3. Code: 2709
4. Vous êtes Super Admin

### Étape 3: Demander et Approuver le Test
1. /profil → "Demander Mon Cadeau"
2. /admin → Onglet "Demandes de Test"
3. Approuver votre demande
4. Retour au /profil → Vous avez 5 crédits BTC

### Étape 4: Créer un Compte de Trading
1. /accounts
2. Créer un compte Binance BTC avec 1000 USD
3. Compte créé et actif

### Étape 5: Lancer un Scan
1. /trading
2. Vérifier que BTC est sélectionné
3. Cliquer "Scanner"
4. Attendre l'analyse...

### Étape 6: Recevoir et Accepter un Signal
1. Si le marché est favorable, vous recevez:
   - Une pré-alerte (5 min avant)
   - Un popup de signal confirmé
2. Cliquez "Accepter"
3. Votre position est enregistrée
4. Les tracés apparaissent sur le graphique
5. Vos stats se mettent à jour
6. Vos crédits diminuent de 1

### Étape 7: Parrainer un Ami
1. /referral
2. Copier votre lien
3. Partager sur WhatsApp/Telegram/etc.
4. Quand votre filleul s'inscrit → +3 positions pour lui
5. Quand il est validé → +5 positions pour vous

---

## 📊 Base de Données (Supabase)

Toutes les données sont sauvegardées dans Supabase:
- URL: https://alsftpbjneityeyzwyzz.supabase.co
- Connexion automatique via les variables d'environnement

### Tables Principales
- `user_profiles`: Utilisateurs
- `trading_accounts`: Comptes de trading
- `position_credits`: Crédits par marché
- `positions`: Positions ouvertes/fermées
- `signals`: Signaux générés
- `free_trial_requests`: Demandes de test
- `referrals`: Parrainages

---

## ⚠️ Règles Importantes

### Marchés Fermés
- **NASDAQ**: Fermé le week-end (samedi-dimanche)
- **GOLD**: Fermé le week-end
- **BTC/ETH**: 24/7

Le bot n'enverra PAS de signaux sur un marché fermé.

### Crédits
- 1 signal accepté = 1 crédit débité
- Si crédits = 0, vous ne pouvez plus recevoir de signaux
- Rechargez via Super Admin (en test) ou achetez des packs (à venir)

### Comptes de Trading
- Un seul compte peut être actif à la fois
- Le compte actif détermine:
  - Le capital utilisé
  - Le calcul de la taille de position
  - Les limites de risque

---

## 🐛 En Cas de Problème

### L'application ne se charge pas
1. Vérifiez que le serveur tourne (terminal avec `npm start`)
2. Allez sur http://localhost:3000
3. Rechargez la page (F5 ou Cmd+R)

### Erreur "Profil introuvable"
1. Déconnectez-vous
2. Reconnectez-vous
3. Le profil se crée automatiquement

### Pas de signal après un scan
C'est normal ! Le bot analyse et ne donne un signal QUE si:
- Le marché est ouvert
- Les conditions sont favorables
- La confiance est >= 70%
- Toutes les confirmations sont OK

Essayez de:
- Changer de timeframe (5m ou 15m recommandés)
- Attendre quelques minutes
- Rescanner

### Le graphique ne s'affiche pas
1. Vérifiez votre connexion internet
2. Rechargez la page
3. Essayez un autre marché

---

## 💡 Conseils

1. **Commencez par BTC en 5m ou 15m**
   - Plus de mouvements
   - Plus de signaux
   - Marché 24/7

2. **Activez le Mode Auto**
   - Scan toutes les 30 secondes
   - Vous recevez les signaux automatiquement
   - N'oubliez pas que ça consomme des crédits !

3. **Testez le Parrainage**
   - Partagez votre lien
   - Gagnez des positions gratuites
   - Maximum 50 positions bonus/mois

4. **Utilisez le Super Admin**
   - Voyez tous les utilisateurs
   - Ajoutez des crédits pour tester
   - Approuvez les demandes

---

## 🎉 Félicitations !

Votre plateforme de trading IA est **opérationnelle et fonctionnelle**.

Toutes les fonctionnalités principales sont implémentées:
- ✅ Auth
- ✅ Crédits
- ✅ Test gratuit
- ✅ Parrainage
- ✅ Multi-comptes
- ✅ Trading avec signaux
- ✅ Graphiques
- ✅ Super Admin

**Prochaine étape:** Affiner l'UX, ajouter les packs payants, et lancer ! 🚀

---

Pour plus de détails techniques, consultez:
- `PLATEFORME_ETAT_ACTUEL.md` - Documentation complète
- `README.md` - Informations générales du projet