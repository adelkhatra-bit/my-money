export const calculatePositionSize = (account, signal) => {
  if (!account || !signal) return null;

  const { capital, risk_per_trade_percent } = account;
  const { direction, entry_min, entry_max, stop_loss } = signal;

  const entryPrice = (entry_min + entry_max) / 2;
  const stopDistance = Math.abs(entryPrice - stop_loss);
  const stopDistancePercent = (stopDistance / entryPrice) * 100;

  const maxRiskAmount = capital * (risk_per_trade_percent / 100);

  const platformRules = getPlatformRules(account.platform, account.market);
  const pointValue = platformRules.pointValue;
  const minLotSize = platformRules.minLotSize;
  const tickSize = platformRules.tickSize;

  let positionSize;

  if (account.market === 'BTC' || account.market === 'ETH') {
    positionSize = maxRiskAmount / stopDistance;
    positionSize = Math.floor(positionSize / minLotSize) * minLotSize;
  } else if (account.market === 'NASDAQ') {
    const contractSize = stopDistance / tickSize;
    const riskPerContract = contractSize * pointValue;
    positionSize = Math.floor(maxRiskAmount / riskPerContract);
  } else if (account.market === 'GOLD') {
    const contractSize = stopDistance / tickSize;
    const riskPerContract = contractSize * pointValue;
    positionSize = Math.floor(maxRiskAmount / riskPerContract);
  } else {
    positionSize = 1;
  }

  positionSize = Math.max(minLotSize, positionSize);

  const actualRiskAmount = positionSize * stopDistance * (pointValue || 1);
  const actualRiskPercent = (actualRiskAmount / capital) * 100;

  const potentialProfit1 = Math.abs(signal.take_profit_1 - entryPrice) * positionSize * (pointValue || 1);
  const potentialProfit2 = signal.take_profit_2
    ? Math.abs(signal.take_profit_2 - entryPrice) * positionSize * (pointValue || 1)
    : null;

  return {
    positionSize,
    entryPrice,
    stopDistance,
    stopDistancePercent,
    riskAmount: actualRiskAmount,
    riskPercent: actualRiskPercent,
    potentialProfit1,
    potentialProfit2,
    riskReward: signal.risk_reward,
    warnings: actualRiskPercent > risk_per_trade_percent * 1.2
      ? ['⚠️ Risque supérieur à la limite configurée']
      : []
  };
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

export const validateRisk = (account, positionCalc) => {
  const warnings = [];

  if (account.max_daily_loss && positionCalc.riskAmount > account.max_daily_loss) {
    warnings.push('❌ Risque dépasse la perte journalière maximale');
  }

  if (positionCalc.riskPercent > account.risk_per_trade_percent * 1.5) {
    warnings.push('⚠️ Risque significativement supérieur au paramètre configuré');
  }

  if (positionCalc.riskReward < 1.5) {
    warnings.push('⚠️ Risk/Reward inférieur à 1.5:1');
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
};
