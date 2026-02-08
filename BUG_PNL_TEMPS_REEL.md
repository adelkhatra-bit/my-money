# 🐛 BUG: PNL non mis à jour en temps réel

## Problème Identifié

Les statistiques (Balance, PNL, Gains, Winrate) ne se mettent pas à jour en temps réel quand une position est ouverte.

**Fichier**: `src/pages/TradingDashboard/TradingDashboard.jsx:134-163`

## Comportement Actuel

```javascript
const loadStats = async (userId, account = null) => {
  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', userId);

  // ❌ Filtre UNIQUEMENT les positions FERMÉES
  const closedPositions = positions.filter(p =>
    p.status === 'TP1_HIT' || p.status === 'TP2_HIT' || p.status === 'SL_HIT'
  );

  // ❌ Calcule UNIQUEMENT le PNL réalisé (positions fermées)
  const totalPnl = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
}
```

**Problèmes**:

1. ❌ **Ignore les positions OPEN**:
   - Le filtre `closedPositions` exclut toutes les positions avec `status = 'OPEN'`
   - Le PNL des positions ouvertes n'est jamais calculé

2. ❌ **Pas de mise à jour automatique**:
   - `loadStats()` est appelé uniquement:
     - À l'acceptation d'un signal (ligne 394)
     - Au chargement initial (ligne 71)
   - Aucun mécanisme de mise à jour périodique

3. ❌ **Pas de prix courant**:
   - Le PNL nécessite le prix actuel du marché
   - Aucun appel à `getCurrentPrice()` dans `loadStats`

4. ❌ **PNL non calculé à la création**:
   - Quand une position est créée, `pnl` est NULL
   - Il faut calculer le PNL non réalisé en temps réel

## Conséquences

- L'utilisateur voit Balance = Capital initial (0 $)
- PNL reste à 0 $ même avec des positions ouvertes profitables
- Gains et Winrate restent à 0
- Pas de feedback en temps réel sur la performance

## Solution Requise

### 1. Calculer le PNL Non Réalisé

```javascript
const calculateUnrealizedPnl = (position, currentPrice) => {
  const entryPrice = position.entry_price;
  const positionSize = position.position_size;

  if (position.direction === 'LONG') {
    // LONG: profit si prix monte
    const priceDiff = currentPrice - entryPrice;
    return priceDiff * positionSize;
  } else {
    // SHORT: profit si prix descend
    const priceDiff = entryPrice - currentPrice;
    return priceDiff * positionSize;
  }
};
```

### 2. Mettre à jour loadStats pour inclure positions OPEN

```javascript
const loadStats = async (userId, account = null) => {
  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', userId);

  if (positions) {
    // Positions fermées avec PNL réalisé
    const closedPositions = positions.filter(p =>
      p.status === 'TP1_HIT' || p.status === 'TP2_HIT' || p.status === 'SL_HIT'
    );
    const realizedPnl = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);

    // ✅ Positions ouvertes avec PNL non réalisé
    const openPositions = positions.filter(p => p.status === 'OPEN');
    let unrealizedPnl = 0;

    for (const pos of openPositions) {
      const currentPrice = await getCurrentPrice(pos.market, pos.platform);
      unrealizedPnl += calculateUnrealizedPnl(pos, currentPrice);
    }

    // ✅ PNL total = réalisé + non réalisé
    const totalPnl = realizedPnl + unrealizedPnl;

    const wins = closedPositions.filter(p =>
      p.status === 'TP1_HIT' || p.status === 'TP2_HIT'
    ).length;
    const losses = closedPositions.filter(p => p.status === 'SL_HIT').length;

    setStats({
      balance: (accountToUse?.capital || 0) + totalPnl,
      pnl: totalPnl,
      wins,
      losses,
      winrate: closedPositions.length > 0 ? (wins / closedPositions.length) * 100 : 0,
      totalTrades: closedPositions.length
    });
  }
};
```

### 3. Ajouter une mise à jour périodique

```javascript
useEffect(() => {
  if (!activeAccount) return;

  // Charger les stats initialement
  loadUserData();

  // ✅ Mettre à jour toutes les 5 secondes
  const statsInterval = setInterval(() => {
    loadUserData();
  }, 5000);

  return () => clearInterval(statsInterval);
}, [activeAccount, market]);
```

### 4. Ajouter un système de détection TP/SL

```javascript
const checkPositions = async (userId) => {
  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'OPEN');

  for (const pos of positions) {
    const currentPrice = await getCurrentPrice(pos.market, pos.platform);

    if (pos.direction === 'LONG') {
      // ✅ Vérifier si TP ou SL atteint
      if (currentPrice >= pos.take_profit_1) {
        await closePosition(pos.id, 'TP1_HIT', currentPrice);
      } else if (currentPrice <= pos.stop_loss) {
        await closePosition(pos.id, 'SL_HIT', currentPrice);
      }
    } else { // SHORT
      if (currentPrice <= pos.take_profit_1) {
        await closePosition(pos.id, 'TP1_HIT', currentPrice);
      } else if (currentPrice >= pos.stop_loss) {
        await closePosition(pos.id, 'SL_HIT', currentPrice);
      }
    }
  }
};

const closePosition = async (positionId, status, exitPrice) => {
  const { data: position } = await supabase
    .from('positions')
    .select('*')
    .eq('id', positionId)
    .single();

  const pnl = calculateUnrealizedPnl(position, exitPrice);

  await supabase
    .from('positions')
    .update({
      status: status,
      exit_price: exitPrice,
      exit_time: new Date().toISOString(),
      pnl: pnl,
      pnl_percent: (pnl / (position.entry_price * position.position_size)) * 100
    })
    .eq('id', positionId);

  // 🔔 Jouer l'alerte audio appropriée
  if (status === 'TP1_HIT' || status === 'TP2_HIT') {
    audioAlerts.takeProfitAlert();
  } else {
    audioAlerts.stopLossAlert();
  }

  // ✅ Recharger les stats
  loadUserData();
};
```

### 5. Intégrer dans le useEffect

```javascript
useEffect(() => {
  if (!activeAccount) return;

  // Vérifier les positions toutes les 2 secondes
  const positionCheckInterval = setInterval(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        await checkPositions(profile.id);
      }
    }
  }, 2000);

  return () => clearInterval(positionCheckInterval);
}, [activeAccount, market, platform]);
```

## Avantages de la Solution

✅ **Feedback temps réel**: L'utilisateur voit son PNL évoluer en direct

✅ **Détection automatique TP/SL**: Les positions se ferment automatiquement

✅ **Alertes audio**: Son quand TP ou SL atteint

✅ **Stats précises**: Balance, PNL, Winrate mis à jour en continu

✅ **Expérience professionnelle**: Comparable aux plateformes de trading réelles

## Priorité

🟡 **IMPORTANT - À implémenter après correction du bug LONG/SHORT**

Sans cette fonctionnalité, l'utilisateur n'a aucun feedback sur ses positions ouvertes.

## Fichiers à Modifier

- `src/pages/TradingDashboard/TradingDashboard.jsx` (fonctions loadStats, checkPositions, closePosition)
- `src/services/marketData.js` (si getCurrentPrice pas optimisé pour appels fréquents)
