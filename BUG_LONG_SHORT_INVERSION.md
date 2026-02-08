# 🐛 BUG CRITIQUE: Inversion LONG/SHORT dans les Signaux

## Problème Identifié

Le code dans `src/services/signalEngine.js` contient **deux bugs critiques** qui causent l'inversion LONG/SHORT:

### Bug 1: Take Profit mal calculé pour les positions SHORT

**Fichier**: `src/services/signalEngine.js:179-181`

```javascript
// Pour SHORT - INCORRECT ❌
if (supports.length > 0) {
  takeProfit1 = supports[0] * 1.01;  // ❌ MULTIPLIE par 1.01 (augmente le prix!)
  if (supports.length > 1) {
    takeProfit2 = supports[1] * 1.01;  // ❌ MULTIPLIE par 1.01
  }
}
```

**Pourquoi c'est faux**:
- Pour une position SHORT, on veut profiter quand le prix **DESCEND**
- `supports[0] * 1.01` **AUGMENTE** le prix de 1%
- Le Take Profit se retrouve **AU-DESSUS** du prix d'entrée
- C'est l'inverse de ce qu'on veut !

**Comportement actuel**:
```
Signal SHORT à 50,000
- Entry: ~50,000
- Take Profit 1: 51,000 (50,000 * 1.01) ❌ AU-DESSUS
- Stop Loss: 50,750 (50,000 * 1.015) ✅ AU-DESSUS (correct)
```

Le TP1 est au-dessus du SL, ce qui est impossible pour un SHORT!

### Bug 2: Logique RSI inversée

**Fichier**: `src/services/signalEngine.js:78 et 134`

```javascript
if (rsi < 70) {         // ❌ Presque TOUJOURS vrai
  direction = 'LONG';
  // ...
} else if (rsi > 30) {  // ❌ Presque TOUJOURS vrai aussi
  direction = 'SHORT';
  // ...
}
```

**Pourquoi c'est faux**:
- RSI < 70 est vrai dans 95% des cas (RSI normal = 30-70)
- RSI > 30 est aussi vrai dans 95% des cas
- Le code génère des LONG presque tout le temps
- Les SHORT ne sont jamais générés car la condition LONG est évaluée en premier

**Logique correcte**:
```javascript
if (rsi < 30) {         // ✅ RSI survendu → acheter (LONG)
  direction = 'LONG';
} else if (rsi > 70) {  // ✅ RSI suracheté → vendre (SHORT)
  direction = 'SHORT';
}
```

## Impact

1. **Positions SHORT impossibles à gagner**:
   - Le prix doit monter pour atteindre le TP
   - Mais un SHORT gagne quand le prix descend
   - Les positions SHORT vont systématiquement au SL

2. **Signaux majoritairement LONG**:
   - La condition `rsi < 70` capture presque tous les cas
   - Les SHORT sont rarement générés

3. **Confusion utilisateur**:
   - Le système annonce "SHORT"
   - Mais les tracés montrent un TP au-dessus (comportement LONG)

## Solution

### Correction 1: Take Profit SHORT

```javascript
// Pour SHORT - CORRECT ✅
if (supports.length > 0) {
  takeProfit1 = supports[0] * 0.99;  // ✅ DIMINUE le prix (descend vers support)
  if (supports.length > 1) {
    takeProfit2 = supports[1] * 0.99;  // ✅ DIMINUE le prix
  } else {
    takeProfit2 = currentPrice * 0.96;  // ✅ 4% en dessous
  }
} else {
  takeProfit1 = currentPrice * 0.975;  // ✅ 2.5% en dessous
  takeProfit2 = currentPrice * 0.96;   // ✅ 4% en dessous
}
```

### Correction 2: Logique RSI

```javascript
// Logique CORRECT ✅
if (rsi < 30) {  // ✅ Survendu → opportunité LONG
  direction = 'LONG';
  reasons.push(`RSI survendu (${rsi.toFixed(1)})`);
  confidence += 60;
  // ... reste du code LONG

} else if (rsi > 70) {  // ✅ Suracheté → opportunité SHORT
  direction = 'SHORT';
  reasons.push(`RSI suracheté (${rsi.toFixed(1)})`);
  confidence += 60;
  // ... reste du code SHORT
}
```

## Vérifications à Faire Après Correction

1. **Test LONG**:
   - Entry: 50,000
   - SL: 49,250 (1.5% en dessous) ✅
   - TP1: 51,250 (2.5% au-dessus) ✅
   - TP2: 52,000 (4% au-dessus) ✅

2. **Test SHORT**:
   - Entry: 50,000
   - SL: 50,750 (1.5% au-dessus) ✅
   - TP1: 48,750 (2.5% en dessous) ✅
   - TP2: 48,000 (4% en dessous) ✅

## Priorité

🔴 **CRITIQUE - À corriger immédiatement**

Ce bug rend les positions SHORT impossibles à gagner et génère une expérience utilisateur très négative.

## Fichiers à Modifier

- `src/services/signalEngine.js` (lignes 78, 134, 179-181)
