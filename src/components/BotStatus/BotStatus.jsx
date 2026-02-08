import React from 'react';
import styles from './BotStatus.module.css';

export default function BotStatus({ isActive, currentState, nextScanIn, lastScanTime, nextScanTime, etaMinutes }) {
  const getStatusInfo = () => {
    switch (currentState) {
      case 'idle':
        return {
          label: 'En attente',
          icon: '⏸️',
          className: styles.idle
        };
      case 'scanning':
        return {
          label: 'Scan en cours...',
          icon: '🔍',
          className: styles.scanning
        };
      case 'pre_alert':
        return {
          label: 'Signal imminent',
          icon: '⚠️',
          className: styles.preAlert
        };
      case 'signal_ready':
        return {
          label: 'Signal prêt',
          icon: '✅',
          className: styles.signalReady
        };
      case 'position_locked':
        return {
          label: 'Position active - Bot en pause',
          icon: '⏸️',
          className: styles.locked
        };
      default:
        return {
          label: 'Inactif',
          icon: '⭕',
          className: styles.inactive
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`${styles.compactContainer} ${!isActive ? styles.disabled : ''}`}>
      <div className={styles.compactHeader}>
        <div className={styles.compactStatus}>
          <span className={styles.compactIcon}>{statusInfo.icon}</span>
          <span className={styles.compactLabel}>{statusInfo.label}</span>
          <span className={`${styles.compactBadge} ${isActive ? styles.activeBadge : styles.inactiveBadge}`}>
            {isActive ? 'ON' : 'OFF'}
          </span>
        </div>

        {isActive && (
          <div className={styles.compactTiming}>
            {etaMinutes && (
              <div className={styles.timingItem}>
                <span className={styles.timingLabel}>Prochaine opportunité:</span>
                <span className={styles.timingValue}>~{etaMinutes} min</span>
              </div>
            )}
            {lastScanTime && (
              <div className={styles.timingItem}>
                <span className={styles.timingLabel}>Dernier scan:</span>
                <span className={styles.timingValue}>{lastScanTime}</span>
              </div>
            )}
            {nextScanTime && (
              <div className={styles.timingItem}>
                <span className={styles.timingLabel}>Prochain scan:</span>
                <span className={styles.timingValue}>{nextScanTime}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {currentState === 'scanning' && (
        <div className={styles.compactProgress}>
          <div className={styles.progressBar}></div>
        </div>
      )}

      {currentState === 'position_locked' && (
        <div className={styles.positionInfo}>
          <p className={styles.infoText}>
            ⚠️ Le bot ne cherchera pas de nouvelles positions tant que la position actuelle est ouverte.
          </p>
          <p className={styles.infoSubtext}>
            Le suivi temps réel continue pour gérer le Stop Loss et les Take Profits.
          </p>
        </div>
      )}
    </div>
  );
}
