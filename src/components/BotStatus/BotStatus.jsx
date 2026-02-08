import React from 'react';
import styles from './BotStatus.module.css';

export default function BotStatus({ isActive, currentState, nextScanIn }) {
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
          label: 'Position verrouillée',
          icon: '🔒',
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
    <div className={`${styles.container} ${!isActive ? styles.disabled : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <span className={styles.botIcon}>🤖</span>
          <h3 className={styles.title}>État du Bot</h3>
        </div>
        <div className={`${styles.toggle} ${isActive ? styles.active : ''}`}>
          <span className={styles.toggleLabel}>
            {isActive ? 'ACTIF' : 'INACTIF'}
          </span>
        </div>
      </div>

      {isActive && (
        <div className={styles.statusSection}>
          <div className={`${styles.statusCard} ${statusInfo.className}`}>
            <div className={styles.statusIcon}>
              {statusInfo.icon}
            </div>
            <div className={styles.statusInfo}>
              <div className={styles.statusLabel}>{statusInfo.label}</div>
              {currentState === 'scanning' && (
                <div className={styles.scanningAnimation}>
                  <div className={styles.scanningBar}></div>
                </div>
              )}
              {nextScanIn && currentState === 'idle' && (
                <div className={styles.countdown}>
                  Prochain scan dans {nextScanIn}s
                </div>
              )}
            </div>
          </div>

          {currentState === 'pre_alert' && (
            <div className={styles.alertMessage}>
              <div className={styles.pulseIcon}>⚡</div>
              <span>Préparez-vous, une opportunité arrive dans 2-5 minutes</span>
            </div>
          )}
        </div>
      )}

      {!isActive && (
        <div className={styles.inactiveMessage}>
          Activez le mode automatique pour démarrer le bot
        </div>
      )}
    </div>
  );
}
