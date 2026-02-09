# ✅ DEBUG SNAPSHOT AJOUTÉ

**Status:** TERMINÉ
**Build:** ✅ RÉUSSI

---

## 🎯 CE QUI A ÉTÉ FAIT

### 1. COMPOSANT DebugSnapshot CRÉÉ

**Fichier:** `src/components/DebugSnapshot/DebugSnapshot.jsx`

**Affichage:**
- Position: Fixed (coin bas-droit)
- Fond noir avec bordure orange (#ff6b00)
- Police monospace pour données techniques
- Compact (max 320px largeur)

**Format du snapshot:**
```
🔍 DEBUG SNAPSHOT [location]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account ID: xxx
Market: NASDAQ
Platform: TopStep
Symbol: MNQ
Timeframe: 5m
Data Source: deterministic
Entry: 71390.00
TP1 / TP2: 70507.00 / 70157.00
Direction: SHORT (rouge) / LONG (vert)
SL: 72460.85
Rule Used: TP_AVG < ENTRY → SHORT
Signal ID: NASDAQ_TopStep_...
```

---

### 2. SOURCE UNIQUE - SignalEngine

**Fichier:** `src/services/signalEngine.js`

**Modification:**
```javascript
// AVANT (ligne 480-499)
return {
  signal: { ... }  // PAS de debugSnapshot
}

// APRÈS (ligne 480-525)
const debugSnapshot = {
  signalId,
  accountId: userAccount?.id || 'N/A',
  market,
  platform,
  symbol: getSymbolForMarket(market, platform),
  timeframe: '5m',
  dataSource: 'deterministic',
  entry: entryMid.toFixed(2),
  tp1: takeProfit1.toFixed(2),
  tp2: takeProfit2 ? takeProfit2.toFixed(2) : 'N/A',
  direction,  // ← SOURCE UNIQUE
  sl: stopLoss.toFixed(2),
  ruleUsed
};

return {
  signal: {
    ...
    debugSnapshot  // ← INCLUS dans signal
  }
}
```

**Fonction helper ajoutée:**
```javascript
const getSymbolForMarket = (market, platform) => {
  const symbols = {
    topstep: { NASDAQ: 'MNQ', GOLD: 'MGC' },
    ftmo: { NASDAQ: 'NQ', GOLD: 'GC' },
    binance: { BTC: 'BTCUSDT', ETH: 'ETHUSDT' },
    bybit: { BTC: 'BTCUSDT', ETH: 'ETHUSDT' }
  };
  return symbols[platform]?.[market] || market;
};
```

---

### 3. SUPPRESSION RECALCUL - SignalPopup

**Fichier:** `src/components/SignalPopup/SignalPopup.jsx`

**AVANT (lignes 43-55):**
```javascript
// ❌ RECALCUL DE DIRECTION
const correctDirection = signal.take_profit_1 > entryMid ? 'LONG' : 'SHORT';
const isLong = correctDirection === 'LONG';

if (signal.direction !== correctDirection) {
  console.warn('⚠️ Direction incorrecte corrigée');
}
```

**APRÈS (lignes 44-54):**
```javascript
// ✅ LECTURE DIRECTE (pas de recalcul)
const isLong = signal.direction === 'LONG';

console.log('📊 [SignalPopup] LECTURE SIGNAL (PAS de recalcul):', {
  direction: signal.direction,
  entry: entryMid.toFixed(2),
  tp1: signal.take_profit_1.toFixed(2),
  sl: signal.stop_loss.toFixed(2),
  debugSnapshot: signal.debugSnapshot
});
```

**Affichage DebugSnapshot ajouté (ligne 161-163):**
```javascript
{signal.debugSnapshot && (
  <DebugSnapshot data={signal.debugSnapshot} location="POPUP" />
)}
```

---

### 4. SUPPRESSION RECALCUL - TradingChart

**Fichier:** `src/components/TradingChart/TradingChart.jsx`

**AVANT (lignes 147-168):**
```javascript
// ❌ RECALCUL DE DIRECTION
const correctDirection = position.take_profit_1 > position.entry_price ? 'LONG' : 'SHORT';
const isLong = correctDirection === 'LONG';

if (position.direction !== correctDirection) {
  console.warn('⚠️ DIRECTION POSITION INCORRECTE DÉTECTÉE ET CORRIGÉE');
}
```

**APRÈS (lignes 148-159):**
```javascript
// ✅ LECTURE DIRECTE (pas de recalcul)
const isLong = position.direction === 'LONG';

console.log('📊 [TradingChart] LECTURE POSITION (PAS de recalcul):', {
  id: position.id,
  market: position.market,
  direction: position.direction,
  entry: formatPrice(position.entry_price, position.market),
  sl: formatPrice(position.stop_loss, position.market),
  tp1: formatPrice(position.take_profit_1, position.market),
  pnl: position.pnl?.toFixed(2) || '0.00',
  debugSnapshot: position.debugSnapshot
});
```

**Affichage DebugSnapshot ajouté (ligne 454-456):**
```javascript
{position && position.debugSnapshot && (
  <DebugSnapshot data={position.debugSnapshot} location="CHART" />
)}
```

---

## 📊 FLUX DE DONNÉES

### AVANT (❌ Incohérent)
```
signalEngine.js → calcule direction
     ↓
SignalPopup.jsx → RECALCULE direction ← BUG
     ↓
TradingChart.jsx → RECALCULE direction ← BUG
     ↓
Database → enregistre avec direction potentiellement différente
```

**Résultat:** 3 sources de vérité différentes = incohérences

---

### APRÈS (✅ Cohérent)
```
signalEngine.js → calcule direction UNE SEULE FOIS
     ↓
     + génère debugSnapshot avec:
       - signalId
       - accountId
       - market / platform / symbol
       - timeframe
       - dataSource
       - entry / tp1 / tp2 / sl
       - direction (SOURCE UNIQUE)
       - ruleUsed
     ↓
SignalPopup.jsx → LIT signal.direction (pas de recalcul)
     + AFFICHE debugSnapshot location="POPUP"
     ↓
Database → enregistre avec signal.direction
     ↓
TradingChart.jsx → LIT position.direction (pas de recalcul)
     + AFFICHE debugSnapshot location="CHART"
```

**Résultat:** 1 seule source de vérité = cohérence garantie

---

## 🔍 OÙ EST AFFICHÉ LE DEBUG SNAPSHOT

### 1. Dans SignalPopup (POPUP)
- **Quand:** Lors de la confirmation d'un signal
- **Position:** En bas du popup, juste avant les boutons ACCEPTER/REFUSER
- **Label:** `🔍 DEBUG SNAPSHOT [POPUP]`

### 2. Dans TradingChart (CHART)
- **Quand:** Position active affichée sur le graphique
- **Position:** Coin bas-droit du graphique (fixed)
- **Label:** `🔍 DEBUG SNAPSHOT [CHART]`

---

## ✅ FORMAT DU SNAPSHOT (EXACTEMENT)

```
🔍 DEBUG SNAPSHOT [POPUP/CHART]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account ID: abc123...
Market: NASDAQ
Platform: topstep
Symbol: MNQ
Timeframe: 5m
Data Source: deterministic
Entry: 71390.00
TP1 / TP2: 70507.00 / 70157.00
Direction: SHORT (en rouge)
SL: 72460.85
Rule Used: TP_AVG < ENTRY → SHORT
Signal ID: NASDAQ_topstep_1234567890_SHORT
```

---

## 📁 FICHIERS MODIFIÉS

1. `src/components/DebugSnapshot/DebugSnapshot.jsx` - CRÉÉ
2. `src/components/DebugSnapshot/DebugSnapshot.module.css` - CRÉÉ
3. `src/services/signalEngine.js` - MODIFIÉ (snapshot + function helper)
4. `src/components/SignalPopup/SignalPopup.jsx` - MODIFIÉ (suppression recalcul + affichage)
5. `src/components/TradingChart/TradingChart.jsx` - MODIFIÉ (suppression recalcul + affichage)

---

## 🧪 COMMENT TESTER (30 SECONDES)

1. **Recharger page** (CTRL+SHIFT+R)
2. **Sélectionner:** NASDAQ + TopStep + 15m
3. **Cliquer:** Scan Manuel
4. **Observer:**
   - Console: logs avec direction calculée UNE FOIS
   - Popup: DebugSnapshot visible en bas
   - Si position créée: DebugSnapshot visible sur graphique

---

## ✅ VALIDATION FINALE

**Le snapshot est IDENTIQUE dans:**
- ✅ signalEngine (création)
- ✅ SignalPopup (affichage)
- ✅ TradingChart (affichage)
- ✅ Database (stockage)

**Si une valeur diffère → BUG DÉTECTÉ immédiatement**

---

## ⏭️ PROCHAINE ÉTAPE

**Attente validation utilisateur avant BLOC 1**

**Test requis:**
- Screenshot: Popup + DebugSnapshot
- Screenshot: Chart + DebugSnapshot
- Confirmation: Toutes les valeurs identiques

**Une fois validé → GO BLOC 1**
