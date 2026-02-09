export const isMarketOpen = (market) => {
  const now = new Date();

  const estFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false
  });

  const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = estDate.getDay();
  const hours = estDate.getHours();
  const minutes = estDate.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  console.log(`[Market Hours] Heure EST: ${hours}:${minutes.toString().padStart(2, '0')}, jour: ${day} (0=dim, 1=lun, 2=mar...)`);

  if (market === 'BTC' || market === 'ETH') {
    return true;
  }

  if (market === 'NASDAQ' || market === 'GOLD') {
    if (day === 0 || day === 6) {
      console.log(`[Market Hours] ${market} fermé - Week-end (jour ${day})`);
      return false;
    }

    if (day === 5 && hours >= 16) {
      console.log(`[Market Hours] ${market} fermé - Vendredi après 16h00 ET`);
      return false;
    }

    if (day === 1 && (hours < 9 || (hours === 9 && minutes < 30))) {
      console.log(`[Market Hours] ${market} fermé - Lundi avant 9h30 ET`);
      return false;
    }

    if (market === 'NASDAQ') {
      const marketOpenMinutes = 9 * 60 + 30;
      const marketCloseMinutes = 16 * 60;
      const isOpen = totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;

      if (!isOpen) {
        console.log(`[Market Hours] NASDAQ fermé - Hors horaires (${hours}:${minutes.toString().padStart(2, '0')} ET, ouvert 9:30-16:00 ET)`);
      }

      return isOpen;
    }

    if (market === 'GOLD') {
      const marketOpenMinutes = 8 * 60;
      const marketCloseMinutes = 17 * 60;
      const isOpen = totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;

      if (!isOpen) {
        console.log(`[Market Hours] GOLD fermé - Hors horaires (${hours}:${minutes.toString().padStart(2, '0')} ET, ouvert 8:00-17:00 ET)`);
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
  const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = estDate.getDay();
  const hours = estDate.getHours();
  const minutes = estDate.getMinutes();

  if (day === 0) {
    return { open: false, message: 'Marché fermé (dimanche) - Réouverture lundi 9h30 ET' };
  }

  if (day === 6) {
    return { open: false, message: 'Marché fermé (samedi) - Réouverture lundi 9h30 ET' };
  }

  if (day === 5 && hours >= 16) {
    return { open: false, message: 'Marché fermé (vendredi soir) - Réouverture lundi 9h30 ET' };
  }

  if (day === 1 && (hours < 9 || (hours === 9 && minutes < 30))) {
    return { open: false, message: 'Marché fermé (lundi matin) - Ouverture à 9h30 ET' };
  }

  if (market === 'NASDAQ') {
    if (hours < 9 || (hours === 9 && minutes < 30)) {
      return { open: false, message: 'NASDAQ fermé - Ouverture à 9h30 ET' };
    }
    if (hours >= 16) {
      return { open: false, message: 'NASDAQ fermé - Session terminée. Réouverture demain 9h30 ET' };
    }
  }

  if (market === 'GOLD') {
    if (hours < 8) {
      return { open: false, message: 'GOLD fermé - Ouverture à 8h00 ET' };
    }
    if (hours >= 17) {
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
  const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = estDate.getDay();
  const hours = estDate.getHours();

  if (day === 6) {
    return 'Lundi 9h30 ET';
  }
  if (day === 0) {
    return 'Lundi 9h30 ET';
  }
  if (day === 5 && hours >= 16) {
    return 'Lundi 9h30 ET';
  }

  return 'Demain 9h30 ET';
};
