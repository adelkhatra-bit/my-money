import React from 'react';
import styles from './PositionMonitor.module.css';

const PositionMonitor = ({ currentPosition, currentPrice, pnl, history = [] }) => {
  if (!currentPosition && (!history || history.length === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.noPosition}>
          Aucune position active
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {currentPosition && (
        <div className={styles.activeSection}>
          <h3 className={styles.sectionTitle}>POSITION EN COURS</h3>
          <div className={`${styles.positionCard} ${styles.active}`}>
            <div className={styles.positionHeader}>
              <div className={styles.marketInfo}>
                <span className={styles.market}>{currentPosition.market}</span>
                <span className={`${styles.direction} ${currentPosition.direction === 'LONG' ? styles.long : styles.short}`}>
                  {currentPosition.direction}
                </span>
              </div>
              <div className={`${styles.pnl} ${pnl >= 0 ? styles.positive : styles.negative}`}>
                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USD
              </div>
            </div>
            <div className={styles.positionDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Entrée:</span>
                <span className={styles.value}>{parseFloat(currentPosition.entry_price).toFixed(2)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Prix actuel:</span>
                <span className={styles.value}>{currentPrice ? currentPrice.toFixed(2) : '-'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>SL:</span>
                <span className={styles.value}>{parseFloat(currentPosition.stop_loss).toFixed(2)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>TP1:</span>
                <span className={styles.value}>
                  {parseFloat(currentPosition.take_profit_1).toFixed(2)}
                  {currentPosition.tp1_hit && <span className={styles.hit}> ✓</span>}
                </span>
              </div>
              {currentPosition.take_profit_2 && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>TP2:</span>
                  <span className={styles.value}>{parseFloat(currentPosition.take_profit_2).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className={styles.statusBadge}>En cours</div>
          </div>
        </div>
      )}

      {history && history.length > 0 && (
        <div className={styles.historySection}>
          <h3 className={styles.sectionTitle}>HISTORIQUE</h3>
          <div className={styles.historyList}>
            {history.map((position) => {
              const positionPnl = parseFloat(position.pnl || 0);
              const isWin = positionPnl > 0;

              return (
                <div key={position.id} className={`${styles.positionCard} ${styles.history}`}>
                  <div className={styles.positionHeader}>
                    <div className={styles.marketInfo}>
                      <span className={styles.market}>{position.market}</span>
                      <span className={`${styles.direction} ${position.direction === 'LONG' ? styles.long : styles.short}`}>
                        {position.direction}
                      </span>
                    </div>
                    <div className={`${styles.pnl} ${isWin ? styles.positive : styles.negative}`}>
                      {isWin ? '✅' : '❌'} {positionPnl >= 0 ? '+' : ''}{positionPnl.toFixed(2)} USD
                    </div>
                  </div>
                  <div className={styles.positionDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Entrée:</span>
                      <span className={styles.value}>{parseFloat(position.entry_price).toFixed(2)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Sortie:</span>
                      <span className={styles.value}>{parseFloat(position.exit_price).toFixed(2)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Raison:</span>
                      <span className={styles.value}>{position.close_reason}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Date:</span>
                      <span className={styles.value}>
                        {new Date(position.closed_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PositionMonitor;
