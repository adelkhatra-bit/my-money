import { calculateIndicators } from './indicators';

const HEALTH_STATUS = {
  STABLE: 'STABLE',
  NOISY: 'NOISY',
  DANGEROUS: 'DANGEROUS'
};

const THRESHOLDS = {
  ATR_WARNING: 2.0,
  ATR_DANGER: 3.0,
  CANDLE_WARNING: 3.0,
  CANDLE_DANGER: 5.0,
  RSI_EXTREME_LOW: 15,
  RSI_EXTREME_HIGH: 85
};

class MarketHealthAnalyzer {
  analyzeMarketHealth(candles, currentPrice) {
    if (!candles || candles.length < 20) {
      return {
        status: HEALTH_STATUS.DANGEROUS,
        score: 0,
        reasons: ['insufficient_data'],
        canTrade: false,
        message: 'Données insuffisantes pour analyser le marché'
      };
    }

    const factors = {
      volatility: this._analyzeVolatility(candles),
      candleAnomaly: this._detectCandleAnomalies(candles),
      rsi: this._analyzeRSI(candles),
      macd: this._analyzeMACDStability(candles)
    };

    const { status, score, reasons } = this._computeFinalScore(factors);
    const canTrade = status === HEALTH_STATUS.STABLE;
    const message = this._generateMessage(status, reasons);

    return {
      status,
      score,
      reasons,
      canTrade,
      message,
      details: factors
    };
  }

  _analyzeVolatility(candles) {
    const atrPeriod = 14;
    const recentCandles = candles.slice(-atrPeriod);

    const atrValues = recentCandles.map(c => c.high - c.low);
    const currentATR = atrValues[atrValues.length - 1];
    const avgATR = atrValues.slice(0, -1).reduce((a, b) => a + b, 0) / (atrValues.length - 1);

    const ratio = avgATR > 0 ? currentATR / avgATR : 0;

    if (ratio >= THRESHOLDS.ATR_DANGER) {
      return { level: 'DANGER', ratio, message: 'Volatilité extrême' };
    }
    if (ratio >= THRESHOLDS.ATR_WARNING) {
      return { level: 'WARNING', ratio, message: 'Volatilité élevée' };
    }
    return { level: 'OK', ratio, message: 'Volatilité normale' };
  }

  _detectCandleAnomalies(candles) {
    const recent = candles.slice(-20);
    const lastCandle = candles[candles.length - 1];

    const avgBody = recent.slice(0, -1).reduce((sum, c) =>
      sum + Math.abs(c.close - c.open), 0) / (recent.length - 1);

    const avgWick = recent.slice(0, -1).reduce((sum, c) =>
      sum + (c.high - c.low), 0) / (recent.length - 1);

    const lastBody = Math.abs(lastCandle.close - lastCandle.open);
    const lastWick = lastCandle.high - lastCandle.low;

    const bodyRatio = avgBody > 0 ? lastBody / avgBody : 0;
    const wickRatio = avgWick > 0 ? lastWick / avgWick : 0;
    const maxRatio = Math.max(bodyRatio, wickRatio);

    if (maxRatio >= THRESHOLDS.CANDLE_DANGER) {
      return { level: 'DANGER', ratio: maxRatio, message: 'Bougie anormale détectée' };
    }
    if (maxRatio >= THRESHOLDS.CANDLE_WARNING) {
      return { level: 'WARNING', ratio: maxRatio, message: 'Bougie inhabituelle' };
    }
    return { level: 'OK', ratio: maxRatio, message: 'Bougies normales' };
  }

  _analyzeRSI(candles) {
    try {
      const indicators = calculateIndicators(candles, 14, 12, 26, 9);
      const rsi = indicators.rsi[indicators.rsi.length - 1];

      if (rsi <= THRESHOLDS.RSI_EXTREME_LOW || rsi >= THRESHOLDS.RSI_EXTREME_HIGH) {
        return { level: 'WARNING', value: rsi, message: 'RSI extrême' };
      }
      return { level: 'OK', value: rsi, message: 'RSI normal' };
    } catch (error) {
      return { level: 'OK', value: 50, message: 'RSI non disponible' };
    }
  }

  _analyzeMACDStability(candles) {
    try {
      const indicators = calculateIndicators(candles, 14, 12, 26, 9);
      const macdLine = indicators.macd;
      const signalLine = indicators.macdSignal;

      if (macdLine.length < 3 || signalLine.length < 3) {
        return { level: 'OK', crossovers: 0, message: 'MACD stable' };
      }

      let crossovers = 0;
      for (let i = macdLine.length - 3; i < macdLine.length - 1; i++) {
        const prevDiff = macdLine[i] - signalLine[i];
        const currDiff = macdLine[i + 1] - signalLine[i + 1];
        if ((prevDiff > 0 && currDiff < 0) || (prevDiff < 0 && currDiff > 0)) {
          crossovers++;
        }
      }

      if (crossovers >= 2) {
        return { level: 'WARNING', crossovers, message: 'MACD instable (faux signaux)' };
      }
      return { level: 'OK', crossovers, message: 'MACD stable' };
    } catch (error) {
      return { level: 'OK', crossovers: 0, message: 'MACD non disponible' };
    }
  }

  _computeFinalScore(factors) {
    const dangerFactors = Object.values(factors).filter(f => f.level === 'DANGER').length;
    const warningFactors = Object.values(factors).filter(f => f.level === 'WARNING').length;

    const reasons = Object.entries(factors)
      .filter(([_, f]) => f.level !== 'OK')
      .map(([name, f]) => `${name}: ${f.message}`);

    if (dangerFactors >= 2) {
      return { status: HEALTH_STATUS.DANGEROUS, score: 20, reasons };
    }

    if (dangerFactors >= 1 || warningFactors >= 2) {
      return { status: HEALTH_STATUS.NOISY, score: 50, reasons };
    }

    if (warningFactors >= 1) {
      return { status: HEALTH_STATUS.NOISY, score: 65, reasons };
    }

    return { status: HEALTH_STATUS.STABLE, score: 90, reasons: [] };
  }

  _generateMessage(status, reasons) {
    switch (status) {
      case HEALTH_STATUS.STABLE:
        return 'Marché stable - Conditions favorables au trading';
      case HEALTH_STATUS.NOISY:
        return `Marché instable - ${reasons.join(', ')}`;
      case HEALTH_STATUS.DANGEROUS:
        return `Marché dangereux - Trading bloqué - ${reasons.join(', ')}`;
      default:
        return 'État du marché inconnu';
    }
  }
}

export default new MarketHealthAnalyzer();
