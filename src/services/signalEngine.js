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

export const generateSignal = async (market, platform, candles, userAccount = null) => {
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

  if (rsi >= 30 && rsi <= 70) {
    return {
      signal: null,
      reason: `RSI neutre (${rsi.toFixed(1)}) - Pas d'opportunité claire`,
      analysis
    };
  }

  const reasons = [];
  let confidence = 0;
  const entryMin = currentPrice * 0.999;
  const entryMax = currentPrice * 1.002;
  const entryMid = (entryMin + entryMax) / 2;

  let takeProfit1 = 0;
  let takeProfit2 = null;
  let stopLoss = 0;
  let direction = null;

  const nearSupport = supports.length > 0 &&
    Math.abs(currentPrice - supports[0]) / currentPrice < 0.03;

  const nearResistance = resistances.length > 0 &&
    Math.abs(currentPrice - resistances[0]) / currentPrice < 0.03;

  if (rsi < 30) {
    reasons.push(`RSI survendu (${rsi.toFixed(1)})`);
    confidence += 60;

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

  } else {
    reasons.push(`RSI suracheté (${rsi.toFixed(1)})`);
    confidence += 60;

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

    if (supports.length > 0 && supports[0] < currentPrice) {
      takeProfit1 = supports[0];
      if (supports.length > 1 && supports[1] < supports[0]) {
        takeProfit2 = supports[1];
      } else {
        takeProfit2 = currentPrice * 0.96;
      }
    } else {
      takeProfit1 = currentPrice * 0.98;
      takeProfit2 = currentPrice * 0.96;
    }
  }

  if (takeProfit1 < entryMid) {
    direction = 'SHORT';
    console.log('📉 DIRECTION DÉTECTÉE: SHORT (TP1 < Entry)', {
      entry: entryMid.toFixed(5),
      tp1: takeProfit1.toFixed(5),
      difference: (entryMid - takeProfit1).toFixed(5)
    });
  } else if (takeProfit1 > entryMid) {
    direction = 'LONG';
    console.log('📈 DIRECTION DÉTECTÉE: LONG (TP1 > Entry)', {
      entry: entryMid.toFixed(5),
      tp1: takeProfit1.toFixed(5),
      difference: (takeProfit1 - entryMid).toFixed(5)
    });
  } else {
    console.error('🚨 INCOHÉRENCE - Signal rejeté', {
      entry: entryMid.toFixed(5),
      tp1: takeProfit1.toFixed(5),
      tp2: takeProfit2 ? takeProfit2.toFixed(5) : 'N/A',
      problem: 'TP1 égal à entry (impossible)'
    });
    return {
      signal: null,
      reason: 'Incohérence dans les niveaux TP',
      analysis
    };
  }

  if (userAccount && userAccount.capital && userAccount.risk_per_trade_percent) {
    const riskPercent = userAccount.risk_per_trade_percent;

    let slMultiplier;
    if (riskPercent <= 0.5) {
      slMultiplier = 1.5;
    } else if (riskPercent <= 1.0) {
      slMultiplier = 2.0;
    } else if (riskPercent <= 1.5) {
      slMultiplier = 2.5;
    } else {
      slMultiplier = 3.0;
    }

    const slDistance = riskPercent * slMultiplier;
    const slPercent = Math.max(0.5, Math.min(slDistance, 3.0));

    if (direction === 'SHORT') {
      stopLoss = entryMid * (1 + slPercent / 100);
    } else {
      stopLoss = entryMid * (1 - slPercent / 100);
    }

    console.log('💰 SL CALCULÉ DEPUIS PROFIL:', {
      capital: userAccount.capital,
      currency: userAccount.currency || 'USD',
      riskPercent: riskPercent,
      slMultiplier: slMultiplier,
      slPercent: slPercent.toFixed(3),
      slPrice: stopLoss.toFixed(5),
      direction,
      placement: direction === 'SHORT' ? 'AU-DESSUS entry' : 'EN DESSOUS entry',
      formula: `Risque ${riskPercent}% × ${slMultiplier} = ${slPercent.toFixed(2)}% SL`
    });
  } else {
    console.warn('⚠️ PROFIL NON TROUVÉ - SL par défaut utilisé');
    if (direction === 'SHORT') {
      stopLoss = entryMid * 1.015;
    } else {
      stopLoss = entryMid * 0.985;
    }
  }

  if (direction === 'LONG' && takeProfit2 && takeProfit2 <= entryMid) {
    console.warn('TP2 LONG incohérent - désactivé');
    takeProfit2 = null;
  } else if (direction === 'SHORT' && takeProfit2 && takeProfit2 >= entryMid) {
    console.warn('TP2 SHORT incohérent - désactivé');
    takeProfit2 = null;
  }

  if (macd.crossover === (direction === 'LONG' ? 'bullish' : 'bearish')) {
    reasons.push(`Croisement MACD ${direction === 'LONG' ? 'haussier' : 'baissier'}`);
    confidence += 15;
  } else if (macd.trend === (direction === 'LONG' ? 'bullish' : 'bearish')) {
    reasons.push(`MACD ${direction === 'LONG' ? 'haussier' : 'baissier'}`);
    confidence += 10;
  } else {
    reasons.push('Configuration MACD neutre');
    confidence += 5;
  }

  const isValid = direction === 'LONG'
    ? (takeProfit1 > entryMid && stopLoss < entryMid)
    : (takeProfit1 < entryMid && stopLoss > entryMid);

  if (!isValid) {
    console.error('🚨 VALIDATION FINALE ÉCHOUÉE', {
      direction,
      entry: entryMid.toFixed(5),
      stopLoss: stopLoss.toFixed(5),
      tp1: takeProfit1.toFixed(5),
      tp2: takeProfit2 ? takeProfit2.toFixed(5) : 'N/A'
    });
    return {
      signal: null,
      reason: 'Validation finale échouée',
      analysis
    };
  }

  const riskReward = Math.abs((takeProfit1 - entryMin) / (entryMin - stopLoss));

  lastSignalTime[marketKey] = now;

  const validityMinutes = 10;
  const validUntil = new Date(now + validityMinutes * 60 * 1000);
  const signalId = `${marketKey}_${now}_${direction}`;

  console.log('✅ SIGNAL VALIDÉ (v2.4.0):', {
    direction,
    currentPrice: currentPrice.toFixed(5),
    entry: entryMid.toFixed(5),
    stopLoss: stopLoss.toFixed(5),
    tp1: takeProfit1.toFixed(5),
    tp2: takeProfit2 ? takeProfit2.toFixed(5) : 'N/A',
    validation: direction === 'SHORT'
      ? `SL(${stopLoss.toFixed(5)}) > Entry(${entryMid.toFixed(5)}) > TP1(${takeProfit1.toFixed(5)}) ✓`
      : `TP1(${takeProfit1.toFixed(5)}) > Entry(${entryMid.toFixed(5)}) > SL(${stopLoss.toFixed(5)}) ✓`,
    slPosition: direction === 'SHORT' ? 'AU-DESSUS ↑' : 'EN DESSOUS ↓',
    tpPosition: direction === 'SHORT' ? 'EN DESSOUS ↓' : 'AU-DESSUS ↑'
  });

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

const getPlatformRules = (platform, market) => {
  const rules = {
    binance: {
      BTC: { pointValue: 1, minLotSize: 0.001, tickSize: 0.01 },
      ETH: { pointValue: 1, minLotSize: 0.01, tickSize: 0.01 }
    },
    bybit: {
      BTC: { pointValue: 1, minLotSize: 0.001, tickSize: 0.01 },
      ETH: { pointValue: 1, minLotSize: 0.01, tickSize: 0.01 }
    },
    ftmo: {
      NASDAQ: { pointValue: 5, minLotSize: 1, tickSize: 0.25 },
      GOLD: { pointValue: 100, minLotSize: 1, tickSize: 0.1 }
    },
    topstep: {
      NASDAQ: { pointValue: 5, minLotSize: 1, tickSize: 0.25 },
      GOLD: { pointValue: 100, minLotSize: 1, tickSize: 0.1 }
    }
  };

  return rules[platform]?.[market] || { pointValue: 1, minLotSize: 1, tickSize: 0.01 };
};
