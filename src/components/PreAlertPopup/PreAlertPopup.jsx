import React, { useState, useEffect } from 'react';
import { audioAlerts } from '../../services/audioAlerts';
import styles from './PreAlertPopup.module.css';

const PreAlertPopup = ({ market, platform, expectedDirection, timeRemaining, onClose }) => {
  const [countdown, setCountdown] = useState(timeRemaining || 300);

  useEffect(() => {
    audioAlerts.playAlert('pre_alert');
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.icon}>⚠️</div>

        <h2 className={styles.title}>Prépare-toi</h2>

        <p className={styles.message}>
          Une opportunité est en préparation
        </p>

        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.label}>Marché</span>
            <span className={styles.value}>{market}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Plateforme</span>
            <span className={styles.value}>{platform}</span>
          </div>
          {expectedDirection && (
            <div className={styles.detailItem}>
              <span className={styles.label}>Direction probable</span>
              <span className={`${styles.value} ${styles[expectedDirection.toLowerCase()]}`}>
                {expectedDirection}
              </span>
            </div>
          )}
        </div>

        <div className={styles.countdown}>
          <div className={styles.countdownLabel}>Confirmation dans</div>
          <div className={styles.countdownValue}>{formatTime(countdown)}</div>
        </div>

        <p className={styles.note}>
          Les analyses vont apparaître progressivement. Attendez la confirmation avant d'entrer en position.
        </p>
      </div>
    </div>
  );
};

export default PreAlertPopup;
