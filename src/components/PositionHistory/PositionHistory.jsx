import React from 'react';
import styles from './PositionHistory.module.css';

const PositionHistory = ({ positions = [] }) => {
  if (!positions || positions.length === 0) {
    return (
      <div className={styles.emptyHistory}>
        <p>Aucune position dans l'historique</p>
      </div>
    );
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'TP1_HIT': return 'TP1 Atteint ✅';
      case 'TP2_HIT': return 'TP2 Atteint ✅✅';
      case 'SL_HIT': return 'Stop Loss ❌';
      case 'BE': return 'Break Even ⚪';
      case 'OPEN': return 'En cours 🟡';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    if (status === 'TP1_HIT' || status === 'TP2_HIT') return styles.win;
    if (status === 'SL_HIT') return styles.loss;
    if (status === 'BE') return styles.breakeven;
    return styles.open;
  };

  const getCorrectDirection = (position) => {
    if (!position.entry_price || !position.take_profit_1) return position.direction;
    return position.take_profit_1 > position.entry_price ? 'LONG' : 'SHORT';
  };

  return (
    <div className={styles.historyContainer}>
      <h3 className={styles.title}>Historique des Positions</h3>
      <div className={styles.positionsList}>
        {positions.slice().reverse().map((position, index) => {
          const pnl = position.pnl || 0;
          const isProfit = pnl > 0;
          const isLoss = pnl < 0;
          const correctDirection = getCorrectDirection(position);

          return (
            <div key={position.id || index} className={`${styles.positionCard} ${getStatusClass(position.status)}`}>
              <div className={styles.header}>
                <div className={styles.direction}>
                  <span className={correctDirection === 'LONG' ? styles.longBadge : styles.shortBadge}>
                    {correctDirection === 'LONG' ? '↑ LONG' : '↓ SHORT'}
                  </span>
                  <span className={styles.market}>{position.market}</span>
                </div>
                <div className={styles.status}>
                  {getStatusLabel(position.status)}
                </div>
              </div>

              <div className={styles.details}>
                <div className={styles.priceInfo}>
                  <span className={styles.label}>Entrée:</span>
                  <span className={styles.value}>{position.entry_price?.toFixed(2)}</span>
                </div>
                <div className={styles.priceInfo}>
                  <span className={styles.label}>SL:</span>
                  <span className={styles.value}>{position.stop_loss?.toFixed(2)}</span>
                </div>
                <div className={styles.priceInfo}>
                  <span className={styles.label}>TP1:</span>
                  <span className={styles.value}>{position.take_profit_1?.toFixed(2)}</span>
                </div>
                {position.take_profit_2 && (
                  <div className={styles.priceInfo}>
                    <span className={styles.label}>TP2:</span>
                    <span className={styles.value}>{position.take_profit_2?.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {position.status !== 'OPEN' && (
                <div className={styles.result}>
                  <div className={styles.pnl}>
                    <span className={styles.label}>P&L:</span>
                    <span className={`${styles.pnlValue} ${isProfit ? styles.profit : isLoss ? styles.loss : ''}`}>
                      {isProfit ? '+' : ''}{pnl?.toFixed(2)} {position.currency || 'USD'}
                    </span>
                  </div>
                  {position.closed_at && (
                    <div className={styles.timestamp}>
                      {new Date(position.closed_at).toLocaleString('fr-FR')}
                    </div>
                  )}
                </div>
              )}

              {position.status === 'OPEN' && position.created_at && (
                <div className={styles.timestamp}>
                  Ouvert le {new Date(position.created_at).toLocaleString('fr-FR')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PositionHistory;
