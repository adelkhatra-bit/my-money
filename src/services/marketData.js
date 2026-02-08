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
    return 0;
  } catch (error) {
    console.error('Error fetching current price:', error);
    return 0;
  }
};
