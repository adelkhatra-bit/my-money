export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'UTC';
  }
};

export const convertETToLocal = (etHour, etMinute = 0) => {
  const etDate = new Date();
  etDate.setHours(etHour, etMinute, 0, 0);

  const etString = etDate.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  const userTz = getUserTimezone();
  const localString = etDate.toLocaleString('en-US', {
    timeZone: userTz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  return localString;
};

export const getTimezoneLabel = () => {
  const userTz = getUserTimezone();
  const now = new Date();
  const tzAbbr = now.toLocaleTimeString('en-US', {
    timeZone: userTz,
    timeZoneName: 'short'
  }).split(' ').pop();

  return tzAbbr;
};

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

  const userTz = getUserTimezone();
  const localTime = now.toLocaleTimeString('en-US', {
    timeZone: userTz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  console.log(`[Market Hours] Heure locale (${userTz}): ${localTime}, ET: ${hours}:${minutes.toString().padStart(2, '0')}, jour: ${day}`);

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

    console.log(`[Market Hours] ${market} ouvert - NQ/MGC FUTURES (TopStep/Apex) - 23h/24 sauf samedi + pause 17h-18h ET`);
    return true;
  }

  console.log(`[Market Hours] ${market} - Marché non reconnu ou fermé`);
  return false;
};

export const getMarketType = (market) => {
  if (market === 'NASDAQ') {
    return 'NQ_FUTURES';
  }
  if (market === 'GOLD') {
    return 'MGC_FUTURES';
  }
  if (market === 'BTC' || market === 'ETH') {
    return 'CRYPTO_24_7';
  }
  return 'UNKNOWN';
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

  const tzLabel = getTimezoneLabel();
  const openingTimeLocal = convertETToLocal(18, 0);
  const closingTimeLocal = convertETToLocal(17, 0);
  const pauseStart = convertETToLocal(17, 0);
  const pauseEnd = convertETToLocal(18, 0);

  if (day === 0 && hours < 18) {
    return {
      open: false,
      message: `Marché fermé (dimanche) - Ouverture à ${openingTimeLocal} ${tzLabel}`
    };
  }

  if (day === 6) {
    return {
      open: false,
      message: `Marché fermé (samedi) - Réouverture dimanche ${openingTimeLocal} ${tzLabel}`
    };
  }

  if (day === 5 && hours >= 17) {
    return {
      open: false,
      message: `Marché fermé (vendredi soir) - Réouverture dimanche ${openingTimeLocal} ${tzLabel}`
    };
  }

  if (totalMinutes >= 17 * 60 && totalMinutes < 18 * 60) {
    return {
      open: false,
      message: `Pause quotidienne (${pauseStart}-${pauseEnd} ${tzLabel}) - Réouverture dans quelques minutes`
    };
  }

  return { open: false, message: 'Marché fermé (hors horaires de trading)' };
};

export const getMarketCountdown = (market) => {
  if (market === 'BTC' || market === 'ETH') {
    return null;
  }

  const now = new Date();
  const nowET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = nowET.getDay();
  const hours = nowET.getHours();
  const minutes = nowET.getMinutes();

  let targetET = new Date(nowET);

  if (day === 6) {
    const daysUntilSunday = 1;
    targetET.setDate(nowET.getDate() + daysUntilSunday);
    targetET.setHours(18, 0, 0, 0);
  } else if (day === 0 && hours < 18) {
    targetET.setHours(18, 0, 0, 0);
  } else if (day === 5 && hours >= 17) {
    targetET.setDate(nowET.getDate() + 2);
    targetET.setHours(18, 0, 0, 0);
  } else if (hours * 60 + minutes >= 17 * 60 && hours * 60 + minutes < 18 * 60) {
    targetET.setHours(18, 0, 0, 0);
  } else {
    return null;
  }

  const targetETString = targetET.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const targetLocal = new Date(targetETString);

  const diffMs = targetLocal - now;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return `${days}j ${remainingHours}h ${remainingMinutes}m`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${remainingMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
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

  const tzLabel = getTimezoneLabel();
  const openingTimeLocal = convertETToLocal(18, 0);
  const countdown = getMarketCountdown(market);

  if (day === 6) {
    return `Dimanche ${openingTimeLocal} ${tzLabel}${countdown ? ` (dans ${countdown})` : ''}`;
  }
  if (day === 0 && hours < 18) {
    return `Dimanche ${openingTimeLocal} ${tzLabel}${countdown ? ` (dans ${countdown})` : ''}`;
  }
  if (day === 5 && hours >= 17) {
    return `Dimanche ${openingTimeLocal} ${tzLabel}${countdown ? ` (dans ${countdown})` : ''}`;
  }
  if (totalMinutes >= 17 * 60 && totalMinutes < 18 * 60) {
    return `Aujourd'hui ${convertETToLocal(18, 0)} ${tzLabel}${countdown ? ` (dans ${countdown})` : ''}`;
  }

  return 'Marché ouvert presque 24h/24';
};
