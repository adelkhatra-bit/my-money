import React from 'react';
import styles from './ScanOpportunity.module.css';

const ScanOpportunity = ({ opportunity, onConfirm, onDismiss }) => {
  if (!opportunity) return null;

  const {
    direction,
    entry_min,
    entry_max,
    stop_loss,
    take_profit_1,
    take_profit_2,
    market,
    confidence = 75,
    currentPrice
  } = opportunity;

  const isLong = direction === 'LONG';
  const entryZone = (entry_min + entry_max) / 2;

  const riskReward = Math.abs((take_profit_1 - entryZone) / (entryZone - stop_loss)).toFixed(2);
  const distanceToEntry = currentPrice ? Math.abs(((currentPrice - entryZone) / entryZone) * 100).toFixed(2) : '0.00';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {isLong ? '🟢 Opportunité LONG' : '🔴 Opportunité SHORT'}
        </h3>
        <div className={styles.confidence}>
          Confiance: <span className={styles.confidenceValue}>{confidence}%</span>
        </div>
      </div>

      <div className={styles.market}>{market}</div>

      <div className={styles.visualZone}>
        <div className={styles.priceLevel} style={{ '--color': '#4caf50' }}>
          <span className={styles.levelLabel}>TP2</span>
          <span className={styles.levelPrice}>{take_profit_2?.toFixed(5) || '-'}</span>
        </div>
        <div className={styles.priceLevel} style={{ '--color': '#00e676' }}>
          <span className={styles.levelLabel}>🎯 TP1</span>
          <span className={styles.levelPrice}>{take_profit_1.toFixed(5)}</span>
        </div>
        <div className={`${styles.entryZone} ${isLong ? styles.long : styles.short}`}>
          <div className={styles.entryLine}>
            <span className={styles.levelLabel}>Zone Max</span>
            <span className={styles.levelPrice}>{entry_max.toFixed(5)}</span>
          </div>
          <div className={styles.entryCenter}>
            <span className={styles.levelLabel}>{isLong ? '🟢 ENTRÉE' : '🔴 ENTRÉE'}</span>
            <span className={styles.levelPrice}>{entryZone.toFixed(5)}</span>
          </div>
          <div className={styles.entryLine}>
            <span className={styles.levelLabel}>Zone Min</span>
            <span className={styles.levelPrice}>{entry_min.toFixed(5)}</span>
          </div>
        </div>
        <div className={styles.priceLevel} style={{ '--color': '#f44336' }}>
          <span className={styles.levelLabel}>🛑 SL</span>
          <span className={styles.levelPrice}>{stop_loss.toFixed(5)}</span>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Risk/Reward</span>
          <span className={styles.statValue}>1:{riskReward}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Distance</span>
          <span className={styles.statValue}>{distanceToEntry}%</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.dismissBtn} onClick={onDismiss}>
          Ignorer
        </button>
        <button className={styles.confirmBtn} onClick={onConfirm}>
          Confirmer et Ouvrir
        </button>
      </div>

      <p className={styles.warning}>
        ⚠️ Attendez que le prix entre dans la zone avant de confirmer
      </p>
    </div>
  );
};

export default ScanOpportunity;
