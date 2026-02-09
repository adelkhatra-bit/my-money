# ✅ TESTS OBLIGATOIRES - CORRECTIONS UI CRITIQUES

## Date: 2026-02-09
## Version: BLOC 1 (PRÉ-VALIDATION)

---

## 🎯 OBJECTIF

Valider que les 2 corrections UI critiques fonctionnent correctement AVANT de passer au BLOC 1 complet.

---

## 📋 TEST A - DROPDOWN FILTRÉ (Marché → Plateforme)

### Objectif
Vérifier que le dropdown Plateforme est filtré dynamiquement selon le marché sélectionné.

### Étapes

1. **Ouvrir la console navigateur** (F12)
2. **Accéder à la page Trading**
3. **Sélectionner NASDAQ dans le dropdown Marché**
4. **Vérifier la console**

### ✅ Résultat Attendu - Log Console

```javascript
🔄 [Market Change] Changement de marché: {
  from: "BTC",
  to: "NASDAQ",
  currentPlatform: "binance"
}

⚠️ [Market Change] Plateforme incompatible détectée, auto-switch: {
  market: "NASDAQ",
  oldPlatform: "binance",
  newPlatform: "ftmo",
  reason: "Incompatibilité marché/plateforme"
}

✅ [Market Change] Marché + Plateforme sauvegardés: {
  market: "NASDAQ",
  platform: "ftmo"
}

📊 [Market Change] Plateformes compatibles pour NASDAQ: ["ftmo", "topstep", "apex"]
```

### ✅ Résultat Attendu - UI

- **Dropdown Plateforme** doit afficher **UNIQUEMENT** :
  - FTMO
  - TopStep
  - Apex

- **Plateforme sélectionnée automatiquement** : FTMO (ou TopStep si déjà sélectionné)

- **Binance, Bybit, OKX, Coinbase** ne doivent **PAS** apparaître dans la liste

---

## 📋 TEST B - BASELINE 1M AGRÉGÉE (Prix identique)

### Objectif
Vérifier que changer le timeframe NE CHANGE PAS le prix, seulement la granularité.

### Étapes

1. **Rester sur NASDAQ / FTMO**
2. **Sélectionner timeframe: 1m**
3. **Noter le prix affiché dans la console**
4. **Changer pour timeframe: 5m**
5. **Vérifier la console**
6. **Changer pour timeframe: 15m**
7. **Vérifier la console**
8. **Changer pour timeframe: 1h**
9. **Vérifier la console**

### ✅ Résultat Attendu - Log Console (pour CHAQUE changement)

```javascript
⏱️ [Timeframe Change] Changement de timeframe: {
  from: "1m",
  to: "5m",
  market: "NASDAQ",
  platform: "ftmo",
  note: "Le prix doit rester identique, seule la granularité change"
}

📊 [Market Data] Fetching unified market data: {
  market: "NASDAQ",
  platform: "ftmo",
  symbol: "NQ",
  requestedTimeframe: "5m",
  baseTimeframe: "1m",
  dataSource: "deterministic"
}

✅ [Market Data] Aggregated to 5m: 100 candles from 500 1m candles

📈 [PRIX COHÉRENT] ✅ Prix identique sur tous timeframes: {
  baseline1m: "21245.67",
  aggregated: "21245.67",
  difference: "0.0000",
  match: true,
  rule: "Timeframe change = granularité SEULEMENT, pas le prix"
}

✅ [Load Data] Données chargées avec succès: {
  candleCount: 100,
  lastPrice: "21245.67",
  timeframe: "5m",
  dataSource: "deterministic"
}
```

### ✅ Résultat Attendu - Vérification Manuelle

**Prix doit être IDENTIQUE sur tous les timeframes :**

| Timeframe | Prix Attendu | Vérification |
|-----------|--------------|--------------|
| 1m        | 21245.67     | ✅ identique |
| 5m        | 21245.67     | ✅ identique |
| 15m       | 21245.67     | ✅ identique |
| 1h        | 21245.67     | ✅ identique |
| 4h        | 21245.67     | ✅ identique |

**Différence autorisée :** < 0.01 (arrondi)

---

## 📋 TEST C - COMPATIBILITÉ COMPLÈTE (Tous les marchés)

### Objectif
Vérifier que TOUS les marchés ont un filtrage correct.

### Matrice de Test

| Marché  | Plateformes Attendues                | Auto-Switch Si Incompatible |
|---------|--------------------------------------|------------------------------|
| BTC     | Binance, Bybit, OKX, Coinbase        | ✅ Oui (vers Binance)        |
| ETH     | Binance, Bybit, OKX, Coinbase        | ✅ Oui (vers Binance)        |
| NASDAQ  | FTMO, TopStep, Apex                  | ✅ Oui (vers FTMO)           |
| GOLD    | FTMO, TopStep, Apex                  | ✅ Oui (vers FTMO)           |

### Étapes de Test

1. **Partir de BTC / Binance**
2. **Sélectionner NASDAQ** → Vérifier auto-switch vers FTMO
3. **Sélectionner GOLD** → Vérifier que FTMO reste (compatible)
4. **Sélectionner BTC** → Vérifier auto-switch vers Binance
5. **Sélectionner ETH** → Vérifier que Binance reste (compatible)

---

## 🚨 CRITÈRES D'ÉCHEC (BLOQUANTS)

**Test A échoue SI :**
- ❌ Binance apparaît dans le dropdown quand NASDAQ est sélectionné
- ❌ Pas d'auto-switch automatique vers une plateforme compatible
- ❌ Erreur rouge affichée au lieu d'un switch automatique

**Test B échoue SI :**
- ❌ Le prix change entre 1m et 5m (différence > 0.01)
- ❌ Le log `[PRIX COHÉRENT]` affiche `match: false`
- ❌ Baseline 1m régénérée à chaque changement de timeframe

**Test C échoue SI :**
- ❌ Une combinaison incompatible est possible (ex: BTC sur TopStep)
- ❌ L'auto-switch ne fonctionne pas pour un des marchés
- ❌ Crash ou erreur lors du changement de marché

---

## ✅ VALIDATION FINALE

**Pour donner GO BLOC 1, JE DOIS RECEVOIR :**

1. **Screenshot ou copie console** des logs Test A (filtrage)
2. **Screenshot ou copie console** des logs Test B (prix cohérent)
3. **Confirmation écrite** : "Tests A, B, C validés ✅"

---

## 📝 NOTES TECHNIQUES

### Fichiers Modifiés

1. **`src/services/platformFilter.js`** (NOUVEAU)
   - `getCompatiblePlatforms(market)`
   - `getDefaultPlatformForMarket(market)`
   - `isPlatformCompatible(market, platform)`

2. **`src/pages/TradingDashboard/TradingDashboard.jsx`**
   - `handleMarketChange()` : auto-switch + logs
   - `handleTimeframeChange()` : logs cohérence
   - `loadHistoricalData()` : utilise `getUnifiedMarketData`
   - Dropdown Plateforme : filtrage dynamique avec `getCompatiblePlatforms()`

3. **`src/services/marketDataUnified.js`**
   - `getUnifiedMarketData()` : logs détaillés de cohérence prix
   - Baseline 1m déterministe unique
   - Agrégation depuis baseline pour tous timeframes

### Comportement Clé

- **1 baseline 1m** = source unique de vérité
- **Agrégation déterministe** = même prix sur tous timeframes
- **Filtrage dynamique** = impossible de sélectionner combinaison invalide
- **Auto-switch intelligent** = pas d'état bloquant pour l'utilisateur

---

## 🎯 PROCHAINE ÉTAPE

**Après validation de ces tests :**
👉 **GO BLOC 1** : Architecture complète baseline + agrégation + mapping + labels
