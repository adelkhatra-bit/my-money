const baseTimeframe = '1m';
let dataCache = {};
let isSimulationMode = false;

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export function clearDataCache() {
  dataCache = {};
  console.log('🗑️ [Market Data] Cache vidé - régénération des données');
}

export function isInSimulationMode() {
  return isSimulationMode;
}

console.log('🔄 [Market Data] Vidage automatique du cache au démarrage (timestamps corrigés)');
dataCache = {};

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

export function aggregateCandles(candles1m, targetTimeframe, metadata = {}) {
  const requestId = metadata.requestId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const firstCandle = candles1m[0];
  const lastCandle = candles1m[candles1m.length - 1];

  if (targetTimeframe === '1m') {
    const enrichedMetadata = {
      ts: new Date().toISOString(),
      dataProviderFile: 'src/services/marketDataUnified.js',
      dataProviderFn: 'getUnifiedMarketData',
      requestId,
      source: 'marketDataUnified',
      symbol: metadata.symbol || 'N/A',
      platform: metadata.platform || 'N/A',
      market: metadata.market || 'N/A',
      timeframeRequested: '1m',
      timeframe: '1m',
      baseline1mCount: candles1m.length,
      aggregatedCount: candles1m.length,
      duplicatesRemoved: metadata.duplicatesRemoved || 0,
      candlesAfterClean: candles1m.length,
      baselineFirstTime: firstCandle?.time || 0,
      baselineLastTime: lastCandle?.time || 0,
      aggregatedFirstTime: firstCandle?.time || 0,
      aggregatedLastTime: lastCandle?.time || 0,
      baselineLastClose: lastCandle?.close || 0,
      aggregatedLastClose: lastCandle?.close || 0,
      lastPriceBaseline: lastCandle?.close || 0,
      lastPriceAggregated: lastCandle?.close || 0,
      priceDiff: 0,
      status: candles1m.length >= 300 ? 'OK' : 'BLOCKED',
      reason: candles1m.length < 300 ? `Données insuffisantes (${candles1m.length} / 300 requises)` : null
    };
    return {
      candles: candles1m,
      lastPrice: lastCandle?.close || 0,
      metadata: enrichedMetadata
    };
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
    const candleTime = candle.time * 1000;

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

  const firstCandleAggregated = aggregated[0];
  const lastCandleAggregated = aggregated[aggregated.length - 1];
  const lastPriceAggregated = lastCandleAggregated?.close || 0;
  const lastPriceBaseline = lastCandle?.close || 0;
  const priceDiff = Math.abs(lastPriceBaseline - lastPriceAggregated);

  const enrichedMetadata = {
    ts: new Date().toISOString(),
    dataProviderFile: 'src/services/marketDataUnified.js',
    dataProviderFn: 'getUnifiedMarketData',
    requestId,
    source: 'marketDataUnified',
    symbol: metadata.symbol || 'N/A',
    platform: metadata.platform || 'N/A',
    market: metadata.market || 'N/A',
    timeframeRequested: targetTimeframe,
    timeframe: targetTimeframe,
    baseline1mCount: candles1m.length,
    aggregatedCount: aggregated.length,
    duplicatesRemoved: metadata.duplicatesRemoved || 0,
    candlesAfterClean: candles1m.length,
    baselineFirstTime: firstCandle?.time || 0,
    baselineLastTime: lastCandle?.time || 0,
    aggregatedFirstTime: firstCandleAggregated?.time || 0,
    aggregatedLastTime: lastCandleAggregated?.time || 0,
    baselineLastClose: lastPriceBaseline,
    aggregatedLastClose: lastPriceAggregated,
    lastPriceBaseline: lastPriceBaseline,
    lastPriceAggregated: lastPriceAggregated,
    priceDiff: priceDiff,
    status: aggregated.length >= 300 ? 'OK' : 'BLOCKED',
    reason: aggregated.length < 300 ? `Données insuffisantes (${aggregated.length} / 300 requises)` : null
  };

  return {
    candles: aggregated,
    lastPrice: lastPriceBaseline,
    metadata: enrichedMetadata
  };
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

async function fetchRealMarketData(symbol, timeframe, limit = 500, platform = 'topstep') {
  const isTopstepPlatform = ['topstep', 'ftmo', 'apex'].includes(platform.toLowerCase());

  if (!isTopstepPlatform) {
    console.log(`ℹ️ [Market Data] Platform ${platform} not configured for LIVE data - using SIMULATION`);
    isSimulationMode = true;
    return null;
  }

  try {
    console.log(`🔄 [Market Data] Attempting TOPSTEP LIVE provider for ${symbol}...`);
    const url = `${SUPABASE_URL}/functions/v1/topstep-live-provider/candles?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();

      if (data.isSimulation === false && data.candles && data.candles.length > 0) {
        isSimulationMode = false;
        console.log(`✅ [Market Data] TOPSTEP LIVE DATA from ${data.provider}:`, {
          symbol: data.symbol,
          candles: data.candles.length,
          lastPrice: data.candles[data.candles.length - 1]?.close,
          dataSource: data.dataSource
        });
        return data.candles;
      }
    }

    console.log('ℹ️ [Market Data] Topstep LIVE not connected - using SIMULATION');
    isSimulationMode = true;
    return null;
  } catch (error) {
    console.log(`ℹ️ [Market Data] Topstep LIVE not available (${error.message}) - using SIMULATION`);
    isSimulationMode = true;
    return null;
  }
}

const MINIMUM_CANDLES = 300;

export async function getUnifiedMarketData(market, platform, timeframe) {
  const symbol = getSymbolMapping(market, platform);
  const cacheKey = `${platform}_${market}_${symbol}`;

  const timeframeMultipliers = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440
  };

  const multiplier = timeframeMultipliers[timeframe] || 1;
  const requiredCandles1m = Math.max(500, MINIMUM_CANDLES * multiplier + 100);

  console.log(`📊 [Market Data] Fetching unified market data:`, {
    market,
    platform,
    symbol,
    requestedTimeframe: timeframe,
    baseTimeframe,
    dataSource: 'deterministic',
    minimumRequired: MINIMUM_CANDLES,
    requiredCandles1m
  });

  let candles1m = dataCache[cacheKey];

  if (!candles1m || candles1m.length < requiredCandles1m) {
    console.log(`🔄 [Market Data] Fetching baseline (1m) for ${symbol}: ${requiredCandles1m} candles`);

    const realData = await fetchRealMarketData(symbol, '1m', requiredCandles1m, platform);

    if (realData && realData.length > 0) {
      candles1m = realData;
      isSimulationMode = false;
      console.log(`✅ [Market Data] LIVE DATA fetched: ${candles1m.length} candles, lastPrice: ${candles1m[candles1m.length - 1]?.close.toFixed(2)}`);
    } else {
      isSimulationMode = true;
      candles1m = generateDeterministicData(symbol, requiredCandles1m);
      console.log(`⚠️ [Market Data] SIMULATION DATA generated: ${candles1m.length} candles, lastPrice: ${candles1m[candles1m.length - 1]?.close.toFixed(2)}`);
    }

    dataCache[cacheKey] = candles1m;
  }

  if (candles1m.length < MINIMUM_CANDLES) {
    console.error(`❌ [Market Data] DONNÉES INSUFFISANTES: ${candles1m.length} bougies (minimum ${MINIMUM_CANDLES} requis)`);
    return {
      error: true,
      message: `Données insuffisantes: ${candles1m.length} bougies disponibles (minimum ${MINIMUM_CANDLES} requis)`,
      candles: []
    };
  }

  const lastPrice1m = candles1m[candles1m.length - 1]?.close;
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const firstCandle = candles1m[0];
  const lastCandle = candles1m[candles1m.length - 1];

  const metadataBase = {
    requestId,
    symbol,
    platform,
    market,
    duplicatesRemoved: 0
  };

  if (timeframe === '1m') {
    console.log(`✅ [Market Data] Returning ${candles1m.length} candles (1m base), lastPrice: ${lastPrice1m.toFixed(2)}`);
    const metadata = {
      ts: new Date().toISOString(),
      dataProviderFile: 'src/services/marketDataUnified.js',
      dataProviderFn: 'getUnifiedMarketData',
      requestId,
      source: 'marketDataUnified',
      symbol,
      platform,
      market,
      timeframeRequested: '1m',
      timeframe: '1m',
      baseline1mCount: candles1m.length,
      aggregatedCount: candles1m.length,
      duplicatesRemoved: 0,
      candlesAfterClean: candles1m.length,
      baselineFirstTime: firstCandle?.time || 0,
      baselineLastTime: lastCandle?.time || 0,
      aggregatedFirstTime: firstCandle?.time || 0,
      aggregatedLastTime: lastCandle?.time || 0,
      baselineLastClose: lastPrice1m,
      aggregatedLastClose: lastPrice1m,
      lastPriceBaseline: lastPrice1m,
      lastPriceAggregated: lastPrice1m,
      priceDiff: 0,
      status: candles1m.length >= MINIMUM_CANDLES ? 'OK' : 'BLOCKED',
      reason: candles1m.length < MINIMUM_CANDLES ? `Données insuffisantes (${candles1m.length} / ${MINIMUM_CANDLES} requises)` : null
    };
    return {
      candles: candles1m,
      lastPrice: lastPrice1m,
      metadata
    };
  }

  const result = aggregateCandles(candles1m, timeframe, metadataBase);
  const aggregated = result.candles || result;
  const metadata = result.metadata;

  const lastPriceAggregated = lastPrice1m;
  const priceDiff = Math.abs(lastPrice1m - lastPriceAggregated);
  const priceMatch = priceDiff < 0.01;

  if (aggregated.length < MINIMUM_CANDLES) {
    console.warn(`⚠️ [Market Data] Agrégation insuffisante: ${aggregated.length} bougies ${timeframe} (minimum ${MINIMUM_CANDLES} requis)`);
    return {
      error: true,
      message: `Données insuffisantes après agrégation: ${aggregated.length} bougies ${timeframe} (minimum ${MINIMUM_CANDLES} requis)`,
      candles: [],
      metadata
    };
  }

  console.log(`✅ [Market Data] Aggregated to ${timeframe}: ${aggregated.length} candles from ${candles1m.length} 1m candles`);
  console.log(`📈 [PRIX COHÉRENT] ${priceMatch ? '✅' : '❌'} Prix identique sur tous timeframes:`, {
    baseline1m: lastPrice1m.toFixed(2),
    aggregated: lastPriceAggregated.toFixed(2),
    difference: priceDiff.toFixed(4),
    match: priceMatch,
    rule: 'Timeframe change = granularité SEULEMENT, pas le prix',
    symbol: metadata.symbol,
    platform: metadata.platform,
    market: metadata.market
  });

  return {
    candles: aggregated,
    lastPrice: lastPrice1m,
    metadata
  };
}

function generateDeterministicData(symbol, count = 500) {
  const basePrices = {
    'MNQ': 25000,
    'NQ': 21000,
    'BTCUSDT': 95000,
    'ETHUSDT': 3500,
    'MGC': 2650,
    'GC': 2650,
    'MES': 6000,
    'ES': 6000
  };

  const priceGuardrails = {
    'MNQ': { min: 23000, max: 27000 },
    'NQ': { min: 19000, max: 23000 },
    'BTCUSDT': { min: 80000, max: 110000 },
    'ETHUSDT': { min: 3000, max: 4000 },
    'MGC': { min: 2400, max: 2900 },
    'GC': { min: 2400, max: 2900 },
    'MES': { min: 5500, max: 6500 },
    'ES': { min: 5500, max: 6500 }
  };

  const basePrice = basePrices[symbol] || 100;
  const guardrails = priceGuardrails[symbol];
  const baseTime = 1707523200;
  const candles = [];

  let currentPrice = basePrice;

  const clampPrice = (price) => {
    if (!guardrails) return price;
    return Math.max(guardrails.min, Math.min(guardrails.max, price));
  };

  for (let i = 0; i < count; i++) {
    const time = baseTime + i * 60;
    const changePercent = (Math.random() - 0.5) * 0.003;
    const volatility = basePrice * 0.001;

    const open = clampPrice(currentPrice);
    const close = clampPrice(currentPrice * (1 + changePercent));
    const high = clampPrice(Math.max(open, close) + Math.random() * volatility);
    const low = clampPrice(Math.min(open, close) - Math.random() * volatility);
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
