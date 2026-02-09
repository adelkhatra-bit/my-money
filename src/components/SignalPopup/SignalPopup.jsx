import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { audioAlerts } from '../../services/audioAlerts';
import styles from './SignalPopup.module.css';

const SignalPopup = ({ signal, riskCalc, onAccept, onReject, onDismiss }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    audioAlerts.playAlert('signal');
  }, []);

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

  const entryMid = (signal.entry_min + signal.entry_max) / 2;

  const correctDirection = signal.take_profit_1 > entryMid ? 'LONG' : 'SHORT';
  const isLong = correctDirection === 'LONG';
  const directionColor = isLong ? '#00e676' : '#ef4444';
  const progressPercent = (timeRemaining / (10 * 60)) * 100;

  if (signal.direction !== correctDirection) {
    console.warn('⚠️ [SignalPopup] Direction incorrecte corrigée:', {
      stored: signal.direction,
      correct: correctDirection,
      entry: entryMid.toFixed(5),
      tp1: signal.take_profit_1.toFixed(5)
    });
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header} style={{ borderColor: directionColor }}>
          <h2 style={{ color: directionColor }}>
            {isLong ? '🟢 LONG ↑' : '🔴 SHORT ↓'} CONFIRMÉ
          </h2>
          <div className={styles.market}>
            {signal.market} • {signal.platform} • {signal.timeframe}
          </div>
          <div className={styles.directionExplanation}>
            {isLong ? (
              <span>📈 Achat - Profit si le prix MONTE</span>
            ) : (
              <span>📉 Vente - Profit si le prix DESCEND</span>
            )}
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
                background: isExpired ? '#ef4444' : directionColor
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
          <div className={styles.schemaTitle}>
            {isLong ? '📈 STRUCTURE LONG (ACHAT)' : '📉 STRUCTURE SHORT (VENTE)'}
          </div>

          <div className={styles.visualStructure}>
            <div className={styles.structureBox}>
              {isLong ? (
                <>
                  {signal.take_profit_2 && (
                    <div className={styles.structureLine} style={{ background: 'linear-gradient(135deg, #00e676, #00c853)', color: '#000' }}>
                      🎯 TP2: {signal.take_profit_2.toFixed(2)}
                    </div>
                  )}
                  <div className={styles.structureLine} style={{ background: 'linear-gradient(135deg, #00e676, #00c853)', color: '#000' }}>
                    🎯 TP1: {signal.take_profit_1.toFixed(2)}
                  </div>
                  <div className={styles.structureLine} style={{ background: 'linear-gradient(135deg, #26a69a, #1e8e86)', color: '#fff' }}>
                    🟢 ENTRÉE: {entryMid.toFixed(2)}
                  </div>
                  <div className={styles.structureLine} style={{ background: 'linear-gradient(135deg, #ff1744, #d50000)', color: '#fff' }}>
                    🛑 SL: {signal.stop_loss.toFixed(2)}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.structureLine} style={{ background: 'linear-gradient(135deg, #ff1744, #d50000)', color: '#fff' }}>
                    🛑 SL: {signal.stop_loss.toFixed(2)}
                  </div>
                  <div className={styles.structureLine} style={{ background: 'linear-gradient(135deg, #ef5350, #e53935)', color: '#fff' }}>
                    🔴 ENTRÉE: {entryMid.toFixed(2)}
                  </div>
                  <div className={styles.structureLine} style={{ background: 'linear-gradient(135deg, #00e676, #00c853)', color: '#000' }}>
                    🎯 TP1: {signal.take_profit_1.toFixed(2)}
                  </div>
                  {signal.take_profit_2 && (
                    <div className={styles.structureLine} style={{ background: 'linear-gradient(135deg, #00e676, #00c853)', color: '#000' }}>
                      🎯 TP2: {signal.take_profit_2.toFixed(2)}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className={styles.structureLabel}>
              {isLong ? '↑ Prix monte = Profit' : '↓ Prix descend = Profit'}
            </div>
          </div>
        </div>

        {riskCalc && (
          <div className={styles.riskInfo}>
            <div className={styles.riskRow}>
              <span className={styles.label}>Position:</span>
              <span className={styles.value}>{riskCalc.positionSize.toFixed(2)} lots</span>
            </div>
            <div className={styles.riskRow}>
              <span className={styles.label}>Risque:</span>
              <span className={styles.value}>
                ${riskCalc.riskAmount.toFixed(2)}
              </span>
            </div>
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
