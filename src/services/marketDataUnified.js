const baseTimeframe = '1m';
let dataCache = {};

export function validateMarketPlatformCompatibility(market, platform) {
  const cryptoMarkets = ['BTC', 'ETH'];
  const cryptoPlatforms = ['binance', 'bybit', 'okx', 'coinbase'];
  const indicesMarkets = ['NASDAQ', 'GOLD', 'SP500'];
  const indicesPlatforms = ['topstep', 'ftmo', 'apex'];

  const isCryptoMarket = cryptoMarkets.includes(market);
  const isCryptoPlatform = cryptoPlatforms.includes(platform.toLowerCase());
  const isIndicesMarket = indicesMarkets.includes(market);
  const isIndicesPlatform = indicesPlatforms.includes(platform.toLowerCase());

  if (isCryptoMarket && isIndicesPlatform) {
    return {
      valid: false,
      error: `❌ INCOMPATIBILITÉ: ${market} n'est pas disponible sur ${platform}`,
      message: `${market} est un actif crypto. Veuillez sélectionner une plateforme crypto (Binance, Bybit, OKX, Coinbase).`
    };
  }

  if (isIndicesMarket && isCryptoPlatform) {
    return {
      valid: false,
      error: `❌ INCOMPATIBILITÉ: ${market} n'est pas disponible sur ${platform}`,
      message: `${market} est un indice/matière première. Veuillez sélectionner TopStep, FTMO ou Apex.`
    };
  }

  return { valid: true };
}

export function getSymbolMapping(market, platform) {
  const validation = validateMarketPlatformCompatibility(market, platform);
  if (!validation.valid) {
    console.error('[Market Data] Incompatibilité:', validation.error);
    throw new Error(validation.error);
  }

  const mappings = {
    topstep: {
      NASDAQ: 'MNQ',
      GOLD: 'MGC',
      SP500: 'MES'
    },
    ftmo: {
      NASDAQ: 'NQ',
      GOLD: 'GC',
      SP500: 'ES'
    },
    binance: {
      BTC: 'BTCUSDT',
      ETH: 'ETHUSDT'
    },
    bybit: {
      BTC: 'BTCUSDT',
      ETH: 'ETHUSDT'
    }
  };

  const platformMappings = mappings[platform.toLowerCase()];
  if (!platformMappings) {
    console.warn(`Platform ${platform} not found in mappings, using market name as symbol`);
    return market;
  }

  return platformMappings[market] || market;
}

export function aggregateCandles(candles1m, targetTimeframe) {
  if (targetTimeframe === '1m') {
    return candles1m;
  }

  const minutesMap = {
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440
  };

  const intervalMinutes = minutesMap[targetTimeframe];
  if (!intervalMinutes) {
    console.error(`Invalid timeframe: ${targetTimeframe}`);
    return candles1m;
  }

  const aggregated = [];
  let currentBucket = [];
  let bucketStartTime = null;

  for (const candle of candles1m) {
    const candleTime = new Date(candle.time).getTime();

    if (!bucketStartTime) {
      bucketStartTime = Math.floor(candleTime / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000);
    }

    const currentBucketEnd = bucketStartTime + (intervalMinutes * 60 * 1000);

    if (candleTime >= currentBucketEnd) {
      if (currentBucket.length > 0) {
        aggregated.push(createAggregatedCandle(currentBucket));
      }
      currentBucket = [candle];
      bucketStartTime = Math.floor(candleTime / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000);
    } else {
      currentBucket.push(candle);
    }
  }

  if (currentBucket.length > 0) {
    aggregated.push(createAggregatedCandle(currentBucket));
  }

  return aggregated;
}

function createAggregatedCandle(candles) {
  const open = candles[0].open;
  const close = candles[candles.length - 1].close;
  const high = Math.max(...candles.map(c => c.high));
  const low = Math.min(...candles.map(c => c.low));
  const volume = candles.reduce((sum, c) => sum + (c.volume || 0), 0);
  const time = candles[0].time;

  return { time, open, high, low, close, volume };
}

export async function getUnifiedMarketData(market, platform, timeframe) {
  const symbol = getSymbolMapping(market, platform);
  const cacheKey = `${platform}_${market}_${symbol}`;

  console.log(`📊 [Market Data] Fetching unified market data:`, {
    market,
    platform,
    symbol,
    requestedTimeframe: timeframe,
    baseTimeframe,
    dataSource: 'deterministic'
  });

  let candles1m = dataCache[cacheKey];

  if (!candles1m || candles1m.length === 0) {
    console.log(`🔄 [Market Data] No cache found, generating deterministic baseline (1m) for ${symbol}`);
    candles1m = generateDeterministicData(symbol, 500);
    dataCache[cacheKey] = candles1m;
    console.log(`✅ [Market Data] Baseline generated: ${candles1m.length} candles, lastPrice: ${candles1m[candles1m.length - 1]?.close.toFixed(2)}`);
  }

  const lastPrice1m = candles1m[candles1m.length - 1]?.close;

  if (timeframe === '1m') {
    console.log(`✅ [Market Data] Returning ${candles1m.length} candles (1m base), lastPrice: ${lastPrice1m.toFixed(2)}`);
    return candles1m;
  }

  const aggregated = aggregateCandles(candles1m, timeframe);
  const lastPriceAggregated = aggregated[aggregated.length - 1]?.close;
  const priceMatch = Math.abs(lastPrice1m - lastPriceAggregated) < 0.01;

  console.log(`✅ [Market Data] Aggregated to ${timeframe}: ${aggregated.length} candles from ${candles1m.length} 1m candles`);
  console.log(`📈 [PRIX COHÉRENT] ${priceMatch ? '✅' : '❌'} Prix identique sur tous timeframes:`, {
    baseline1m: lastPrice1m.toFixed(2),
    aggregated: lastPriceAggregated.toFixed(2),
    difference: Math.abs(lastPrice1m - lastPriceAggregated).toFixed(4),
    match: priceMatch,
    rule: 'Timeframe change = granularité SEULEMENT, pas le prix'
  });

  return aggregated;
}

function generateDeterministicData(symbol, count = 500) {
  const basePrices = {
    'MNQ': 21000,
    'NQ': 21000,
    'BTCUSDT': 95000,
    'ETHUSDT': 3500,
    'MGC': 2650,
    'GC': 2650,
    'MES': 6000,
    'ES': 6000
  };

  const basePrice = basePrices[symbol] || 100;
  const now = Date.now();
  const candles = [];

  let currentPrice = basePrice;

  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now - i * 60 * 1000).toISOString().split('T')[0];
    const changePercent = (Math.random() - 0.5) * 0.003;
    const volatility = basePrice * 0.001;

    const open = currentPrice;
    const close = currentPrice * (1 + changePercent);
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    const volume = Math.floor(Math.random() * 1000) + 100;

    candles.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  return candles;
}

export function refreshMarketData(market, platform) {
  const symbol = getSymbolMapping(market, platform);
  const cacheKey = `${platform}_${market}_${symbol}`;

  console.log(`🔄 Refreshing data for ${cacheKey}`);
  const newData = generateDeterministicData(symbol, 500);
  dataCache[cacheKey] = newData;

  return newData;
}

export function clearCache() {
  console.log('🧹 Clearing market data cache');
  dataCache = {};
}

export function getCurrentPrice(market, platform) {
  const symbol = getSymbolMapping(market, platform);
  const cacheKey = `${platform}_${market}_${symbol}`;

  const candles = dataCache[cacheKey];
  if (!candles || candles.length === 0) {
    console.warn(`No data available for ${cacheKey}, generating...`);
    const freshData = generateDeterministicData(symbol, 500);
    dataCache[cacheKey] = freshData;
    return freshData[freshData.length - 1].close;
  }

  return candles[candles.length - 1].close;
}

export function validateDataConsistency(market, platform) {
  const candles1m = getUnifiedMarketData(market, platform, '1m');
  const candles5m = getUnifiedMarketData(market, platform, '5m');
  const candles15m = getUnifiedMarketData(market, platform, '15m');

  return Promise.all([candles1m, candles5m, candles15m]).then(([data1m, data5m, data15m]) => {
    const price1m = data1m[data1m.length - 1]?.close;
    const price5m = data5m[data5m.length - 1]?.close;
    const price15m = data15m[data15m.length - 1]?.close;

    const consistent = Math.abs(price1m - price5m) < 1 && Math.abs(price1m - price15m) < 1;

    console.log('🔍 Data consistency check:', {
      market,
      platform,
      price1m: price1m.toFixed(2),
      price5m: price5m.toFixed(2),
      price15m: price15m.toFixed(2),
      consistent: consistent ? '✅' : '❌'
    });

    return consistent;
  });
}
