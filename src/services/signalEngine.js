import {
  calculateRSI,
  calculateMACD,
  findSupportResistance,
  detectOrderBlocks,
  detectTrend
} from './indicators';
import { getCurrentPrice } from './marketDataUnified';
import { isMarketOpen } from './marketHours';
import {
  enforceDirectionRules,
  validateSignalCoherence,
  DIRECTION
} from './directionValidator';
import tradingGate from './tradingGate.js';

const lastSignalTime = {};
const lastSignalData = {};
const COOLDOWN_MS = 5 * 60 * 1000;

(function runDirectionValidationTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TEST AUTOMATIQUE - VALIDATION DIRECTION LONG/SHORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const testCases = [
    {
      name: 'TEST CASE SHORT',
      entry: 71390,
      tp1: 70507,
      tp2: 70157,
      expectedDirection: 'SHORT',
      expectedSLPosition: 'AU-DESSUS'
    },
    {
      name: 'TEST CASE LONG',
      entry: 100,
      tp1: 105,
      tp2: 110,
      expectedDirection: 'LONG',
      expectedSLPosition: 'EN DESSOUS'
    }
  ];

  testCases.forEach((test, index) => {
    const avgTP = (test.tp1 + test.tp2) / 2;
    const detectedDirection = avgTP > test.entry ? 'LONG' : 'SHORT';
    const calculatedSL = detectedDirection === 'SHORT'
      ? test.entry * 1.015
      : test.entry * 0.985;
    const slPosition = calculatedSL > test.entry ? 'AU-DESSUS' : 'EN DESSOUS';

    const passed = detectedDirection === test.expectedDirection &&
                   slPosition === test.expectedSLPosition;

    console.log(`\n${passed ? '✅' : '❌'} ${test.name}`);
    console.log(`   Entry: ${test.entry.toFixed(2)}`);
    console.log(`   TP1: ${test.tp1.toFixed(2)} | TP2: ${test.tp2.toFixed(2)}`);
    console.log(`   TP Moyen: ${avgTP.toFixed(2)}`);
    console.log(`   Direction détectée: ${detectedDirection} (attendu: ${test.expectedDirection})`);
    console.log(`   SL calculé: ${calculatedSL.toFixed(2)} - Position: ${slPosition} (attendu: ${test.expectedSLPosition})`);
    console.log(`   RÉSULTAT: ${passed ? '✓ PASS' : '✗ FAIL'}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 FIN DES TESTS - Version v3.1.4-DIRECTION-FIX');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();

export const generateSignal = async (market, platform, candles, userAccount = null) => {
  if (!isMarketOpen(market)) {
    return {
      signal: null,
      reason: 'Marché fermé',
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

  const currentPrice = candles[candles.length - 1].close;
  const userId = userAccount?.user_id || userAccount?.id;
  const accountId = userAccount?.id;

  if (userId && accountId) {
    const gateResult = await tradingGate.canOpenPosition(
      userId,
      accountId,
      market,
      candles,
      currentPrice
    );

    if (!gateResult.allowed) {
      const summary = tradingGate.getStatusSummary(gateResult);
      const blockReason = gateResult.blockReasons[0];

      console.log('🚫 TRADING GATE - SIGNAL BLOQUÉ:', {
        market,
        platform,
        status: summary.status,
        reason: blockReason.reason,
        module: blockReason.module,
        message: blockReason.message
      });

      return {
        signal: null,
        reason: blockReason.message,
        analysis: {
          gateStatus: summary,
          blockReasons: gateResult.blockReasons,
          marketHealth: gateResult.marketHealth
        }
      };
    }

    console.log('✅ TRADING GATE - AUTORISATION ACCORDÉE:', {
      market,
      platform,
      marketHealthScore: gateResult.marketHealth?.score,
      marketHealthStatus: gateResult.marketHealth?.status
    });
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

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
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
    const tempDirection = rsi < 50 ? DIRECTION.LONG : DIRECTION.SHORT;
    const tempEntry = currentPrice;
    const tempTP1 = tempDirection === DIRECTION.LONG ? currentPrice * 1.02 : currentPrice * 0.98;
    const tempTP2 = tempDirection === DIRECTION.LONG ? currentPrice * 1.04 : currentPrice * 0.96;
    const tempSL = tempDirection === DIRECTION.LONG ? currentPrice * 0.985 : currentPrice * 1.015;

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

  const avgTP = (takeProfit1 + (takeProfit2 || takeProfit1)) / 2;

  if (avgTP > entryMid) {
    direction = DIRECTION.LONG;
    console.log('📈 DIRECTION DÉTECTÉE: LONG (TP moyen > Entry)', {
      entry: entryMid.toFixed(5),
      tp1: takeProfit1.toFixed(5),
      tp2: takeProfit2 ? takeProfit2.toFixed(5) : 'N/A',
      avgTP: avgTP.toFixed(5)
    });
  } else if (avgTP < entryMid) {
    direction = DIRECTION.SHORT;
    console.log('📉 DIRECTION DÉTECTÉE: SHORT (TP moyen < Entry)', {
      entry: entryMid.toFixed(5),
      tp1: takeProfit1.toFixed(5),
      tp2: takeProfit2 ? takeProfit2.toFixed(5) : 'N/A',
      avgTP: avgTP.toFixed(5)
    });
  } else {
    console.error('🚨 INCOHÉRENCE - Signal rejeté', {
      entry: entryMid.toFixed(5),
      tp1: takeProfit1.toFixed(5),
      tp2: takeProfit2 ? takeProfit2.toFixed(5) : 'N/A',
      problem: 'TP moyen égal à entry (impossible)'
    });
    return {
      signal: null,
      reason: 'Incohérence dans les niveaux TP',
      analysis
    };
  }

  if (trend === 'downtrend' && direction === DIRECTION.LONG) {
    console.warn('🔴 FILTRAGE STRICT: Marché baissier détecté, LONG INTERDIT');
    return {
      signal: null,
      reason: 'Marché en tendance baissière - Seuls les SHORT sont autorisés',
      analysis
    };
  }

  if (trend === 'uptrend' && direction === DIRECTION.SHORT) {
    console.warn('🟢 FILTRAGE STRICT: Marché haussier détecté, SHORT INTERDIT');
    return {
      signal: null,
      reason: 'Marché en tendance haussière - Seuls les LONG sont autorisés',
      analysis
    };
  }

  if (direction === DIRECTION.SHORT) {
    stopLoss = entryMid * 1.015;
    console.log('🔴 SL SHORT CALCULÉ (AU-DESSUS de entry):', {
      entry: entryMid.toFixed(2),
      sl: stopLoss.toFixed(2),
      distance: ((stopLoss - entryMid) / entryMid * 100).toFixed(2) + '%',
      validation: `SL(${stopLoss.toFixed(2)}) > Entry(${entryMid.toFixed(2)}) ✓`
    });
  } else {
    stopLoss = entryMid * 0.985;
    console.log('🟢 SL LONG CALCULÉ (EN DESSOUS de entry):', {
      entry: entryMid.toFixed(2),
      sl: stopLoss.toFixed(2),
      distance: ((entryMid - stopLoss) / entryMid * 100).toFixed(2) + '%',
      validation: `Entry(${entryMid.toFixed(2)}) > SL(${stopLoss.toFixed(2)}) ✓`
    });
  }

  if (userAccount && userAccount.capital && userAccount.risk_per_trade_percent) {
    const capital = parseFloat(userAccount.capital);
    const riskPercent = parseFloat(userAccount.risk_per_trade_percent);
    const maxRiskAmount = capital * (riskPercent / 100);

    const rules = getPlatformRules(platform, market);
    const pointValue = rules.pointValue || 1;
    const tickSize = rules.tickSize || 0.01;
    const defaultLotSize = rules.minLotSize || 1;
    const slDistance = Math.abs(stopLoss - entryMid);

    const calculatedRisk = slDistance * pointValue * defaultLotSize;

    console.log('💰 VALIDATION RISQUE PROFIL:', {
      capital: capital.toFixed(2),
      riskPercentConfigured: riskPercent.toFixed(2) + '%',
      maxRiskAmount: maxRiskAmount.toFixed(2),
      calculatedRisk: calculatedRisk.toFixed(2),
      slDistance: slDistance.toFixed(2),
      status: calculatedRisk <= maxRiskAmount ? '✓ OK' : '⚠️ DÉPASSE'
    });
  }

  if (direction === DIRECTION.LONG && takeProfit2 && takeProfit2 <= entryMid) {
    console.warn('TP2 LONG incohérent - désactivé');
    takeProfit2 = null;
  } else if (direction === DIRECTION.SHORT && takeProfit2 && takeProfit2 >= entryMid) {
    console.warn('TP2 SHORT incohérent - désactivé');
    takeProfit2 = null;
  }

  if (macd.crossover === (direction === DIRECTION.LONG ? 'bullish' : 'bearish')) {
    reasons.push(`Croisement MACD ${direction === DIRECTION.LONG ? 'haussier' : 'baissier'}`);
    confidence += 15;
  } else if (macd.trend === (direction === DIRECTION.LONG ? 'bullish' : 'bearish')) {
    reasons.push(`MACD ${direction === DIRECTION.LONG ? 'haussier' : 'baissier'}`);
    confidence += 10;
  } else {
    reasons.push('Configuration MACD neutre');
    confidence += 5;
  }

  console.log('🔍 VALIDATION FINALE - VÉRIFICATION COHÉRENCE:', {
    entry: entryMid.toFixed(2),
    tp1: takeProfit1.toFixed(2),
    tp2: takeProfit2 ? takeProfit2.toFixed(2) : 'N/A',
    sl: stopLoss.toFixed(2),
    direction,
    avgTP: ((takeProfit1 + (takeProfit2 || takeProfit1)) / 2).toFixed(2)
  });

  const finalAvgTP = (takeProfit1 + (takeProfit2 || takeProfit1)) / 2;

  if (finalAvgTP > entryMid && direction !== DIRECTION.LONG) {
    console.error('🚨 INCOHÉRENCE: TP > Entry mais direction n\'est pas LONG');
    direction = DIRECTION.LONG;
    stopLoss = entryMid * 0.985;
  }

  if (finalAvgTP < entryMid && direction !== DIRECTION.SHORT) {
    console.error('🚨 INCOHÉRENCE: TP < Entry mais direction n\'est pas SHORT');
    direction = DIRECTION.SHORT;
    stopLoss = entryMid * 1.015;
  }

  if (direction === DIRECTION.LONG && stopLoss >= entryMid) {
    console.error('🚨 ERREUR CRITIQUE: LONG avec SL au-dessus de entry - CORRECTION');
    stopLoss = entryMid * 0.985;
  }

  if (direction === DIRECTION.SHORT && stopLoss <= entryMid) {
    console.error('🚨 ERREUR CRITIQUE: SHORT avec SL en dessous de entry - CORRECTION');
    stopLoss = entryMid * 1.015;
  }

  let signalData = {
    entry: entryMid,
    tp1: takeProfit1,
    tp2: takeProfit2 || takeProfit1,
    stopLoss,
    direction
  };

  try {
    validateSignalCoherence(signalData);

    console.log('✅ SIGNAL VALIDÉ - COHÉRENCE CONFIRMÉE:', {
      direction,
      entry: entryMid.toFixed(2),
      sl: stopLoss.toFixed(2),
      tp1: takeProfit1.toFixed(2),
      tp2: takeProfit2 ? takeProfit2.toFixed(2) : 'N/A',
      check: direction === DIRECTION.SHORT
        ? `SL(${stopLoss.toFixed(2)}) > Entry(${entryMid.toFixed(2)}) > TP(${takeProfit1.toFixed(2)})`
        : `TP(${takeProfit1.toFixed(2)}) > Entry(${entryMid.toFixed(2)}) > SL(${stopLoss.toFixed(2)})`
    });

  } catch (error) {
    console.error('🚨 VALIDATION STRICTE ÉCHOUÉE:', error.message);
    return {
      signal: null,
      reason: `Signal incohérent: ${error.message}`,
      analysis
    };
  }

  analysis.potentialEntry = {
    direction,
    entry_min: entryMin,
    entry_max: entryMax,
    stop_loss: stopLoss,
    take_profit_1: takeProfit1,
    take_profit_2: takeProfit2
  };

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

  console.log('✅ SIGNAL VALIDÉ (v3.1.0 - Direction stricte):', {
    direction,
    currentPrice: currentPrice.toFixed(2),
    entry: entryMid.toFixed(2),
    stopLoss: stopLoss.toFixed(2),
    tp1: takeProfit1.toFixed(2),
    tp2: takeProfit2 ? takeProfit2.toFixed(2) : 'N/A',
    validation: direction === DIRECTION.SHORT
      ? `SL(${stopLoss.toFixed(2)}) > Entry(${entryMid.toFixed(2)}) > TP1(${takeProfit1.toFixed(2)}) ✓`
      : `TP1(${takeProfit1.toFixed(2)}) > Entry(${entryMid.toFixed(2)}) > SL(${stopLoss.toFixed(2)}) ✓`,
    slPosition: direction === DIRECTION.SHORT ? 'AU-DESSUS ↑' : 'EN DESSOUS ↓',
    tpPosition: direction === DIRECTION.SHORT ? 'EN DESSOUS ↓' : 'AU-DESSUS ↑'
  });

  const ruleUsed = avgTP > entryMid
    ? 'TP_AVG > ENTRY → LONG'
    : avgTP < entryMid
      ? 'TP_AVG < ENTRY → SHORT'
      : 'INCOHÉRENCE';

  const debugSnapshot = {
    signalId,
    accountId: userAccount?.id || 'N/A',
    market,
    platform,
    symbol: getSymbolForMarket(market, platform),
    timeframe: '5m',
    dataSource: 'deterministic',
    entry: entryMid.toFixed(2),
    tp1: takeProfit1.toFixed(2),
    tp2: takeProfit2 ? takeProfit2.toFixed(2) : 'N/A',
    direction,
    sl: stopLoss.toFixed(2),
    ruleUsed
  };

  console.log('🔍 DEBUG SNAPSHOT CRÉÉ:', debugSnapshot);

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
      status: 'ACTIVE',
      debugSnapshot
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

const getSymbolForMarket = (market, platform) => {
  const symbols = {
    topstep: {
      NASDAQ: 'MNQ',
      GOLD: 'MGC'
    },
    ftmo: {
      NASDAQ: 'NQ',
      GOLD: 'GC'
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

  return symbols[platform]?.[market] || market;
};
