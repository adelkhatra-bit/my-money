let wsConnection = null;
let currentSubscribers = [];

export const connectToMarketData = (market, platform, callback) => {
  if (market === 'BTC' || market === 'ETH') {
    const symbol = market === 'BTC' ? 'btcusdt' : 'ethusdt';

    let wsUrl = '';
    if (platform === 'binance') {
      wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_1m`;
    } else if (platform === 'bybit') {
      wsUrl = `wss://stream.bybit.com/v5/public/linear`;
    } else {
      wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_1m`;
    }

    if (wsConnection) {
      wsConnection.close();
    }

    wsConnection = new WebSocket(wsUrl);

    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (platform === 'binance' && data.k) {
          const kline = data.k;
          const candle = {
            time: Math.floor(kline.t / 1000),
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v)
          };
          callback(candle);
        }
      } catch (error) {
        console.error('Error parsing market data:', error);
      }
    };

    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsConnection.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (wsConnection) {
        wsConnection.close();
        wsConnection = null;
      }
    };
  }

  return () => {};
};

const generateDemoData = (market, timeframe, limit) => {
  const basePrice = market === 'NASDAQ' ? 16500 : 2050;
  const volatility = market === 'NASDAQ' ? 50 : 10;

  const now = Math.floor(Date.now() / 1000);
  const timeframeSeconds = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '1h' ? 3600 : 14400;

  const candles = [];
  let currentPrice = basePrice;

  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = now - (i * timeframeSeconds);

    const change = (Math.random() - 0.5) * volatility;
    currentPrice += change;

    const open = currentPrice;
    const close = currentPrice + (Math.random() - 0.5) * volatility * 0.5;
    const high = Math.max(open, close) + Math.random() * volatility * 0.3;
    const low = Math.min(open, close) - Math.random() * volatility * 0.3;
    const volume = Math.random() * 10000000;

    candles.push({
      time: timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(2))
    });

    currentPrice = close;
  }

  return candles;
};

export const fetchHistoricalData = async (market, platform, timeframe = '5m', limit = 500) => {
  try {
    if (market === 'BTC' || market === 'ETH') {
      const symbol = market === 'BTC' ? 'BTCUSDT' : 'ETHUSDT';
      const interval = timeframe;

      let url = '';
      if (platform === 'binance') {
        url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      } else {
        url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      return data.map(candle => ({
        time: Math.floor(candle[0] / 1000),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
    }

    if (market === 'NASDAQ' || market === 'GOLD') {
      console.log(`Generating demo data for ${market} (Paper Trading Mode)`);
      return generateDemoData(market, timeframe, limit);
    }

    return [];
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
};

export const getCurrentPrice = async (market, platform) => {
  try {
    if (market === 'BTC' || market === 'ETH') {
      const symbol = market === 'BTC' ? 'BTCUSDT' : 'ETHUSDT';

      let url = '';
      if (platform === 'binance') {
        url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
      } else {
        url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      return parseFloat(data.price);
    }

    if (market === 'NASDAQ') {
      return 16500 + (Math.random() - 0.5) * 100;
    }

    if (market === 'GOLD') {
      return 2050 + (Math.random() - 0.5) * 20;
    }

    return 0;
  } catch (error) {
    console.error('Error fetching current price:', error);
    return 0;
  }
};
