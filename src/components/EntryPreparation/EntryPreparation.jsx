import { useState } from 'react';
import styles from './EntryPreparation.module.css';

export default function EntryPreparation({
  signal,
  onVerify,
  onCancel,
  visible = false
}) {
  const [isVerifying, setIsVerifying] = useState(false);

  if (!visible || !signal) return null;

  const handleVerify = async () => {
    setIsVerifying(true);
    if (onVerify) {
      await onVerify(signal);
    }
    setIsVerifying(false);
  };

  const isLong = signal.direction === 'LONG';
  const entryPrice = signal.entry || (signal.entry_min + signal.entry_max) / 2;

  const riskReward = signal.take_profit_1 && signal.stop_loss
    ? Math.abs(signal.take_profit_1 - entryPrice) / Math.abs(entryPrice - signal.stop_loss)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={`${styles.badge} ${styles[isLong ? 'long' : 'short']}`}>
            {isLong ? 'LONG ↑' : 'SHORT ↓'}
          </span>
          <span className={styles.symbol}>{signal.market || signal.symbol}</span>
          <span className={styles.timeframe}>{signal.timeframe}</span>
        </div>
        <button onClick={onCancel} className={styles.closeBtn}>✕</button>
      </div>

      <div className={styles.content}>
        <div className={styles.priceGrid}>
          <div className={styles.priceItem}>
            <span className={styles.label}>Entry</span>
            <span className={styles.value}>{entryPrice.toFixed(2)}</span>
          </div>
          <div className={styles.priceItem}>
            <span className={styles.label}>SL</span>
            <span className={`${styles.value} ${styles.red}`}>
              {signal.stop_loss.toFixed(2)}
            </span>
          </div>
          <div className={styles.priceItem}>
            <span className={styles.label}>TP1</span>
            <span className={`${styles.value} ${styles.green}`}>
              {signal.take_profit_1.toFixed(2)}
            </span>
          </div>
          {signal.take_profit_2 && (
            <div className={styles.priceItem}>
              <span className={styles.label}>TP2</span>
              <span className={`${styles.value} ${styles.green}`}>
                {signal.take_profit_2.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>R:R</span>
            <span className={styles.metricValue}>{riskReward.toFixed(2)}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Distance SL</span>
            <span className={styles.metricValue}>
              {Math.abs(entryPrice - signal.stop_loss).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className={styles.verifyBtn}
        >
          {isVerifying ? 'Vérification...' : 'Vérifier position'}
        </button>
        <button onClick={onCancel} className={styles.cancelBtn}>
          Annuler
        </button>
      </div>
    </div>
  );
}
