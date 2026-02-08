import React, { useEffect } from 'react';
import styles from './TrailingStopPopup.module.css';

const TrailingStopPopup = ({ show, direction, oldSL, newSL, currentPrice, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const gain = direction === 'LONG'
    ? ((currentPrice - oldSL) / oldSL * 100).toFixed(2)
    : ((oldSL - currentPrice) / oldSL * 100).toFixed(2);

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <div className={styles.icon}>🛡️</div>
          <h3>STOP LOSS SÉCURISÉ</h3>
        </div>

        <div className={styles.content}>
          <div className={styles.gainBadge}>
            +{gain}% de gains protégés
          </div>

          <div className={styles.slChange}>
            <div className={styles.slRow}>
              <span className={styles.label}>Ancien SL:</span>
              <span className={styles.oldValue}>{oldSL.toFixed(5)}</span>
            </div>

            <div className={styles.arrow}>↓</div>

            <div className={styles.slRow}>
              <span className={styles.label}>Nouveau SL:</span>
              <span className={styles.newValue}>{newSL.toFixed(5)}</span>
            </div>
          </div>

          <div className={styles.info}>
            <p>✅ Vos gains sont maintenant sécurisés</p>
            <p>📈 Prix actuel: {currentPrice.toFixed(5)}</p>
            <p>🎯 Direction: {direction}</p>
          </div>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          OK, Compris
        </button>
      </div>
    </div>
  );
};

export default TrailingStopPopup;
