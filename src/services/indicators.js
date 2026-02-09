import { RSI, MACD, EMA, SMA, BollingerBands } from 'technicalindicators';

export const calculateRSI = (closes, period = 14) => {
  if (closes.length < period + 1) return null;

  const rsiInput = {
    values: closes,
    period: period
  };

  const rsiValues = RSI.calculate(rsiInput);
  return rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;
};

export const calculateMACD = (closes) => {
  if (closes.length < 26) return null;

  const macdInput = {
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  };

  const macdValues = MACD.calculate(macdInput);
  if (macdValues.length === 0) return null;

  const latest = macdValues[macdValues.length - 1];
  return {
    macd: latest.MACD,
    signal: latest.signal,
    histogram: latest.histogram,
    trend: latest.histogram > 0 ? 'bullish' : 'bearish',
    crossover: macdValues.length > 1 &&
               macdValues[macdValues.length - 2].histogram < 0 &&
               latest.histogram > 0 ? 'bullish' :
               macdValues.length > 1 &&
               macdValues[macdValues.length - 2].histogram > 0 &&
               latest.histogram < 0 ? 'bearish' : 'none'
  };
};

export const calculateEMA = (closes, period) => {
  if (closes.length < period) return null;

  const emaInput = {
    values: closes,
    period: period
  };

  const emaValues = EMA.calculate(emaInput);
  return emaValues.length > 0 ? emaValues[emaValues.length - 1] : null;
};

export const calculateSMA = (closes, period) => {
  if (closes.length < period) return null;

  const smaInput = {
    values: closes,
    period: period
  };

  const smaValues = SMA.calculate(smaInput);
  return smaValues.length > 0 ? smaValues[smaValues.length - 1] : null;
};

export const findSupportResistance = (candles, lookback = 50) => {
  if (candles.length < lookback) return { supports: [], resistances: [] };

  const recent = candles.slice(-lookback);
  const highs = recent.map(c => c.high);
  const lows = recent.map(c => c.low);

  const resistances = [];
  const supports = [];

  for (let i = 2; i < recent.length - 2; i++) {
    if (
      highs[i] > highs[i - 1] &&
      highs[i] > highs[i - 2] &&
      highs[i] > highs[i + 1] &&
      highs[i] > highs[i + 2]
    ) {
      resistances.push(highs[i]);
    }

    if (
      lows[i] < lows[i - 1] &&
      lows[i] < lows[i - 2] &&
      lows[i] < lows[i + 1] &&
      lows[i] < lows[i + 2]
    ) {
      supports.push(lows[i]);
    }
  }

  return {
    supports: supports.slice(-3),
    resistances: resistances.slice(-3)
  };
};

export const detectOrderBlocks = (candles, minSize = 1.5) => {
  if (candles.length < 10) return { bullish: [], bearish: [] };

  const bullishOB = [];
  const bearishOB = [];
  const recent = candles.slice(-50);

  for (let i = 1; i < recent.length - 1; i++) {
    const prev = recent[i - 1];
    const curr = recent[i];
    const next = recent[i + 1];

    const bodySize = Math.abs(curr.close - curr.open);
    const avgBody = recent.slice(Math.max(0, i - 10), i).reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / 10;

    if (bodySize > avgBody * minSize) {
      if (curr.close > curr.open && next.close > curr.high) {
        bullishOB.push({
          high: curr.high,
          low: curr.low,
          time: curr.time
        });
      }

      if (curr.close < curr.open && next.close < curr.low) {
        bearishOB.push({
          high: curr.high,
          low: curr.low,
          time: curr.time
        });
      }
    }
  }

  return {
    bullish: bullishOB.slice(-2),
    bearish: bearishOB.slice(-2)
  };
};

export const detectTrend = (candles) => {
  if (candles.length < 50) return 'range';

  const closes = candles.map(c => c.close);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  if (!ema20 || !ema50) return 'range';

  const currentPrice = closes[closes.length - 1];

  if (currentPrice > ema20 && ema20 > ema50) return 'uptrend';
  if (currentPrice < ema20 && ema20 < ema50) return 'downtrend';

  return 'range';
};

export const calculateIndicators = (candles, rsiPeriod = 14, macdFast = 12, macdSlow = 26, macdSignal = 9) => {
  const closes = candles.map(c => c.close);
  const rsi = calculateRSI(closes, rsiPeriod);
  const macdData = calculateMACD(closes);

  return {
    rsi: Array.isArray(rsi) ? rsi : [rsi],
    macd: macdData.macd || [],
    macdSignal: macdData.signal || []
  };
};
