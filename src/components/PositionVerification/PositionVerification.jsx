import { useState, useEffect } from 'react';
import styles from './PositionVerification.module.css';

export default function PositionVerification({
  signal,
  account,
  onConfirm,
  onCancel,
  visible = false
}) {
  const [calculation, setCalculation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible || !signal || !account) return;

    calculatePosition();
  }, [visible, signal, account]);

  const calculatePosition = () => {
    try {
      const isLong = signal.direction === 'LONG';
      const entryPrice = signal.entry || (signal.entry_min + signal.entry_max) / 2;
      const stopLoss = signal.stop_loss;
      const tp1 = signal.take_profit_1;
      const tp2 = signal.take_profit_2;

      const accountCapital = parseFloat(account.capital);
      const riskPercent = parseFloat(account.risk_per_trade_percent);
      const currency = account.currency || 'USD';

      const riskAmount = (accountCapital * riskPercent) / 100;

      const stopLossDistance = Math.abs(entryPrice - stopLoss);
      const pointValue = 1;
      const contractSize = Math.floor(riskAmount / (stopLossDistance * pointValue));

      const tp1Distance = Math.abs(tp1 - entryPrice);
      const potentialGainTP1 = tp1Distance * contractSize * pointValue;

      let potentialGainTP2 = 0;
      if (tp2) {
        const tp2Distance = Math.abs(tp2 - entryPrice);
        potentialGainTP2 = tp2Distance * contractSize * pointValue;
      }

      const riskReward1 = potentialGainTP1 / riskAmount;
      const riskReward2 = tp2 ? potentialGainTP2 / riskAmount : 0;

      const priceCheck = isLong
        ? (tp1 > entryPrice && entryPrice > stopLoss)
        : (stopLoss > entryPrice && entryPrice > tp1);

      if (!priceCheck) {
        setError('Incohérence prix/timeframe — Vérification requise');
        return;
      }

      setCalculation({
        currency,
        contractSize,
        riskAmount,
        potentialGainTP1,
        potentialGainTP2,
        riskReward1,
        riskReward2,
        entryPrice,
        stopLoss,
        tp1,
        tp2,
        isLong
      });
      setError(null);
    } catch (err) {
      console.error('Error calculating position:', err);
      setError('Erreur de calcul — Vérifiez les paramètres');
    }
  };

  if (!visible) return null;

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorMessage}>{error}</div>
          <button onClick={onCancel} className={styles.errorBtn}>
            Fermer
          </button>
        </div>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Calcul en cours...</div>
      </div>
    );
  }

  const currencySymbol = calculation.currency === 'EUR' ? '€' : '$';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Vérification Position</h3>
        <button onClick={onCancel} className={styles.closeBtn}>✕</button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h4>Direction</h4>
          <div className={`${styles.directionBadge} ${styles[calculation.isLong ? 'long' : 'short']}`}>
            {calculation.isLong ? '🟢 LONG ↑' : '🔴 SHORT ↓'}
          </div>
        </div>

        <div className={styles.section}>
          <h4>Taille Position</h4>
          <div className={styles.bigValue}>{calculation.contractSize} contrats</div>
        </div>

        <div className={styles.section}>
          <h4>Risque</h4>
          <div className={`${styles.bigValue} ${styles.red}`}>
            -{currencySymbol}{calculation.riskAmount.toFixed(2)}
          </div>
          <div className={styles.subtext}>
            {account.risk_per_trade_percent}% du capital
          </div>
        </div>

        <div className={styles.section}>
          <h4>Potentiel TP1</h4>
          <div className={`${styles.bigValue} ${styles.green}`}>
            +{currencySymbol}{calculation.potentialGainTP1.toFixed(2)}
          </div>
          <div className={styles.subtext}>
            R:R {calculation.riskReward1.toFixed(2)}:1
          </div>
        </div>

        {calculation.tp2 && (
          <div className={styles.section}>
            <h4>Potentiel TP2</h4>
            <div className={`${styles.bigValue} ${styles.green}`}>
              +{currencySymbol}{calculation.potentialGainTP2.toFixed(2)}
            </div>
            <div className={styles.subtext}>
              R:R {calculation.riskReward2.toFixed(2)}:1
            </div>
          </div>
        )}

        <div className={styles.priceTable}>
          <div className={styles.priceRow}>
            <span>Entry:</span>
            <span>{calculation.entryPrice.toFixed(2)}</span>
          </div>
          <div className={styles.priceRow}>
            <span>Stop Loss:</span>
            <span className={styles.red}>{calculation.stopLoss.toFixed(2)}</span>
          </div>
          <div className={styles.priceRow}>
            <span>TP1:</span>
            <span className={styles.green}>{calculation.tp1.toFixed(2)}</span>
          </div>
          {calculation.tp2 && (
            <div className={styles.priceRow}>
              <span>TP2:</span>
              <span className={styles.green}>{calculation.tp2.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={onConfirm} className={styles.confirmBtn}>
          Entrer en position
        </button>
        <button onClick={onCancel} className={styles.cancelBtn}>
          Annuler
        </button>
      </div>
    </div>
  );
}
