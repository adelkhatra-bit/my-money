class PriceEngine {
  constructor() {
    if (PriceEngine.instance) {
      return PriceEngine.instance;
    }

    this.prices = new Map();
    this.subscribers = new Map();
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;

    PriceEngine.instance = this;
  }

  initializeMarket(market, config) {
    if (!this.prices.has(market)) {
      this.prices.set(market, {
        current: null,
        previous: null,
        timestamp: null,
        direction: null,
        status: 'disconnected',
        config: config
      });
      this.subscribers.set(market, new Set());
      this.reconnectAttempts.set(market, 0);
    }
  }

  connectMarket(market) {
    const priceData = this.prices.get(market);
    if (!priceData) {
      console.error(`[PriceEngine] Market ${market} not initialized`);
      return;
    }

    const { config } = priceData;

    if (config.source === 'binance') {
      this._connectBinance(market, config);
    } else if (config.source === 'tradingview') {
      this._connectTradingView(market, config);
    } else {
      console.error(`[PriceEngine] Unknown source: ${config.source}`);
    }
  }

  _connectBinance(market, config) {
    if (this.connections.has(market)) {
      console.log(`[PriceEngine] ${market} already connected`);
      return;
    }

    const symbol = config.symbol.toLowerCase();
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@trade`;

    console.log(`[PriceEngine] Connecting ${market} to Binance: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`[PriceEngine] ${market} connected to Binance`);
      this._updateStatus(market, 'connected');
      this.reconnectAttempts.set(market, 0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const price = parseFloat(data.p);
        this.updatePrice(market, price);
      } catch (error) {
        console.error(`[PriceEngine] ${market} parse error:`, error);
      }
    };

    ws.onerror = (error) => {
      console.error(`[PriceEngine] ${market} WebSocket error:`, error);
      this._updateStatus(market, 'error');
    };

    ws.onclose = () => {
      console.log(`[PriceEngine] ${market} disconnected`);
      this._updateStatus(market, 'disconnected');
      this.connections.delete(market);
      this._handleReconnect(market);
    };

    this.connections.set(market, ws);
  }

  _connectTradingView(market, config) {
    console.log(`[PriceEngine] ${market} TradingView connection prepared`);
    this._updateStatus(market, 'widget');
  }

  _handleReconnect(market) {
    const attempts = this.reconnectAttempts.get(market) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.error(`[PriceEngine] ${market} max reconnection attempts reached`);
      this._updateStatus(market, 'failed');
      return;
    }

    console.log(`[PriceEngine] ${market} reconnecting in ${this.reconnectDelay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
    this.reconnectAttempts.set(market, attempts + 1);

    setTimeout(() => {
      this.connectMarket(market);
    }, this.reconnectDelay);
  }

  updatePrice(market, newPrice) {
    const priceData = this.prices.get(market);
    if (!priceData) {
      console.error(`[PriceEngine] Cannot update price for unknown market: ${market}`);
      return;
    }

    const now = Date.now();
    const previous = priceData.current;
    let direction = null;

    if (previous !== null) {
      if (newPrice > previous) {
        direction = 'UP';
      } else if (newPrice < previous) {
        direction = 'DOWN';
      } else {
        direction = 'STABLE';
      }
    }

    this.prices.set(market, {
      ...priceData,
      current: newPrice,
      previous: previous,
      timestamp: now,
      direction: direction
    });

    this._broadcast(market, {
      market,
      current: newPrice,
      previous: previous,
      timestamp: now,
      direction: direction,
      status: priceData.status
    });
  }

  _updateStatus(market, status) {
    const priceData = this.prices.get(market);
    if (priceData) {
      priceData.status = status;
      this.prices.set(market, priceData);
    }
  }

  subscribe(market, callback) {
    if (!this.subscribers.has(market)) {
      this.subscribers.set(market, new Set());
    }

    this.subscribers.get(market).add(callback);

    const priceData = this.prices.get(market);
    if (priceData && priceData.current !== null) {
      callback({
        market,
        current: priceData.current,
        previous: priceData.previous,
        timestamp: priceData.timestamp,
        direction: priceData.direction,
        status: priceData.status
      });
    }

    return () => this.unsubscribe(market, callback);
  }

  unsubscribe(market, callback) {
    const marketSubscribers = this.subscribers.get(market);
    if (marketSubscribers) {
      marketSubscribers.delete(callback);
    }
  }

  _broadcast(market, data) {
    const marketSubscribers = this.subscribers.get(market);
    if (marketSubscribers) {
      marketSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[PriceEngine] Broadcast error for ${market}:`, error);
        }
      });
    }
  }

  getCurrentPrice(market) {
    const priceData = this.prices.get(market);
    return priceData ? priceData.current : null;
  }

  getPriceData(market) {
    const priceData = this.prices.get(market);
    if (!priceData) return null;

    return {
      market,
      current: priceData.current,
      previous: priceData.previous,
      timestamp: priceData.timestamp,
      direction: priceData.direction,
      status: priceData.status
    };
  }

  getStatus(market) {
    const priceData = this.prices.get(market);
    return priceData ? priceData.status : 'unknown';
  }

  disconnectMarket(market) {
    const ws = this.connections.get(market);
    if (ws) {
      ws.close();
      this.connections.delete(market);
    }

    this._updateStatus(market, 'disconnected');
    console.log(`[PriceEngine] ${market} manually disconnected`);
  }

  disconnectAll() {
    this.connections.forEach((ws, market) => {
      ws.close();
      this._updateStatus(market, 'disconnected');
    });
    this.connections.clear();
    console.log('[PriceEngine] All markets disconnected');
  }

  getConnectedMarkets() {
    const connected = [];
    this.prices.forEach((data, market) => {
      if (data.status === 'connected' || data.status === 'widget') {
        connected.push(market);
      }
    });
    return connected;
  }

  getMarketsList() {
    return Array.from(this.prices.keys());
  }

  isMarketReady(market) {
    const priceData = this.prices.get(market);
    if (!priceData) return false;
    return (priceData.status === 'connected' || priceData.status === 'widget') && priceData.current !== null;
  }
}

const priceEngine = new PriceEngine();

const MARKET_CONFIGS = {
  BTC: {
    code: 'BTC',
    name: 'Bitcoin',
    source: 'binance',
    symbol: 'BTCUSDT',
    tickSize: 0.01,
    is24h: true
  },
  MNQ: {
    code: 'MNQ',
    name: 'NASDAQ Micro E-mini',
    source: 'tradingview',
    symbol: 'NQ1!',
    tickSize: 0.25,
    is24h: false
  },
  MGC: {
    code: 'MGC',
    name: 'Gold Micro',
    source: 'tradingview',
    symbol: 'GC1!',
    tickSize: 0.10,
    is24h: false
  }
};

Object.keys(MARKET_CONFIGS).forEach(market => {
  priceEngine.initializeMarket(market, MARKET_CONFIGS[market]);
});

export { priceEngine, MARKET_CONFIGS };
