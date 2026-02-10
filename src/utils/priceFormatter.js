const MARKET_DECIMALS = {
  MNQ: 2,
  NASDAQ: 2,
  MGC: 2,
  GOLD: 2,
  BTC: 2,
  ETH: 2,
};

export const getMarketDecimals = (market) => {
  return MARKET_DECIMALS[market] || 2;
};

export const formatPrice = (price, market = null) => {
  if (!price || isNaN(price)) return 0;
  const decimals = market ? getMarketDecimals(market) : 2;
  return parseFloat(Number(price).toFixed(decimals));
};

export const formatPnL = (pnl, decimals = 2) => {
  if (!pnl || isNaN(pnl)) return 0;
  return parseFloat(Number(pnl).toFixed(decimals));
};

export const formatPercentage = (percentage, decimals = 2) => {
  if (!percentage || isNaN(percentage)) return 0;
  return parseFloat(Number(percentage).toFixed(decimals));
};

export const displayPrice = (price, market = null) => {
  const decimals = market ? getMarketDecimals(market) : 2;
  const formatted = formatPrice(price, market);
  return `$${formatted.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

export const displayPnL = (pnl, decimals = 2) => {
  const formatted = formatPnL(pnl, decimals);
  const sign = formatted >= 0 ? '+' : '';
  return `${sign}$${formatted.toFixed(decimals)}`;
};

export const displayPercentage = (percentage, decimals = 2) => {
  const formatted = formatPercentage(percentage, decimals);
  const sign = formatted >= 0 ? '+' : '';
  return `${sign}${formatted.toFixed(decimals)}%`;
};
