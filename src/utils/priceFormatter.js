export const formatPrice = (price, decimals = 2) => {
  if (!price || isNaN(price)) return 0;
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

export const displayPrice = (price, decimals = 2) => {
  const formatted = formatPrice(price, decimals);
  return formatted.toFixed(decimals);
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
