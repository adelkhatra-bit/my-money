import marketHealthAnalyzer from './marketHealthAnalyzer.js';
import tradeDiscipline from './tradeDiscipline.js';
import { isMarketOpen } from './marketHours';
import { newsDetection } from './newsDetection';

class TradingGate {
  async canOpenPosition(userId, accountId, market, candles, currentPrice) {
    const checks = {
      marketHours: this._checkMarketHours(market),
      marketHealth: this._checkMarketHealth(candles, currentPrice),
      discipline: await this._checkDiscipline(userId, accountId),
      news: this._checkNews()
    };

    const blockReasons = [];
    const warnings = [];

    if (!checks.marketHours.allowed) {
      blockReasons.push(checks.marketHours);
    }

    if (!checks.marketHealth.allowed) {
      blockReasons.push(checks.marketHealth);
    }

    if (!checks.discipline.allowed) {
      blockReasons.push(checks.discipline);
    }

    if (!checks.news.allowed) {
      blockReasons.push(checks.news);
    }

    if (checks.marketHealth.warning) {
      warnings.push(checks.marketHealth.warning);
    }

    const allowed = blockReasons.length === 0;

    return {
      allowed,
      blockReasons,
      warnings,
      marketHealth: checks.marketHealth.details,
      checks,
      nextCheck: new Date(Date.now() + 60000).toISOString()
    };
  }

  _checkMarketHours(market) {
    const isOpen = isMarketOpen(market);

    if (!isOpen) {
      return {
        allowed: false,
        module: 'MARKET_HOURS',
        reason: 'MARKET_CLOSED',
        message: `Le marché ${market} est actuellement fermé`,
        severity: 'CRITICAL'
      };
    }

    return { allowed: true, module: 'MARKET_HOURS' };
  }

  _checkMarketHealth(candles, currentPrice) {
    if (!candles || candles.length < 20) {
      return {
        allowed: false,
        module: 'MARKET_HEALTH',
        reason: 'INSUFFICIENT_DATA',
        message: 'Données insuffisantes pour analyser le marché',
        severity: 'CRITICAL',
        details: null
      };
    }

    const health = marketHealthAnalyzer.analyzeMarketHealth(candles, currentPrice);

    if (health.status === 'DANGEROUS') {
      return {
        allowed: false,
        module: 'MARKET_HEALTH',
        reason: 'MARKET_DANGEROUS',
        message: health.message,
        severity: 'CRITICAL',
        details: health
      };
    }

    if (health.status === 'NOISY') {
      return {
        allowed: false,
        module: 'MARKET_HEALTH',
        reason: 'MARKET_NOISY',
        message: health.message,
        severity: 'HIGH',
        details: health,
        warning: 'Marché instable - Le robot attend une structure plus propre'
      };
    }

    return {
      allowed: true,
      module: 'MARKET_HEALTH',
      details: health
    };
  }

  async _checkDiscipline(userId, accountId) {
    const result = await tradeDiscipline.canOpenPosition(userId, accountId);

    if (!result.allowed) {
      return {
        allowed: false,
        module: 'DISCIPLINE',
        reason: result.reason,
        message: result.message,
        severity: 'HIGH',
        resetAt: result.resetAt
      };
    }

    return { allowed: true, module: 'DISCIPLINE' };
  }

  _checkNews() {
    const newsCheck = newsDetection.isNewsPeriod();

    if (newsCheck.isNews) {
      return {
        allowed: false,
        module: 'NEWS',
        reason: 'NEWS_PERIOD',
        message: newsCheck.message || 'Période de news détectée - Trading bloqué pour votre protection',
        severity: 'CRITICAL',
        eventName: newsCheck.eventName,
        timeRemaining: newsCheck.timeRemaining
      };
    }

    return { allowed: true, module: 'NEWS' };
  }

  getStatusSummary(gateResult) {
    if (gateResult.allowed) {
      return {
        icon: '🟢',
        status: 'AUTORISÉ',
        message: 'Toutes les conditions sont remplies',
        color: 'green'
      };
    }

    const criticalBlock = gateResult.blockReasons.find(b => b.severity === 'CRITICAL');
    if (criticalBlock) {
      return {
        icon: '🔴',
        status: 'BLOQUÉ',
        message: criticalBlock.message,
        color: 'red',
        reason: criticalBlock.reason
      };
    }

    const highBlock = gateResult.blockReasons.find(b => b.severity === 'HIGH');
    if (highBlock) {
      return {
        icon: '🟡',
        status: 'ATTENTE',
        message: highBlock.message,
        color: 'orange',
        reason: highBlock.reason
      };
    }

    return {
      icon: '🟡',
      status: 'ATTENTE',
      message: 'Vérifications en cours',
      color: 'orange'
    };
  }
}

export default new TradingGate();
