# 🎯 ARCHITECTURE FINALE - PLATEFORME DE TRADING

## 📋 VISION

Un seul graphique interne. Une source de vérité. Des données cohérentes.

---

## 🏗️ ARCHITECTURE CENTRALE

### 1️⃣ MarketDataProvider (Centre Névralgique)

**Fichier**: `src/services/MarketDataProvider.js`

**Rôle**: Point d'entrée unique pour toutes les données de marché.

**Interface Standard**:
```javascript
import { marketDataProvider } from './services/MarketDataProvider';

// Récupérer les bougies OHLC
const data = await marketDataProvider.getOHLC('NASDAQ', 'topstep', '5m');

// Prix actuel
const price = marketDataProvider.getCurrentPrice('NASDAQ', 'topstep');

// Spécifications du contrat
const specs = marketDataProvider.getContractSpecs('NASDAQ', 'topstep');

// Calculer le P&L
const pnl = marketDataProvider.calculatePnL('NASDAQ', 'topstep', 'LONG', 1, 25000, 25050);

// Formater un prix selon la plateforme
const formatted = marketDataProvider.formatPrice('NASDAQ', 'topstep', 25392.75);
```

---

## 🔌 PROVIDERS PAR PLATEFORME

### ✅ Topstep (Futures)
- **NASDAQ** → MNQ (tickSize: 0.25, tickValue: $0.50)
- **GOLD** → MGC (tickSize: 0.10, tickValue: $1.00)
- **SP500** → MES (tickSize: 0.25, tickValue: $1.25)

### ✅ FTMO (Futures)
- **NASDAQ** → NQ (tickSize: 0.25, tickValue: $5.00)
- **GOLD** → GC (tickSize: 0.10, tickValue: $10.00)
- **SP500** → ES (tickSize: 0.25, tickValue: $12.50)

### ✅ ANTØ Sandbox (Simulation)
- **ANTO_NASDAQ** → ANTO_NASDAQ (baseline: 18500, volatility: 25)

### ✅ Binance / Bybit (Crypto)
- **BTC** → BTCUSDT
- **ETH** → ETHUSDT

---

## 📊 GRAPHIQUE UNIQUE

**Fichier**: `src/components/TradingChart/TradingChart.jsx`

**Librairie**: `lightweight-charts` (TradingView)

**Principe**:
- Un seul graphique pour toutes les plateformes
- Les bougies proviennent de `MarketDataProvider`
- Les tracés (SL, TP, zones) sont calculés en interne
- Aucun iframe externe
- Aucune dépendance visuelle aux plateformes

**Props**:
```javascript
<TradingChart
  candles={candlesData}         // Bougies OHLC
  signal={currentSignal}         // Signal de trading
  position={activePosition}      // Position en cours
  supports={supportLevels}       // Niveaux de support
  resistances={resistanceLevels} // Niveaux de résistance
  platform="topstep"             // Plateforme sélectionnée
  market="NASDAQ"                // Marché sélectionné
  metadata={proofMetadata}       // Métadonnées de preuve
/>
```

---

## 🎛️ FLOW UTILISATEUR

### 1. Connexion
```
Utilisateur → Login → Dashboard
```

### 2. Sélection Plateforme + Marché
```
Dashboard → Choix Topstep + NASDAQ → Validation compatibilité
```

### 3. Scan du Marché
```
Clic "SCAN" → MarketDataProvider.getOHLC() → Graphique affiche bougies
```

### 4. Tracé Automatique
```
Analyse technique → Zones détectées → Tracés ORANGE sur graphique
```

### 5. Signal de Trading
```
Condition remplie → Popup signal → Utilisateur valide → Position ouverte
```

### 6. Aperçu Position
```
Clic "APERÇU" → Position affichée sur graphique → SL/TP visibles → Montants justes
```

---

## ⚙️ MAPPING AUTOMATIQUE

Le `MarketDataProvider` adapte automatiquement selon la plateforme:

| Marché | Topstep | FTMO | Valeur/Tick |
|--------|---------|------|-------------|
| NASDAQ | MNQ     | NQ   | $0.50 vs $5.00 |
| GOLD   | MGC     | GC   | $1.00 vs $10.00 |
| SP500  | MES     | ES   | $1.25 vs $12.50 |

**Exemple concret**:
```javascript
// Même mouvement, montants différents
const topstepPnL = marketDataProvider.calculatePnL('NASDAQ', 'topstep', 'LONG', 1, 25000, 25010);
// → 10 points × 4 ticks × $0.50 = $20.00

const ftmoPnL = marketDataProvider.calculatePnL('NASDAQ', 'ftmo', 'LONG', 1, 25000, 25010);
// → 10 points × 4 ticks × $5.00 = $200.00
```

---

## 🧪 ANTØ SANDBOX

**Objectif**: Environnement de test sans dépendance externe.

**Activation**:
```javascript
// Initialiser ANTØ
marketDataProvider.initializeAntoMarket('ANTO_NASDAQ');

// Récupérer les données
const data = await marketDataProvider.getOHLC('ANTO_NASDAQ', 'anto', '1m');

// Prix simulé
const price = marketDataProvider.getCurrentPrice('ANTO_NASDAQ', 'anto');
```

**Caractéristiques**:
- Prix de base: 18500
- Volatilité: 25 points
- Mise à jour: 1 seconde
- 300+ bougies garanties
- Données déterministes

---

## ✅ PREUVES RUNTIME

Chaque appel à `getOHLC()` retourne des métadonnées complètes:

```json
{
  "ts": "2026-02-10T15:34:22.123Z",
  "dataProviderFile": "src/services/marketDataUnified.js",
  "dataProviderFn": "getUnifiedMarketData",
  "platform": "ANTO",
  "market": "ANTO_NASDAQ",
  "symbol": "ANTO_NASDAQ",
  "timeframe": "1m",
  "baseline1mCount": 500,
  "aggregatedCount": 500,
  "baselineLastClose": 18523.50,
  "aggregatedLastClose": 18523.50,
  "priceDiff": 0,
  "status": "OK"
}
```

**Boutons de preuve** (TradingChart):
- 📋 Copier preuve (données source)
- 📋 Copier Gate Proof (validation gate 300)

---

## 🚫 CE QUI EST ÉLIMINÉ

- ❌ Iframe Bolt
- ❌ Embed externe Topstep/FTMO
- ❌ Dépendance visuelle aux plateformes
- ❌ Mock data
- ❌ Fallback aléatoire
- ❌ Preview bancal
- ❌ CSP issues

---

## ✅ CE QUI EST GARANTI

- ✅ Graphique stable et visible
- ✅ Bougies OHLC réelles
- ✅ Prix cohérents (baseline = aggregated)
- ✅ Calculs corrects par plateforme
- ✅ SL/TP tracés visuellement
- ✅ Montants justes (Topstep ≠ FTMO)
- ✅ UX fluide et claire

---

## 📁 STRUCTURE DES FICHIERS

```
src/
├── services/
│   ├── MarketDataProvider.js      ← POINT D'ENTRÉE UNIQUE
│   ├── marketDataUnified.js       ← Provider données réelles
│   ├── antoMarketEngine.js        ← Provider ANTØ Sandbox
│   ├── riskCalculator.js          ← Calcul SL/TP/Risk
│   ├── signalEngine.js            ← Détection signaux
│   └── positionManager.js         ← Gestion positions
│
├── components/
│   ├── TradingChart/              ← GRAPHIQUE UNIQUE
│   ├── SignalPopup/               ← Popup signal
│   ├── PositionMonitor/           ← Aperçu position
│   └── DebugSnapshot/             ← Preuves runtime
│
└── pages/
    └── TradingDashboard/          ← Interface principale
```

---

## 🎯 UTILISATION COMPLÈTE

### Exemple Dashboard

```javascript
import { marketDataProvider } from '../services/MarketDataProvider';
import TradingChart from '../components/TradingChart/TradingChart';

function TradingDashboard() {
  const [platform, setPlatform] = useState('topstep');
  const [market, setMarket] = useState('NASDAQ');
  const [timeframe, setTimeframe] = useState('5m');
  const [candles, setCandles] = useState([]);
  const [metadata, setMetadata] = useState(null);

  const handleScan = async () => {
    const result = await marketDataProvider.getOHLC(market, platform, timeframe);

    if (result.error) {
      console.error('Erreur données:', result.message);
      return;
    }

    setCandles(result.candles);
    setMetadata(result.metadata);
  };

  const currentPrice = marketDataProvider.getCurrentPrice(market, platform);
  const specs = marketDataProvider.getContractSpecs(market, platform);

  return (
    <div>
      <h1>Trading {specs.platformName} - {market}</h1>
      <p>Prix actuel: {marketDataProvider.formatPrice(market, platform, currentPrice)}</p>

      <button onClick={handleScan}>SCAN MARCHÉ</button>

      <TradingChart
        candles={candles}
        platform={platform}
        market={market}
        metadata={metadata}
        showProofMode={true}
      />
    </div>
  );
}
```

---

## 🔧 CONFIGURATION COMPLÈTE

Toutes les configurations sont centralisées dans `MarketDataProvider`:
- Symboles par plateforme
- Tick sizes
- Valeurs par tick
- Taille des contrats
- Décimales d'affichage
- Devises

**Ajouter une nouvelle plateforme**:
```javascript
// Dans MarketDataProvider.getPlatformConfigs()
apex: {
  name: 'Apex Trader',
  type: 'futures',
  markets: {
    NASDAQ: {
      symbol: 'MNQ',
      tickSize: 0.25,
      tickValue: 0.50,
      contractValue: 2,
      minMove: 0.25,
      decimalPlaces: 2,
      currency: 'USD'
    }
  }
}
```

---

## ✅ PRÊT POUR TEST

1. Le build passe: ✅
2. L'architecture est centralisée: ✅
3. Le graphique est unique et interne: ✅
4. Les providers sont en place: ✅
5. Le mapping est automatique: ✅
6. Les calculs sont corrects: ✅
7. ANTØ Sandbox est intégré: ✅

**Il ne reste plus qu'à**:
- Ouvrir le site
- Tester visuellement
- Copier les 4 JSON de preuve
- Valider l'ÉTAPE B

---

## 📞 SUPPORT

Pour toute question sur l'architecture:
1. Lire `MarketDataProvider.js` (interface centrale)
2. Lire `marketDataUnified.js` (données réelles)
3. Lire `antoMarketEngine.js` (ANTØ Sandbox)
4. Lire `TradingChart.jsx` (graphique)

**Tout est documenté. Tout est centralisé. Tout est prêt.**
