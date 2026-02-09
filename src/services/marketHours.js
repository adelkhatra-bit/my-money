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
    if (day === 6) {
      console.log(`[Market Hours] ${market} fermé - Samedi`);
      return false;
    }

    if (day === 5 && hours >= 17) {
      console.log(`[Market Hours] ${market} fermé - Vendredi après 17h00 ET`);
      return false;
    }

    if (day === 0 && hours < 18) {
      console.log(`[Market Hours] ${market} fermé - Dimanche avant 18h00 ET`);
      return false;
    }

    if (day === 1 && hours < 18 && totalMinutes >= 17 * 60 && totalMinutes < 18 * 60) {
      console.log(`[Market Hours] ${market} fermé - Pause quotidienne 17h00-18h00 ET`);
      return false;
    }

    if (day >= 2 && day <= 5 && totalMinutes >= 17 * 60 && totalMinutes < 18 * 60) {
      console.log(`[Market Hours] ${market} fermé - Pause quotidienne 17h00-18h00 ET`);
      return false;
    }

    console.log(`[Market Hours] ${market} ouvert - Futures trading 24h (dimanche 18h00 ET - vendredi 17h00 ET)`);
    return true;
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
  const totalMinutes = hours * 60 + minutes;

  if (day === 0 && hours < 18) {
    return { open: false, message: 'Marché fermé (dimanche) - Ouverture à 18h00 ET (minuit heure FR)' };
  }

  if (day === 6) {
    return { open: false, message: 'Marché fermé (samedi) - Réouverture dimanche 18h00 ET (minuit heure FR)' };
  }

  if (day === 5 && hours >= 17) {
    return { open: false, message: 'Marché fermé (vendredi soir) - Réouverture dimanche 18h00 ET (minuit heure FR)' };
  }

  if (totalMinutes >= 17 * 60 && totalMinutes < 18 * 60) {
    return { open: false, message: 'Pause quotidienne (17h00-18h00 ET) - Réouverture dans quelques minutes' };
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
  const totalMinutes = hours * 60 + estDate.getMinutes();

  if (day === 6) {
    return 'Dimanche 18h00 ET (minuit heure FR)';
  }
  if (day === 0 && hours < 18) {
    return 'Dimanche 18h00 ET (minuit heure FR)';
  }
  if (day === 5 && hours >= 17) {
    return 'Dimanche 18h00 ET (minuit heure FR)';
  }
  if (totalMinutes >= 17 * 60 && totalMinutes < 18 * 60) {
    return "Aujourd'hui 18h00 ET";
  }

  return 'Marché ouvert presque 24h/24';
};
