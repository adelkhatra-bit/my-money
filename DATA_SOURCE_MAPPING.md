# TABLEAU COMPLET - CHAMP UI → SOURCE → FORMULE

**Date**: 2026-02-10
**Objectif**: Documenter TOUTES les sources de données affichées dans l'interface

---

## 📊 STATISTIQUES AFFICHÉES

### Page: TradingDashboard - Stats Bar (ligne 2208-2237)

| Champ UI | Source DB | Table | Formule | Fiable? |
|----------|-----------|-------|---------|---------|
| **Balance** | `stats.balance` | Calculé | `activeAccount.capital + realizedPnL` | ✅ OUI |
| **PnL Total** | `stats.pnl` | `positions` (agrégé) | `SUM(realized_pnl WHERE status='CLOSED')` | ✅ OUI |
| **Total Trades** | `stats.totalTrades` | `positions` (count) | `COUNT(* WHERE status='CLOSED')` | ✅ OUI |
| **Gains** | `stats.wins` | `positions` (count) | `COUNT(* WHERE status='CLOSED' AND realized_pnl > 0)` | ✅ OUI |
| **Pertes** | `stats.losses` | `positions` (count) | `COUNT(* WHERE status='CLOSED' AND realized_pnl < 0)` | ✅ OUI |
| **Winrate** | `stats.winrate` | Calculé | `(wins / totalTrades) * 100` | ✅ OUI |

### Page: TradingDashboard - Banner Compte (ligne 1814-1832)

| Champ UI | Source DB | Table | Formule | Fiable? |
|----------|-----------|-------|---------|---------|
| **Nom compte** | `activeAccount.name` | `trading_accounts.name` | Valeur directe | ✅ OUI |
| **Capital de Départ** | `activeAccount.capital` | `trading_accounts.capital` | Valeur directe (FIXE) | ✅ OUI |
| **Risque** | `activeAccount.risk_per_trade_percent` | `trading_accounts.risk_per_trade_percent` | Valeur directe | ✅ OUI |
| **Max Perte/Jour** | `activeAccount.max_daily_loss` | `trading_accounts.max_daily_loss` | Valeur directe | ✅ OUI |

### Page: AccountManagement - Card Compte (ligne 871-907)

| Champ UI | Source DB | Table | Formule | Fiable? |
|----------|-----------|-------|---------|---------|
| **Balance** | Calculé | `positions` + `trading_accounts` | `account.capital + stats.totalPnl` | ✅ OUI |
| **PnL Total** | `stats.totalPnl` | `positions` (agrégé) | `SUM(realized_pnl WHERE status='CLOSED')` | ✅ OUI |
| **Total Trades** | `stats.totalTrades` | `positions` (count) | `COUNT(* WHERE status='CLOSED')` | ✅ OUI |
| **Gains** | `stats.wins` | `positions` (count) | `COUNT(* WHERE status='CLOSED' AND realized_pnl > 0)` | ✅ OUI |
| **Pertes** | `stats.losses` | `positions` (count) | `COUNT(* WHERE status='CLOSED' AND realized_pnl < 0)` | ✅ OUI |
| **Winrate** | `stats.winrate` | Calculé | `(wins / totalTrades) * 100` | ✅ OUI |

---

## 🔧 CALCUL DES STATS - CODE SOURCE

### Fichier: `src/services/positionService.js`

```javascript
export const getAccountStats = async (userId, accountId) => {
  // Récupère TOUTES les positions FERMÉES
  const { data: closedPositions } = await supabase
    .from('positions')
    .select('realized_pnl')
    .eq('user_id', userId)
    .eq('account_id', accountId)
    .eq('status', 'CLOSED')
    .order('closed_at', { ascending: false });

  let totalPnl = 0;
  let wins = 0;
  let losses = 0;

  if (closedPositions && closedPositions.length > 0) {
    closedPositions.forEach(pos => {
      const pnl = parseFloat(pos.realized_pnl || 0);
      totalPnl += pnl;

      if (pnl > 0) {
        wins++;
      } else if (pnl < 0) {
        losses++;
      }
    });
  }

  const totalTrades = closedPositions ? closedPositions.length : 0;
  const winrate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  return {
    realized_pnl: totalPnl,
    wins,
    losses,
    total_trades: totalTrades,
    winrate
  };
};
```

**✅ VERDICT**: Source fiable, calcul correct

---

## 🔧 CALCUL DE LA BALANCE - CODE SOURCE

### Fichier: `src/pages/TradingDashboard/TradingDashboard.jsx` (ligne 564-579)

```javascript
const currentBalance = parseFloat(accountToUse.capital || 0) + realizedPnL;

const newStats = {
  balance: currentBalance,
  pnl: realizedPnL,
  totalTrades: accountStats.total_trades || 0,
  wins: accountStats.wins || 0,
  losses: accountStats.losses || 0,
  winrate: accountStats.winrate || 0
};

setStats(newStats);
```

**Formule Balance**:
```
Balance = Capital de Départ (fixe) + PnL Réalisé (cumulé)
```

**✅ VERDICT**: Formule correcte

---

## 🔧 MODE SIMULATION vs MODE RÉEL

### Fichier: `src/config/dataMode.js`

```javascript
export const DATA_MODE = 'real'; // 'simulation' ou 'real'
```

### EN MODE 'real':
- **TOUTES** les données viennent de Supabase
- Aucune donnée "mock"
- Chaque position est enregistrée dans `positions` table
- Chaque trade impacte le PnL réel

### EN MODE 'simulation':
- **Positions**: enregistrées dans DB (`positions` table) avec flag `is_simulation: true`
- **Stats**: calculées depuis les positions simulation
- **Aucune** donnée mock - tout est en DB mais marqué simulation

**✅ VERDICT**: Pas de "mock data" flottante, tout est en DB

---

## 🔄 IMPACT CHANGEMENT MARCHÉ / PLATEFORME / TIMEFRAME

### Quand l'utilisateur change de Marché (ex: BTC → NASDAQ):

1. **Chargement nouveau compte actif** (`userPreferencesService.getPreferences`)
2. **Rechargement stats** pour le nouveau compte
3. **Changement données graphique** (nouveau market data)
4. **Pas d'impact sur positions anciennes** (elles restent liées à l'ancien compte)

### Quand l'utilisateur change de Plateforme:

1. Même logique que changement marché
2. Le compte actif change
3. Les stats sont recalculées pour le nouveau compte

### Quand l'utilisateur change de Timeframe:

1. **Aucun impact sur les stats** (timeframe = affichage graphique uniquement)
2. **Aucun impact sur positions**
3. **Seul le graphique est rechargé** avec nouvelle granularité

**✅ VERDICT**: Logique propre, pas de mélange de données

---

## 📋 RÉSUMÉ EXÉCUTIF

### Sources de Vérité

| Concept | Source de Vérité | Type |
|---------|------------------|------|
| **Capital de Départ** | `trading_accounts.capital` | FIXE (ne change jamais) |
| **Balance Actuelle** | Calculé | `capital + SUM(realized_pnl)` |
| **PnL Réalisé** | `positions.realized_pnl` | Agrégé (SUM WHERE status='CLOSED') |
| **PnL Latent** | `positions.unrealized_pnl` | Calculé temps réel (position ouverte) |
| **Équité** | Calculé | `balance + unrealized_pnl` |
| **Trades** | `positions` (count) | WHERE status='CLOSED' |
| **Gains/Pertes** | `positions` (count) | WHERE realized_pnl > 0 / < 0 |
| **Winrate** | Calculé | `(wins / totalTrades) * 100` |

### Cohérence Vérifiée

✅ **Balance**: `capital (fixe) + realized_pnl (agrégé DB)` → COHÉRENT
✅ **Stats**: Toutes basées sur `positions` table → COHÉRENT
✅ **Simulation**: Tout en DB avec flag → COHÉRENT
✅ **Changement marché**: Compte séparé → COHÉRENT

### Problèmes Détectés

❌ **AUCUN** - Toutes les sources sont cohérentes et fiables

---

## 🎯 RECOMMANDATIONS

### 1. Ajouter champ `equity` (optionnel)

```javascript
const equity = currentBalance + (openPosition?.unrealized_pnl || 0);
```

### 2. Afficher détail Balance au survol (DÉJÀ FAIT)

```jsx
<span title={`Capital: ${capital} + PnL: ${pnl}`}>
  Balance: {balance}
</span>
```

### 3. Log de debug pour vérification

```javascript
console.log('[Stats Debug]', {
  capital: activeAccount.capital,
  realizedPnl: stats.pnl,
  balance: stats.balance,
  formula: `${activeAccount.capital} + ${stats.pnl} = ${stats.balance}`
});
```

---

## 📊 EXEMPLE CONCRET

### Scénario: Compte avec 3 trades

| Trade | Type | Entry | Exit | PnL | Status |
|-------|------|-------|------|-----|--------|
| 1 | LONG | 50000 | 51000 | +150 | CLOSED |
| 2 | SHORT | 51000 | 50500 | +75 | CLOSED |
| 3 | LONG | 50500 | 50200 | -45 | CLOSED |

**Calcul**:
```
Capital de Départ: 10000 USD
PnL Total: +150 + 75 - 45 = +180 USD
Balance: 10000 + 180 = 10180 USD
Gains: 2
Pertes: 1
Total Trades: 3
Winrate: (2/3) * 100 = 66.7%
```

**Affichage Interface**:
```
💰 Balance: $10,180.00
📊 PnL Total: +$180.00
📈 Total Trades: 3
✅ Gains: 2
❌ Pertes: 1
🎯 Winrate: 66.7%
```

**✅ COHÉRENT**

---

## 🔍 VÉRIFICATION MANUELLE

Pour vérifier la cohérence:

```sql
-- 1. Vérifier Capital de Départ
SELECT id, name, capital FROM trading_accounts WHERE id = 'xxx';

-- 2. Vérifier PnL Total
SELECT SUM(realized_pnl) as total_pnl
FROM positions
WHERE account_id = 'xxx' AND status = 'CLOSED';

-- 3. Calculer Balance
-- Balance = Capital + Total PnL

-- 4. Vérifier Trades
SELECT COUNT(*) as total_trades
FROM positions
WHERE account_id = 'xxx' AND status = 'CLOSED';

-- 5. Vérifier Gains
SELECT COUNT(*) as wins
FROM positions
WHERE account_id = 'xxx' AND status = 'CLOSED' AND realized_pnl > 0;

-- 6. Vérifier Pertes
SELECT COUNT(*) as losses
FROM positions
WHERE account_id = 'xxx' AND status = 'CLOSED' AND realized_pnl < 0;
```

---

**CONCLUSION**: ✅ TOUS LES CHIFFRES SONT COHÉRENTS ET TRAÇABLES
