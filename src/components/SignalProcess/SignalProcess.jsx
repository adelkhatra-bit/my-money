import React, { useState, useEffect } from 'react';
import styles from './SignalProcess.module.css';

const SignalProcess = ({
  isScanning,
  preAlert,
  signal,
  onAcceptSignal,
  onDeclineSignal,
  onDismissSignal,
  userCredits
}) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [userReady, setUserReady] = useState(false);

  const getCorrectDirection = (sig) => {
    if (!sig) return null;
    const entryMid = (sig.entry_min + sig.entry_max) / 2;
    return sig.take_profit_1 > entryMid ? 'LONG' : 'SHORT';
  };

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
          <h3>🔍 Analyse du marché</h3>
          <p>Le robot recherche les meilleures opportunités...</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>
      </div>
    );
  }

  if (preAlert && !userReady) {
    const entryMid = preAlert.entry_min && preAlert.entry_max
      ? (preAlert.entry_min + preAlert.entry_max) / 2
      : null;

    const correctDirection = preAlert.take_profit_1 && entryMid
      ? (preAlert.take_profit_1 > entryMid ? 'LONG' : 'SHORT')
      : preAlert.direction;
    const isLong = correctDirection === 'LONG';
    const directionColor = isLong ? '#00e676' : '#ef4444';

    if (preAlert.direction !== correctDirection && preAlert.take_profit_1 && entryMid) {
      console.warn('⚠️ [SignalProcess/PreAlert] Direction incorrecte corrigée:', {
        stored: preAlert.direction,
        correct: correctDirection,
        entry: entryMid.toFixed(5),
        tp1: preAlert.take_profit_1.toFixed(5),
        comparison: preAlert.take_profit_1 > entryMid ? 'TP > Entry → LONG' : 'TP < Entry → SHORT'
      });
    }

    return (
      <div className={styles.preAlertOverlay}>
        <div className={styles.preAlertBox}>
          <div className={styles.alertHeader}>
            <div className={styles.pulsingIcon}>⚠️</div>
            <h3 className={styles.alertTitle}>UNE ENTRÉE EST BIENTÔT PRÊTE !</h3>
          </div>

          <div className={styles.directionBanner} style={{ background: `linear-gradient(135deg, ${directionColor}22, ${directionColor}11)`, borderColor: directionColor }}>
            <div className={styles.directionLabel}>
              {isLong ? '🟢 POSITION ACHAT (LONG)' : '🔴 POSITION VENTE (SHORT)'}
            </div>
            <div className={styles.directionExplanation}>
              {isLong ? '📈 Profit si le prix MONTE' : '📉 Profit si le prix DESCEND'}
            </div>
          </div>

          <div className={styles.marketInfo}>
            <span className={styles.infoItem}>📊 {preAlert.market}</span>
            <span className={styles.infoSeparator}>•</span>
            <span className={styles.infoItem}>🏦 {preAlert.platform}</span>
          </div>

          {preAlert.currentPrice && entryMid && (
            <div className={styles.priceSchema}>
              <div className={styles.schemaTitle}>📍 SCHÉMA DU POINT D'ENTRÉE</div>

              {isLong ? (
                <div className={styles.schemaBoxLong}>
                  {preAlert.take_profit_2 && (
                    <div className={styles.schemaLevel} style={{ background: '#00e67644' }}>
                      <span className={styles.levelIcon}>🎯</span>
                      <span className={styles.levelLabel}>TP2 (Objectif 2)</span>
                      <span className={styles.levelPrice}>{preAlert.take_profit_2.toFixed(2)}</span>
                    </div>
                  )}

                  <div className={styles.schemaLevel} style={{ background: '#00e67666' }}>
                    <span className={styles.levelIcon}>🎯</span>
                    <span className={styles.levelLabel}>TP1 (Objectif 1)</span>
                    <span className={styles.levelPrice}>{preAlert.take_profit_1.toFixed(2)}</span>
                  </div>

                  <div className={styles.schemaArrow}>↑↑↑</div>

                  <div className={styles.schemaLevel} style={{ background: '#2196f3aa', fontWeight: 'bold' }}>
                    <span className={styles.levelIcon}>➡️</span>
                    <span className={styles.levelLabel}>ZONE D'ENTRÉE</span>
                    <span className={styles.levelPrice}>{preAlert.entry_min.toFixed(2)} - {preAlert.entry_max.toFixed(2)}</span>
                  </div>

                  <div className={styles.currentPriceIndicator} style={{ color: '#ffeb3b' }}>
                    📍 Prix actuel: {preAlert.currentPrice.toFixed(2)}
                  </div>

                  <div className={styles.schemaLevel} style={{ background: '#ef444466' }}>
                    <span className={styles.levelIcon}>🛑</span>
                    <span className={styles.levelLabel}>STOP LOSS (Protection)</span>
                    <span className={styles.levelPrice}>{preAlert.stop_loss.toFixed(2)}</span>
                  </div>

                  <div className={styles.schemaNote}>
                    ✅ LONG: TP au-dessus • SL en dessous
                  </div>
                </div>
              ) : (
                <div className={styles.schemaBoxShort}>
                  <div className={styles.schemaLevel} style={{ background: '#ef444466' }}>
                    <span className={styles.levelIcon}>🛑</span>
                    <span className={styles.levelLabel}>STOP LOSS (Protection)</span>
                    <span className={styles.levelPrice}>{preAlert.stop_loss.toFixed(2)}</span>
                  </div>

                  <div className={styles.currentPriceIndicator} style={{ color: '#ffeb3b' }}>
                    📍 Prix actuel: {preAlert.currentPrice.toFixed(2)}
                  </div>

                  <div className={styles.schemaLevel} style={{ background: '#ff4444aa', fontWeight: 'bold' }}>
                    <span className={styles.levelIcon}>➡️</span>
                    <span className={styles.levelLabel}>ZONE D'ENTRÉE</span>
                    <span className={styles.levelPrice}>{preAlert.entry_min.toFixed(2)} - {preAlert.entry_max.toFixed(2)}</span>
                  </div>

                  <div className={styles.schemaArrow}>↓↓↓</div>

                  <div className={styles.schemaLevel} style={{ background: '#00e67666' }}>
                    <span className={styles.levelIcon}>🎯</span>
                    <span className={styles.levelLabel}>TP1 (Objectif 1)</span>
                    <span className={styles.levelPrice}>{preAlert.take_profit_1.toFixed(2)}</span>
                  </div>

                  {preAlert.take_profit_2 && (
                    <div className={styles.schemaLevel} style={{ background: '#00e67644' }}>
                      <span className={styles.levelIcon}>🎯</span>
                      <span className={styles.levelLabel}>TP2 (Objectif 2)</span>
                      <span className={styles.levelPrice}>{preAlert.take_profit_2.toFixed(2)}</span>
                    </div>
                  )}

                  <div className={styles.schemaNote}>
                    ✅ SHORT: SL au-dessus • TP en dessous
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.confirmationInfo}>
            <div className={styles.infoIcon}>🔍</div>
            <div className={styles.infoContent}>
              <p className={styles.infoMain}>Analyse approfondie en cours...</p>
              <p className={styles.infoSub}>La confirmation finale arrive dans <strong>5 secondes</strong></p>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={styles.readyBtn}
              onClick={() => setUserReady(true)}
            >
              ✅ OK - Je suis prêt
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => onDeclineSignal()}
            >
              ❌ Annuler
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
            <h3>TROP TARD</h3>
            <p>La fenêtre d'entrée est maintenant fermée.</p>
            <p className={styles.nextSignalText}>Le prochain signal arrivera bientôt...</p>
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

    const correctDirection = getCorrectDirection(signal);
    const displayDirection = correctDirection || signal.direction;

    if (signal.direction !== correctDirection) {
      console.warn('⚠️ [SignalProcess] Direction incorrecte corrigée:', {
        stored: signal.direction,
        correct: correctDirection,
        entry: ((signal.entry_min + signal.entry_max) / 2).toFixed(5),
        tp1: signal.take_profit_1.toFixed(5)
      });
    }

    return (
      <div className={styles.signalOverlay}>
        <div className={styles.signalBox}>
          <div className={styles.signalHeader}>
            <div className={`${styles.signalBadge} ${styles[displayDirection.toLowerCase()]}`}>
              {displayDirection === 'LONG' ? '🟢 ACHAT CONFIRMÉ (LONG)' : '🔴 VENTE CONFIRMÉE (SHORT)'}
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
            ✅ Tu peux encore entrer maintenant
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={styles.acceptBtn}
              onClick={() => onAcceptSignal(signal)}
            >
              OK - J'accepte
            </button>
            <button
              className={styles.declineBtn}
              onClick={() => onDeclineSignal()}
            >
              Refuser
            </button>
          </div>

          {onDismissSignal && (
            <button
              className={styles.dismissBtn}
              onClick={() => onDismissSignal()}
            >
              C'est bon, j'ai compris
            </button>
          )}

          <div className={styles.creditInfo}>
            1 crédit sera débité quand tu acceptes
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SignalProcess;
