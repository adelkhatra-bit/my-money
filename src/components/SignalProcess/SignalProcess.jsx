import React, { useState, useEffect } from 'react';
import styles from './SignalProcess.module.css';

const SignalProcess = ({
  isScanning,
  preAlert,
  signal,
  onAcceptSignal,
  onDeclineSignal,
  userCredits
}) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [userReady, setUserReady] = useState(false);

  useEffect(() => {
    if (signal && signal.validUntil) {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, signal.validUntil - now);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [signal]);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!userCredits || userCredits === 0) {
    return null;
  }

  if (isScanning) {
    return (
      <div className={styles.scanningOverlay}>
        <div className={styles.scanningBox}>
          <div className={styles.spinner}></div>
          <h3>Scan en cours...</h3>
          <p>Recherche d'une position optimale</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>
      </div>
    );
  }

  if (preAlert && !userReady) {
    return (
      <div className={styles.preAlertOverlay}>
        <div className={styles.preAlertBox}>
          <div className={styles.warningIcon}>⚠️</div>
          <h3>Signal bientôt disponible</h3>
          <p>Une opportunité arrive dans <strong>3 minutes</strong></p>
          <p className={styles.stayReadyText}>Reste devant l'écran</p>
          <div className={styles.buttonGroup}>
            <button
              className={styles.readyBtn}
              onClick={() => setUserReady(true)}
            >
              OK - Je suis prêt
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => onDeclineSignal()}
            >
              Pas maintenant
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (signal && timeRemaining !== null) {
    const isExpired = timeRemaining === 0;

    if (isExpired) {
      return (
        <div className={styles.expiredOverlay}>
          <div className={styles.expiredBox}>
            <div className={styles.stopIcon}>⛔</div>
            <h3>Trop tard</h3>
            <p>Entrée verrouillée. La fenêtre de validité est expirée.</p>
            <p className={styles.nextSignalText}>Attends le prochain signal...</p>
            <button
              className={styles.okBtn}
              onClick={() => onDeclineSignal()}
            >
              Compris
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.signalOverlay}>
        <div className={styles.signalBox}>
          <div className={styles.signalHeader}>
            <div className={`${styles.signalBadge} ${styles[signal.direction.toLowerCase()]}`}>
              {signal.direction === 'LONG' ? '🟢 BUY CONFIRMÉ' : '🔴 SELL CONFIRMÉ'}
            </div>
            <div className={styles.timer}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
          </div>

          <div className={styles.signalDetails}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Marché :</span>
              <span className={styles.value}>{signal.market}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Plateforme :</span>
              <span className={styles.value}>{signal.platform}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Timeframe :</span>
              <span className={styles.value}>{signal.timeframe}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Zone d'entrée :</span>
              <span className={styles.value}>{signal.entryMin} - {signal.entryMax}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Stop Loss :</span>
              <span className={styles.value}>{signal.sl}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Take Profit :</span>
              <span className={styles.value}>
                TP1: {signal.tp1} {signal.tp2 && `| TP2: ${signal.tp2}`}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Lots conseillés :</span>
              <span className={styles.value}>{signal.lots}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Risque :</span>
              <span className={styles.value}>{signal.risk}%</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Confiance :</span>
              <span className={styles.value}>{signal.confidence}%</span>
            </div>
          </div>

          <div className={styles.entryStatus}>
            ✅ Entrée encore possible
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={styles.acceptBtn}
              onClick={() => onAcceptSignal(signal)}
            >
              OK - Je prends la position
            </button>
            <button
              className={styles.declineBtn}
              onClick={() => onDeclineSignal()}
            >
              Refuser
            </button>
          </div>

          <div className={styles.creditInfo}>
            1 position sera débitée si vous acceptez
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SignalProcess;
