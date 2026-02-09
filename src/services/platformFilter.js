export function getCompatiblePlatforms(market) {
  const cryptoMarkets = ['BTC', 'ETH'];
  const indicesMarkets = ['NASDAQ', 'GOLD', 'SP500'];

  if (cryptoMarkets.includes(market)) {
    return [
      { value: 'binance', label: 'Binance' },
      { value: 'bybit', label: 'Bybit' },
      { value: 'okx', label: 'OKX' },
      { value: 'coinbase', label: 'Coinbase' }
    ];
  }

  if (indicesMarkets.includes(market)) {
    return [
      { value: 'ftmo', label: 'FTMO' },
      { value: 'topstep', label: 'TopStep' },
      { value: 'apex', label: 'Apex' }
    ];
  }

  return [];
}

export function getDefaultPlatformForMarket(market) {
  const cryptoMarkets = ['BTC', 'ETH'];
  const indicesMarkets = ['NASDAQ', 'GOLD', 'SP500'];

  if (cryptoMarkets.includes(market)) {
    return 'binance';
  }

  if (indicesMarkets.includes(market)) {
    return 'ftmo';
  }

  return null;
}

export function isPlatformCompatible(market, platform) {
  const compatiblePlatforms = getCompatiblePlatforms(market);
  return compatiblePlatforms.some(p => p.value === platform.toLowerCase());
}
