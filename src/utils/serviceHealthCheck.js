export const healthCheck = () => {
  const checks = {
    tradingGate: false,
    marketHealthAnalyzer: false,
    tradeDiscipline: false,
    indicators: false
  };

  try {
    const tradingGate = require('../services/tradingGate');
    checks.tradingGate = !!tradingGate.default;
  } catch (e) {
    console.error('❌ tradingGate failed:', e);
  }

  try {
    const marketHealthAnalyzer = require('../services/marketHealthAnalyzer');
    checks.marketHealthAnalyzer = !!marketHealthAnalyzer.default;
  } catch (e) {
    console.error('❌ marketHealthAnalyzer failed:', e);
  }

  try {
    const tradeDiscipline = require('../services/tradeDiscipline');
    checks.tradeDiscipline = !!tradeDiscipline.default;
  } catch (e) {
    console.error('❌ tradeDiscipline failed:', e);
  }

  try {
    const indicators = require('../services/indicators');
    checks.indicators = !!indicators.calculateIndicators;
  } catch (e) {
    console.error('❌ indicators failed:', e);
  }

  const allHealthy = Object.values(checks).every(v => v);

  console.log('🏥 Service Health Check:', checks, allHealthy ? '✅ ALL OK' : '❌ ISSUES DETECTED');

  return { checks, allHealthy };
};
