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
    currentPrice,
    potentialEntry: null
  };

  if (!rsi || !macd) {
    return {
      signal: null,
      reason: 'Indicateurs non calculables',
      analysis
    };
  }

  if (rsi >= 30 && rsi <= 70) {
    const tempDirection = rsi < 50 ? 'LONG' : 'SHORT';
    const tempEntry = currentPrice;
    const tempTP1 = tempDirection === 'LONG' ? currentPrice * 1.02 : currentPrice * 0.98;
    const tempTP2 = tempDirection === 'LONG' ? currentPrice * 1.04 : currentPrice * 0.96;
    const tempSL = tempDirection === 'LONG' ? currentPrice * 0.985 : currentPrice * 1.015;

    analysis.potentialEntry = {
      direction: tempDirection,
      entry_min: tempEntry * 0.999,
      entry_max: tempEntry * 1.001,
      stop_loss: tempSL,
      take_profit_1: tempTP1,
      take_profit_2: tempTP2
    };

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

  if (trend === 'downtrend' && direction === 'LONG') {
    console.warn('🔴 FILTRAGE STRICT: Marché baissier détecté, LONG INTERDIT');
    return {
      signal: null,
      reason: 'Marché en tendance baissière - Seuls les SHORT sont autorisés',
      analysis
    };
  }

  if (trend === 'uptrend' && direction === 'SHORT') {
    console.warn('🟢 FILTRAGE STRICT: Marché haussier détecté, SHORT INTERDIT');
    return {
      signal: null,
      reason: 'Marché en tendance haussière - Seuls les LONG sont autorisés',
      analysis
    };
  }

  if (direction === 'LONG' && stopLoss >= entryMid) {
    console.error('🚨 INCOHÉRENCE CRITIQUE: LONG avec SL au-dessus de l\'entry!', {
      direction,
      entry: entryMid.toFixed(5),
      sl: stopLoss.toFixed(5),
      problem: 'SL LONG doit être EN DESSOUS de l\'entry'
    });
    return {
      signal: null,
      reason: 'Erreur technique: SL mal placé pour LONG',
      analysis
    };
  }

  if (direction === 'SHORT' && stopLoss <= entryMid) {
    console.error('🚨 INCOHÉRENCE CRITIQUE: SHORT avec SL en dessous de l\'entry!', {
      direction,
      entry: entryMid.toFixed(5),
      sl: stopLoss.toFixed(5),
      problem: 'SL SHORT doit être AU-DESSUS de l\'entry'
    });
    return {
      signal: null,
      reason: 'Erreur technique: SL mal placé pour SHORT',
      analysis
    };
  }

  if (userAccount && userAccount.capital && userAccount.risk_per_trade_percent) {
    const capital = parseFloat(userAccount.capital);
    const riskPercent = parseFloat(userAccount.risk_per_trade_percent);
    const maxRiskAmount = capital * (riskPercent / 100);

    const rules = getPlatformRules(platform, market);
    const pointValue = rules.pointValue || 1;
    const tickSize = rules.tickSize || 0.01;

    const defaultLotSize = rules.minLotSize || 1;
    const slDistance = (maxRiskAmount / (pointValue * defaultLotSize)) * tickSize;

    if (direction === 'SHORT') {
      stopLoss = entryMid + slDistance;
    } else {
      stopLoss = entryMid - slDistance;
    }

    console.log('💰 SL CALCULÉ DEPUIS PROFIL (RISQUE ABSOLU):', {
      capital: capital.toFixed(2),
      riskPercent: riskPercent.toFixed(3) + '%',
      maxRiskAmount: maxRiskAmount.toFixed(2),
      slDistance: slDistance.toFixed(2),
      entryMid: entryMid.toFixed(2),
      slPrice: stopLoss.toFixed(2),
      direction,
      placement: direction === 'SHORT' ? 'AU-DESSUS entry ↑' : 'EN DESSOUS entry ↓',
      formula: `Risque max = ${maxRiskAmount.toFixed(2)}$ (${riskPercent}% de ${capital}$)`
    });
  } else {
    console.warn('⚠️ PROFIL NON TROUVÉ - SL par défaut utilisé (1.5% du prix)');
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

  analysis.potentialEntry = {
    direction,
    entry_min: entryMin,
    entry_max: entryMax,
    stop_loss: stopLoss,
    take_profit_1: takeProfit1,
    take_profit_2: takeProfit2
  };

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

  if (confidence < 75) {
    console.warn(`⚠️ CONFIANCE INSUFFISANTE: ${confidence}% (minimum requis: 75%)`);
    return {
      signal: null,
      reason: `Confiance insuffisante (${confidence}%) - Attente de meilleures conditions`,
      analysis
    };
  }

  const riskReward = Math.abs((takeProfit1 - entryMin) / (entryMin - stopLoss));

  if (riskReward < 1.5) {
    console.warn(`⚠️ RISK/REWARD INSUFFISANT: ${riskReward.toFixed(2)} (minimum requis: 1.5)`);
    return {
      signal: null,
      reason: `Ratio risque/reward trop faible (${riskReward.toFixed(2)})`,
      analysis
    };
  }

  lastSignalTime[marketKey] = now;

  const validityMinutes = 10;
  const validUntil = new Date(now + validityMinutes * 60 * 1000);
  const signalId = `${marketKey}_${now}_${direction}`;

  console.log('✅ SIGNAL VALIDÉ (v3.0.0):', {
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
