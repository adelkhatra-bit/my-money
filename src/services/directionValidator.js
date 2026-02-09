export const DIRECTION = {
  LONG: 'LONG',
  SHORT: 'SHORT'
};

export function validateDirection(entry, tp1, tp2, stopLoss) {
  const avgTP = (tp1 + tp2) / 2;

  if (avgTP > entry) {
    if (stopLoss >= entry) {
      throw new Error(
        `Direction LONG détectée (TP > Entry) mais SL est au-dessus de l'entrée. ` +
        `Entry: ${entry.toFixed(2)}, TP moyen: ${avgTP.toFixed(2)}, SL: ${stopLoss.toFixed(2)}. ` +
        `Pour un LONG, le SL DOIT être en dessous de l'entrée.`
      );
    }
    return DIRECTION.LONG;
  }

  if (avgTP < entry) {
    if (stopLoss <= entry) {
      throw new Error(
        `Direction SHORT détectée (TP < Entry) mais SL est en dessous de l'entrée. ` +
        `Entry: ${entry.toFixed(2)}, TP moyen: ${avgTP.toFixed(2)}, SL: ${stopLoss.toFixed(2)}. ` +
        `Pour un SHORT, le SL DOIT être au-dessus de l'entrée.`
      );
    }
    return DIRECTION.SHORT;
  }

  throw new Error(
    `Impossible de déterminer la direction: TP moyen (${avgTP.toFixed(2)}) égal à l'entrée (${entry.toFixed(2)})`
  );
}

export function calculateStopLoss(entry, direction, riskAmount, positionSize, tickValue) {
  const slDistance = riskAmount / (positionSize * tickValue);

  if (direction === DIRECTION.LONG) {
    return entry - slDistance;
  } else {
    return entry + slDistance;
  }
}

export function enforceDirectionRules(signal) {
  const { entry, tp1, tp2, stopLoss } = signal;

  if (!entry || !tp1 || !tp2 || !stopLoss) {
    throw new Error('Données incomplètes: entry, tp1, tp2 et stopLoss sont obligatoires');
  }

  const avgTP = (tp1 + tp2) / 2;

  let detectedDirection;
  if (avgTP > entry) {
    detectedDirection = DIRECTION.LONG;
  } else if (avgTP < entry) {
    detectedDirection = DIRECTION.SHORT;
  } else {
    throw new Error('TP moyen égal à l\'entrée: impossible de déterminer la direction');
  }

  let correctedSL = stopLoss;

  if (detectedDirection === DIRECTION.LONG) {
    if (stopLoss >= entry) {
      const slDistance = Math.abs(tp1 - entry) * 0.5;
      correctedSL = entry - slDistance;
      console.warn(
        `CORRECTION APPLIQUÉE: LONG détecté mais SL était au-dessus. ` +
        `SL original: ${stopLoss.toFixed(2)}, SL corrigé: ${correctedSL.toFixed(2)}`
      );
    }
  } else {
    if (stopLoss <= entry) {
      const slDistance = Math.abs(entry - tp1) * 0.5;
      correctedSL = entry + slDistance;
      console.warn(
        `CORRECTION APPLIQUÉE: SHORT détecté mais SL était en dessous. ` +
        `SL original: ${stopLoss.toFixed(2)}, SL corrigé: ${correctedSL.toFixed(2)}`
      );
    }
  }

  return {
    ...signal,
    direction: detectedDirection,
    stopLoss: correctedSL,
    corrected: correctedSL !== stopLoss
  };
}

export function validateSignalCoherence(signal) {
  const { entry, tp1, tp2, stopLoss, direction } = signal;

  const errors = [];

  const avgTP = (tp1 + tp2) / 2;

  if (direction === DIRECTION.LONG) {
    if (avgTP <= entry) {
      errors.push(`LONG: TP moyen (${avgTP.toFixed(2)}) doit être AU-DESSUS de l'entrée (${entry.toFixed(2)})`);
    }
    if (tp1 <= entry) {
      errors.push(`LONG: TP1 (${tp1.toFixed(2)}) doit être AU-DESSUS de l'entrée (${entry.toFixed(2)})`);
    }
    if (tp2 <= entry) {
      errors.push(`LONG: TP2 (${tp2.toFixed(2)}) doit être AU-DESSUS de l'entrée (${entry.toFixed(2)})`);
    }
    if (stopLoss >= entry) {
      errors.push(`LONG: SL (${stopLoss.toFixed(2)}) doit être EN DESSOUS de l'entrée (${entry.toFixed(2)})`);
    }
  }

  else if (direction === DIRECTION.SHORT) {
    if (avgTP >= entry) {
      errors.push(`SHORT: TP moyen (${avgTP.toFixed(2)}) doit être EN DESSOUS de l'entrée (${entry.toFixed(2)})`);
    }
    if (tp1 >= entry) {
      errors.push(`SHORT: TP1 (${tp1.toFixed(2)}) doit être EN DESSOUS de l'entrée (${entry.toFixed(2)})`);
    }
    if (tp2 >= entry) {
      errors.push(`SHORT: TP2 (${tp2.toFixed(2)}) doit être EN DESSOUS de l'entrée (${entry.toFixed(2)})`);
    }
    if (stopLoss <= entry) {
      errors.push(`SHORT: SL (${stopLoss.toFixed(2)}) doit être AU-DESSUS de l'entrée (${entry.toFixed(2)})`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Signal incohérent:\n${errors.join('\n')}`);
  }

  return true;
}

export function getDirectionColor(direction) {
  return direction === DIRECTION.LONG ? '#22c55e' : '#ef4444';
}

export function getDirectionLabel(direction) {
  return direction === DIRECTION.LONG ? 'LONG (Achat)' : 'SHORT (Vente)';
}
