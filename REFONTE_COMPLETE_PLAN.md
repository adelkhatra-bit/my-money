# PLAN DE REFONTE COMPLÈTE - AI Trading Platform

**Date**: 2026-02-10
**Statut**: URGENT - REFONTE NÉCESSAIRE

---

## 🔴 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. **SYSTÈME D'HORAIRES INCORRECT**

**Problème actuel** (src/services/marketHours.js):
```javascript
// ❌ Affiche "17h00-18h00 ET" sans conversion locale
message: 'Pause quotidienne (17h00-18h00 ET) - Réouverture dans quelques minutes'
```

**Impact utilisateur**:
- Un utilisateur en France (CET/CEST) voit "17h00 ET"
- Il doit mentalement calculer: 17h ET = 23h FR
- **C'EST TROMPEUR ET INACCEPTABLE**

**Solution requise**:
1. Détecter automatiquement la timezone utilisateur (`Intl.DateTimeFormat().resolvedOptions().timeZone`)
2. Convertir ET → timezone locale
3. Afficher: `"Pause quotidienne (23h00-00h00 heure locale)"`

---

### 2. **CONFUSION CAPITAL / BALANCE / WALLET**

**État actuel**:

| Terme | Localisation | Valeur | Rôle |
|-------|--------------|--------|------|
| `capital` | trading_accounts.capital | Fixe | Capital de départ (référence risk management) |
| `Balance` | Interface (ligne 2211) | capital + PnL | Balance actuelle |
| `current_balance` | trading_accounts.current_balance | capital + PnL | Calculé automatiquement |
| `Wallet` | ??? | Non utilisé | Confusion totale |

**Problèmes**:
1. **"Capital Initial"** (ligne 1820) affiche `account.capital` (fixe)
2. **"Balance"** (ligne 2211) affiche `capital + PnL` (dynamique)
3. Mais dans `accountingService.js` ligne 32: `initialBalance = account.initial_balance || account.capital`
   → **INCOHÉRENCE**: `initial_balance` n'existe PAS dans la table!

**Solution requise**:
- **Capital de Départ** (`capital`) = montant de départ FIXE (ne bouge JAMAIS)
- **Balance Actuelle** (`current_balance`) = capital + PnL réalisé (calculé automatiquement)
- **Équité** (`equity`) = balance + PnL latent (si position ouverte)
- **Supprimer toute référence à "Wallet"** (inutile, source de confusion)

**Renommage proposé**:
```
Capital Initial → Capital de Départ (fixe)
Balance Actuelle → Balance (dynamique)
```

---

### 3. **PAGE TRADING SURCHARGÉE**

**TradingDashboard.jsx: 2264 LIGNES** ❌

**Problèmes**:
- Trop de composants imbriqués
- Trop d'états (97 lignes de useState)
- Trop de logique métier dans le composant UI
- Impossible à maintenir

**Solution requise**: REFACTORISER EN MODULES

```
src/pages/TradingDashboard/
├── TradingDashboard.jsx (orchestrateur - 300 lignes max)
├── hooks/
│   ├── useTradingState.js (gestion états)
│   ├── useMarketData.js (données marché)
│   ├── usePositionMonitoring.js (surveillance positions)
│   └── useSignalDetection.js (détection signaux)
├── components/
│   ├── TradingHeader.jsx
│   ├── MarketSelector.jsx
│   ├── AccountBanner.jsx
│   ├── StatsBar.jsx
│   └── TradingControls.jsx
└── TradingDashboard.module.css
```

---

### 4. **BOUTONS NON EXPLIQUÉS**

**Actuellement sur la page Trading**:
- `Scan maintenant` → ?
- `Auto` → ?
- `Bot ON/OFF` → ?
- `Fermer position` → ?
- Boutons sur signaux → ?

**Solution requise**: Documentation + Tooltips clairs

Exemple:
```jsx
<button title="Scanne le marché pour détecter une opportunité de trading">
  Scan maintenant
</button>
```

---

### 5. **CONFIGURATION TECHNIQUE À CHARGE DE L'UTILISATEUR**

**Problème**:
- L'utilisateur doit configurer TradingView
- L'utilisateur doit connaître les horaires de chaque marché
- L'utilisateur doit savoir quelle plateforme pour quel marché

**Solution requise**: Configuration Super Admin

```
Super Admin configure:
├── Marchés disponibles (BTC, ETH, NASDAQ, GOLD)
├── Horaires d'ouverture (stockés en DB)
├── Plateformes compatibles par marché
└── Configuration TradingView (webhooks, alertes)

Utilisateur voit:
├── Marchés actifs/inactifs
├── Horaires convertis automatiquement
└── Plateforme auto-sélectionnée selon marché
```

---

## ✅ PLAN D'ACTION COMPLET

### **PHASE 1: CORRECTION HORAIRES** (Priorité CRITIQUE)

**Fichier**: `src/services/marketHours.js`

**Actions**:
1. Détecter timezone utilisateur
2. Convertir ET → locale
3. Afficher horaires locaux
4. Ajouter badge explicite: `"⏰ Horaires affichés en heure locale (CET)"`

**Temps estimé**: 2h

---

### **PHASE 2: CLARIFICATION CAPITAL/BALANCE** (Priorité HAUTE)

**Fichiers**:
- `src/services/accountingService.js`
- `src/pages/AccountManagement/AccountManagement.jsx`
- `src/pages/TradingDashboard/TradingDashboard.jsx`

**Actions**:
1. Supprimer référence à `initial_balance` (n'existe pas)
2. Utiliser uniquement `capital` (fixe)
3. Renommer affichage:
   - "Capital de Départ" au lieu de "Capital Initial"
   - "Balance" au lieu de "Balance Actuelle"
4. Ajouter tooltip explicatif
5. Migration DB pour ajouter colonne `equity` (optionnel)

**Temps estimé**: 3h

---

### **PHASE 3: REFACTORISATION TRADINGDASHBOARD** (Priorité HAUTE)

**Objectif**: 2264 lignes → 300 lignes (composant principal)

**Actions**:
1. Créer `hooks/useTradingState.js` (déplacer tous les useState)
2. Créer `hooks/useMarketData.js` (logique chargement données)
3. Créer `hooks/usePositionMonitoring.js` (surveillance position)
4. Créer `hooks/useSignalDetection.js` (détection signaux)
5. Créer composants UI séparés:
   - `TradingHeader.jsx`
   - `MarketSelector.jsx`
   - `AccountBanner.jsx`
   - `StatsBar.jsx`
   - `TradingControls.jsx`

**Temps estimé**: 8h

---

### **PHASE 4: DOCUMENTATION BOUTONS** (Priorité MOYENNE)

**Actions**:
1. Créer `GUIDE_UTILISATEUR.md`
2. Ajouter tooltips sur chaque bouton
3. Ajouter aide contextuelle (icône "?")

**Temps estimé**: 2h

---

### **PHASE 5: SYSTÈME CONFIGURATION SUPER ADMIN** (Priorité MOYENNE)

**Actions**:
1. Créer table `market_configurations`
2. Créer interface Super Admin pour:
   - Activer/désactiver marchés
   - Configurer horaires
   - Définir plateformes compatibles
3. Brancher système sur interface utilisateur

**Temps estimé**: 6h

---

## 📊 SCHÉMA FONCTIONNEL CIBLE

```
┌─────────────────────────────────────────────────┐
│         UTILISATEUR SE CONNECTE                 │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│      CHARGEMENT PRÉFÉRENCES UTILISATEUR         │
│  - Marché préféré (BTC/ETH/NASDAQ/GOLD)         │
│  - Plateforme préférée                          │
│  - Compte actif                                 │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│        AFFICHAGE PAGE TRADING                   │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  [Header]                                │  │
│  │  - Sélecteur marché                      │  │
│  │  - Sélecteur plateforme (auto-filtré)    │  │
│  │  - Horaires (timezone locale)            │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  [Compte Actif]                          │  │
│  │  - Nom du compte                         │  │
│  │  - Capital de Départ (fixe)              │  │
│  │  - Balance (dynamique)                   │  │
│  │  - Risque par trade                      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  [Graphique + Signaux]                   │  │
│  │  - Affichage prix temps réel             │  │
│  │  - Position ouverte (si existe)          │  │
│  │  - Signaux détectés                      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  [Contrôles]                             │  │
│  │  - Scan Manuel (tooltip: "Scanne...")   │  │
│  │  - Bot Auto (tooltip: "Active le...")   │  │
│  │  - Fermer Position (si ouverte)          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  [Stats]                                 │  │
│  │  - Balance                               │  │
│  │  - PnL Total                             │  │
│  │  - Winrate                               │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  [Historique]                            │  │
│  │  - 20 dernières positions                │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🎯 OBJECTIFS MESURABLES

| Métrique | Avant | Cible |
|----------|-------|-------|
| Lignes TradingDashboard.jsx | 2264 | <300 |
| Horaires affichés | ET (non converti) | Timezone locale |
| Confusion Capital/Balance | Élevée | Nulle (renommage) |
| Boutons non documentés | Tous | 0 (tooltips + aide) |
| Configuration utilisateur | Technique | Zéro config |

---

## 🚨 BLOCKERS ACTUELS

1. **Horaires**: BLOQUANT - Utilisateur ne sait pas quand le marché est ouvert dans SA timezone
2. **Capital/Balance**: CONFUSANT - Chiffres contradictoires
3. **TradingDashboard**: MAINTENANCE IMPOSSIBLE - Trop gros fichier
4. **UX**: SURCHARGE COGNITIVE - Trop d'infos, pas assez de hiérarchie

---

## 📝 PROCHAINES ÉTAPES

1. **IMMÉDIATEMENT**: Fixer les horaires (PHASE 1)
2. **AUJOURD'HUI**: Clarifier Capital/Balance (PHASE 2)
3. **CETTE SEMAINE**: Refactoriser TradingDashboard (PHASE 3)
4. **SEMAINE PROCHAINE**: Documentation + Config Super Admin (PHASES 4-5)

---

## ✅ VALIDATION FINALE

Avant de reprendre les développements:

- [ ] Horaires affichés en timezone locale ✅
- [ ] Capital vs Balance clarifié ✅
- [ ] TradingDashboard refactorisé en modules ✅
- [ ] Tous les boutons documentés ✅
- [ ] Configuration technique gérée par Super Admin ✅

**OBJECTIF: PLATEFORME COMPRÉHENSIBLE SANS EXPLICATION ORALE**

---

## 🔗 DOCUMENTS CONNEXES

- `GUIDE_UTILISATEUR.md` (à créer)
- `ARCHITECTURE.md` (à créer)
- `API_DOCUMENTATION.md` (à créer)

---

**FIN DU PLAN**
