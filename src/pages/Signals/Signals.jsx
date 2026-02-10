import React from 'react';
import TradingViewSignals from '../../components/TradingViewSignals/TradingViewSignals';
import styles from './Signals.module.css';

export default function Signals() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Signaux TradingView</h1>
        <p>Les signaux arrivent automatiquement depuis TradingView</p>
      </div>

      <div className={styles.content}>
        <TradingViewSignals />
      </div>
    </div>
  );
}
