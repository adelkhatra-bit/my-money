# 📋 INVENTAIRE COMPLET - TOUS LES BOUTONS DE L'APPLICATION

**Date**: 2026-02-10
**Objectif**: Lister TOUS les boutons et TOUT expliquer clairement

---

## 🎯 LÉGENDE

Pour chaque bouton :
- **Nom** : Texte affiché
- **Où** : Page / Composant
- **Pourquoi** : Raison d'exister
- **Quand** : Conditions d'utilisation
- **Action** : Ce qui se passe quand on clique
- **Service** : Code exécuté
- **DB** : Tables/données impactées
- **Résultat visible** : Ce que voit l'utilisateur

---

## 📄 PAGE: TRADINGDASHBOARD (/trading)

### Bouton 1: 🤖 ROBOT ON / ⏸️ ROBOT OFF

**Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 1911-1924

| Attribut | Valeur |
|----------|--------|
| **Nom** | "🤖 ROBOT ON" ou "⏸️ ROBOT OFF" |
| **Où** | TradingDashboard - Header contrôles |
| **Pourquoi** | Active le mode automatique (scan toutes les 30s) |
| **Quand** | Marché ouvert ET aucune position ouverte |
| **Action** | Toggle `autoMode` true/false |
| **Service** | `botService.js` démarre/arrête le polling |
| **DB** | - |
| **Résultat visible** | Bouton change de couleur, scans automatiques démarrent |
| **Désactivé si** | Marché fermé OU position ouverte |

**Code** :
```javascript
const handleToggleBot = () => {
  setAutoMode(!autoMode);
  // Si ON: démarre scan automatique toutes les 30s
  // Si OFF: arrête le scan automatique
};
```

**Statut actuel** : ✅ UTILE (action principale)

---

### Bouton 2: 🎯 Scan Manuel

**Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 1927-1932

| Attribut | Valeur |
|----------|--------|
| **Nom** | "🎯 Scan Manuel" |
| **Où** | TradingDashboard - Header contrôles |
| **Pourquoi** | Déclenche un scan immédiat sans attendre le robot |
| **Quand** | Marché ouvert ET aucune position ouverte ET crédits disponibles |
| **Action** | Appelle `handleManualScan()` |
| **Service** | `signalEngine.js` → génère signal |
| **DB** | Décrémente `position_credits.credits_remaining` |
| **Résultat visible** | Popup signal si opportunité détectée |
| **Désactivé si** | Marché fermé OU position ouverte OU crédits = 0 |

**Code** :
```javascript
const handleManualScan = async () => {
  // 1. Vérifie crédits
  // 2. Génère signal (signalEngine.generateSignal)
  // 3. Si OK: affiche popup opportunité
  // 4. Si KO: affiche raison du rejet
};
```

**Statut actuel** : ⚠️ CONFUS (l'utilisateur ne comprend pas la différence avec Robot)

---

### Bouton 3: 📊 Log d'Activité

**Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 2118

| Attribut | Valeur |
|----------|--------|
| **Nom** | "📊" (icône uniquement) |
| **Où** | TradingDashboard - Coin supérieur droit |
| **Pourquoi** | Affiche historique des actions du bot |
| **Quand** | Toujours disponible |
| **Action** | Toggle affichage `BotActivityLog` |
| **Service** | - |
| **DB** | - (logs en mémoire uniquement) |
| **Résultat visible** | Panneau log apparaît/disparaît |

**Code** :
```javascript
onClick={() => setShowActivityLog(!showActivityLog)}
```

**Statut actuel** : ⚠️ TECHNIQUE (pas essentiel pour utilisateur)

---

### Bouton 4: ▼ Stats Bar Toggle

**Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 2145

| Attribut | Valeur |
|----------|--------|
| **Nom** | "▼" (flèche) |
| **Où** | TradingDashboard - Barre de stats (bas) |
| **Pourquoi** | Masquer/afficher les statistiques |
| **Quand** | Toujours disponible |
| **Action** | Toggle `statsBarCollapsed` |
| **Service** | - |
| **DB** | - |
| **Résultat visible** | Stats bar se rétracte ou s'étend |

**Code** :
```javascript
const toggleStatsBar = () => {
  setStatsBarCollapsed(!statsBarCollapsed);
  localStorage.setItem('trading_statsbar_collapsed', !statsBarCollapsed);
};
```

**Statut actuel** : ✅ UTILE (gain d'espace écran)

---

### Sélecteur 5: Marché

**Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 1882-1886

| Attribut | Valeur |
|----------|--------|
| **Nom** | Dropdown avec options |
| **Où** | TradingDashboard - Header contrôles |
| **Pourquoi** | Choisir le marché à trader |
| **Options** | NASDAQ (MNQ), GOLD (MGC), BTC (Test) |
| **Action** | Appelle `handleMarketChange(value)` |
| **Service** | Change compte actif, recharge données |
| **DB** | Lit `trading_accounts` pour le nouveau marché |
| **Résultat visible** | Graphique et stats changent |

**Code** :
```javascript
const handleMarketChange = async (newMarket) => {
  setMarket(newMarket);
  // 1. Change compte actif
  // 2. Recharge stats
  // 3. Recharge graphique
  // 4. Reset position courante
};
```

**Statut actuel** : ✅ ESSENTIEL

---

### Sélecteur 6: Plateforme

**Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 1890-1896

| Attribut | Valeur |
|----------|--------|
| **Nom** | Dropdown avec options |
| **Où** | TradingDashboard - Header contrôles |
| **Pourquoi** | Choisir la plateforme de trading |
| **Options** | TopStep, Apex, FTMO (selon marché) |
| **Action** | Appelle `handlePlatformChange(value)` |
| **Service** | Change compte actif |
| **DB** | Lit `trading_accounts` |
| **Résultat visible** | Compte et stats changent |

**Code** :
```javascript
const handlePlatformChange = async (newPlatform) => {
  setPlatform(newPlatform);
  // Change compte actif pour nouveau marché+plateforme
};
```

**Statut actuel** : ✅ ESSENTIEL

---

### Sélecteur 7: Timeframe

**Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx` ligne 1898-1907

| Attribut | Valeur |
|----------|--------|
| **Nom** | Dropdown avec options |
| **Où** | TradingDashboard - Header contrôles |
| **Pourquoi** | Choisir la granularité du graphique |
| **Options** | 1m, 5m, 15m, 30m, 1h, 4h |
| **Action** | Change `timeframe` state |
| **Service** | Recharge données graphique |
| **DB** | - |
| **Résultat visible** | Graphique change de granularité |

**Code** :
```javascript
onChange={(e) => setTimeframe(e.target.value)}
```

**Statut actuel** : ✅ UTILE (affichage graphique)

---

## 📄 COMPOSANTS POPUP/MODAL

### Popup 8: ScanOpportunity - Confirmer / Ignorer

**Fichier**: `src/components/ScanOpportunity/ScanOpportunity.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "✅ Confirmer" / "❌ Ignorer" |
| **Où** | Popup après scan réussi |
| **Pourquoi** | Valider ou rejeter l'opportunité détectée |
| **Quand** | Après scan (manuel ou auto) |
| **Action Confirmer** | Ouvre EntryPreparation |
| **Action Ignorer** | Ferme popup, ignore signal |
| **Service** | - |
| **DB** | - |
| **Résultat visible** | Passe à l'étape suivante ou annule |

**Code** :
```javascript
onConfirm={() => handleConfirmOpportunity(scanOpportunity)}
onDismiss={() => handleDismissOpportunity()}
```

**Statut actuel** : ⚠️ CONFUS (redondant avec EntryPreparation)

---

### Popup 9: EntryPreparation - Vérifier / Annuler

**Fichier**: `src/components/EntryPreparation/EntryPreparation.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "🔍 Vérifier Position" / "❌ Annuler" |
| **Où** | Popup préparation entrée |
| **Pourquoi** | Valider les paramètres d'entrée |
| **Quand** | Après confirmation opportunité |
| **Action Vérifier** | Ouvre PositionVerification |
| **Action Annuler** | Ferme popup, annule signal |
| **Service** | - |
| **DB** | - |
| **Résultat visible** | Passe à vérification ou annule |

**Code** :
```javascript
onVerify={() => handleVerifyPosition(prepSignal)}
onCancel={() => handleCancelEntry()}
```

**Statut actuel** : ⚠️ CONFUS (étape intermédiaire peu claire)

---

### Popup 10: PositionVerification - Confirmer Entrée / Annuler

**Fichier**: `src/components/PositionVerification/PositionVerification.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "✅ Confirmer Entrée" / "❌ Annuler" |
| **Où** | Popup vérification finale |
| **Pourquoi** | Dernière validation avant ouverture position |
| **Quand** | Après EntryPreparation |
| **Action Confirmer** | Ouvre position réelle |
| **Action Annuler** | Ferme popup, annule signal |
| **Service** | `positionService.createPosition()` |
| **DB** | INSERT dans `positions` |
| **Résultat visible** | Position ouverte, PositionMonitor visible |

**Code** :
```javascript
onConfirm={() => handleConfirmEntry(verificationSignal)}
onCancel={() => handleCancelVerification()}
```

**Statut actuel** : ⚠️ REDONDANT (3 popups pour 1 entrée)

---

### Popup 11: PositionMonitor - Fermer Position

**Fichier**: `src/components/PositionMonitor/PositionMonitor.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "🔴 Fermer Position" |
| **Où** | Affichage position ouverte |
| **Pourquoi** | Fermer manuellement la position |
| **Quand** | Position ouverte |
| **Action** | Ferme position |
| **Service** | `accountingService.closePosition()` |
| **DB** | UPDATE `positions` (status='CLOSED', realized_pnl calculé) |
| **Résultat visible** | Position fermée, PnL réalisé ajouté |

**Code** :
```javascript
onClose={() => handleClosePosition()}
```

**Statut actuel** : ✅ ESSENTIEL

---

### Popup 12: TrailingStopPopup - Activer / Ignorer

**Fichier**: `src/components/TrailingStopPopup/TrailingStopPopup.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "✅ Activer Trailing Stop" / "❌ Ignorer" |
| **Où** | Popup après TP1 atteint |
| **Pourquoi** | Proposer trailing stop automatique |
| **Quand** | TP1 atteint |
| **Action Activer** | Active trailing stop |
| **Action Ignorer** | Continue sans trailing |
| **Service** | `trailingStop.js` |
| **DB** | UPDATE `positions.current_stop` |
| **Résultat visible** | Stop loss suit le prix |

**Code** :
```javascript
onActivate={() => handleActivateTrailing()}
onDismiss={() => handleDismissTrailing()}
```

**Statut actuel** : ✅ UTILE (gestion risque)

---

## 📄 PAGE: ACCOUNTMANAGEMENT (/comptes)

### Bouton 13: ➕ Créer un compte

**Fichier**: `src/pages/AccountManagement/AccountManagement.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "➕ Créer un compte" |
| **Où** | AccountManagement - Header |
| **Pourquoi** | Ajouter nouveau compte de trading |
| **Quand** | Toujours disponible |
| **Action** | Ouvre modal création compte |
| **Service** | - |
| **DB** | - (modal ouvre formulaire) |
| **Résultat visible** | Modal apparaît |

**Statut actuel** : ✅ ESSENTIEL

---

### Bouton 14: 📝 Modifier

**Fichier**: `src/pages/AccountManagement/AccountManagement.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "📝 Modifier" |
| **Où** | Card compte - Actions |
| **Pourquoi** | Modifier paramètres compte |
| **Quand** | Sur chaque compte |
| **Action** | Ouvre modal édition |
| **Service** | - |
| **DB** | - (modal ouvre formulaire) |
| **Résultat visible** | Modal édition apparaît |

**Statut actuel** : ✅ ESSENTIEL

---

### Bouton 15: 🗑️ Supprimer

**Fichier**: `src/pages/AccountManagement/AccountManagement.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "🗑️ Supprimer" |
| **Où** | Card compte - Actions |
| **Pourquoi** | Supprimer un compte |
| **Quand** | Sur chaque compte |
| **Action** | Supprime compte après confirmation |
| **Service** | Supabase delete |
| **DB** | DELETE `trading_accounts` |
| **Résultat visible** | Compte disparaît de la liste |

**Statut actuel** : ✅ ESSENTIEL

---

### Bouton 16: ✅ Activer

**Fichier**: `src/pages/AccountManagement/AccountManagement.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "✅ Activer" |
| **Où** | Card compte - Actions |
| **Pourquoi** | Définir comme compte actif |
| **Quand** | Si compte inactif |
| **Action** | Active le compte |
| **Service** | - |
| **DB** | UPDATE préférences utilisateur |
| **Résultat visible** | Badge "Actif" apparaît |

**Statut actuel** : ✅ ESSENTIEL

---

## 📄 PAGE: SUPERADMIN (/super-admin)

### Bouton 17: ✅ Approuver / ❌ Rejeter (Free Trial)

**Fichier**: `src/pages/SuperAdmin/SuperAdmin.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "✅ Approuver" / "❌ Rejeter" |
| **Où** | SuperAdmin - Demandes d'essai gratuit |
| **Pourquoi** | Valider/rejeter demandes trial |
| **Quand** | Super admin uniquement |
| **Action** | Approuve/rejette demande |
| **Service** | RPC function `approve_trial_request` / `reject_trial_request` |
| **DB** | UPDATE `free_trial_requests`, INSERT `position_credits` |
| **Résultat visible** | User reçoit crédits ou refus |

**Statut actuel** : ✅ ESSENTIEL (admin)

---

### Bouton 18: Effacer tous les trades

**Fichier**: `src/pages/SuperAdmin/SuperAdmin.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "🗑️ Effacer tous les trades" |
| **Où** | SuperAdmin - Outils |
| **Pourquoi** | Reset complet données user |
| **Quand** | Super admin uniquement |
| **Action** | Supprime toutes positions user |
| **Service** | RPC function `delete_user_trades` |
| **DB** | DELETE `positions` WHERE user_id |
| **Résultat visible** | Historique user effacé |

**Statut actuel** : ⚠️ DANGEREUX (à sécuriser)

---

### Bouton 19: Reset positions ouvertes

**Fichier**: `src/pages/SuperAdmin/SuperAdmin.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "🔄 Reset positions ouvertes" |
| **Où** | SuperAdmin - Outils |
| **Pourquoi** | Fermer toutes positions ouvertes user |
| **Quand** | Super admin uniquement |
| **Action** | Ferme toutes positions OPEN |
| **Service** | RPC function `reset_open_positions` |
| **DB** | UPDATE `positions` (status='CLOSED') |
| **Résultat visible** | Positions fermées |

**Statut actuel** : ⚠️ TECHNIQUE (admin debug)

---

## 📄 PAGE: TRADINGVIEWCONFIG (/config-tradingview)

### Bouton 20: Connecter TopStep

**Fichier**: `src/components/ConnectTopstep/ConnectTopstep.jsx`

| Attribut | Valeur |
|----------|--------|
| **Nom** | "🔗 Connecter TopStep" |
| **Où** | TradingDashboard / TradingViewConfig |
| **Pourquoi** | Lier compte TopStep |
| **Quand** | Si non connecté |
| **Action** | Demande credentials TopStep |
| **Service** | `topstepAuth.js` |
| **DB** | INSERT `topstep_connections` |
| **Résultat visible** | Compte lié, données TopStep disponibles |

**Statut actuel** : ⚠️ TECHNIQUE (config manuelle)

---

## 📄 NAVBAR (toutes pages)

### Lien 21-27: Navigation

**Fichier**: `src/components/Navbar/Navbar.jsx`

| Nom | Destination | Pourquoi |
|-----|-------------|----------|
| Dashboard | `/` | Accueil / Vue d'ensemble |
| Trading | `/trading` | Interface trading principale |
| Configuration | `/configuration` | Paramètres compte |
| Signaux | `/signaux` | Historique signaux |
| Mes Comptes | `/comptes` | Gestion comptes trading |
| Parrainage | `/referral` | Programme parrainage |
| Profil | `/profil` | Paramètres utilisateur |
| Super Admin | `/super-admin` | Admin (si super_admin) |

**Statut actuel** : ✅ ESSENTIEL (navigation)

---

## 📊 RÉCAPITULATIF

### Total Boutons/Actions: 27

### Par Catégorie:

| Catégorie | Nombre | Statut |
|-----------|--------|--------|
| **ESSENTIELS** (garder) | 12 | ✅ |
| **UTILES** (optimiser) | 5 | ⚠️ |
| **CONFUS** (simplifier) | 7 | ❌ |
| **TECHNIQUE** (cacher) | 3 | ⚠️ |

---

## 🚨 PROBLÈMES IDENTIFIÉS

### 1. Flux d'entrée = 3 POPUPS ❌

Actuellement:
```
Scan → ScanOpportunity → EntryPreparation → PositionVerification → Position Ouverte
        (Popup 1)          (Popup 2)              (Popup 3)
```

**Problème**: Trop d'étapes, utilisateur confus

**Solution proposée**:
```
Scan → 🟢 LONG CONFIRMÉ (bouton unique) → Position Ouverte
```

---

### 2. Scan Manuel vs Robot ❌

**Problème**: Utilisateur ne comprend pas la différence

**Solution proposée**:
- Supprimer "Scan Manuel"
- Garder uniquement "ROBOT ON/OFF"
- Robot fait tout automatiquement

---

### 3. Boutons Techniques Visibles ❌

**Problème**: "Copier preuve", "Log d'activité", etc. visibles

**Solution proposée**:
- Cacher dans mode debug/développeur
- UI utilisateur = minimaliste

---

## 💡 PROPOSITION SIMPLIFICATION RADICALE

### UI MINIMALE - 3 ÉTATS SEULEMENT

```
┌─────────────────────────────────────────────────┐
│  NASDAQ | $10,180 | [🤖 BOT OFF ▼]             │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                                                 │
│              GRAPHIQUE PROPRE                   │
│                                                 │
│                                                 │
│          Entry: 18,500                          │
│          SL: 18,480 | TP: 18,540               │
│                                                 │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  État: 🟠 ATTENTE                               │
│  ou: 🟢 [ACHETER LONG]                         │
│  ou: 🔴 [VENDRE SHORT]                         │
└─────────────────────────────────────────────────┘
```

### Boutons Visibles (5 maximum):

1. **BOT ON/OFF** - Toggle robot
2. **ACHETER LONG** - Si signal long confirmé
3. **VENDRE SHORT** - Si signal short confirmé
4. **FERMER POSITION** - Si position ouverte
5. **⚙️** - Menu déroulant (Comptes, Config, Déconnexion)

**C'est tout.**

---

## 📋 SCHÉMA SIMPLIFIÉ

```
USER ACTION → SERVICE → DB → RÉSULTAT

1. Clic "BOT ON"
   → botService démarre
   → (rien en DB)
   → Scan auto toutes les 30s

2. Signal détecté
   → signalEngine génère
   → (rien en DB)
   → Bouton [ACHETER] apparaît

3. Clic "ACHETER"
   → positionService.createPosition()
   → INSERT positions
   → Position ouverte visible

4. TP/SL atteint
   → accountingService.closePosition()
   → UPDATE positions
   → PnL réalisé ajouté à balance

5. Clic "BOT OFF"
   → botService arrête
   → (rien en DB)
   → Scan auto arrêté
```

---

## 🎯 PROCHAINES ÉTAPES

### A. Inventaire ✅ FAIT

### B. Simplification UI (à valider)
- Supprimer 3 popups → 1 bouton
- Masquer boutons techniques
- UI minimaliste 3 états

### C. Données Réelles (à résoudre)
- NASDAQ: Comment récupérer données gratuites ?
- GOLD: Comment récupérer données gratuites ?
- BTC: API Binance/Coinbase gratuite ✅

### D. Configuration Zero (à planifier)
- Tout en Super Admin
- User = login + bot + c'est tout

---

**CONCLUSION**: L'inventaire est fait. On attend validation avant simplification.
