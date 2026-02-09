import React from 'react';
import styles from './MarketHealthIndicator.module.css';

const MarketHealthIndicator = ({ status = 'STABLE', message = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'DANGEROUS':
        return {
          icon: '🔴',
          text: 'DANGER',
          className: styles.dangerous
        };
      case 'NOISY':
        return {
          icon: '🟡',
          text: 'BRUIT',
          className: styles.noisy
        };
      case 'STABLE':
      default:
        return {
          icon: '🟢',
          text: 'STABLE',
          className: styles.stable
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${styles.indicator} ${config.className}`}>
      <span className={styles.icon}>{config.icon}</span>
      <span className={styles.text}>{config.text}</span>
      {message && <span className={styles.message}>{message}</span>}
    </div>
  );
};

export default MarketHealthIndicator;
