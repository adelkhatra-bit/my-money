import { getUnifiedMarketData, getCurrentPrice as getUnifiedCurrentPrice } from './marketDataUnified';
import { initializeAntoMarket, getAntoPriceHistory, getAntoCurrentPrice } from './antoMarketEngine';

class MarketDataProvider {
  constructor() {
    this.activeProviders = new Map();
    this.platformConfigs = this.getPlatformConfigs();
  }

  getPlatformConfigs() {
    return {
      topstep: {
        name: 'TopstepTrader',
        type: 'futures',
        markets: {
          NASDAQ: {
            symbol: 'MNQ',
            tickSize: 0.25,
            tickValue: 0.50,
            contractValue: 2,
            minMove: 0.25,
            decimalPlaces: 2,
            currency: 'USD'
          },
          GOLD: {
            symbol: 'MGC',
            tickSize: 0.10,
            tickValue: 1.00,
            contractValue: 10,
            minMove: 0.10,
            decimalPlaces: 2,
            currency: 'USD'
          },
          SP500: {
            symbol: 'MES',
            tickSize: 0.25,
            tickValue: 1.25,
            contractValue: 5,
            minMove: 0.25,
            decimalPlaces: 2,
            currency: 'USD'
          }
        }
      },
      ftmo: {
        name: 'FTMO',
        type: 'futures',
        markets: {
          NASDAQ: {
            symbol: 'NQ',
            tickSize: 0.25,
            tickValue: 5.00,
            contractValue: 20,
            minMove: 0.25,
            decimalPlaces: 2,
            currency: 'USD'
          },
          GOLD: {
            symbol: 'GC',
            tickSize: 0.10,
            tickValue: 10.00,
            contractValue: 100,
            minMove: 0.10,
            decimalPlaces: 2,
            currency: 'USD'
          },
          SP500: {
            symbol: 'ES',
            tickSize: 0.25,
            tickValue: 12.50,
            contractValue: 50,
            minMove: 0.25,
            decimalPlaces: 2,
            currency: 'USD'
          }
        }
      },
      anto: {
        name: 'ANTØ Sandbox',
        type: 'simulation',
        markets: {
          ANTO_NASDAQ: {
            symbol: 'ANTO_NASDAQ',
            tickSize: 0.25,
            tickValue: 0.50,
            contractValue: 2,
            minMove: 0.25,
            decimalPlaces: 2,
            currency: 'USD',
            baselinePrice: 18500.00,
            minBaseline: 300,
            volatility: 25
          }
        }
      },
      binance: {
        name: 'Binance',
        type: 'crypto',
        markets: {
          BTC: {
            symbol: 'BTCUSDT',
            tickSize: 0.01,
            tickValue: 0.01,
            contractValue: 1,
            minMove: 0.01,
            decimalPlaces: 2,
            currency: 'USDT'
          },
          ETH: {
            symbol: 'ETHUSDT',
            tickSize: 0.01,
            tickValue: 0.01,
            contractValue: 1,
            minMove: 0.01,
            decimalPlaces: 2,
            currency: 'USDT'
          }
        }
      },
      bybit: {
        name: 'Bybit',
        type: 'crypto',
        markets: {
          BTC: {
            symbol: 'BTCUSDT',
            tickSize: 0.01,
            tickValue: 0.01,
            contractValue: 1,
            minMove: 0.01,
            decimalPlaces: 2,
            currency: 'USDT'
          },
          ETH: {
            symbol: 'ETHUSDT',
            tickSize: 0.01,
            tickValue: 0.01,
            contractValue: 1,
            minMove: 0.01,
            decimalPlaces: 2,
            currency: 'USDT'
          }
        }
      }
    };
  }

  validateMarketPlatform(market, platform) {
    const platformLower = platform.toLowerCase();
    const config = this.platformConfigs[platformLower];

    if (!config) {
      return {
        valid: false,
        error: `Plateforme inconnue: ${platform}`
      };
    }

    if (!config.markets[market]) {
      return {
        valid: false,
        error: `Marché ${market} non disponible sur ${platform}`
      };
    }

    return { valid: true };
  }

  async getOHLC(market, platform, timeframe = '1m') {
    const validation = this.validateMarketPlatform(market, platform);
    if (!validation.valid) {
      console.error('[MarketDataProvider] Validation error:', validation.error);
      throw new Error(validation.error);
    }

    if (platform.toLowerCase() === 'anto') {
      return await getAntoPriceHistory(market, timeframe, 500);
    }

    return await getUnifiedMarketData(market, platform, timeframe);
  }

  getCurrentPrice(market, platform) {
    const validation = this.validateMarketPlatform(market, platform);
    if (!validation.valid) {
      console.error('[MarketDataProvider] Validation error:', validation.error);
      throw new Error(validation.error);
    }

    if (platform.toLowerCase() === 'anto') {
      return this.getAntoCurrentPrice(market);
    }

    return getUnifiedCurrentPrice(market, platform);
  }

  getAntoCurrentPrice(market) {
    return getAntoCurrentPrice(market);
  }

  getTickSize(market, platform) {
    const validation = this.validateMarketPlatform(market, platform);
    if (!validation.valid) {
      console.error('[MarketDataProvider] Validation error:', validation.error);
      return 0.01;
    }

    const platformLower = platform.toLowerCase();
    const config = this.platformConfigs[platformLower];
    const marketConfig = config.markets[market];

    return marketConfig.tickSize;
  }

  getContractSpecs(market, platform) {
    const validation = this.validateMarketPlatform(market, platform);
    if (!validation.valid) {
      console.error('[MarketDataProvider] Validation error:', validation.error);
      return null;
    }

    const platformLower = platform.toLowerCase();
    const config = this.platformConfigs[platformLower];
    const marketConfig = config.markets[market];

    return {
      symbol: marketConfig.symbol,
      tickSize: marketConfig.tickSize,
      tickValue: marketConfig.tickValue,
      contractValue: marketConfig.contractValue,
      minMove: marketConfig.minMove,
      decimalPlaces: marketConfig.decimalPlaces,
      currency: marketConfig.currency,
      platformName: config.name,
      platformType: config.type
    };
  }

  calculatePositionValue(market, platform, quantity, entryPrice) {
    const specs = this.getContractSpecs(market, platform);
    if (!specs) return 0;

    return quantity * specs.contractValue * entryPrice;
  }

  calculatePnL(market, platform, direction, quantity, entryPrice, currentPrice) {
    const specs = this.getContractSpecs(market, platform);
    if (!specs) return 0;

    const priceChange = direction === 'LONG'
      ? (currentPrice - entryPrice)
      : (entryPrice - currentPrice);

    const ticks = priceChange / specs.tickSize;
    const pnl = ticks * specs.tickValue * quantity;

    return pnl;
  }

  formatPrice(market, platform, price) {
    const specs = this.getContractSpecs(market, platform);
    if (!specs) return price.toFixed(2);

    return price.toFixed(specs.decimalPlaces);
  }

  initializeAntoMarket(market) {
    if (!market.startsWith('ANTO_')) {
      console.error('[MarketDataProvider] Market must start with ANTO_');
      return null;
    }

    const cleanup = initializeAntoMarket(market);
    this.activeProviders.set(market, cleanup);

    return cleanup;
  }

  cleanup() {
    this.activeProviders.forEach((cleanup) => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
    this.activeProviders.clear();
  }
}

export const marketDataProvider = new MarketDataProvider();

export default MarketDataProvider;
