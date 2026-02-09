export const isMarketOpen = (market) => {
  const now = new Date();
  const day = now.getUTCDay();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (market === 'BTC' || market === 'ETH') {
    return true;
  }

  if (market === 'NASDAQ' || market === 'GOLD') {
    if (day === 0 || day === 6) {
      console.log(`[Market Hours] ${market} fermé - Week-end (jour ${day})`);
      return false;
    }

    if (day === 5 && hours >= 21) {
      console.log(`[Market Hours] ${market} fermé - Vendredi après 21h UTC`);
      return false;
    }

    if (day === 1 && (hours < 14 || (hours === 14 && minutes < 30))) {
      console.log(`[Market Hours] ${market} fermé - Lundi avant 14h30 UTC (9h30 ET)`);
      return false;
    }

    if (market === 'NASDAQ') {
      const marketOpenMinutes = 14 * 60 + 30;
      const marketCloseMinutes = 21 * 60;
      const isOpen = totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;

      if (!isOpen) {
        console.log(`[Market Hours] NASDAQ fermé - Hors horaires (${hours}:${minutes.toString().padStart(2, '0')} UTC, ouvert 14:30-21:00 UTC)`);
      }

      return isOpen;
    }

    if (market === 'GOLD') {
      const marketOpenMinutes = 13 * 60;
      const marketCloseMinutes = 22 * 60;
      const isOpen = totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;

      if (!isOpen) {
        console.log(`[Market Hours] GOLD fermé - Hors horaires (${hours}:${minutes.toString().padStart(2, '0')} UTC, ouvert 13:00-22:00 UTC)`);
      }

      return isOpen;
    }
  }

  console.log(`[Market Hours] ${market} - Marché non reconnu ou fermé`);
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
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();

  if (day === 0) {
    return { open: false, message: 'Marché fermé (dimanche) - Réouverture lundi 9h30 ET' };
  }

  if (day === 6) {
    return { open: false, message: 'Marché fermé (samedi) - Réouverture lundi 9h30 ET' };
  }

  if (day === 5 && hours >= 21) {
    return { open: false, message: 'Marché fermé (vendredi soir) - Réouverture lundi 9h30 ET' };
  }

  if (day === 1 && (hours < 14 || (hours === 14 && minutes < 30))) {
    return { open: false, message: 'Marché fermé (lundi matin) - Ouverture à 9h30 ET (14h30 UTC)' };
  }

  if (market === 'NASDAQ') {
    if (hours < 14 || (hours === 14 && minutes < 30)) {
      return { open: false, message: 'NASDAQ fermé - Ouverture à 9h30 ET (14h30 UTC)' };
    }
    if (hours >= 21) {
      return { open: false, message: 'NASDAQ fermé - Session terminée. Réouverture demain 9h30 ET' };
    }
  }

  if (market === 'GOLD') {
    if (hours < 13) {
      return { open: false, message: 'GOLD fermé - Ouverture à 8h00 ET (13h00 UTC)' };
    }
    if (hours >= 22) {
      return { open: false, message: 'GOLD fermé - Session terminée. Réouverture demain 8h00 ET' };
    }
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
