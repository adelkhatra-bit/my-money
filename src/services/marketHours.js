export const isMarketOpen = (market) => {
  const now = new Date();
  const day = now.getUTCDay();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();

  if (market === 'BTC' || market === 'ETH') {
    return true;
  }

  if (market === 'NASDAQ' || market === 'GOLD') {
    if (day === 0 || day === 6) {
      return false;
    }

    if (day === 5 && hours >= 21) {
      return false;
    }

    if (day === 1 && hours < 13) {
      return false;
    }

    if (market === 'NASDAQ') {
      const totalMinutes = hours * 60 + minutes;
      const marketOpenMinutes = 14 * 60 + 30;
      const marketCloseMinutes = 21 * 60;
      return totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;
    }

    if (market === 'GOLD') {
      const totalMinutes = hours * 60 + minutes;
      const marketOpenMinutes = 13 * 60;
      const marketCloseMinutes = 22 * 60;
      return totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;
    }
  }

  return false;
};

export const getMarketStatus = (market) => {
  if (isMarketOpen(market)) {
    return { open: true, message: 'Marché ouvert' };
  }

  if (market === 'BTC' || market === 'ETH') {
    return { open: true, message: 'Marché 24/7' };
  }

  const now = new Date();
  const day = now.getUTCDay();

  if (day === 0 || day === 6) {
    return { open: false, message: 'Marché fermé (week-end)' };
  }

  return { open: false, message: 'Marché fermé (hors horaires de trading)' };
};

export const getNextMarketOpen = (market) => {
  if (market === 'BTC' || market === 'ETH') {
    return null;
  }

  const now = new Date();
  const day = now.getUTCDay();

  if (day === 6) {
    return 'Lundi 9h30 ET';
  }
  if (day === 0) {
    return 'Lundi 9h30 ET';
  }

  return 'Demain 9h30 ET';
};
