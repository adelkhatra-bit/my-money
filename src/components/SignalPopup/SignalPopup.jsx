import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './SignalPopup.module.css';

const SignalPopup = ({ signal, riskCalc, onAccept, onReject, onDismiss }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!signal) return;

    const updateTimer = () => {
      const now = new Date();
      const validUntil = new Date(signal.valid_until);
      const remaining = Math.max(0, Math.floor((validUntil - now) / 1000));

      setTimeRemaining(remaining);
      setIsExpired(remaining === 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [signal]);

  if (!signal) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const directionColor = signal.direction === 'LONG' ? '#00e676' : '#e91e63';
  const progressPercent = (timeRemaining / (10 * 60)) * 100;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header} style={{ borderColor: directionColor }}>
          <h2 style={{ color: directionColor }}>
            {signal.direction} CONFIRMÉ
          </h2>
          <div className={styles.market}>
            {signal.market} • {signal.platform} • {signal.timeframe}
          </div>
        </div>

        <div className={styles.timer}>
          <div className={styles.timerLabel}>Temps restant</div>
          <div className={`${styles.timerValue} ${isExpired ? styles.expired : ''}`}>
            {formatTime(timeRemaining)}
          </div>
          <div className={styles.timerBar}>
            <div
              className={styles.timerProgress}
              style={{
                width: `${progressPercent}%`,
                background: isExpired ? '#e91e63' : directionColor
              }}
            />
          </div>
        </div>

        {isExpired && (
          <div className={styles.expiredWarning}>
            ⚠️ Signal expiré - Ne pas entrer en position
          </div>
        )}

        <div className={styles.priceInfo}>
          <div className={styles.priceRow}>
            <span className={styles.label}>Zone d'entrée:</span>
            <span className={styles.value}>
              {signal.entry_min.toFixed(2)} - {signal.entry_max.toFixed(2)}
            </span>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.label}>Stop Loss:</span>
            <span className={styles.value} style={{ color: '#e91e63' }}>
              {signal.stop_loss.toFixed(2)}
            </span>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.label}>Take Profit 1:</span>
            <span className={styles.value} style={{ color: '#00e676' }}>
              {signal.take_profit_1.toFixed(2)}
            </span>
          </div>
          {signal.take_profit_2 && (
            <div className={styles.priceRow}>
              <span className={styles.label}>Take Profit 2:</span>
              <span className={styles.value} style={{ color: '#00e676' }}>
                {signal.take_profit_2.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {riskCalc && (
          <div className={styles.riskInfo}>
            <div className={styles.riskRow}>
              <span className={styles.label}>Taille position:</span>
              <span className={styles.value}>{riskCalc.positionSize.toFixed(3)} lots</span>
            </div>
            <div className={styles.riskRow}>
              <span className={styles.label}>Risque:</span>
              <span className={styles.value}>
                ${riskCalc.riskAmount.toFixed(2)} ({riskCalc.riskPercent.toFixed(2)}%)
              </span>
            </div>
            <div className={styles.riskRow}>
              <span className={styles.label}>Profit potentiel (TP1):</span>
              <span className={styles.value} style={{ color: '#00e676' }}>
                ${riskCalc.potentialProfit1.toFixed(2)}
              </span>
            </div>
            <div className={styles.riskRow}>
              <span className={styles.label}>Risk/Reward:</span>
              <span className={styles.value}>
                {signal.risk_reward.toFixed(2)}:1
              </span>
            </div>
          </div>
        )}

        <div className={styles.confidence}>
          <div className={styles.confidenceLabel}>Confiance: {signal.confidence}%</div>
          <div className={styles.confidenceBar}>
            <div
              className={styles.confidenceProgress}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
        </div>

        <div className={styles.reasons}>
          <div className={styles.reasonsTitle}>Pourquoi cette position:</div>
          <ul className={styles.reasonsList}>
            {signal.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>

        {riskCalc && riskCalc.warnings.length > 0 && (
          <div className={styles.warnings}>
            {riskCalc.warnings.map((warning, index) => (
              <div key={index} className={styles.warning}>
                {warning}
              </div>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          {onDismiss && (
            <button
              className={styles.dismissBtn}
              onClick={onDismiss}
            >
              C'est bon, j'ai compris
            </button>
          )}
          <button
            className={styles.rejectBtn}
            onClick={onReject}
          >
            REFUSER
          </button>
          <button
            className={`${styles.acceptBtn} ${isExpired ? styles.disabled : ''}`}
            onClick={isExpired ? null : onAccept}
            disabled={isExpired}
          >
            ACCEPTER
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignalPopup;
