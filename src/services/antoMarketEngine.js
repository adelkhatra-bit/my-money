const ANTO_MARKETS = {
  ANTO_NASDAQ: {
    name: 'ANTO_NASDAQ',
    basePrice: 21000,
    tickSize: 0.25,
    volatility: 0.0008,
  },
  ANTO_BTC: {
    name: 'ANTO_BTC',
    basePrice: 50000,
    tickSize: 0.01,
    volatility: 0.002,
  },
};

const TIMEFRAME_SECONDS = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function generateBaseline1m({ market, seed = 'demo', scenario = 'calm', count = 500 }) {
  const marketConfig = ANTO_MARKETS[market];
  if (!marketConfig) {
    throw new Error(`Unknown market: ${market}`);
  }

  const rng = seededRandom(
    Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  );

  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * 60;
  const candles = [];

  let currentPrice = marketConfig.basePrice;
  const { volatility, tickSize } = marketConfig;

  const scenarioMultipliers = {
    calm: { vol: 0.5, trend: 0 },
    news_spike: { vol: 3, trend: 0 },
    trend: { vol: 1, trend: 0.0003 },
    chop: { vol: 1.5, trend: 0 },
  };

  const multiplier = scenarioMultipliers[scenario] || scenarioMultipliers.calm;

  for (let i = 0; i < count; i++) {
    const time = startTime + i * 60;
    const open = currentPrice;

    const trendMove = multiplier.trend * marketConfig.basePrice;
    const randomMove =
      (rng() - 0.5) * 2 * volatility * multiplier.vol * marketConfig.basePrice;

    const close = open + trendMove + randomMove;

    const highOffset = rng() * volatility * multiplier.vol * marketConfig.basePrice;
    const lowOffset = rng() * volatility * multiplier.vol * marketConfig.basePrice;

    const high = Math.max(open, close) + highOffset;
    const low = Math.min(open, close) - lowOffset;

    const volume = Math.floor(1000 + rng() * 9000);

    candles.push({
      time,
      open: Math.round(open / tickSize) * tickSize,
      high: Math.round(high / tickSize) * tickSize,
      low: Math.round(low / tickSize) * tickSize,
      close: Math.round(close / tickSize) * tickSize,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

function aggregateCandles(baseline1m, targetTimeframe) {
  const tfSeconds = TIMEFRAME_SECONDS[targetTimeframe];
  if (!tfSeconds) {
    throw new Error(`Unknown timeframe: ${targetTimeframe}`);
  }

  if (targetTimeframe === '1m') {
    return baseline1m;
  }

  const aggregated = [];
  let currentBucket = null;

  baseline1m.forEach((candle) => {
    const bucketStart = Math.floor(candle.time / tfSeconds) * tfSeconds;

    if (!currentBucket || currentBucket.time !== bucketStart) {
      if (currentBucket) {
        aggregated.push(currentBucket);
      }
      currentBucket = {
        time: bucketStart,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      };
    } else {
      currentBucket.high = Math.max(currentBucket.high, candle.high);
      currentBucket.low = Math.min(currentBucket.low, candle.low);
      currentBucket.close = candle.close;
      currentBucket.volume += candle.volume;
    }
  });

  if (currentBucket) {
    aggregated.push(currentBucket);
  }

  return aggregated;
}

function calculateMetadata(baseline, aggregated, params) {
  const { market, timeframe, seed, scenario } = params;

  const baselineFirst = baseline[0];
  const baselineLast = baseline[baseline.length - 1];
  const aggregatedLast = aggregated[aggregated.length - 1];

  const baselineLastClose = baselineLast ? baselineLast.close : 0;
  const aggregatedLastClose = aggregatedLast ? aggregatedLast.close : 0;
  const priceDiff = Math.abs(baselineLastClose - aggregatedLastClose);

  const status = baseline.length >= 300 && priceDiff < 0.01 ? 'OK' : 'BLOCKED';
  const reason =
    status === 'BLOCKED'
      ? baseline.length < 300
        ? 'Baseline < 300 candles'
        : 'Price divergence detected'
      : null;

  return {
    ts: new Date().toISOString(),
    source: 'ANTO',
    dataProviderFile: 'src/services/antoMarketEngine.js',
    dataProviderFn: 'getMarketData',
    requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    platform: 'ANTO',
    market,
    symbol: market,
    timeframeRequested: timeframe,
    seed,
    scenario,
    baseline1mCount: baseline.length,
    aggregatedCount: aggregated.length,
    baselineFirstTime: baselineFirst ? baselineFirst.time : 0,
    baselineLastTime: baselineLast ? baselineLast.time : 0,
    aggregatedFirstTime: aggregated[0] ? aggregated[0].time : 0,
    aggregatedLastTime: aggregatedLast ? aggregatedLast.time : 0,
    baselineLastClose,
    aggregatedLastClose,
    priceDiff,
    status,
    reason,
  };
}

export function getMarketData({
  market = 'ANTO_NASDAQ',
  timeframe = '1m',
  seed = 'demo',
  scenario = 'calm',
  count = 500,
} = {}) {
  if (!ANTO_MARKETS[market]) {
    return {
      candles: [],
      metadata: {
        ts: new Date().toISOString(),
        source: 'ANTO',
        dataProviderFile: 'src/services/antoMarketEngine.js',
        dataProviderFn: 'getMarketData',
        requestId: `${Date.now()}-error`,
        status: 'BLOCKED',
        reason: `Unknown market: ${market}`,
      },
    };
  }

  const baseline1m = generateBaseline1m({ market, seed, scenario, count });
  const aggregated = aggregateCandles(baseline1m, timeframe);
  const metadata = calculateMetadata(baseline1m, aggregated, {
    market,
    timeframe,
    seed,
    scenario,
  });

  return {
    candles: aggregated,
    metadata,
  };
}

export const antoMarketEngine = {
  getMarketData,
  ANTO_MARKETS,
  TIMEFRAME_SECONDS,
};

export default antoMarketEngine;
