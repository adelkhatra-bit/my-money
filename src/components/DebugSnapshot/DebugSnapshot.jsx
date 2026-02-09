import React from 'react';
import styles from './DebugSnapshot.module.css';

const DebugSnapshot = ({ data, location }) => {
  if (!data) return null;

  return (
    <div className={styles.debugSnapshot}>
      <div className={styles.header}>
        🔍 DEBUG SNAPSHOT [{location}]
      </div>
      <div className={styles.grid}>
        <div className={styles.row}>
          <span className={styles.label}>Account ID:</span>
          <span className={styles.value}>{data.accountId || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Market:</span>
          <span className={styles.value}>{data.market || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Platform:</span>
          <span className={styles.value}>{data.platform || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Symbol:</span>
          <span className={styles.value}>{data.symbol || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Timeframe:</span>
          <span className={styles.value}>{data.timeframe || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Data Source:</span>
          <span className={styles.value}>{data.dataSource || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Entry:</span>
          <span className={styles.value}>{data.entry || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>TP1 / TP2:</span>
          <span className={styles.value}>{data.tp1 || 'N/A'} / {data.tp2 || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Direction:</span>
          <span className={`${styles.value} ${styles[data.direction?.toLowerCase()]}`}>
            {data.direction || 'N/A'}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>SL:</span>
          <span className={styles.value}>{data.sl || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Rule Used:</span>
          <span className={styles.valueRule}>{data.ruleUsed || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Signal ID:</span>
          <span className={styles.valueId}>{data.signalId || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default DebugSnapshot;
