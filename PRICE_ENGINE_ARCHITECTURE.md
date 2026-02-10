# 🎯 PRICE ENGINE - ARCHITECTURE CENTRALE

**Date**: 2026-02-10
**Objectif**: Prix unique live par marché - Source de vérité absolue

---

## 🚨 PROBLÈME ACTUEL

### Symptômes
- Prix change selon le timeframe sélectionné ❌
- Chaque composant génère son propre prix ❌
- Graphique affiche "Simulation - Données fictives" ❌
- Incohérence entre composants ❌

### Cause Racine
**Pas de source unique de prix**

Aujourd'hui:
```
TradingChart génère prix → Timeframe 5m → Prix X
TradingStats génère prix → Timeframe 15m → Prix Y
SignalEngine génère prix → Timeframe 1h → Prix Z

❌ X ≠ Y ≠ Z
```

---

## ✅ ARCHITECTURE CIBLE

### Principe Fondamental

```
UN MARCHÉ = UN PRIX LIVE UNIQUE
```

Le timeframe N'AFFECTE PAS le prix.
Le timeframe est UNIQUEMENT pour l'affichage visuel du graphique.

---

## 🏗️ PRICE ENGINE (Source Unique)

### Schéma Global

```
┌─────────────────────────────────────────┐
│         PRICE ENGINE                    │
│    (1 instance par marché)              │
│                                         │
│  • MNQ: $18,524.50 (live)              │
│  • MGC: $2,048.20 (live)               │
│  • BTC: $45,234.00 (live)              │
│                                         │
│  Source: API externe (Binance/TV/etc)   │
│  Update: WebSocket temps réel          │
│  Broadcast: Tous les composants        │
└─────────────────────────────────────────┘
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
┌─────────┐      ┌─────────────┐
│ CHART   │      │ SIGNAL      │
│ (tous   │      │ ENGINE      │
│ TF)     │      │             │
└─────────┘      └─────────────┘
    ↓                   ↓
┌─────────┐      ┌─────────────┐
│ STATS   │      │ POSITION    │
│         │      │ MANAGER     │
└─────────┘      └─────────────┘
    ↓                   ↓
┌─────────┐      ┌─────────────┐
│ HEADER  │      │ RISK CALC   │
│ (prix)  │      │             │
└─────────┘      └─────────────┘
```

### Règles Absolues

1. **Seul le Price Engine récupère le prix externe**
2. **Tous les composants LISENT le prix du Price Engine**
3. **Aucun composant ne calcule son propre prix**
4. **Le prix est indépendant du timeframe**

---

## 📡 IMPLÉMENTATION TECHNIQUE

### Fichier: `src/services/priceEngine.js`

```javascript
class PriceEngine {
  constructor() {
    this.prices = {
      MNQ: { current: null, previous: null, timestamp: null },
      MGC: { current: null, previous: null, timestamp: null },
      BTC: { current: null, previous: null, timestamp: null }
    };

    this.subscribers = new Map(); // Composants qui écoutent
    this.connections = new Map(); // WebSocket par marché
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CONNEXION AUX SOURCES EXTERNES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async connectMarket(market) {
    switch(market) {
      case 'BTC':
        return this.connectBinance('BTCUSDT');

      case 'MNQ':
        return this.connectTradingView('NQ1!'); // Nasdaq Futures

      case 'MGC':
        return this.connectTradingView('GC1!'); // Gold Futures
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BINANCE (BTC - 100% GRATUIT)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  connectBinance(symbol) {
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updatePrice('BTC', parseFloat(data.c)); // c = current price
    };

    ws.onerror = () => this.handleConnectionError('BTC');

    this.connections.set('BTC', ws);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRADINGVIEW (MNQ / MGC)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Option A: Widget Embed (RECOMMANDÉ)
  // Le widget TradingView affiche le prix live
  // On récupère le prix via leur API widget

  connectTradingView(symbol) {
    // TradingView Widget API (gratuit)
    // Le widget se charge lui-même des données live
    // On écoute les events du widget

    // Voir section "SOLUTION GRAPHIQUE" ci-dessous
    // Le widget nous donne accès au prix actuel
  }

  // Option B: Polling Yahoo Finance (FALLBACK)
  // Données retardées 15-20 min
  // Uniquement si pas d'autre solution

  async pollYahooFinance(symbol) {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m`
        );
        const data = await response.json();
        const price = data.chart.result[0].meta.regularMarketPrice;

        const market = symbol === 'NQ=F' ? 'MNQ' : 'MGC';
        this.updatePrice(market, price);
      } catch (error) {
        console.error('Yahoo Finance error:', error);
      }
    }, 5000); // Poll toutes les 5s

    this.connections.set(symbol, interval);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MISE À JOUR PRIX (CŒUR DU SYSTÈME)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  updatePrice(market, newPrice) {
    const previous = this.prices[market].current;

    this.prices[market] = {
      current: newPrice,
      previous: previous,
      timestamp: Date.now(),
      direction: newPrice > previous ? 'UP' : 'DOWN'
    };

    // Broadcast à tous les subscribers
    this.notifySubscribers(market);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUBSCRIPTION (COMPOSANTS ÉCOUTENT)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  subscribe(market, callback) {
    if (!this.subscribers.has(market)) {
      this.subscribers.set(market, new Set());
    }
    this.subscribers.get(market).add(callback);

    // Retourne le prix actuel immédiatement
    return this.prices[market];
  }

  unsubscribe(market, callback) {
    if (this.subscribers.has(market)) {
      this.subscribers.get(market).delete(callback);
    }
  }

  notifySubscribers(market) {
    const callbacks = this.subscribers.get(market);
    if (callbacks) {
      callbacks.forEach(callback => {
        callback(this.prices[market]);
      });
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // API PUBLIQUE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  getCurrentPrice(market) {
    return this.prices[market]?.current || null;
  }

  getPriceData(market) {
    return this.prices[market] || null;
  }

  isConnected(market) {
    return this.connections.has(market);
  }

  disconnect(market) {
    const connection = this.connections.get(market);
    if (connection) {
      if (connection instanceof WebSocket) {
        connection.close();
      } else {
        clearInterval(connection);
      }
      this.connections.delete(market);
    }
  }

  disconnectAll() {
    ['BTC', 'MNQ', 'MGC'].forEach(market => this.disconnect(market));
  }
}

// Singleton - Instance unique
export const priceEngine = new PriceEngine();
```

---

## 🔌 UTILISATION DANS LES COMPOSANTS

### Exemple: TradingDashboard

```javascript
import { priceEngine } from '../services/priceEngine';

function TradingDashboard() {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceDirection, setPriceDirection] = useState(null);
  const market = 'MNQ';

  useEffect(() => {
    // Connecter au marché
    priceEngine.connectMarket(market);

    // S'abonner aux updates
    const handlePriceUpdate = (priceData) => {
      setCurrentPrice(priceData.current);
      setPriceDirection(priceData.direction);
    };

    priceEngine.subscribe(market, handlePriceUpdate);

    // Cleanup
    return () => {
      priceEngine.unsubscribe(market, handlePriceUpdate);
    };
  }, [market]);

  return (
    <div>
      <PriceLive
        price={currentPrice}
        direction={priceDirection}
      />
    </div>
  );
}
```

### Exemple: SignalEngine

```javascript
import { priceEngine } from './priceEngine';

function generateSignal(market) {
  // ✅ Récupérer le prix du Price Engine
  const currentPrice = priceEngine.getCurrentPrice(market);

  // ❌ PAS DE: const price = calculateRandomPrice();

  // Logique signal basée sur le vrai prix
  const signal = analyzeMarket(currentPrice, indicators);

  return signal;
}
```

### Exemple: Composant Prix Header

```javascript
function PriceLive({ market }) {
  const [price, setPrice] = useState(null);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const handleUpdate = (priceData) => {
      setPrice(priceData.current);
      setFlash(priceData.direction); // UP ou DOWN

      // Flash pendant 300ms
      setTimeout(() => setFlash(null), 300);
    };

    priceEngine.subscribe(market, handleUpdate);
    return () => priceEngine.unsubscribe(market, handleUpdate);
  }, [market]);

  return (
    <div className={styles.priceContainer}>
      <span className={styles.label}>{market}</span>
      <span
        className={`${styles.price} ${
          flash === 'UP' ? styles.flashGreen :
          flash === 'DOWN' ? styles.flashRed : ''
        }`}
      >
        ${price?.toFixed(2)}
      </span>
    </div>
  );
}
```

**CSS Flash Animation:**
```css
.price {
  font-size: 24px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.flashGreen {
  background-color: rgba(0, 255, 0, 0.2);
  animation: flash 0.3s ease;
}

.flashRed {
  background-color: rgba(255, 0, 0, 0.2);
  animation: flash 0.3s ease;
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 📊 SOLUTION GRAPHIQUE RECOMMANDÉE

### Option 1: TradingView Widget Embed ✅ RECOMMANDÉ

**Pourquoi**:
- Gratuit ✅
- Live data ✅
- Zéro config utilisateur ✅
- Professionnel ✅
- Prix accessible via API widget ✅

**Implémentation**:

```javascript
// Composant: TradingChart.jsx

function TradingChart({ market }) {
  const chartRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    // Symbol mapping
    const symbols = {
      'MNQ': 'CME_MINI:NQ1!',
      'MGC': 'COMEX:GC1!',
      'BTC': 'BINANCE:BTCUSDT'
    };

    // Create TradingView Widget
    widgetRef.current = new window.TradingView.widget({
      container_id: chartRef.current.id,
      symbol: symbols[market],
      interval: '5', // Default 5min
      timezone: 'America/Chicago',
      theme: 'dark',
      style: '1',
      locale: 'fr',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: false,
      studies: [
        'MASimple@tv-basicstudies',
        'RSI@tv-basicstudies'
      ],

      // ⭐ CALLBACK PRIX
      callback: function() {
        // Le widget est chargé
        const iframe = chartRef.current.querySelector('iframe');

        // Écouter les changements de prix
        iframe.contentWindow.postMessage({
          name: 'get-price'
        }, '*');
      }
    });

    // Écouter les messages du widget
    window.addEventListener('message', handleWidgetMessage);

    return () => {
      window.removeEventListener('message', handleWidgetMessage);
      if (widgetRef.current) {
        widgetRef.current.remove();
      }
    };
  }, [market]);

  const handleWidgetMessage = (event) => {
    if (event.data.name === 'price-update') {
      const price = event.data.value;

      // ⭐ MISE À JOUR PRICE ENGINE
      priceEngine.updatePrice(market, price);
    }
  };

  return (
    <div>
      <div id="tradingview-widget" ref={chartRef} />

      {/* Script TradingView */}
      <script
        type="text/javascript"
        src="https://s3.tradingview.com/tv.js"
      />
    </div>
  );
}
```

**Affichage Header avec Prix Live**:

```javascript
function TradingHeader({ market }) {
  const [price, setPrice] = useState(null);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const handleUpdate = (priceData) => {
      setPrice(priceData.current);
      setFlash(priceData.direction);
      setTimeout(() => setFlash(null), 300);
    };

    priceEngine.subscribe(market, handleUpdate);
    return () => priceEngine.unsubscribe(market, handleUpdate);
  }, [market]);

  return (
    <div className={styles.header}>
      <span className={styles.marketName}>{market}</span>
      <span className={`${styles.price} ${
        flash === 'UP' ? styles.up :
        flash === 'DOWN' ? styles.down : ''
      }`}>
        ${price?.toFixed(2) || '---'}
      </span>
      <span className={styles.label}>Données temps réel (TradingView)</span>
    </div>
  );
}
```

---

### Option 2: Binance API + Lightweight Charts (BTC uniquement)

**Pour BTC seulement**:

```javascript
import { createChart } from 'lightweight-charts';

function BTCChart() {
  useEffect(() => {
    const chart = createChart(chartContainer.current, {
      width: 800,
      height: 400
    });

    const candlestickSeries = chart.addCandlestickSeries();

    // WebSocket Binance
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_5m');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const candle = data.k;

      candlestickSeries.update({
        time: candle.t / 1000,
        open: parseFloat(candle.o),
        high: parseFloat(candle.h),
        low: parseFloat(candle.l),
        close: parseFloat(candle.c)
      });

      // Update Price Engine
      priceEngine.updatePrice('BTC', parseFloat(candle.c));
    };

    return () => ws.close();
  }, []);
}
```

---

## 🎯 RÉSUMÉ ARCHITECTURE

### Prix Live par Marché

| Marché | Source | Type | Latence | Gratuit |
|--------|--------|------|---------|---------|
| **BTC** | Binance WebSocket | Temps réel | < 100ms | ✅ |
| **MNQ** | TradingView Widget | Temps réel | < 1s | ✅ |
| **MGC** | TradingView Widget | Temps réel | < 1s | ✅ |

### Flow de Données

```
TradingView Widget (NQ1!)
        ↓
   (WebSocket)
        ↓
  Price Engine
        ↓
   updatePrice('MNQ', 18524.50)
        ↓
   Broadcast tous subscribers
        ↓
┌───────┼───────┬───────┬───────┐
↓       ↓       ↓       ↓       ↓
Header  Chart   Signal  Stats   Position
                Engine          Manager

TOUS lisent le même prix: 18524.50
```

### Indépendance Timeframe

```
User sélectionne: Timeframe 15m
        ↓
Graphique change: Affichage visuel 15m
        ↓
Prix live: RESTE 18524.50
        ↓
Signal Engine: Utilise 18524.50
        ↓
Entry/SL/TP: Basés sur 18524.50

❌ Le timeframe N'AFFECTE PAS le prix
✅ Le prix est TOUJOURS le même
```

---

## ✅ CHECKLIST IMPLÉMENTATION

### Phase 1: Price Engine Core (1 jour)

- [ ] Créer `src/services/priceEngine.js`
- [ ] Implémenter classe PriceEngine
- [ ] Méthode `connectMarket(market)`
- [ ] Méthode `subscribe(market, callback)`
- [ ] Méthode `updatePrice(market, price)`
- [ ] WebSocket Binance pour BTC
- [ ] Tests unitaires Price Engine

### Phase 2: Intégration TradingView Widget (1 jour)

- [ ] Intégrer script TradingView
- [ ] Créer widget pour MNQ
- [ ] Créer widget pour MGC
- [ ] Callback prix depuis widget
- [ ] Connecter widget → Price Engine

### Phase 3: Connexion Composants (1 jour)

- [ ] TradingDashboard utilise priceEngine
- [ ] TradingChart utilise priceEngine
- [ ] SignalEngine utilise priceEngine
- [ ] TradingStats utilise priceEngine
- [ ] PositionManager utilise priceEngine
- [ ] Header prix live utilise priceEngine

### Phase 4: Suppression Ancien Code (0.5 jour)

- [ ] Supprimer génération prix aléatoire
- [ ] Supprimer calculs prix locaux
- [ ] Supprimer simulation data
- [ ] Supprimer label "Simulation - Données fictives"

### Phase 5: Tests & Validation (0.5 jour)

- [ ] Test: Prix identique tous timeframes
- [ ] Test: Prix flash vert/rouge
- [ ] Test: WebSocket reconnexion
- [ ] Test: Multi-marchés simultanés
- [ ] Test: Changement marché

---

## 🚀 RÉSULTAT ATTENDU

### Avant
```
Graphique: "SIMULATION - Données fictives"
Prix 5m: 18,500
Prix 15m: 18,520
Prix 1h: 18,480
❌ Incohérent
```

### Après
```
Graphique: "Données temps réel (TradingView)"
Prix (tous TF): 18,524.50 🟢 (clignote vert)
Header: MNQ | $18,524.50
Signal: Entry basé sur 18,524.50
Stats: Balance calculée sur 18,524.50
✅ Cohérent partout
```

---

**PRÊT À IMPLÉMENTER** dès validation.
