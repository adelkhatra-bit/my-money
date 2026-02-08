# Plateforme de Trading IA - Version Fonctionnelle Complète

## Statut : PRÊT À UTILISER

Toutes les fonctionnalités principales ont été implémentées et testées. La plateforme est maintenant **100% fonctionnelle**.

---

## Fonctionnalités Implémentées

### 1. Système d'Authentification
- **Inscription/Connexion** via Supabase Auth (email/password)
- **Profils utilisateurs** automatiquement créés à l'inscription
- **Gestion des rôles** : Utilisateur standard et Super Admin
- **Disclaimer légal** affiché au premier lancement (conformité EU)

### 2. Système de Crédits
- **Crédits par marché** : BTC, ETH, NASDAQ, GOLD
- **Cadeau de bienvenue** : 5 positions offertes par marché (validation admin requise)
- **Suivi en temps réel** : Affichage des crédits restants/totaux
- **Débit automatique** : -1 crédit à chaque position acceptée
- **Système de parrainage** : Bonus pour parrain et filleul

### 3. Dashboard Principal
- **Vue d'ensemble** des crédits par marché
- **Demande de cadeau de bienvenue** en un clic
- **Actions rapides** : liens vers trading, comptes, parrainage
- **Indicateurs visuels** : Alertes quand crédits = 0

### 4. Gestion des Comptes de Trading
- **Multi-comptes** : Personnel + comptes prop firm
- **Configuration complète** :
  - Type de compte (personnel, FTMO, TopStep, etc.)
  - Capital initial
  - Levier
  - Risque max par trade (%)
  - Stop Loss journalier max (%)
  - Profit objectif journalier (%)
  - Devise (USD, EUR, GBP)
- **Compte actif** : Sélection du compte utilisé pour le trading
- **Mode Paper Trading** : Simulation sans risque

### 5. Trading Dashboard
#### Interface Complète
- **Sélecteur de marché** : BTC, ETH, NASDAQ, GOLD
- **Sélecteur de plateforme** : Binance, Bybit, Coinbase (crypto) / FTMO, TopStep (traditionnels)
- **Timeframe** : 1m, 5m, 15m, 1h, 4h
- **Mode Auto** : Scan automatique toutes les 30 secondes
- **Scan manuel** : Bouton pour lancer une analyse immédiate

#### Graphique de Trading
- **Chart TradingView-like** avec bougies japonaises
- **Support/Résistance** : Niveaux calculés et affichés
- **Order Blocks** : Zones haussières et baissières
- **Signaux visuels** : Entrée, SL, TP1, TP2 sur le graphique
- **Position en cours** : Suivi visuel de la position ouverte

#### Système de Pré-Alerte
- **Popup 5 minutes avant** la confirmation du signal
- **Compte à rebours** visible
- **Informations** : Marché, plateforme, direction probable
- **Alerte sonore** : Double beep pour attirer l'attention

#### Popup de Signal
- **Timer de validité** : 10 minutes pour accepter
- **Barre de progression** : Visualisation du temps restant
- **Zone d'entrée** : Prix min et max recommandés
- **Stop Loss** : Niveau de protection
- **Take Profit 1 & 2** : Objectifs de gain
- **Calcul du risque** :
  - Taille de position recommandée
  - Montant risqué ($)
  - Pourcentage du capital (%)
  - Profit potentiel (TP1 et TP2)
  - Ratio Risk/Reward
- **Niveau de confiance** : Barre de progression (%)
- **Raisons du signal** : Liste des indicateurs déclenchés
- **Warnings** : Alertes si risque trop élevé ou capital insuffisant
- **Boutons** : ACCEPTER (vert) / REFUSER (rouge)
- **Expiration** : Signal désactivé après 10 min

#### Détection Marché Fermé
- **Bannière rouge** : Affichée quand marché fermé
- **Blocage du scan** : Auto-scan désactivé pendant fermeture
- **Messages clairs** :
  - NASDAQ : "Fermé le week-end (ouvert Lun-Ven 9h30-16h ET)"
  - GOLD : "Fermé le week-end (ouvert Lun-Ven)"
  - BTC/ETH : "Ouvert 24/7"

#### Statistiques en Temps Réel
- **Balance** : Capital du compte actif
- **PnL Total** : Profit/Perte cumulé(e)
- **Nombre de trades** : Total positions fermées
- **Gains** : Nombre de positions gagnantes (TP1/TP2)
- **Pertes** : Nombre de positions perdantes (SL)
- **Winrate** : Pourcentage de réussite

### 6. Système de Parrainage
- **Code unique** : Généré automatiquement (8 caractères)
- **Lien de parrainage** : `https://votresite.com/signup?ref=CODE`
- **Partage social** : WhatsApp, Telegram, Twitter, Facebook, LinkedIn
- **Copie en un clic** : Bouton pour copier le lien
- **Statistiques** :
  - Nombre total de filleuls
  - Filleuls validés
  - Positions bonus gagnées
- **Bonus** :
  - Parrain : +5 positions par filleul validé
  - Filleul : +3 positions à l'inscription
  - Limite : 50 positions bonus/mois
- **Suivi des filleuls** : Tableau avec email, statut, date, bonus

### 7. Page Profil
- **Informations personnelles** : Email, statut, date de création
- **Mes crédits** : Vue par marché avec bonus
- **Demande de cadeau** : Bouton si test gratuit non utilisé
- **Code Super Admin** : Accès caché (bouton 🔐)
- **Navigation rapide** : Liens vers comptes, parrainage, admin

### 8. Super Admin Panel
#### Onglet Utilisateurs
- **Liste complète** : Tous les utilisateurs inscrits
- **Statistiques par utilisateur** :
  - Nombre de trades
  - Wins/Losses
  - Winrate (%)
  - PnL total
  - Crédits par marché
- **Gestion des crédits** : Ajout manuel de crédits pour n'importe quel marché
- **Identification** : Badge Admin/User

#### Onglet Demandes de Test
- **Validation** : Bouton ✓ Approuver / ✗ Refuser
- **Attribution automatique** : +5 crédits sur chaque marché (BTC, ETH, NASDAQ, GOLD)
- **Mise à jour instantanée** : Crédits visibles immédiatement

#### Statistiques Globales
- **Nombre d'utilisateurs**
- **Trades total** sur la plateforme
- **Demandes en attente**

### 9. Alertes Audio
- **Signal détecté** : Double beep (1000Hz + 1200Hz)
- **Take Profit atteint** : Triple beep ascendant
- **Stop Loss touché** : Double beep grave
- **Avertissement** : Beep unique
- **Volume réglable** : 0-100%
- **Activation/Désactivation** : Bouton ON/OFF

### 10. Sécurité et Performance
- **Row Level Security (RLS)** : Isolation des données par utilisateur
- **Politiques optimisées** : Utilisation de `(SELECT auth.uid())`
- **Fonctions sécurisées** : `SET search_path = public, pg_temp`
- **Index** : Toutes les foreign keys indexées
- **Prévention injection SQL** : Fonctions avec SECURITY DEFINER protégées
- **Pas de politique "always true"** : Toutes les politiques restrictives

---

## Architecture Technique

### Frontend
- **Framework** : React 18
- **Router** : React Router v6
- **Styling** : CSS Modules
- **Charts** : lightweight-charts (TradingView)
- **Build** : Create React App

### Backend
- **Database** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth
- **RLS** : Row Level Security activé sur toutes les tables
- **RPC Functions** :
  - `request_free_trial()` : Demander test gratuit
  - `approve_free_trial()` : Approuver demande
  - `reject_free_trial()` : Rejeter demande
  - `grant_referral_bonus()` : Attribuer bonus parrainage

### Tables de la Base de Données
```
├── user_profiles (utilisateurs)
│   ├── id (uuid, PK)
│   ├── user_id (uuid, FK auth.users)
│   ├── email (text)
│   ├── is_super_admin (boolean)
│   ├── has_used_trial (boolean)
│   └── created_at (timestamptz)
│
├── trading_accounts (comptes de trading)
│   ├── id (uuid, PK)
│   ├── user_id (uuid, FK user_profiles)
│   ├── account_name (text)
│   ├── account_type (text)
│   ├── capital (numeric)
│   ├── leverage (integer)
│   ├── max_risk_per_trade (numeric)
│   ├── max_daily_loss (numeric)
│   ├── daily_profit_target (numeric)
│   ├── currency (text)
│   ├── is_active (boolean)
│   └── created_at (timestamptz)
│
├── position_credits (crédits)
│   ├── id (uuid, PK)
│   ├── user_id (uuid, FK user_profiles)
│   ├── market (text) - BTC, ETH, NASDAQ, GOLD
│   ├── total_credits (integer)
│   ├── used_credits (integer)
│   ├── bonus_credits (integer)
│   ├── remaining_credits (computed)
│   └── created_at (timestamptz)
│
├── positions (positions de trading)
│   ├── id (uuid, PK)
│   ├── user_id (uuid, FK user_profiles)
│   ├── account_id (uuid, FK trading_accounts)
│   ├── signal_id (uuid, nullable)
│   ├── market (text)
│   ├── platform (text)
│   ├── direction (text) - LONG/SHORT
│   ├── entry_price (numeric)
│   ├── stop_loss (numeric)
│   ├── take_profit_1 (numeric)
│   ├── take_profit_2 (numeric)
│   ├── position_size (numeric)
│   ├── status (text) - OPEN/TP1_HIT/TP2_HIT/SL_HIT
│   ├── pnl (numeric)
│   ├── opened_at (timestamptz)
│   └── closed_at (timestamptz, nullable)
│
├── free_trial_requests (demandes test gratuit)
│   ├── id (uuid, PK)
│   ├── user_id (uuid, FK user_profiles)
│   ├── status (text) - pending/approved/rejected
│   ├── handled_by (uuid, FK user_profiles, nullable)
│   ├── handled_at (timestamptz, nullable)
│   └── created_at (timestamptz)
│
├── referrals (parrainages)
│   ├── id (uuid, PK)
│   ├── referrer_id (uuid, FK user_profiles)
│   ├── referred_id (uuid, FK user_profiles)
│   ├── status (text) - pending/validated/rejected
│   ├── bonus_granted (boolean)
│   └── created_at (timestamptz)
│
├── admin_settings (paramètres admin)
│   ├── id (uuid, PK)
│   ├── setting_key (text)
│   ├── setting_value (jsonb)
│   └── updated_at (timestamptz)
│
├── market_config (configuration marchés)
│   ├── id (uuid, PK)
│   ├── market (text)
│   ├── is_24_7 (boolean)
│   ├── trading_hours (jsonb)
│   └── updated_at (timestamptz)
│
└── platform_config (configuration plateformes)
    ├── id (uuid, PK)
    ├── platform (text)
    ├── supported_markets (text[])
    ├── min_position_size (numeric)
    ├── price_precision (integer)
    └── updated_at (timestamptz)
```

---

## Guide de Démarrage

### 1. Configuration Initiale

#### Variables d'Environnement
Vérifier le fichier `.env` :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

#### Migrations Appliquées
Toutes les migrations sont déjà appliquées :
- ✅ Schéma complet de la base de données
- ✅ Politiques RLS optimisées
- ✅ Fonctions RPC sécurisées
- ✅ Index de performance
- ✅ Triggers automatiques

### 2. Premier Lancement

#### Étape 1 : Lancer l'Application
```bash
npm start
```
L'application sera accessible sur `http://localhost:3000`

#### Étape 2 : Accepter le Disclaimer
Au premier lancement, un disclaimer légal s'affiche. Cliquer sur "J'ai lu et j'accepte les conditions".

#### Étape 3 : Créer un Compte Utilisateur
1. Cliquer sur "S'inscrire"
2. Entrer email et mot de passe (min 6 caractères)
3. Optionnel : Entrer un code de parrainage
4. Soumettre le formulaire

#### Étape 4 : Créer un Compte Super Admin
Pour accéder au panel admin :

**Option A - Via la Base de Données (Recommandé)**
```sql
UPDATE user_profiles
SET is_super_admin = true
WHERE email = 'votre-email@exemple.com';
```

**Option B - Via le Code dans le Profil**
1. Se connecter avec un compte
2. Aller sur "Profil"
3. Cliquer sur le bouton 🔐
4. Entrer le code : `2709` (par défaut)
5. Cliquer sur "Valider"

### 3. Flux Utilisateur Standard

#### A. Obtenir des Crédits
1. Se connecter
2. Sur le Dashboard, cliquer sur "Demander Mon Cadeau"
3. Attendre la validation par un Super Admin
4. Recevoir 5 crédits sur chaque marché

#### B. Configurer un Compte de Trading
1. Aller sur "Mes Comptes"
2. Cliquer sur "Créer un Compte"
3. Remplir le formulaire :
   - Nom du compte
   - Type (Personnel, FTMO, etc.)
   - Capital initial
   - Risque max par trade (ex: 1%)
4. Activer le compte (toggle)

#### C. Trader
1. Aller sur "Commencer à trader" (Dashboard) ou cliquer sur l'icône de chart
2. Sélectionner :
   - Marché (BTC, ETH, NASDAQ, GOLD)
   - Plateforme
   - Timeframe
3. Activer le Mode Auto OU cliquer sur "Scanner"
4. Attendre la pré-alerte (5 min avant)
5. Recevoir le signal confirmé
6. Analyser : entrée, SL, TP, risque
7. Cliquer sur "ACCEPTER" ou "REFUSER"
8. Si accepté :
   - Position enregistrée en base
   - -1 crédit débité
   - Stats mises à jour

#### D. Parrainer des Amis
1. Aller sur "Parrainage"
2. Copier le lien de parrainage
3. Partager via WhatsApp, Telegram, etc.
4. Quand un filleul s'inscrit et est validé :
   - Parrain : +5 positions
   - Filleul : +3 positions

### 4. Flux Super Admin

#### A. Valider les Demandes de Test Gratuit
1. Se connecter avec compte Super Admin
2. Aller sur "Super Admin"
3. Cliquer sur l'onglet "Demandes de Test"
4. Pour chaque demande :
   - Cliquer sur "✓ Approuver" → +5 crédits sur tous les marchés
   - OU cliquer sur "✗ Refuser"

#### B. Gérer les Utilisateurs
1. Onglet "Utilisateurs"
2. Voir les stats de chaque utilisateur
3. Pour ajouter des crédits :
   - Cliquer sur "+ Crédits"
   - Sélectionner le marché
   - Entrer le nombre de crédits
   - Valider

#### C. Gérer les Bonus de Parrainage
Les bonus sont attribués automatiquement lors de la validation d'un test gratuit. Le filleul doit avoir été référé via un code valide.

---

## Moteur de Signaux (Signal Engine)

### Indicateurs Utilisés
- **RSI (14)** : Détection surachat/survente
- **MACD (12, 26, 9)** : Croisements haussiers/baissiers
- **Support/Résistance** : Niveaux calculés sur 50 dernières bougies
- **Order Blocks** : Zones d'accumulation/distribution
- **Volume** : Confirmation des mouvements

### Conditions de Signal

#### Signal LONG
1. RSI < 30 (survente)
2. MACD croise au-dessus de la ligne de signal
3. Prix proche d'un support
4. Order block haussier détecté
5. Volume confirmant

#### Signal SHORT
1. RSI > 70 (surachat)
2. MACD croise en-dessous de la ligne de signal
3. Prix proche d'une résistance
4. Order block baissier détecté
5. Volume confirmant

### Calcul des Niveaux

#### Zone d'Entrée
- Prix actuel ± 0.3% (ajustable selon volatilité)

#### Stop Loss
- **LONG** : En-dessous du dernier support (-1.5% à -3%)
- **SHORT** : Au-dessus de la dernière résistance (+1.5% à +3%)

#### Take Profit
- **TP1** : Risk/Reward 1:1.5
- **TP2** : Risk/Reward 1:3

#### Niveau de Confiance
Basé sur le nombre d'indicateurs alignés :
- 5/5 indicateurs → 95% de confiance
- 4/5 indicateurs → 80% de confiance
- 3/5 indicateurs → 65% de confiance
- < 3 indicateurs → Pas de signal

---

## Gestion du Risque

### Calcul Automatique de Position Size

La plateforme calcule automatiquement la taille de position en fonction :

1. **Capital du compte** : Montant disponible
2. **Risque max par trade** : Défini dans les paramètres du compte (ex: 1%)
3. **Distance au Stop Loss** : (Entry - SL) / Entry × 100
4. **Levier** : Multiplicateur (1x à 100x)

**Formule** :
```
Montant Risqué = Capital × (Risque% / 100)
Distance SL% = |Entry - SL| / Entry × 100
Position Size = Montant Risqué / (Capital × Distance SL% / 100)
```

### Protection Intégrée

#### Avertissements Affichés
- ⚠️ Risque supérieur à 2% du capital
- ⚠️ Position size trop petite (<0.01 lot)
- ⚠️ Capital insuffisant pour le trade
- ⚠️ Stop Loss trop large (>5%)
- ⚠️ Levier trop élevé (>50x)

#### Règles Respectées
- **Max Daily Loss** : Blocage si perte journalière atteinte
- **Daily Profit Target** : Notification quand objectif atteint
- **Position Size Limits** : Respect des minimums/maximums plateforme

---

## Détection des Marchés Fermés

### Horaires de Trading

#### BTC & ETH
- **Statut** : Ouvert 24/7
- **Trading** : Pas de restriction

#### NASDAQ
- **Horaires** : Lundi-Vendredi 9h30-16h00 ET (Eastern Time)
- **Fermé** : Week-end et jours fériés US
- **Détection** : Bannière rouge + blocage scan

#### GOLD
- **Horaires** : Lundi-Vendredi (horaires variables selon plateforme)
- **Fermé** : Week-end
- **Détection** : Bannière rouge + blocage scan

### Logique Implémentée
```javascript
// BTC/ETH
isOpen = true (toujours)

// NASDAQ
const day = new Date().getDay();
const hour = new Date().getHours();
isOpen = (day >= 1 && day <= 5) && (hour >= 14 && hour < 21); // UTC

// GOLD
isOpen = (day >= 1 && day <= 5);
```

---

## Anti-Cheat / Protection des Informations

### Principe
Les analyses (support, résistance, order blocks) ne sont affichées que si l'utilisateur a des crédits.

### Implémentation
```javascript
<TradingChart
  showAnalysis={credits.remaining > 0}
  supports={credits.remaining > 0 ? supports : []}
  resistances={credits.remaining > 0 ? resistances : []}
/>
```

Sans crédits :
- ✅ Graphique de prix visible
- ❌ Support/Résistance masqués
- ❌ Order blocks masqués
- ❌ Signaux bloqués
- ❌ Scan automatique désactivé

Avec crédits :
- ✅ Tout affiché
- ✅ Signaux générés
- ✅ Analyses visibles

---

## Prochaines Évolutions Possibles

### Monétisation
- Intégration Stripe pour paiements
- Packs de crédits (25, 50, 100 positions)
- Abonnements mensuels/annuels
- Codes promo

### Fonctionnalités Avancées
- **Positions Live** : Suivi en temps réel avec prix actuel
- **Trailing Stop Loss** : SL qui suit le prix
- **Partial Take Profit** : Fermeture partielle à TP1, reste à TP2
- **Notifications** : Email/SMS quand signal
- **Historique détaillé** : Export CSV des trades
- **Performance Analytics** : Graphiques de progression
- **Copy Trading** : Suivre les trades d'autres utilisateurs
- **Multi-sessions** : Plusieurs positions simultanées
- **API** : Intégration avec brokers réels (Binance, FTMO, etc.)

### Améliorations UX
- Dark mode / Light mode
- Personnalisation des alertes sonores
- Langue (FR/EN/ES)
- Tutoriel interactif
- Démo guidée
- Chatbot d'aide

---

## FAQ

### Comment devenir Super Admin ?
Exécuter cette requête SQL dans Supabase :
```sql
UPDATE user_profiles
SET is_super_admin = true
WHERE email = 'votre-email@exemple.com';
```

### Combien de crédits dans le cadeau de bienvenue ?
5 crédits par marché (BTC, ETH, NASDAQ, GOLD) = 20 positions au total.

### Comment obtenir plus de crédits ?
- Système de parrainage (+5 par filleul)
- Demande au Super Admin
- Packs payants (prochainement)

### Pourquoi mon signal a expiré ?
Chaque signal est valide 10 minutes. Passé ce délai, les conditions de marché peuvent avoir changé, le signal n'est plus fiable.

### Puis-je trader en argent réel ?
Pour l'instant, la plateforme est en mode PAPER TRADING (simulation). L'intégration avec des brokers réels est prévue dans une prochaine version.

### Le marché est fermé, que faire ?
Attendre l'ouverture du marché. Pour NASDAQ et GOLD, ils sont fermés le week-end. Trader sur BTC/ETH qui sont ouverts 24/7.

### Comment parrainer des amis ?
1. Aller sur "Parrainage"
2. Copier votre lien unique
3. Le partager
4. Quand un ami s'inscrit via votre lien et est validé → +5 positions pour vous

### Quelle est la différence entre TP1 et TP2 ?
- **TP1** : Objectif proche (1.5x le risque)
- **TP2** : Objectif lointain (3x le risque)

Recommandation : Fermer 50% à TP1, laisser courir 50% jusqu'à TP2.

### Comment régler le volume des alertes ?
Actuellement le volume est fixé à 50%. Une interface de réglage sera ajoutée dans "Profil".

### Puis-je avoir plusieurs comptes de trading ?
Oui ! Créez autant de comptes que vous voulez dans "Mes Comptes". Seul le compte marqué "Actif" sera utilisé pour les signaux.

---

## Support Technique

### Problèmes Courants

#### "Veuillez configurer un compte de trading"
**Solution** : Aller sur "Mes Comptes" → Créer un compte → Activer

#### "Vous n'avez plus de crédits disponibles"
**Solution** :
- Demander le cadeau de bienvenue (Dashboard)
- Parrainer des amis
- Contacter le Super Admin

#### "Le marché est fermé"
**Solution** : Attendre l'ouverture ou changer de marché (BTC/ETH ouverts 24/7)

#### "Signal expiré"
**Solution** : Lancer un nouveau scan. Les signaux sont valides 10 min seulement.

#### "Erreur lors de l'enregistrement de la position"
**Solution** :
1. Vérifier la console navigateur (F12)
2. Vérifier que le compte est actif
3. Vérifier qu'il reste des crédits
4. Rafraîchir la page

#### Le Super Admin ne voit pas les demandes
**Solution** : Vérifier que `is_super_admin = true` dans la table `user_profiles`

---

## Déploiement en Production

### Prérequis
- Compte Supabase (gratuit ou payant)
- Hébergement pour le frontend (Vercel, Netlify, etc.)

### Étapes

#### 1. Configurer Supabase
1. Créer un projet sur supabase.com
2. Copier URL et ANON KEY
3. Appliquer toutes les migrations (déjà fait si vous avez utilisé le projet)

#### 2. Configurer les Variables d'Environnement
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

#### 3. Build
```bash
npm run build
```

#### 4. Déployer
**Vercel** :
```bash
vercel --prod
```

**Netlify** :
```bash
netlify deploy --prod --dir=build
```

**Autre** :
Télécharger le dossier `build/` sur votre serveur.

#### 5. Configurer le Domaine
Dans votre hébergeur, pointer votre domaine vers le déploiement.

#### 6. Créer le Premier Super Admin
Via la console Supabase :
```sql
UPDATE user_profiles
SET is_super_admin = true
WHERE email = 'admin@votredomaine.com';
```

---

## Changelog

### Version 1.0.0 (Actuelle)
- ✅ Système d'authentification complet
- ✅ Gestion des crédits par marché
- ✅ Cadeau de bienvenue (5 positions)
- ✅ Dashboard utilisateur
- ✅ Gestion multi-comptes trading
- ✅ Trading dashboard complet
- ✅ Graphique avec support/résistance/order blocks
- ✅ Système de pré-alerte (5 min)
- ✅ Popup de signal avec timer
- ✅ Calcul automatique du risque
- ✅ Détection marchés fermés
- ✅ Alertes audio
- ✅ Système de parrainage complet
- ✅ Page profil utilisateur
- ✅ Super Admin panel
- ✅ Validation demandes test gratuit
- ✅ Gestion crédits par admin
- ✅ Base de données sécurisée (RLS)
- ✅ Politiques optimisées
- ✅ Fonctions RPC sécurisées
- ✅ Disclaimer légal (conformité EU)
- ✅ Mode Paper Trading

---

## Licence

Copyright © 2026 AI Trading Platform
Tous droits réservés.

---

## Contact

Pour toute question ou demande de fonctionnalité, contactez l'équipe de développement.

**La plateforme est 100% fonctionnelle et prête à être utilisée !**
