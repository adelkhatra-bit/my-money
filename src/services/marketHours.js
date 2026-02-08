export const isMarketOpen = (market) => {
  const now = new Date();
  const day = now.getUTCDay();
  const hours = now.getUTCHours();

  if (market === 'BTC' || market === 'ETH') {
    return true;
  }

  if (market === 'NASDAQ' || market === 'GOLD') {
    if (day === 0 || day === 6) {
      return false;
    }

    if (market === 'NASDAQ') {
      const estHours = (hours - 5 + 24) % 24;
      return estHours >= 9 && estHours < 16;
    }

    if (market === 'GOLD') {
      const estHours = (hours - 5 + 24) % 24;
      return estHours >= 8 && estHours < 17;
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
