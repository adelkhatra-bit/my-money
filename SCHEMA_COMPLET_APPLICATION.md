# SCHÉMA COMPLET DE L'APPLICATION
# AI Trading Platform

**Date**: 2026-02-10  
**Version**: 1.0.0  
**Status**: Documentation complète avant refonte

---

## TABLE DES MATIÈRES

1. [CARTE DU SITE](#1-carte-du-site)
2. [INVENTAIRE NAVBAR](#2-inventaire-navbar)
3. [TABLEAU COMPLET DES BOUTONS](#3-tableau-complet-des-boutons)
4. [SCHÉMA COMPOSANTS PAR PAGE](#4-schéma-composants-par-page)
5. [SCHÉMA DES DONNÉES](#5-schéma-des-données)
6. [TABLES SUPABASE](#6-tables-supabase)
7. [SERVICES & LOGIQUE MÉTIER](#7-services--logique-métier)
8. [SOURCES DE VÉRITÉ](#8-sources-de-vérité)

---

## 1. CARTE DU SITE

### Routes Publiques
| Route | Page | Component | Protection |
|-------|------|-----------|------------|
| `/login` | Connexion | `Login.jsx` | Redirect to / if logged in |
| `/signup` | Inscription | `Signup.jsx` | Redirect to / if logged in |
| `/health` | Santé du système | `Health.jsx` | Public |
| `/safeboot` | Démarrage sécurisé | `SafeBoot.jsx` | Public |
| `/chart` | Graphique simple | `Chart.jsx` | Public |

### Routes Protégées (Authentication Required)
| Route | Page | Component | Navbar Label | Description |
|-------|------|-----------|--------------|-------------|
| `/` | Dashboard | `Dashboard.jsx` | Dashboard | Vue d'ensemble + crédits |
| `/trading` | Trading | `TradingDashboard.jsx` | Trading | Page principale de trading |
| `/setup` | Configuration | `TradingSetup.jsx` | Configuration | Configuration TradingView |
| `/signals` | Signaux | `Signals.jsx` | Signaux | Historique des signaux TradingView |
| `/accounts` | Mes Comptes | `AccountManagement.jsx` | Mes Comptes | Gestion comptes trading |
| `/referral` | Parrainage | `Referral.jsx` | Parrainage | Programme de parrainage |
| `/profil` | Profil | `Profil.jsx` | Profil | Profil utilisateur + crédits |

### Routes Admin (Super Admin Only)
| Route | Page | Component | Navbar Label | Protection |
|-------|------|-----------|--------------|------------|
| `/admin` | Super Admin | `SuperAdmin.jsx` | Super Admin | `isSuperAdmin === true` |

---

## 2. INVENTAIRE NAVBAR

### Éléments Navbar (Pour tous les utilisateurs connectés)

1. **Brand / Logo**
   - Text: "AI Trading Platform"
   - Version affichée: `v{VERSION}+{BUILD_HASH}`
   - Lien: `/`

2. **Liens Navigation** (7-8 selon profil)
   - Dashboard (🏠)
   - Trading (📈) - Bouton vert spécial
   - Configuration (⚙️)
   - Signaux (📊)
   - Mes Comptes (💼)
   - Parrainage (👥)
   - Profil (👤)
   - **Super Admin (⚡)** - Visible uniquement si `isSuperAdmin === true`

3. **Bouton Déconnexion**
   - Text: "Déconnexion"
   - Action: `handleLogout()` → `supabase.auth.signOut()` → navigate to `/login`

---

## 3. TABLEAU COMPLET DES BOUTONS

### FORMAT DÉTAILLÉ PAR BOUTON

---

#### PAGE: DASHBOARD (`/`)

**BOUTON 1: "Commencer à Trader"**
- **Nom exact dans l'UI**: "Commencer à Trader"
- **Page / section**: Dashboard / Header
- **Condition d'affichage**: `totalCredits > 0`
- **Au clic, fonction appelée**: `() => navigate('/setup')`
- **Fichier**: `src/pages/Dashboard/Dashboard.jsx` ligne 129
- **Données lues**: `credits` state (objet avec btc, eth, nasdaq, gold)
- **Données écrites**: Aucune (navigation uniquement)
- **Endpoint / table**: Aucun
- **Résultat attendu UI**: Navigation vers `/setup`
- **Composants impactés**: Route change
- **Cas d'erreur**: Aucun (navigation standard)

**BOUTON 2: "Demander Mon Cadeau"**
- **Nom exact dans l'UI**: "Demander Mon Cadeau"
- **Page / section**: Dashboard / Welcome Card
- **Condition d'affichage**: `needsCredits && !pendingRequest` (totalCredits === 0 ET pas de demande en attente)
- **Au clic, fonction appelée**: `requestWelcomeBonus()`
- **Fichier**: `src/pages/Dashboard/Dashboard.jsx` ligne 154
- **Données lues**: `userId`, `profileId`
- **Données écrites**: Table `free_trial_requests` (INSERT)
- **Endpoint / table**: `free_trial_requests` table
- **Résultat attendu UI**: 
  - Alert success: "Demande envoyée avec succès! Un admin va valider votre demande sous peu."
  - OU Alert error si erreur
  - Recharge données via `loadUserData()`
- **Composants impactés**: Dashboard state refresh
- **Cas d'erreur**: 
  - Utilisateur non trouvé → alert erreur
  - Erreur DB → alert erreur générique

**LIEN 1: "Commencer à trader" (Quick Action)**
- **Nom exact dans l'UI**: "Commencer à trader"
- **Page / section**: Dashboard / Quick Actions
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: Navigation `<a href="/setup">`
- **Résultat attendu UI**: Navigation vers `/setup`

**LIEN 2: "Gérer mes comptes"**
- **Nom exact dans l'UI**: "Gérer mes comptes"
- **Page / section**: Dashboard / Quick Actions
- **Condition d'affichage**: Toujours visible
- **Résultat attendu UI**: Navigation vers `/accounts`

**LIEN 3: "Parrainer des amis"**
- **Nom exact dans l'UI**: "Parrainer des amis"
- **Page / section**: Dashboard / Quick Actions
- **Condition d'affichage**: Toujours visible
- **Résultat attendu UI**: Navigation vers `/referral`

---

#### PAGE: TRADING (`/trading`)

**BOUTON 1: "🤖 ROBOT ON/OFF/VERROUILLÉ"**
- **Nom exact dans l'UI**: 
  - "🤖 ROBOT ON" si autoMode === true
  - "⏸️ ROBOT OFF" si autoMode === false
  - "🔒 ROBOT VERROUILLÉ" si position ouverte
- **Page / section**: Trading / Header Controls
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `handleToggleBot()`
- **Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 1337
- **Données lues**: `marketStatus.open`, `autoMode`, `currentPosition`
- **Données écrites**: 
  - State `autoMode` (boolean)
  - Table `user_settings` (UPDATE `bot_auto_mode`)
  - localStorage `bot_active_${market}`
- **Endpoint / table**: `user_settings` table
- **Résultat attendu UI**:
  - Bouton change de couleur (vert ON / gris OFF)
  - Label change
  - Log activité: "🤖 Robot activé" ou "⏸️ Robot désactivé"
- **Composants impactés**: BotActivityLog, scanning behavior
- **Cas d'erreur**:
  - Si `!marketStatus.open` ET tentative activation → Alert: "❌ MARCHÉ FERMÉ"
  - Si position ouverte → Disabled (aucune action)

**BOUTON 2: "🎯 Scan Manuel"**
- **Nom exact dans l'UI**: "🎯 Scan Manuel" ou "🔍 Analyse..." (pendant scan)
- **Page / section**: Trading / Header Controls
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `handleManualScan()`
- **Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 1216
- **Données lues**: 
  - `currentPosition`
  - `credits.remaining`
  - `signalState.isScanning`
  - `marketStatus.open`
  - `candles` array
- **Données écrites**:
  - State `scanning`, `signalState`, `scanOpportunity`
  - Appelle `performScan()` qui génère signal
- **Endpoint / table**: Lecture `candles` + génération signal via services
- **Résultat attendu UI**:
  - Bouton devient "🔍 Analyse..."
  - Pre-alert popup peut apparaître après ~5s
  - Signal popup peut apparaître après confirmation
  - Log activité: "🖱️ Scan manuel déclenché"
- **Composants impactés**: SignalProcess, ScanOpportunity, PreAlertPopup
- **Cas d'erreur**:
  - Si position ouverte → Alert: "⛔ POSITION ACTIVE"
  - Si `credits.remaining === 0` → Alert: "❌ Plus de positions disponibles"
  - Si `!marketStatus.open` → Alert: "Le marché {market} est actuellement fermé"
  - Si scan déjà en cours → Alert: "⏳ Un scan est déjà en cours"

**BOUTON 3: "🔽 Masquer / ▶️ Afficher" (Activity Log)**
- **Nom exact dans l'UI**: "🔽 Masquer" ou "▶️ Afficher"
- **Page / section**: Trading / Bot Activity Section
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `onClick={() => setShowActivityLog(!showActivityLog)}`
- **Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 2118
- **Données lues**: `showActivityLog` state
- **Données écrites**: State `showActivityLog` (boolean)
- **Résultat attendu UI**: Toggle affichage du log d'activité du bot
- **Composants impactés**: BotActivityLog visibility

**BOUTON 4: "▲ Afficher / ▼ Masquer" (Stats Bar)**
- **Nom exact dans l'UI**: "▲ Afficher" ou "▼ Masquer"
- **Page / section**: Trading / Stats Bar Header
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `toggleStatsBar()`
- **Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 104
- **Données lues**: `statsBarCollapsed` state
- **Données écrites**: 
  - State `statsBarCollapsed` (boolean)
  - localStorage `trading_statsbar_collapsed`
- **Résultat attendu UI**: Toggle affichage de la barre de statistiques
- **Composants impactés**: TradingStats visibility

**DROPDOWNS (3)**:

**DROPDOWN 1: Market**
- **Options**: BTC, ETH, NASDAQ, GOLD
- **Handler**: `handleMarketChange(e.target.value)`
- **Ligne**: 1882
- **Effet**: Change marché, valide plateforme compatible, recharge données, sauvegarde préférences

**DROPDOWN 2: Platform**
- **Options**: Dynamique selon compatibilité (topstep, ftmo, binance, bybit, etc.)
- **Handler**: `handlePlatformChange(e.target.value)`
- **Ligne**: 1889
- **Effet**: Change plateforme, valide compatibilité, recharge données

**DROPDOWN 3: Timeframe**
- **Options**: 1m, 5m, 15m, 1h, 4h
- **Handler**: `handleTimeframeChange(e.target.value)`
- **Ligne**: 1895
- **Effet**: Change timeframe, recharge données historiques

---

#### PAGE: CONFIGURATION (`/setup`)

**BOUTON 1: "Activer les signaux TradingView"**
- **Nom exact dans l'UI**: "Activer les signaux TradingView"
- **Page / section**: TradingSetup / Main Card
- **Condition d'affichage**: `!signalsEnabled`
- **Au clic, fonction appelée**: `handleActivateSignals()`
- **Fichier**: `src/pages/TradingSetup/TradingSetup.jsx`
- **Données lues**: `signalsEnabled` state
- **Données écrites**: State `signalsEnabled` (devient true)
- **Résultat attendu UI**: Navigation vers `/signals`
- **Cas d'erreur**: Aucun

**BOUTON 2: "Voir tous les signaux →"**
- **Nom exact dans l'UI**: "Voir tous les signaux →"
- **Page / section**: TradingSetup / Last Signal Card
- **Condition d'affichage**: `signalsEnabled && lastSignal`
- **Au clic, fonction appelée**: Navigation inline `onClick={() => navigate('/signals')}`
- **Résultat attendu UI**: Navigation vers `/signals`

---

#### PAGE: SIGNAUX (`/signals`)

**Composant: TradingViewSignals**

**BOUTON 1: "Confirmer"**
- **Nom exact dans l'UI**: "Confirmer"
- **Page / section**: Signals / Signal Card Actions
- **Condition d'affichage**: Signal avec `status === 'pending'`
- **Au clic, fonction appelée**: `confirmSignal(signal.id)`
- **Fichier**: `src/components/TradingViewSignals/TradingViewSignals.jsx`
- **Données lues**: `signal.id`
- **Données écrites**: Table `tradingview_alerts` (UPDATE status = 'confirmed')
- **Endpoint / table**: `tradingview_alerts`
- **Résultat attendu UI**: 
  - Signal status passe à "confirmed"
  - Badge change de couleur (orange → vert)
  - Label change: "Confirmé"
- **Cas d'erreur**: Alert si erreur UPDATE

**BOUTON 2: "Refuser"**
- **Nom exact dans l'UI**: "Refuser"
- **Page / section**: Signals / Signal Card Actions
- **Condition d'affichage**: Signal avec `status === 'pending'`
- **Au clic, fonction appelée**: `rejectSignal(signal.id)`
- **Fichier**: `src/components/TradingViewSignals/TradingViewSignals.jsx`
- **Données lues**: `signal.id`
- **Données écrites**: Table `tradingview_alerts` (UPDATE status = 'rejected')
- **Endpoint / table**: `tradingview_alerts`
- **Résultat attendu UI**:
  - Signal status passe à "rejected"
  - Badge change de couleur (orange → rouge)
  - Label change: "Refusé"
- **Cas d'erreur**: Alert si erreur UPDATE

---

#### PAGE: MES COMPTES (`/accounts`)

**BOUTON 1: "+ Ajouter un compte" / "Annuler"**
- **Nom exact dans l'UI**: "+ Ajouter un compte" ou "Annuler"
- **Page / section**: AccountManagement / Header
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `onClick={() => setShowForm(!showForm)}`
- **Données lues**: `showForm` state
- **Données écrites**: State `showForm` (toggle)
- **Résultat attendu UI**: Affiche/masque formulaire de création

**BOUTON 2: "Autre montant" / "Montants prédéfinis"**
- **Nom exact dans l'UI**: "Autre montant" ou "Montants prédéfinis"
- **Page / section**: AccountManagement / Create Form
- **Condition d'affichage**: Formulaire visible
- **Au clic, fonction appelée**: `onClick={() => setNewAccount({...newAccount, capitalOption: ...})}`
- **Résultat attendu UI**: Toggle mode saisie capital (presets vs custom)

**BOUTON 3: "Créer le compte"**
- **Nom exact dans l'UI**: "Créer le compte"
- **Page / section**: AccountManagement / Create Form
- **Condition d'affichage**: Formulaire visible
- **Au clic, fonction appelée**: `handleCreateAccount(e)`
- **Données lues**: `newAccount` state (name, platform, market, capital, etc.)
- **Données écrites**: Table `trading_accounts` (INSERT)
- **Endpoint / table**: `trading_accounts`
- **Résultat attendu UI**:
  - Nouveau compte apparaît dans la liste
  - Formulaire se ferme
  - Message succès
  - `loadAccounts()` refresh
- **Cas d'erreur**: Alert si erreur INSERT

**BOUTON 4: "Sauvegarder les modifications"**
- **Nom exact dans l'UI**: "Sauvegarder les modifications"
- **Page / section**: AccountManagement / Edit Form
- **Condition d'affichage**: Mode édition (`editingAccount !== null`)
- **Au clic, fonction appelée**: `handleUpdateAccount(e)`
- **Données lues**: `editingAccount` state
- **Données écrites**: Table `trading_accounts` (UPDATE)
- **Endpoint / table**: `trading_accounts`
- **Résultat attendu UI**: Compte mis à jour, mode édition fermé
- **Cas d'erreur**: Alert si erreur UPDATE

**BOUTON 5: "⭐ Définir actif"**
- **Nom exact dans l'UI**: "⭐ Définir actif"
- **Page / section**: AccountManagement / Account Card
- **Condition d'affichage**: Compte non actif
- **Au clic, fonction appelée**: `handleSetActiveAccount(accountId, market, platform)`
- **Données lues**: Account data
- **Données écrites**: Service `userPreferencesService.setActiveAccount()`
- **Résultat attendu UI**: Compte marqué comme actif, étoile dorée visible
- **Cas d'erreur**: Aucun (service handled)

**BOUTON 6: "Actif" / "Inactif"** (Toggle)
- **Nom exact dans l'UI**: "Actif" ou "Inactif"
- **Page / section**: AccountManagement / Account Card
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `toggleAccountStatus(accountId, currentStatus)`
- **Données lues**: Account `is_active`
- **Données écrites**: Table `trading_accounts` (UPDATE is_active)
- **Résultat attendu UI**: Status toggle, couleur badge change
- **Cas d'erreur**: Alert si erreur UPDATE

**BOUTON 7: "✏️" (Edit)**
- **Nom exact dans l'UI**: "✏️"
- **Page / section**: AccountManagement / Account Card Actions
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `startEditAccount(account)`
- **Données lues**: Account object
- **Données écrites**: State `editingAccount`
- **Résultat attendu UI**: Mode édition activé, formulaire pré-rempli

**BOUTON 8: "🗑️" (Delete)**
- **Nom exact dans l'UI**: "🗑️"
- **Page / section**: AccountManagement / Account Card Actions
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `handleDeleteAccount(accountId, accountName)`
- **Données lues**: Account id, name
- **Données écrites**: Table `trading_accounts` (DELETE)
- **Endpoint / table**: `trading_accounts`
- **Résultat attendu UI**: 
  - Confirmation dialog
  - Si confirmé → Compte supprimé
  - Liste refresh
- **Cas d'erreur**: Alert si erreur DELETE

---

#### PAGE: PARRAINAGE (`/referral`)

**BOUTON 1: "📋 Copier" / "✓ Copié"**
- **Nom exact dans l'UI**: "📋 Copier" ou "✓ Copié"
- **Page / section**: Referral / Referral Link Card
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `copyReferralLink()`
- **Données lues**: `referralCode`, `window.location.origin`
- **Données écrites**: Clipboard via `navigator.clipboard.writeText()`
- **Résultat attendu UI**: 
  - Bouton change temporairement à "✓ Copié"
  - Retour à "📋 Copier" après 2s
- **Cas d'erreur**: Aucun (clipboard API fallback)

**BOUTON 2-6: Partage Social**
- **Noms**: "💬 WhatsApp", "✈️ Telegram", "🐦 Twitter", "📘 Facebook", "💼 LinkedIn"
- **Page / section**: Referral / Share Section
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `shareOnPlatform(platform)`
- **Données lues**: `referralCode`, message prédéfini
- **Données écrites**: Aucune (ouvre fenêtre externe)
- **Résultat attendu UI**: Ouvre dialog de partage social
- **Cas d'erreur**: Aucun (window.open standard)

---

#### PAGE: PROFIL (`/profil`)

**BOUTON 1: "🔐" (Toggle Super Admin Input)**
- **Nom exact dans l'UI**: "🔐"
- **Page / section**: Profil / Admin Section Header
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `onClick={() => setShowSuperAdminInput(!showSuperAdminInput)}`
- **Données lues**: `showSuperAdminInput` state
- **Données écrites**: State `showSuperAdminInput` (toggle)
- **Résultat attendu UI**: Affiche/masque input code super admin

**BOUTON 2: "Valider"**
- **Nom exact dans l'UI**: "Valider"
- **Page / section**: Profil / Super Admin Input
- **Condition d'affichage**: `showSuperAdminInput === true`
- **Au clic, fonction appelée**: `handleSuperAdminAccess()`
- **Données lues**: `superAdminCode` state, `profile.id`
- **Données écrites**: Table `user_profiles` (UPDATE is_super_admin = true)
- **Endpoint / table**: `user_profiles`, `admin_settings`
- **Résultat attendu UI**:
  - Si code correct → Success, page refresh, onglet Super Admin apparaît
  - Si code incorrect → Alert erreur
- **Cas d'erreur**: Alert "Code invalide"

**BOUTON 3: "🎁 Demander Mon Cadeau"**
- **Nom exact dans l'UI**: "🎁 Demander Mon Cadeau (5 positions)" ou "⏳ Envoi..."
- **Page / section**: Profil / Credits Card
- **Condition d'affichage**: Crédits = 0
- **Au clic, fonction appelée**: `requestFreeTrial()`
- **Données lues**: `profile.id`
- **Données écrites**: RPC `request_free_trial()`
- **Endpoint / table**: RPC function
- **Résultat attendu UI**: 
  - Bouton devient "⏳ Envoi..."
  - Message retour RPC affiché
  - Reload profile data
- **Cas d'erreur**: Message erreur du RPC affiché

**BOUTON 4: "Gérer mes comptes"**
- **Nom exact dans l'UI**: "Gérer mes comptes"
- **Page / section**: Profil / Quick Actions
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: Navigation inline
- **Résultat attendu UI**: Navigation vers `/accounts`

**BOUTON 5: "Programme de parrainage"**
- **Nom exact dans l'UI**: "Programme de parrainage"
- **Page / section**: Profil / Quick Actions
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: Navigation inline
- **Résultat attendu UI**: Navigation vers `/referral`

**BOUTON 6: "Super Admin Panel"**
- **Nom exact dans l'UI**: "Super Admin Panel"
- **Page / section**: Profil / Quick Actions
- **Condition d'affichage**: `profile?.is_super_admin === true`
- **Au clic, fonction appelée**: Navigation inline
- **Résultat attendu UI**: Navigation vers `/admin`

---

#### PAGE: SUPER ADMIN (`/admin`)

**ONGLETS (3)**:

**TAB 1: "Utilisateurs"**
- **Nom exact dans l'UI**: "Utilisateurs"
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `onClick={() => setActiveTab('users')}`

**TAB 2: "Demandes de Test"**
- **Nom exact dans l'UI**: "Demandes de Test ({count})"
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `onClick={() => setActiveTab('requests')}`

**TAB 3: "TradingView Config"**
- **Nom exact dans l'UI**: "TradingView Config"
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `onClick={() => setActiveTab('tradingview')}`

**ONGLET UTILISATEURS:**

**BOUTON 1: "Gérer"**
- **Nom exact dans l'UI**: "Gérer"
- **Page / section**: SuperAdmin / Users Tab / User Card
- **Condition d'affichage**: Pour chaque utilisateur
- **Au clic, fonction appelée**: `onClick={() => setSelectedUser(user)}`
- **Données lues**: User object
- **Données écrites**: State `selectedUser`
- **Résultat attendu UI**: Ouvre modal de gestion des crédits

**BOUTON 2: "🗑️ Effacer tous les trades"**
- **Nom exact dans l'UI**: "🗑️ Effacer tous les trades ({count})"
- **Page / section**: SuperAdmin / Credit Modal
- **Condition d'affichage**: Modal ouvert, trades > 0
- **Au clic, fonction appelée**: `handleDeleteAllTrades()`
- **Données lues**: `selectedUser.id`
- **Données écrites**: RPC `delete_user_trades(user_id)`
- **Endpoint / table**: `positions` (DELETE ALL)
- **Résultat attendu UI**:
  - Confirmation dialog
  - Si confirmé → Tous les trades supprimés
  - Compteur reset
  - Modal reload
- **Cas d'erreur**: Alert si erreur RPC

**BOUTON 3: "Annuler" (Modal)**
- **Nom exact dans l'UI**: "Annuler"
- **Page / section**: SuperAdmin / Credit Modal
- **Condition d'affichage**: Modal ouvert
- **Au clic, fonction appelée**: `onClick={() => setSelectedUser(null)}`
- **Résultat attendu UI**: Ferme modal

**BOUTON 4: "Ajouter" / "Définir"**
- **Nom exact dans l'UI**: "Ajouter" ou "Définir"
- **Page / section**: SuperAdmin / Credit Modal Form
- **Condition d'affichage**: Modal ouvert
- **Au clic, fonction appelée**: `handleAddCredits(e)`
- **Données lues**: `creditForm` (market, credits, action)
- **Données écrites**: 
  - Si action=add → UPDATE `position_credits` (total_credits += X, used_credits -= X)
  - Si action=set → UPDATE `position_credits` (total_credits = X)
- **Endpoint / table**: `position_credits`
- **Résultat attendu UI**: 
  - Crédits mis à jour
  - Modal fermé
  - Liste users refresh
- **Cas d'erreur**: Alert si erreur UPDATE/INSERT

**ONGLET DEMANDES:**

**BOUTON 5: "✓ Approuver (5 positions)"**
- **Nom exact dans l'UI**: "✓ Approuver (5 positions)"
- **Page / section**: SuperAdmin / Requests Tab / Request Card
- **Condition d'affichage**: Pour chaque demande pending
- **Au clic, fonction appelée**: `handleApproveTrial(requestId)`
- **Données lues**: `request.id`
- **Données écrites**: RPC `approve_free_trial(request_id, 5)`
- **Endpoint / table**: `free_trial_requests` (UPDATE status='approved'), `position_credits` (INSERT/UPDATE)
- **Résultat attendu UI**:
  - Demande disparaît de la liste
  - Crédits ajoutés à l'utilisateur
  - Alert succès
- **Cas d'erreur**: Alert si erreur RPC

**BOUTON 6: "✗ Refuser"**
- **Nom exact dans l'UI**: "✗ Refuser"
- **Page / section**: SuperAdmin / Requests Tab / Request Card
- **Condition d'affichage**: Pour chaque demande pending
- **Au clic, fonction appelée**: `handleRejectTrial(requestId)`
- **Données lues**: `request.id`
- **Données écrites**: RPC `reject_free_trial(request_id)`
- **Endpoint / table**: `free_trial_requests` (UPDATE status='rejected')
- **Résultat attendu UI**:
  - Demande disparaît de la liste
  - Alert info
- **Cas d'erreur**: Alert si erreur RPC

**ONGLET TRADINGVIEW CONFIG:**

Voir composant TradingViewConfig ci-dessous.

---

#### COMPOSANT: TradingViewConfig

**BOUTON 1-N: "Copier" (Webhook URL)**
- **Nom exact dans l'UI**: "Copier"
- **Page / section**: TradingViewConfig / Webhook Section
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `copyToClipboard(webhookUrl, 'Webhook URL')`
- **Résultat attendu UI**: URL copiée, message confirmation temporaire

**BOUTON: "Copier" (Symboles)**
- **Nom exact dans l'UI**: "Copier"
- **Page / section**: TradingViewConfig / Symbol Cards
- **Condition d'affichage**: Pour chaque symbole (NASDAQ, BTC, ETH, GOLD)
- **Au clic, fonction appelée**: `copyToClipboard(symbol, 'Symbole')`
- **Résultat attendu UI**: Symbole copié

**BOUTON: "📌 Où trouver le symbole ?"**
- **Nom exact dans l'UI**: "📌 Où trouver le symbole ?"
- **Page / section**: TradingViewConfig / Guides
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `onClick={() => setShowGuide('symbol')}`
- **Résultat attendu UI**: Ouvre modal guide symboles

**BOUTON: "📌 Créer une alerte TradingView"**
- **Nom exact dans l'UI**: "📌 Créer une alerte TradingView"
- **Page / section**: TradingViewConfig / Guides
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `onClick={() => setShowGuide('alert')}`
- **Résultat attendu UI**: Ouvre modal guide création alerte

**BOUTON: "📌 Format JSON requis"**
- **Nom exact dans l'UI**: "📌 Format JSON requis"
- **Page / section**: TradingViewConfig / Guides
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `onClick(() => setShowGuide('json')}`
- **Résultat attendu UI**: Ouvre modal guide format JSON

**BOUTON: "✕" (Close Guide)**
- **Nom exact dans l'UI**: "✕"
- **Page / section**: TradingViewConfig / Guide Modal
- **Condition d'affichage**: Guide ouvert
- **Au clic, fonction appelée**: `onClick={() => setShowGuide(null)}`
- **Résultat attendu UI**: Ferme modal guide

**BOUTON: "Envoyer un Signal Test"**
- **Nom exact dans l'UI**: "Envoyer un Signal Test"
- **Page / section**: TradingViewConfig / Test Section
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `testWebhook()`
- **Données lues**: `webhookUrl`, test payload
- **Données écrites**: HTTP POST vers webhook
- **Résultat attendu UI**: 
  - Alert succès si 200
  - Alert erreur sinon
- **Cas d'erreur**: Alert erreur HTTP

---

#### PAGE: LOGIN (`/login`)

**BOUTON 1: "Se connecter" / "Connexion..."**
- **Nom exact dans l'UI**: "Se connecter" ou "Connexion..."
- **Page / section**: Login / Form
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `handleLogin(e)`
- **Fichier**: `src/pages/Auth/Login.jsx`
- **Données lues**: `email`, `password` states
- **Données écrites**: Auth session via `supabase.auth.signInWithPassword()`
- **Endpoint / table**: Supabase Auth
- **Résultat attendu UI**:
  - Si succès → Navigation vers `/`
  - Si erreur → Message erreur affiché
- **Cas d'erreur**: 
  - "Email ou mot de passe incorrect"
  - "Erreur réseau"

---

#### PAGE: SIGNUP (`/signup`)

**BOUTON 1: "Créer un compte" / "Création..."**
- **Nom exact dans l'UI**: "Créer un compte" ou "Création..."
- **Page / section**: Signup / Form
- **Condition d'affichage**: Toujours visible
- **Au clic, fonction appelée**: `handleSignup(e)`
- **Fichier**: `src/pages/Auth/Signup.jsx`
- **Données lues**: `email`, `password`, `confirmPassword` states
- **Données écrites**: Auth user via `supabase.auth.signUp()`
- **Endpoint / table**: Supabase Auth
- **Résultat attendu UI**:
  - Si succès → Navigation vers `/login` avec message "Compte créé"
  - Si erreur → Message erreur affiché
- **Cas d'erreur**:
  - "Les mots de passe ne correspondent pas"
  - "Le mot de passe doit contenir au moins 6 caractères"
  - "Cette adresse email est déjà utilisée"

---

## RÉSUMÉ TOTAL BOUTONS

| Page | Nombre de boutons/actions |
|------|---------------------------|
| Dashboard | 5 |
| Trading | 7 + 3 dropdowns |
| Configuration | 2 |
| Signaux | 2 par signal |
| Mes Comptes | 8 + actions par compte |
| Parrainage | 6 |
| Profil | 6 |
| Super Admin | 9 + actions par user/request |
| TradingViewConfig | 8 |
| Login | 1 |
| Signup | 1 |

**TOTAL ESTIMÉ: ~55-60 boutons/actions uniques**

---

## 4. SCHÉMA COMPOSANTS PAR PAGE

### PAGE: DASHBOARD

**Composants React**:
- Aucun composant externe (tout en inline JSX)

**Structure**:
```
Dashboard
├── Header
│   ├── Title: "Bienvenue sur votre plateforme de trading"
│   └── Button: "Commencer à Trader" (si crédits > 0)
├── Welcome Card (si needsCredits)
│   ├── Title: "Commencez votre parcours"
│   └── Button: "Demander Mon Cadeau"
├── Credits Summary
│   ├── Total Credits Display
│   └── Breakdown par marché (BTC, ETH, NASDAQ, GOLD)
├── Pending Request Card (si pendingRequest)
│   └── Status: "En attente de validation"
└── Quick Actions
    ├── Link: "Commencer à trader"
    ├── Link: "Gérer mes comptes"
    ├── Link: "Parrainer des amis"
    └── Card: "Recharger des crédits" (disabled, visual only)
```

**Inputs/Props**:
- Aucun (page racine)

**State utilisé**:
- `credits`: { btc, eth, nasdaq, gold }
- `hasWelcomeBonus`: boolean
- `pendingRequest`: object | null
- `loading`: boolean

**Source de données**:
- **RÉEL**: Supabase DB
  - Tables: `user_profiles`, `position_credits`, `free_trial_requests`
- **SIMULATION**: Aucune

**Sortie (affichage)**:
- Résumé crédits
- Call-to-action selon état
- Quick links navigation

---

### PAGE: TRADING

**Composants React importés**:
1. **TradingChart** - Graphique des chandeliers avec indicateurs
2. **SignalProcess** - Gestion du flow pre-alert → signal
3. **BotStatus** - Status du bot avec timeline
4. **PositionHistory** - Historique des positions
5. **PositionMonitor** - Monitoring position ouverte en temps réel
6. **TrailingStopPopup** - Popup trailing stop activé
7. **BotActivityLog** - Log d'activité du bot
8. **ScanOpportunity** - Popup opportunité détectée
9. **MarketHealthIndicator** - Indicateur santé marché
10. **MarketBlockedPopup** - Popup marché bloqué
11. **ConnectTopstep** - Connexion Topstep
12. **TradingViewAlerts** - Alertes TradingView
13. **EntryPreparation** - Modal préparation entrée
14. **PositionVerification** - Modal vérification position

**Structure hiérarchique**:
```
TradingDashboard
├── Header
│   ├── Simulation/Live Badge
│   └── ConnectTopstep
├── Controls
│   ├── Market Dropdown
│   ├── Platform Dropdown
│   ├── Timeframe Dropdown
│   ├── Robot Toggle Button
│   └── Manual Scan Button
├── Market Status Banner
├── TradingChart
│   ├── Candles display
│   ├── Indicators (EMA, support/resistance)
│   └── Entry zones visualization
├── Current Signal Display (si signal actif)
├── Credits & Stats Bar (collapsible)
│   └── Balance, PnL, Wins, Losses, Winrate
├── PositionMonitor (si position ouverte)
│   ├── Entry price
│   ├── Current price
│   ├── Live PnL
│   ├── TP1/TP2/SL levels
│   └── Trailing stop status
├── BotActivityLog (collapsible)
│   └── Chronological activity entries
├── PositionHistory
│   └── Last 20 positions cards
├── TradingViewAlerts
│   └── Recent alerts from TradingView
└── Popups/Modals (conditionnels)
    ├── ScanOpportunity (si scanOpportunity)
    ├── SignalProcess (si signalState.signal)
    ├── EntryPreparation (si showEntryPrep)
    ├── PositionVerification (si showPositionVerif)
    ├── TrailingStopPopup (si showTrailingStopPopup)
    └── MarketBlockedPopup (si showMarketBlockedPopup)
```

**Inputs/Props pour chaque composant**:

**TradingChart**:
- `candles`: array OHLC
- `livePrice`: number
- `supports`: array
- `resistances`: array
- `orderBlocks`: { bullish: [], bearish: [] }
- `currentSignal`: object | null
- `currentPosition`: object | null
- `market`: string
- `timeframe`: string

**SignalProcess**:
- `signalState`: { isScanning, preAlert, signal }
- `onAcceptSignal`: function
- `onDeclineSignal`: function
- `onDismissSignal`: function
- `onClosePreAlert`: function
- `market`: string
- `candles`: array

**BotStatus**:
- `botState`: string ('idle', 'scanning', 'pre_alert', 'signal_ready', 'position_locked')
- `nextScanIn`: number
- `scanning`: boolean

**PositionMonitor**:
- `position`: object
- `livePrice`: number
- `livePnL`: number
- `market`: string
- `trailingStopActive`: boolean

**PositionHistory**:
- `history`: array
- `market`: string

**EntryPreparation**:
- `signal`: object
- `onVerify`: function
- `onCancel`: function
- `market`: string

**PositionVerification**:
- `signal`: object
- `accountBalance`: number
- `onConfirm`: function
- `onCancel`: function

**State utilisé** (48 variables):
- Market/Platform: `market`, `platform`, `timeframe`, `isSimulation`
- Bot: `autoMode`, `botState`, `scanning`, `scanStatus`, `lastScanTime`, `nextScanTime`, `nextScanIn`, `etaMinutes`
- Data: `candles`, `livePrice`, `livePnL`, `supports`, `resistances`, `orderBlocks`
- Signal: `currentSignal`, `signalState`, `showPreAlert`, `showAnalysis`, `riskCalc`, `dismissedSignals`, `potentialEntry`, `scanOpportunity`, `prepSignal`
- Position: `currentPosition`, `positionsHistory`, `history`
- Trailing: `showTrailingStopPopup`, `trailingStopData`, `lastTrailingStopUpdate`
- User: `userId`, `activeAccount`, `isLoadingAccount`, `credits`
- Stats: `stats`, `statsBarCollapsed`
- Market: `marketStatus`, `newsSuspension`, `marketHealth`, `compatibilityError`, `showMarketBlockedPopup`
- UI: `showActivityLog`, `showEntryPrep`, `showPositionVerif`, `activityLogCallback`

**Source de données**:

**RÉEL (Supabase DB)**:
- `user_profiles`: User profile
- `user_settings`: Audio settings, bot_auto_mode
- `trading_accounts`: Active account
- `positions`: Open position, history
- `position_credits`: Credit balance
- `signal_history`: Signal acceptance/refusal history

**SERVICES (src/services/)**:
- `marketDataProvider.getOHLC()`: Historical candles
- `marketDataProvider.getCurrentPrice()`: Live price
- `signalEngine.generateSignal()`: AI signal generation
- `positionManager.monitorPosition()`: Real-time monitoring
- `tradingGate.canOpenPosition()`: Validation rules
- `audioAlerts.playAlert()`: Sound notifications
- `newsDetection.isNewsSuspension()`: News check
- `isMarketOpen()`: Market hours check

**SIMULATION**:
- Quand `isSimulation === true`:
  - Candles: Données déterministes via `marketDataProvider` avec flag simulation
  - Live price: Simulated
  - PnL: Calculé sur données simulées
- Note: **Badge visuel ROUGE** avec animation pulse si simulation

**Sortie**:
- Graphique temps réel avec zones d'entrée
- Signals visuels (pre-alert → confirmation)
- Monitoring position avec PnL live
- Log d'activité détaillé
- Stats performance

---

### PAGE: CONFIGURATION (TradingSetup)

**Composants React**:
- Aucun composant externe

**Structure**:
```
TradingSetup
├── Header: "Configuration TradingView"
├── Status Card
│   ├── Signaux status (enabled/disabled)
│   └── Button: "Activer les signaux TradingView"
└── Last Signal Card (si signal existe)
    ├── Signal details (market, direction, price)
    └── Button: "Voir tous les signaux →"
```

**State**:
- `signalsEnabled`: boolean
- `lastSignal`: object | null
- `loading`: boolean

**Source de données**:
- **RÉEL**: Table `tradingview_alerts`
- **Real-time**: Subscription sur INSERT `tradingview_alerts`

**Sortie**:
- Status activation
- Dernier signal reçu

---

### PAGE: SIGNAUX

**Composants React**:
- **TradingViewSignals** (tout le contenu)

**Structure TradingViewSignals**:
```
TradingViewSignals
├── Header: "Signaux TradingView"
├── Signal Cards (liste)
│   ├── Market badge
│   ├── Direction badge (LONG/SHORT)
│   ├── Price info
│   ├── Timestamp
│   ├── Status badge
│   └── Actions (si pending)
│       ├── Button: "Confirmer"
│       └── Button: "Refuser"
└── Empty state (si aucun signal)
```

**State**:
- `signals`: array
- `loading`: boolean

**Source de données**:
- **RÉEL**: Table `tradingview_alerts` (SELECT last 20, UPDATE status)
- **Real-time**: Subscription + Polling (5s)
- **SIMULATION**: Aucune

**Sortie**:
- Liste chronologique des signaux
- Actions confirmation/refus

---

### PAGE: MES COMPTES

**Composants React**:
- Aucun composant externe

**Structure**:
```
AccountManagement
├── Header
│   └── Button: "+ Ajouter un compte" / "Annuler"
├── Filters
│   ├── Status filter (all/active/inactive)
│   └── Market filter (all/BTC/ETH/NASDAQ/GOLD)
├── Create/Edit Form (si visible)
│   ├── Name input
│   ├── Platform dropdown
│   ├── Market dropdown
│   ├── Capital input (presets ou custom)
│   ├── Risk settings
│   └── Submit button
└── Accounts List
    └── Account Cards
        ├── Name, platform, market badge
        ├── Capital, risk, limits display
        ├── Stats (balance, trades, PnL)
        ├── Status toggle
        ├── Active star (si actif)
        └── Actions: Edit, Delete
```

**State** (9 variables):
- `accounts`: array
- `loading`: boolean
- `showForm`: boolean
- `editingAccount`: object | null
- `userProfileId`: string | null
- `activeAccountId`: string | null
- `filterStatus`: string
- `filterMarket`: string
- `newAccount`: object (form data)

**Source de données**:
- **RÉEL**: Tables `user_profiles`, `trading_accounts`
- **Services**: `positionService.getAccountStats()`, `userPreferencesService`
- **SIMULATION**: Aucune

**Sortie**:
- Liste comptes avec stats
- Formulaire CRUD

---

### PAGE: PARRAINAGE

**Composants React**:
- Aucun composant externe

**Structure**:
```
Referral
├── Header: "Programme de Parrainage"
├── Stats Cards
│   ├── Total parrainages
│   ├── Validés
│   └── Bonus gagné
├── Referral Link Card
│   ├── URL display
│   └── Button: "Copier"
├── Share Buttons
│   ├── WhatsApp
│   ├── Telegram
│   ├── Twitter
│   ├── Facebook
│   └── LinkedIn
└── Referrals List
    └── Referral Cards
        ├── Email
        ├── Status badge
        └── Join date
```

**State**:
- `profileId`: string | null
- `referralCode`: string
- `referrals`: array
- `stats`: { total, validated, bonusEarned }
- `loading`: boolean
- `copied`: boolean

**Source de données**:
- **RÉEL**: Tables `user_profiles`, `referrals`
- **Computed**: 
  - `referralCode`: First 8 chars of profile ID uppercase
  - `bonusEarned`: validated × 5

**Sortie**:
- Stats parrainage
- Lien + boutons partage
- Liste filleuls

---

### PAGE: PROFIL

**Composants React**:
- Aucun composant externe

**Structure**:
```
Profil
├── Header: "Mon Profil"
├── User Info Card
│   ├── Email
│   └── User ID
├── Credits Summary
│   ├── Credits par marché
│   └── Button: "Demander Mon Cadeau" (si 0 credits)
├── Quick Actions
│   ├── "Gérer mes comptes"
│   ├── "Programme de parrainage"
│   └── "Super Admin Panel" (si super admin)
└── Admin Section
    ├── Toggle icon 🔐
    ├── Code input (si toggled)
    └── Button: "Valider"
```

**State**:
- `profile`: object | null
- `loading`: boolean
- `superAdminCode`: string
- `showSuperAdminInput`: boolean
- `credits`: array
- `requestingTrial`: boolean
- `trialMessage`: string

**Source de données**:
- **RÉEL**: Tables `user_profiles`, `position_credits`, `admin_settings`
- **RPC**: `request_free_trial()`

**Sortie**:
- Infos utilisateur
- Résumé crédits
- Accès rapides

---

### PAGE: SUPER ADMIN

**Composants React**:
- **TradingViewConfig** (dans onglet)

**Structure**:
```
SuperAdmin
├── Tabs
│   ├── "Utilisateurs"
│   ├── "Demandes de Test ({count})"
│   └── "TradingView Config"
├── Users Tab
│   └── User Cards
│       ├── Email, ID
│       ├── Comptes, Positions, Crédits
│       ├── Button: "Gérer"
│       └── Credit Modal (si selectedUser)
│           ├── Credit form (market, amount, action)
│           ├── Button: "Ajouter"/"Définir"
│           ├── Button: "Effacer tous les trades"
│           └── Button: "Annuler"
├── Requests Tab
│   └── Request Cards
│       ├── User email
│       ├── Request date
│       ├── Button: "✓ Approuver"
│       └── Button: "✗ Refuser"
└── TradingView Tab
    └── <TradingViewConfig />
```

**State**:
- `users`: array (avec stats complètes)
- `loading`: boolean
- `selectedUser`: object | null
- `creditForm`: { market, credits, action }
- `trialRequests`: array
- `activeTab`: string

**Source de données**:
- **RÉEL**: 
  - Tables: `user_profiles`, `positions`, `position_credits`, `trading_accounts`
  - RPC: `get_pending_trial_requests()`, `approve_free_trial()`, `reject_free_trial()`, `delete_user_trades()`
- **Real-time**: 4 subscriptions (trial_requests, credits, accounts, positions)

**Sortie**:
- Vue admin complète
- Gestion utilisateurs/crédits
- Configuration TradingView

---

### COMPOSANT: TradingViewConfig

**Structure**:
```
TradingViewConfig
├── Webhook URL Section
│   ├── URL display
│   └── Button: "Copier"
├── Symbols Section
│   └── Symbol Cards (NASDAQ, BTC, ETH, GOLD)
│       ├── Symbol display
│       └── Button: "Copier"
├── Guides Section
│   ├── Button: "📌 Où trouver le symbole ?"
│   ├── Button: "📌 Créer une alerte TradingView"
│   └── Button: "📌 Format JSON requis"
├── Test Section
│   └── Button: "Envoyer un Signal Test"
├── Recent Signals
│   └── Signal cards (last 10)
└── Guide Modal (si showGuide)
    ├── Guide content (dynamic based on type)
    └── Button: "✕" (close)
```

**State**:
- `config`: { symbols, timeframes, webhookUrl }
- `showGuide`: string | null
- `signals`: array
- `loading`: boolean

**Source de données**:
- **RÉEL**: Table `tradingview_alerts` (SELECT last 10)
- **HTTP**: POST webhook test
- **Constants**: Symbols, timeframes hardcoded

**Sortie**:
- Configuration webhook
- Guides détaillés
- Test fonctionnel

---

## 5. SCHÉMA DES DONNÉES

### CAPITAL & BALANCE - SOURCE DE VÉRITÉ

#### Capital de Départ

**Source**: Table `trading_accounts`
- Champ: `capital` (decimal)
- **D'où vient-il**: Saisi par l'utilisateur lors création du compte
- **Fixe ou dynamique**: **FIXE** - Ne change JAMAIS
- **Définition**: Capital initial alloué au compte (ex: 50000 $ pour FTMO 50k)

**Exemple**:
```sql
trading_accounts:
  id: "abc-123"
  user_id: "user-456"
  name: "FTMO 50k"
  capital: 50000.00  ← CAPITAL INITIAL (FIXE)
  market: "NASDAQ"
  platform: "ftmo"
```

#### Balance Actuelle

**Formule EXACTE**:
```
balance = capital + realized_pnl
```

**Calcul**:
1. On prend le `capital` fixe du compte
2. On ajoute le PnL réalisé (somme des positions fermées)

**Exemple**:
```javascript
// Compte FTMO 50k
const capital = 50000; // Fixe

// Positions fermées
const positions = [
  { status: 'TP1_HIT', pnl: +350 },
  { status: 'SL_HIT', pnl: -180 },
  { status: 'TP2_HIT', pnl: +720 },
];

const realized_pnl = positions
  .filter(p => ['TP1_HIT', 'TP2_HIT', 'SL_HIT'].includes(p.status))
  .reduce((sum, p) => sum + p.pnl, 0);
// realized_pnl = 350 - 180 + 720 = +890

const balance = capital + realized_pnl;
// balance = 50000 + 890 = 50890 $
```

**Stockage**:
- Balance N'EST PAS stockée en DB
- **Calculée en temps réel** via RPC `get_account_stats()`
- Ou calculée côté client dans `updateRealTimePnL()`

**Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 826
```javascript
setStats({
  balance: accountToUse.capital + totalPnl, // ← FORMULE
  pnl: totalPnl,
  wins,
  losses,
  winrate,
  totalTrades
});
```

#### Wallet

**C'est quoi exactement?**
- **WALLET = BALANCE**
- Terme utilisé en UI mais désigne la même chose
- Display: "Wallet: {balance} $"

**Stocké où?**
- **NULLE PART** (calculé dynamiquement)

---

### PNL (Profit & Loss) - SOURCE DE VÉRITÉ

#### PnL Réalisé (Realized PnL)

**Définition**: Gains/pertes des positions FERMÉES

**Formule**:
```javascript
const realized_pnl = positions
  .filter(p => p.status === 'TP1_HIT' || p.status === 'TP2_HIT' || p.status === 'SL_HIT')
  .reduce((sum, p) => sum + (p.pnl || 0), 0);
```

**Source**: Table `positions`
- Champs utilisés:
  - `status`: 'TP1_HIT' | 'TP2_HIT' | 'SL_HIT'
  - `pnl`: decimal (calculé lors fermeture)

**Calcul PnL lors fermeture**:

**Position LONG**:
```
pnl = (exit_price - entry_price) × position_size × point_value
```

**Position SHORT**:
```
pnl = (entry_price - exit_price) × position_size × point_value
```

**Exemple NASDAQ (MNQ)**:
```javascript
// Position LONG fermée à TP1
entry_price = 21500.00
exit_price = 21550.00   // TP1 atteint
position_size = 1       // 1 micro contrat
point_value = 2         // MNQ = 2$ par point

pnl = (21550 - 21500) × 1 × 2
pnl = 50 × 2 = +100 $
```

**Stockage**:
- Table `positions`, champ `pnl`
- Calculé dans `updateRealTimePnL()` ligne 747-755, 782-785

#### PnL Non Réalisé (Unrealized PnL)

**Définition**: Gains/pertes des positions OUVERTES (en cours)

**Formule**:
```javascript
const unrealized_pnl = positions
  .filter(p => p.status === 'OPEN')
  .reduce((sum, p) => sum + (p.pnl || 0), 0);
```

**Calcul en temps réel**:

**Position LONG ouverte**:
```
current_pnl = (live_price - entry_price) × position_size × point_value
```

**Position SHORT ouverte**:
```
current_pnl = (entry_price - live_price) × position_size × point_value
```

**Exemple NASDAQ (MNQ) - Position LONG en cours**:
```javascript
entry_price = 21500.00
live_price = 21520.00   // Prix actuel
position_size = 1
point_value = 2

current_pnl = (21520 - 21500) × 1 × 2
current_pnl = 20 × 2 = +40 $
```

**Stockage**:
- **NON stocké en DB** (calculé live)
- State `livePnL` dans TradingDashboard
- Mis à jour toutes les 5 secondes via `updateRealTimePnL()`

**Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 618-626
```javascript
const currentPrice = await marketDataProvider.getCurrentPrice(market, platform);
const pointValue = getPointValue(market);
const pnl = currentPosition.direction === 'LONG'
  ? (currentPrice - entryPrice) * positionSize * pointValue
  : (entryPrice - currentPrice) * positionSize * pointValue;

setLivePnL(pnl); // ← État temps réel
```

#### PnL Total

**Formule**:
```
total_pnl = realized_pnl + unrealized_pnl
```

**Affichage UI**:
```
PnL: +890.00 $ (réalisé) + 40.00 $ (en cours) = +930.00 $
```

---

### GAINS / PERTES / WINRATE - SOURCE DE VÉRITÉ

#### Gains (Wins)

**Définition**: Nombre de positions gagnantes (TP1 ou TP2 atteints)

**Formule**:
```javascript
const wins = positions
  .filter(p => p.status === 'TP1_HIT' || p.status === 'TP2_HIT')
  .length;
```

**Source**: Table `positions`, champ `status`

#### Pertes (Losses)

**Définition**: Nombre de positions perdantes (SL atteint)

**Formule**:
```javascript
const losses = positions
  .filter(p => p.status === 'SL_HIT')
  .length;
```

**Source**: Table `positions`, champ `status`

#### Winrate

**Définition**: Pourcentage de trades gagnants

**Formule EXACTE**:
```javascript
const closed_positions = positions.filter(p =>
  p.status === 'TP1_HIT' || p.status === 'TP2_HIT' || p.status === 'SL_HIT'
);

const wins = closed_positions.filter(p =>
  p.status === 'TP1_HIT' || p.status === 'TP2_HIT'
).length;

const winrate = closed_positions.length > 0
  ? (wins / closed_positions.length) * 100
  : 0;
```

**Exemple**:
```javascript
// 10 positions fermées
closed_positions = 10

// 7 gagnantes (TP1/TP2), 3 perdantes (SL)
wins = 7

winrate = (7 / 10) × 100 = 70%
```

**Stockage**:
- **NON stocké** (calculé dynamiquement)
- Calculé dans `updateRealTimePnL()` ligne 830

---

### RÉSUMÉ TABLEAU - SOURCES DE VÉRITÉ

| Métrique | Source | Type | Calcul |
|----------|--------|------|--------|
| **Capital** | `trading_accounts.capital` | FIXE | Saisi par user (NEVER CHANGES) |
| **Balance** | Calculé | DYNAMIQUE | `capital + realized_pnl` |
| **Wallet** | Alias de Balance | DYNAMIQUE | Même chose que Balance |
| **Realized PnL** | `positions.pnl` (fermées) | DYNAMIQUE | Somme PnL positions fermées |
| **Unrealized PnL** | Calculé temps réel | TEMPS RÉEL | `(live_price - entry) × size × point_value` |
| **Total PnL** | Calculé | DYNAMIQUE | `realized_pnl + unrealized_pnl` |
| **Wins** | `positions.status` | DYNAMIQUE | Count(TP1_HIT, TP2_HIT) |
| **Losses** | `positions.status` | DYNAMIQUE | Count(SL_HIT) |
| **Winrate** | Calculé | DYNAMIQUE | `(wins / closed_trades) × 100` |
| **Total Trades** | `positions` | DYNAMIQUE | Count(all positions) |

---

## 6. TABLES SUPABASE

### Table: `user_profiles`

**Description**: Profils utilisateurs (1 par user auth)

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK, gen_random_uuid() |
| `user_id` | uuid | Ref auth.users | FK, UNIQUE |
| `email` | text | Email utilisateur | NOT NULL |
| `is_super_admin` | boolean | Super admin flag | DEFAULT false |
| `created_at` | timestamptz | Date création | DEFAULT now() |

**RLS Policies**:
- Users can read own profile
- Users can update own profile
- Super admins can read all profiles

**Créé par**: Migration `20260208062405_create_trading_platform_schema.sql`

---

### Table: `user_settings`

**Description**: Préférences utilisateur (audio, bot, etc.)

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `user_id` | uuid | Ref user_profiles | FK, UNIQUE |
| `audio_enabled` | boolean | Audio alerts ON/OFF | DEFAULT true |
| `volume` | integer | Volume (0-100) | DEFAULT 70 |
| `bot_auto_mode` | boolean | Bot auto-scan | DEFAULT false |
| `created_at` | timestamptz | Date création | DEFAULT now() |

**RLS Policies**:
- Users can read/update own settings

**Créé par**: Migration `20260208193236_add_bot_auto_mode_to_user_settings.sql`

---

### Table: `trading_accounts`

**Description**: Comptes de trading (FTMO, Topstep, Binance, etc.)

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `user_id` | uuid | Ref user_profiles | FK |
| `name` | text | Nom compte | NOT NULL |
| `platform` | text | Platform (ftmo, topstep, binance) | NOT NULL |
| `market` | text | Market (BTC, NASDAQ, GOLD) | NOT NULL |
| `capital` | decimal | Capital initial FIXE | NOT NULL |
| `currency` | text | Currency (USD, EUR) | DEFAULT 'USD' |
| `risk_per_trade_percent` | decimal | Risk % par trade | DEFAULT 1.0 |
| `max_daily_loss` | decimal | Perte max journalière | |
| `max_total_loss` | decimal | Perte max totale | |
| `is_active` | boolean | Compte actif | DEFAULT true |
| `created_at` | timestamptz | Date création | DEFAULT now() |

**RLS Policies**:
- Users can CRUD own accounts
- Super admins can read all accounts

**Index**:
- `idx_trading_accounts_user_id` sur `user_id`
- `idx_trading_accounts_market_platform` sur `market, platform`

**Créé par**: Migration `20260208062405_create_trading_platform_schema.sql`

---

### Table: `position_credits`

**Description**: Crédits de positions (combien de trades autorisés)

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `user_id` | uuid | Ref user_profiles | FK |
| `market` | text | Market (BTC, NASDAQ, GOLD) | NOT NULL |
| `total_credits` | integer | Total crédits achetés | DEFAULT 0 |
| `used_credits` | integer | Crédits consommés | DEFAULT 0 |
| `expires_at` | timestamptz | Date expiration | NULLABLE |
| `created_at` | timestamptz | Date création | DEFAULT now() |

**Computed Field**:
```sql
remaining_credits = total_credits - used_credits
```

**RLS Policies**:
- Users can read own credits
- Super admins can read/update all credits

**Unique Constraint**:
- `UNIQUE(user_id, market)` - 1 seul record par user+market

**Créé par**: Migration `20260208062405_create_trading_platform_schema.sql`

---

### Table: `positions`

**Description**: Positions de trading (ouvertes et fermées)

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `user_id` | uuid | Ref user_profiles | FK |
| `account_id` | uuid | Ref trading_accounts | FK |
| `signal_id` | uuid | Ref signals (deprecated) | FK NULLABLE |
| `market` | text | Market | NOT NULL |
| `platform` | text | Platform | NOT NULL |
| `direction` | text | LONG or SHORT | NOT NULL |
| `entry_price` | decimal | Prix entrée | NOT NULL |
| `stop_loss` | decimal | Stop loss | NOT NULL |
| `take_profit_1` | decimal | TP1 | NOT NULL |
| `take_profit_2` | decimal | TP2 | NULLABLE |
| `position_size` | decimal | Taille (lots/contracts) | NOT NULL |
| `status` | text | OPEN, TP1_HIT, TP2_HIT, SL_HIT, BE, CLOSED | DEFAULT 'OPEN' |
| `entry_time` | timestamptz | Timestamp entrée | DEFAULT now() |
| `exit_time` | timestamptz | Timestamp sortie | NULLABLE |
| `exit_price` | decimal | Prix sortie | NULLABLE |
| `pnl` | decimal | Profit/Loss | NULLABLE |
| `pnl_percent` | decimal | PnL en % | NULLABLE |
| `user_modified` | boolean | User a modifié risk | DEFAULT false |
| `created_at` | timestamptz | Date création | DEFAULT now() |

**RLS Policies**:
- Users can CRUD own positions
- Super admins can read all positions

**Index**:
- `idx_positions_user_account` sur `user_id, account_id`
- `idx_positions_status` sur `status`

**Créé par**: Migration `20260208062405_create_trading_platform_schema.sql`

---

### Table: `signal_history`

**Description**: Historique des signaux (acceptés/refusés)

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `user_id` | uuid | Ref user_profiles | FK |
| `account_id` | uuid | Ref trading_accounts | FK |
| `market` | text | Market | NOT NULL |
| `platform` | text | Platform | NOT NULL |
| `direction` | text | LONG or SHORT | NOT NULL |
| `entry_min` | decimal | Zone entrée min | |
| `entry_max` | decimal | Zone entrée max | |
| `confidence` | integer | 0-100 | |
| `action` | text | 'pris' or 'refusé' | NOT NULL |
| `credit_debited` | boolean | Crédit débité | DEFAULT false |
| `created_at` | timestamptz | Date | DEFAULT now() |

**RLS Policies**:
- Users can read/insert own signal history

**Créé par**: Migration `20260208161259_add_signal_history_table.sql`

---

### Table: `action_history`

**Description**: Journal d'audit (toutes actions utilisateur)

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `user_id` | uuid | Ref user_profiles | FK |
| `account_id` | uuid | Ref trading_accounts | FK NULLABLE |
| `action_type` | text | Type action | NOT NULL |
| `action_data` | jsonb | Données action | DEFAULT '{}' |
| `created_at` | timestamptz | Timestamp | DEFAULT now() |

**Action Types**:
- `PRE_ALERT`
- `SIGNAL_CONFIRMED`
- `POSITION_OPENED`
- `TRAILING_STOP_MOVED`
- `TP1_HIT`
- `TP2_HIT`
- `SL_HIT`
- `SIGNAL_REFUSED`
- `SIGNAL_DISMISSED`

**RLS Policies**:
- Users can read/insert own actions
- Super admins can read all actions

**Créé par**: Migration `20260208190208_add_action_history_tracking.sql`

---

### Table: `free_trial_requests`

**Description**: Demandes de crédits gratuits

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `user_id` | uuid | Ref user_profiles | FK |
| `status` | text | pending, approved, rejected | DEFAULT 'pending' |
| `created_at` | timestamptz | Date demande | DEFAULT now() |

**RLS Policies**:
- Users can read own requests
- Users can insert requests
- Super admins can read/update all requests

**Créé par**: Migration `20260208064116_add_referral_and_free_trial_system.sql`

---

### Table: `referrals`

**Description**: Programme de parrainage

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `referrer_id` | uuid | Ref user_profiles (parrain) | FK |
| `referred_id` | uuid | Ref user_profiles (filleul) | FK |
| `status` | text | pending, validated | DEFAULT 'pending' |
| `bonus_granted` | boolean | Bonus accordé | DEFAULT false |
| `created_at` | timestamptz | Date parrainage | DEFAULT now() |

**RLS Policies**:
- Users can read own referrals (as referrer)

**Créé par**: Migration `20260208064116_add_referral_and_free_trial_system.sql`

---

### Table: `topstep_connections`

**Description**: Connexions Topstep (OAuth tokens)

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `user_id` | uuid | Ref user_profiles | FK, UNIQUE |
| `email` | text | Email Topstep | NOT NULL |
| `access_token` | text | Access token (encrypted) | NOT NULL |
| `refresh_token` | text | Refresh token (encrypted) | |
| `expires_at` | timestamptz | Expiration token | |
| `is_connected` | boolean | Connexion active | DEFAULT true |
| `last_sync` | timestamptz | Dernière synchro | |
| `created_at` | timestamptz | Date connexion | DEFAULT now() |

**RLS Policies**:
- Users can read/update own connection

**Créé par**: Migration `20260210160741_add_topstep_connections_table.sql`

---

### Table: `tradingview_alerts`

**Description**: Alertes webhook TradingView

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `market` | text | Market (BTC, NASDAQ, etc.) | NOT NULL |
| `direction` | text | LONG or SHORT | NOT NULL |
| `price` | decimal | Prix au moment de l'alerte | NOT NULL |
| `timeframe` | text | Timeframe (5, 15, 30, 60, etc.) | NOT NULL |
| `timestamp` | text | Timestamp TradingView | NOT NULL |
| `symbol` | text | Symbole TradingView | |
| `status` | text | pending, confirmed, rejected, executed | DEFAULT 'pending' |
| `raw_payload` | jsonb | Payload brut webhook | |
| `created_at` | timestamptz | Date réception | DEFAULT now() |

**RLS Policies**:
- Authenticated users can read alerts
- Authenticated users can update status

**Créé par**: Migration `20260210201355_create_tradingview_alerts_table.sql`

---

### Table: `user_preferences`

**Description**: Préférences utilisateur (last selections)

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `user_id` | uuid | Ref user_profiles | FK, UNIQUE |
| `last_market` | text | Dernier marché sélectionné | |
| `last_platform` | text | Dernière plateforme | |
| `last_timeframe` | text | Dernier timeframe | |
| `active_account_id` | uuid | Compte actif | |
| `preferences` | jsonb | Autres préférences | DEFAULT '{}' |
| `created_at` | timestamptz | Date création | DEFAULT now() |
| `updated_at` | timestamptz | Dernière MAJ | DEFAULT now() |

**RLS Policies**:
- Users can read/update own preferences

**Créé par**: Migration `20260209042053_create_user_preferences_and_position_history.sql`

---

### Table: `admin_settings`

**Description**: Paramètres admin globaux

**Colonnes**:
| Colonne | Type | Description | Contrainte |
|---------|------|-------------|------------|
| `id` | uuid | Primary key | PK |
| `setting_key` | text | Clé paramètre | UNIQUE |
| `setting_value` | text | Valeur | |
| `description` | text | Description | |
| `created_at` | timestamptz | Date création | DEFAULT now() |

**Settings stockés**:
- `super_admin_code`: Code accès super admin (default: '2709')

**RLS Policies**:
- Public read access
- Only super admins can update

**Créé par**: Migration `20260208073512_setup_super_admin_system.sql`

---

## 7. SERVICES & LOGIQUE MÉTIER

### Service: `marketDataProvider`
**Fichier**: `src/services/MarketDataProvider.js`

**Méthodes**:
- `getOHLC(market, platform, timeframe)`: Retourne historical candles
- `getCurrentPrice(market, platform)`: Retourne prix actuel
- `getSupports(candles)`: Calcule niveaux support
- `getResistances(candles)`: Calcule niveaux résistance

**Mode**:
- Si simulation: Données déterministes (fichier JSON ou générées)
- Si réel: API externe ou Supabase (selon plateforme)

---

### Service: `signalEngine`
**Fichier**: `src/services/signalEngine.js`

**Méthode principale**:
- `generateSignal(market, platform, candles, activeAccount)`: Génère signal trading basé sur:
  - Analyse technique (EMA, RSI, MACD)
  - Order blocks
  - Support/Resistance
  - Confirmation multi-critères

**Retourne**:
```javascript
{
  direction: 'LONG' | 'SHORT',
  entry_min: number,
  entry_max: number,
  stop_loss: number,
  take_profit_1: number,
  take_profit_2: number,
  confidence: 0-100,
  risk_reward: number,
  reasons: string[]
}
```

---

### Service: `positionManager`
**Fichier**: `src/services/positionManager.js`

**Méthodes**:
- `monitorPosition(userId, positionId)`: Lance monitoring temps réel
- `checkTPSL(position, currentPrice)`: Vérifie si TP/SL atteints
- `updatePosition(positionId, updates)`: Met à jour position DB

**Logique**:
- Poll prix toutes les 5s
- Check TP1, TP2, SL
- Si TP1 hit → Active trailing stop automatique
- Si TP/SL hit → Ferme position, calcule PnL, UPDATE DB

---

### Service: `positionService`
**Fichier**: `src/services/positionService.js`

**Méthodes**:
- `getOpenPosition(userId, accountId)`: Récupère position ouverte
- `getPositionHistory(userId, accountId, limit)`: Historique positions
- `getAccountStats(userId, accountId)`: Stats compte via RPC

---

### Service: `tradingGate`
**Fichier**: `src/services/tradingGate.js`

**Méthode principale**:
- `canOpenPosition(userId, accountId, market, candles, price)`: Valide conditions trading
  - Marché ouvert?
  - Crédits disponibles?
  - Pas de position déjà ouverte?
  - Pas de news suspension?
  - Market health OK?

**Retourne**: `{ allowed: boolean, reason: string }`

---

### Service: `userPreferencesService`
**Fichier**: `src/services/userPreferences.js`

**Méthodes**:
- `getPreferences(userId)`: Lit préférences
- `updateLastSelection(userId, market, platform, timeframe)`: Sauvegarde dernière sélection
- `setActiveAccount(userId, accountId, market, platform)`: Définit compte actif

---

### Service: `audioAlerts`
**Fichier**: `src/services/audioAlerts.js`

**Méthodes**:
- `playAlert(type)`: Joue son ('pre_alert', 'signal', 'error', 'warning', 'success')
- `setEnabled(enabled)`: Active/désactive sons
- `setVolume(volume)`: Ajuste volume 0-100

---

### Service: `riskCalculator`
**Fichier**: `src/services/riskCalculator.js`

**Méthodes**:
- `calculatePositionSize(accountBalance, riskPercent, entryPrice, stopLoss, pointValue)`: Calcule taille position optimale
- `calculateRiskReward(entryPrice, stopLoss, takeProfit)`: Calcule ratio R:R

**Formule Position Size**:
```
risk_amount = accountBalance × (riskPercent / 100)
price_distance = |entryPrice - stopLoss|
position_size = risk_amount / (price_distance × pointValue)
```

---

### Service: `trailingStop`
**Fichier**: `src/services/trailingStop.js`

**Logique**:
- Activé automatiquement quand TP1 hit
- Déplace SL progressivement vers breakeven puis profit
- Règles:
  - Si prix monte de X points → SL suit à X/2 points
  - SL ne peut JAMAIS descendre (LONG) ou monter (SHORT)

---

### Service: `newsDetection`
**Fichier**: `src/services/newsDetection.js`

**Méthode**:
- `isNewsSuspension(market)`: Check si news majeure en cours
- Suspend trading X minutes avant/après annonces économiques

---

### Service: `marketHours`
**Fichier**: `src/services/marketHours.js`

**Méthodes**:
- `isMarketOpen(market)`: Check si marché ouvert maintenant
- `getMarketStatus(market)`: Retourne status détaillé avec message

**Horaires**:
- **NASDAQ**: Lun-Ven 15:30-22:00 CET (pause 23:00-00:00)
- **BTC/ETH**: 24/7
- **GOLD**: Lun-Ven horaires spécifiques

---

## 8. SOURCES DE VÉRITÉ

### MODE SIMULATION vs MODE RÉEL

#### Détection Mode

**Fichier**: `src/config/dataMode.js`

**Logique**:
```javascript
const isSimulation = !process.env.REACT_APP_SUPABASE_URL
  || process.env.REACT_APP_DATA_MODE === 'SIMULATION';
```

**Critères**:
- Si `REACT_APP_SUPABASE_URL` absent → SIMULATION
- Si `REACT_APP_DATA_MODE=SIMULATION` → SIMULATION
- Sinon → RÉEL

#### UI Différence

**SIMULATION**:
- Badge ROUGE: "⚠️ SIMULATION - Données déterministes"
- Animation pulse sur badge
- Données: Mock/fichiers JSON

**RÉEL**:
- Badge VERT: "✅ LIVE - Données temps réel"
- Pas d'animation
- Données: Supabase + APIs externes

---

### RÉCAPITULATIF SOURCES PAR TYPE DE DONNÉES

| Type de données | Mode SIMULATION | Mode RÉEL |
|-----------------|-----------------|-----------|
| **Candles (OHLC)** | Fichier JSON déterministe | API externe (Binance, FMP, etc.) |
| **Prix live** | Mock généré | WebSocket/API temps réel |
| **Capital** | Mock (ex: 50000$) | Table `trading_accounts.capital` |
| **Balance** | Mock calculé | `capital + realized_pnl` (DB) |
| **Positions** | State local | Table `positions` |
| **Crédits** | Mock (ex: 5) | Table `position_credits` |
| **Signaux** | Générés aléatoirement | `signalEngine` basé candles réels |
| **User profile** | Mock | Table `user_profiles` |
| **Stats** | Calculées sur mock | Calculées sur DB via RPC |

---

### POINTS D'INCOHÉRENCE IDENTIFIÉS

#### 1. Capital vs Balance - Confusion

**Problème**: Certains composants affichent `capital` au lieu de `balance`

**Impact**: Utilisateur voit capital initial au lieu de balance actuelle

**Localisation**:
- `TradingStats` component peut afficher capital si balance non fournie
- `AccountManagement` affiche capital au lieu de balance calculée

**Solution requise**: Toujours calculer et afficher `balance = capital + realized_pnl`

#### 2. PnL Calculation - Incohérent entre composants

**Problème**: 
- `TradingDashboard` calcule PnL toutes les 5s
- `PositionMonitor` peut avoir PnL différent si async

**Impact**: Affichage PnL peut varier entre composants

**Solution requise**: Centraliser calcul PnL dans un seul service

#### 3. Credits - Double Source

**Problème**:
- State `credits` local dans plusieurs pages
- Table `position_credits` en DB
- Pas de sync automatique

**Impact**: Crédits peuvent être désynchronisés

**Solution requise**: Single source of truth + real-time subscription

#### 4. Simulation Mode - Pas assez clair

**Problème**: 
- Badge visible mais données peuvent sembler "réelles"
- Utilisateur peut confondre simulation et réel

**Impact**: Confusion sur validité des données

**Solution requise**: 
- Modal disclaimer au démarrage
- Watermark "SIMULATION" sur toute la page
- Désactiver certaines actions en simulation

#### 5. Market Status - Pas toujours respecté

**Problème**:
- Avant corrections d'aujourd'hui, signaux générés marché fermé
- Tests montrent incohérences

**Impact**: UX mensongère

**Solution**: ✅ CORRIGÉ aujourd'hui (hard gates ajoutés)

---

## CONCLUSION

Ce document constitue la **carte complète** de l'application AI Trading Platform.

**Utilisations**:
1. ✅ Référence pour refactoring
2. ✅ Documentation pour nouveaux développeurs
3. ✅ Identification des incohérences
4. ✅ Base pour tests E2E
5. ✅ Validation logique métier

**Prochaines étapes**:
1. Validation de ce schéma par l'équipe
2. Correction des incohérences identifiées
3. Refactoring basé sur cette structure
4. Tests end-to-end basés sur ce mapping

---

**FIN DU DOCUMENT**
