import {
  calculateRSI,
  calculateMACD,
  findSupportResistance,
  detectOrderBlocks,
  detectTrend
} from './indicators';
import { getCurrentPrice } from './marketData';
import { isMarketOpen } from './marketHours';

const lastSignalTime = {};
const COOLDOWN_MS = 10 * 60 * 1000;

export const generateSignal = async (market, platform, candles) => {
  if (!isMarketOpen(market)) {
    return {
      signal: null,
      reason: 'Marché fermé'
    };
  }

  const marketKey = `${market}_${platform}`;
  const now = Date.now();

  if (lastSignalTime[marketKey] && now - lastSignalTime[marketKey] < COOLDOWN_MS) {
    const remainingTime = Math.ceil((COOLDOWN_MS - (now - lastSignalTime[marketKey])) / 1000);
    return {
      signal: null,
      reason: `Cooldown actif (${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s restantes)`
    };
  }

  if (candles.length < 100) {
    return {
      signal: null,
      reason: 'Données insuffisantes'
    };
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const currentCandle = candles[candles.length - 1];

  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const trend = detectTrend(candles);
  const { supports, resistances } = findSupportResistance(candles);
  const { bullish: bullishOB, bearish: bearishOB } = detectOrderBlocks(candles);

  if (!rsi || !macd) {
    return {
      signal: null,
      reason: 'Indicateurs non calculables'
    };
  }

  const reasons = [];
  let direction = null;
  let confidence = 0;
  let entryMin = currentPrice;
  let entryMax = currentPrice;
  let stopLoss = 0;
  let takeProfit1 = 0;
  let takeProfit2 = null;

  const nearSupport = supports.length > 0 &&
    Math.abs(currentPrice - supports[supports.length - 1]) / currentPrice < 0.02;

  const nearResistance = resistances.length > 0 &&
    Math.abs(currentPrice - resistances[resistances.length - 1]) / currentPrice < 0.02;

  if (rsi < 35 && macd.crossover === 'bullish' && trend !== 'downtrend' && nearSupport) {
    direction = 'LONG';
    reasons.push('RSI en survente (< 35)');
    reasons.push('Croisement MACD haussier');
    reasons.push('Prix proche du support');
    confidence += 30;

    if (bullishOB.length > 0) {
      reasons.push('Order Block haussier détecté');
      confidence += 20;
    }

    if (trend === 'uptrend') {
      reasons.push('Tendance haussière confirmée');
      confidence += 25;
    } else {
      confidence += 10;
    }

    const supportLevel = supports[supports.length - 1];
    entryMin = currentPrice * 0.999;
    entryMax = currentPrice * 1.002;
    stopLoss = currentPrice * 0.985;

    if (resistances.length > 0) {
      takeProfit1 = resistances[0] * 0.99;
      if (resistances.length > 1) {
        takeProfit2 = resistances[1] * 0.99;
      }
    } else {
      takeProfit1 = currentPrice * 1.025;
      takeProfit2 = currentPrice * 1.04;
    }

    confidence += 15;
  } else if (rsi > 65 && macd.crossover === 'bearish' && trend !== 'uptrend' && nearResistance) {
    direction = 'SHORT';
    reasons.push('RSI en surachat (> 65)');
    reasons.push('Croisement MACD baissier');
    reasons.push('Prix proche de la résistance');
    confidence += 30;

    if (bearishOB.length > 0) {
      reasons.push('Order Block baissier détecté');
      confidence += 20;
    }

    if (trend === 'downtrend') {
      reasons.push('Tendance baissière confirmée');
      confidence += 25;
    } else {
      confidence += 10;
    }

    const resistanceLevel = resistances[resistances.length - 1];
    entryMin = currentPrice * 0.998;
    entryMax = currentPrice * 1.001;
    stopLoss = currentPrice * 1.015;

    if (supports.length > 0) {
      takeProfit1 = supports[0] * 1.01;
      if (supports.length > 1) {
        takeProfit2 = supports[1] * 1.01;
      }
    } else {
      takeProfit1 = currentPrice * 0.975;
      takeProfit2 = currentPrice * 0.96;
    }

    confidence += 15;
  }

  if (!direction) {
    return {
      signal: null,
      reason: `Aucune opportunité détectée (RSI: ${rsi.toFixed(1)}, MACD: ${macd.trend}, Tendance: ${trend})`
    };
  }

  const riskReward = Math.abs((takeProfit1 - entryMin) / (entryMin - stopLoss));

  if (confidence < 70) {
    return {
      signal: null,
      reason: `Confiance insuffisante (${confidence}% < 70%)`
    };
  }

  if (riskReward < 1.5) {
    return {
      signal: null,
      reason: `Risk/Reward insuffisant (${riskReward.toFixed(2)} < 1.5)`
    };
  }

  lastSignalTime[marketKey] = now;

  const validityMinutes = 10;
  const validUntil = new Date(now + validityMinutes * 60 * 1000);

  return {
    signal: {
      market,
      platform,
      timeframe: '5m',
      direction,
      entry_min: entryMin,
      entry_max: entryMax,
      stop_loss: stopLoss,
      take_profit_1: takeProfit1,
      take_profit_2: takeProfit2,
      confidence: Math.min(confidence, 95),
      risk_reward: riskReward,
      reasons,
      valid_until: validUntil.toISOString(),
      status: 'ACTIVE'
    },
    reason: 'Signal généré avec succès'
  };
};

export const shouldScan = (market) => {
  return isMarketOpen(market);
};
