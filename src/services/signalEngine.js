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
const lastSignalData = {};
const COOLDOWN_MS = 5 * 60 * 1000;

export const generateSignal = async (market, platform, candles) => {
  if (!isMarketOpen(market)) {
    return {
      signal: null,
      reason: 'Marché fermé',
      analysis: null
    };
  }

  const marketKey = `${market}_${platform}`;
  const now = Date.now();

  if (lastSignalTime[marketKey] && (now - lastSignalTime[marketKey]) < COOLDOWN_MS) {
    return {
      signal: null,
      reason: 'Cooldown actif - Prochain signal possible dans ' + Math.ceil((COOLDOWN_MS - (now - lastSignalTime[marketKey])) / 60000) + ' minutes',
      analysis: null
    };
  }

  if (candles.length < 100) {
    return {
      signal: null,
      reason: 'Données insuffisantes',
      analysis: null
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
  const { supports: rawSupports, resistances: rawResistances } = findSupportResistance(candles);
  const { bullish: bullishOB, bearish: bearishOB } = detectOrderBlocks(candles);

  const supports = rawSupports
    .filter(s => s < currentPrice)
    .sort((a, b) => b - a);

  const resistances = rawResistances
    .filter(r => r > currentPrice)
    .sort((a, b) => a - b);

  const analysis = {
    supports,
    resistances,
    orderBlocks: { bullish: bullishOB, bearish: bearishOB },
    rsi: rsi || 0,
    macd: macd || { trend: 'neutral', crossover: null },
    trend,
    currentPrice
  };

  if (!rsi || !macd) {
    return {
      signal: null,
      reason: 'Indicateurs non calculables',
      analysis
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
    Math.abs(currentPrice - supports[supports.length - 1]) / currentPrice < 0.03;

  const nearResistance = resistances.length > 0 &&
    Math.abs(currentPrice - resistances[resistances.length - 1]) / currentPrice < 0.03;

  if (rsi < 30) {
    direction = 'LONG';
    reasons.push(`RSI survendu (${rsi.toFixed(1)})`);
    confidence += 60;

    if (macd.crossover === 'bullish') {
      reasons.push('Croisement MACD haussier');
      confidence += 15;
    } else if (macd.trend === 'bullish') {
      reasons.push('MACD haussier');
      confidence += 10;
    } else {
      reasons.push('Configuration MACD neutre');
      confidence += 5;
    }

    if (nearSupport) {
      reasons.push('Prix proche du support');
      confidence += 10;
    } else {
      reasons.push('Zone de prix standard');
      confidence += 5;
    }

    if (bullishOB.length > 0) {
      reasons.push('Order Block haussier détecté');
      confidence += 10;
    }

    if (trend === 'uptrend') {
      reasons.push('Tendance haussière');
      confidence += 15;
    } else if (trend === 'ranging') {
      reasons.push('Marché en range');
      confidence += 8;
    } else {
      reasons.push('Potentiel de retournement');
      confidence += 5;
    }

    entryMin = currentPrice * 0.999;
    entryMax = currentPrice * 1.002;
    stopLoss = currentPrice * 0.985;

    if (resistances.length > 0 && resistances[0] > currentPrice * 1.015) {
      takeProfit1 = resistances[0] * 0.995;
      if (resistances.length > 1 && resistances[1] > currentPrice * 1.03) {
        takeProfit2 = resistances[1] * 0.995;
      } else {
        takeProfit2 = currentPrice * 1.04;
      }
    } else {
      takeProfit1 = currentPrice * 1.025;
      takeProfit2 = currentPrice * 1.04;
    }
  } else if (rsi > 70) {
    direction = 'SHORT';
    reasons.push(`RSI suracheté (${rsi.toFixed(1)})`);
    confidence += 60;

    if (macd.crossover === 'bearish') {
      reasons.push('Croisement MACD baissier');
      confidence += 15;
    } else if (macd.trend === 'bearish') {
      reasons.push('MACD baissier');
      confidence += 10;
    } else {
      reasons.push('Configuration MACD neutre');
      confidence += 5;
    }

    if (nearResistance) {
      reasons.push('Prix proche de la résistance');
      confidence += 10;
    } else {
      reasons.push('Zone de prix standard');
      confidence += 5;
    }

    if (bearishOB.length > 0) {
      reasons.push('Order Block baissier détecté');
      confidence += 10;
    }

    if (trend === 'downtrend') {
      reasons.push('Tendance baissière');
      confidence += 15;
    } else if (trend === 'ranging') {
      reasons.push('Marché en range');
      confidence += 8;
    } else {
      reasons.push('Potentiel de retournement');
      confidence += 5;
    }

    entryMin = currentPrice * 0.998;
    entryMax = currentPrice * 1.001;
    stopLoss = currentPrice * 1.015;

    if (supports.length > 0 && supports[0] < currentPrice * 0.985) {
      takeProfit1 = supports[0] * 1.005;
      if (supports.length > 1 && supports[1] < currentPrice * 0.97) {
        takeProfit2 = supports[1] * 1.005;
      } else {
        takeProfit2 = currentPrice * 0.96;
      }
    } else {
      takeProfit1 = currentPrice * 0.975;
      takeProfit2 = currentPrice * 0.96;
    }
  }

  if (!direction) {
    return {
      signal: null,
      reason: `Aucune opportunité détectée (RSI: ${rsi.toFixed(1)}, MACD: ${macd.trend}, Tendance: ${trend})`,
      analysis
    };
  }

  const entryMid = (entryMin + entryMax) / 2;

  if (direction === 'LONG') {
    if (takeProfit1 <= entryMid) {
      console.error('VALIDATION ERROR: LONG TP1 must be ABOVE entry', { entryMid, takeProfit1 });
      return {
        signal: null,
        reason: 'Erreur de cohérence: TP LONG doit être au-dessus de l\'entrée',
        analysis
      };
    }
    if (stopLoss >= entryMid) {
      console.error('VALIDATION ERROR: LONG SL must be BELOW entry', { entryMid, stopLoss });
      return {
        signal: null,
        reason: 'Erreur de cohérence: SL LONG doit être en-dessous de l\'entrée',
        analysis
      };
    }
    if (takeProfit2 && takeProfit2 <= entryMid) {
      console.error('VALIDATION ERROR: LONG TP2 must be ABOVE entry', { entryMid, takeProfit2 });
      takeProfit2 = null;
    }
  } else if (direction === 'SHORT') {
    if (takeProfit1 >= entryMid) {
      console.error('VALIDATION ERROR: SHORT TP1 must be BELOW entry', { entryMid, takeProfit1 });
      return {
        signal: null,
        reason: 'Erreur de cohérence: TP SHORT doit être en-dessous de l\'entrée',
        analysis
      };
    }
    if (stopLoss <= entryMid) {
      console.error('VALIDATION ERROR: SHORT SL must be ABOVE entry', { entryMid, stopLoss });
      return {
        signal: null,
        reason: 'Erreur de cohérence: SL SHORT doit être au-dessus de l\'entrée',
        analysis
      };
    }
    if (takeProfit2 && takeProfit2 >= entryMid) {
      console.error('VALIDATION ERROR: SHORT TP2 must be BELOW entry', { entryMid, takeProfit2 });
      takeProfit2 = null;
    }
  }

  const riskReward = Math.abs((takeProfit1 - entryMin) / (entryMin - stopLoss));

  lastSignalTime[marketKey] = now;

  const validityMinutes = 10;
  const validUntil = new Date(now + validityMinutes * 60 * 1000);
  const signalId = `${marketKey}_${now}_${direction}`;

  return {
    signal: {
      id: signalId,
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
    analysis,
    reason: 'Signal généré avec succès'
  };
};

export const shouldScan = (market) => {
  return isMarketOpen(market);
};
