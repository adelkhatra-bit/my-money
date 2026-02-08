export const calculateTrailingStop = (position, currentPrice, supports, resistances) => {
  if (!position || position.status !== 'OPEN') return null;

  const { direction, entry_price, stop_loss, take_profit_1 } = position;

  const minGainPercentage = 0.005;
  const minDistanceFromEntry = 0.003;

  if (direction === 'LONG') {
    const currentGain = (currentPrice - entry_price) / entry_price;

    if (currentGain < minGainPercentage) {
      return null;
    }

    const relevantSupports = supports
      .filter(s => s < currentPrice && s > stop_loss)
      .sort((a, b) => b - a);

    if (relevantSupports.length === 0) {
      const calculatedSL = currentPrice * (1 - 0.015);
      if (calculatedSL > stop_loss && calculatedSL > entry_price * (1 + minDistanceFromEntry)) {
        return {
          newStopLoss: calculatedSL,
          reason: 'Trailing stop calculé (pas de support disponible)',
          gainProtected: ((calculatedSL - entry_price) / entry_price * 100).toFixed(2)
        };
      }
      return null;
    }

    const bestSupport = relevantSupports[0];
    const slBelowSupport = bestSupport * 0.9985;

    if (slBelowSupport > stop_loss && slBelowSupport > entry_price * (1 + minDistanceFromEntry)) {
      return {
        newStopLoss: slBelowSupport,
        reason: `SL déplacé sous le support à ${bestSupport.toFixed(5)}`,
        supportLevel: bestSupport,
        gainProtected: ((slBelowSupport - entry_price) / entry_price * 100).toFixed(2)
      };
    }

  } else if (direction === 'SHORT') {
    const currentGain = (entry_price - currentPrice) / entry_price;

    if (currentGain < minGainPercentage) {
      return null;
    }

    const relevantResistances = resistances
      .filter(r => r > currentPrice && r < stop_loss)
      .sort((a, b) => a - b);

    if (relevantResistances.length === 0) {
      const calculatedSL = currentPrice * (1 + 0.015);
      if (calculatedSL < stop_loss && calculatedSL < entry_price * (1 - minDistanceFromEntry)) {
        return {
          newStopLoss: calculatedSL,
          reason: 'Trailing stop calculé (pas de résistance disponible)',
          gainProtected: ((entry_price - calculatedSL) / entry_price * 100).toFixed(2)
        };
      }
      return null;
    }

    const bestResistance = relevantResistances[0];
    const slAboveResistance = bestResistance * 1.0015;

    if (slAboveResistance < stop_loss && slAboveResistance < entry_price * (1 - minDistanceFromEntry)) {
      return {
        newStopLoss: slAboveResistance,
        reason: `SL déplacé au-dessus de la résistance à ${bestResistance.toFixed(5)}`,
        resistanceLevel: bestResistance,
        gainProtected: ((entry_price - slAboveResistance) / entry_price * 100).toFixed(2)
      };
    }
  }

  return null;
};

export const shouldUpdateTrailingStop = (position, lastUpdateTime) => {
  if (!position || position.status !== 'OPEN') return false;

  if (!lastUpdateTime) return true;

  const timeSinceLastUpdate = Date.now() - lastUpdateTime;
  const minUpdateInterval = 10000;

  return timeSinceLastUpdate > minUpdateInterval;
};
