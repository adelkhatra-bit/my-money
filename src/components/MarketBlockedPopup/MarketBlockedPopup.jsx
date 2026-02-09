import React from 'react';
import styles from './MarketBlockedPopup.module.css';

const MarketBlockedPopup = ({ status, reason, onClose }) => {
  const getConfig = () => {
    if (status === 'DANGEROUS') {
      return {
        icon: '🔴',
        title: 'MARCHÉ DANGEREUX',
        subtitle: 'Trading bloqué pour votre sécurité'
      };
    }
    return {
      icon: '🟡',
      title: 'MARCHÉ INSTABLE',
      subtitle: 'Le robot attend une structure plus propre'
    };
  };

  const config = getConfig();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.icon}>{config.icon}</span>
          <h3 className={styles.title}>{config.title}</h3>
        </div>

        <p className={styles.subtitle}>{config.subtitle}</p>

        {reason && (
          <p className={styles.reason}>{reason}</p>
        )}

        <div className={styles.info}>
          <p className={styles.infoText}>Aucun crédit débité</p>
        </div>

        <button className={styles.button} onClick={onClose}>
          Compris
        </button>
      </div>
    </div>
  );
};

export default MarketBlockedPopup;
