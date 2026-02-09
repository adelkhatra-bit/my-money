const MARKET_DECIMALS = {
  BTC: 2,
  ETH: 2,
  NASDAQ: 2,
  GOLD: 2,
  SP500: 2,
  FOREX: 5
};

const MARKET_TICK_SIZES = {
  BTC: 0.01,
  ETH: 0.01,
  NASDAQ: 0.25,
  GOLD: 0.1,
  SP500: 0.25,
  FOREX: 0.00001
};

export function formatPrice(price, market) {
  if (price === null || price === undefined || isNaN(price)) {
    return '0.00';
  }

  const decimals = MARKET_DECIMALS[market] || 2;
  return parseFloat(price).toFixed(decimals);
}

export function roundToTickSize(price, market) {
  const tickSize = MARKET_TICK_SIZES[market] || 0.01;
  return Math.round(price / tickSize) * tickSize;
}

export function getTickSize(market) {
  return MARKET_TICK_SIZES[market] || 0.01;
}

export function getDecimals(market) {
  return MARKET_DECIMALS[market] || 2;
}

export function formatPriceWithSymbol(price, market, currency = 'USD') {
  const formatted = formatPrice(price, market);

  if (currency === 'USD') {
    return `$${formatted}`;
  } else if (currency === 'EUR') {
    return `€${formatted}`;
  }

  return `${formatted} ${currency}`;
}

export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }

  return `${parseFloat(value).toFixed(decimals)}%`;
}

export function formatCompact(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const absValue = Math.abs(value);

  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  } else if (absValue >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }

  return value.toFixed(2);
}
