import React, { useEffect, useState } from 'react';
import { calculateRealStats, getDailyStats } from '../../services/accountingService';
import { formatPrice, formatPercentage } from '../../services/priceFormatting';
import styles from './TradingStats.module.css';

const getCurrencySymbol = (curr) => {
  if (curr === 'USD') return '$';
  if (curr === 'EUR') return '€';
  return curr;
};

export default function TradingStats({ accountId, market, currency = 'USD' }) {
  const [statsState, setStatsState] = useState({ stats: null, dailyStats: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }

    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, [accountId]);

  async function loadStats() {
    try {
      const [statsData, dailyData] = await Promise.all([
        calculateRealStats(accountId),
        getDailyStats(accountId)
      ]);
      setStatsState({ stats: statsData, dailyStats: dailyData });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const { stats, dailyStats } = statsState;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement des statistiques...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>Aucune donnée disponible</div>
      </div>
    );
  }

  const symbol = getCurrencySymbol(currency);

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Balance</div>
          <div className={styles.statValue}>
            {symbol}{formatPrice(stats.currentBalance, market)}
          </div>
          <div className={styles.statSubtext}>
            Capital initial: {symbol}{formatPrice(stats.startingCapital, market)}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>PnL Total</div>
          <div className={`${styles.statValue} ${stats.realizedPnL >= 0 ? styles.positive : styles.negative}`}>
            {stats.realizedPnL >= 0 ? '+' : ''}{symbol}{formatPrice(Math.abs(stats.realizedPnL), market)}
          </div>
          {stats.unrealizedPnL !== 0 && (
            <div className={styles.statSubtext}>
              Non réalisé: {stats.unrealizedPnL >= 0 ? '+' : ''}{symbol}{formatPrice(Math.abs(stats.unrealizedPnL), market)}
            </div>
          )}
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Trades</div>
          <div className={styles.statValue}>{stats.totalTrades}</div>
          <div className={styles.statSubtext}>
            {stats.winCount}W / {stats.lossCount}L
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Gains</div>
          <div className={`${styles.statValue} ${styles.positive}`}>
            +{symbol}{formatPrice(stats.totalGains, market)}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pertes</div>
          <div className={`${styles.statValue} ${styles.negative}`}>
            -{symbol}{formatPrice(stats.totalLosses, market)}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Winrate</div>
          <div className={styles.statValue}>
            {formatPercentage(stats.winrate)}
          </div>
          <div className={styles.statSubtext}>
            PF: {stats.profitFactor.toFixed(2)}
          </div>
        </div>

        {dailyStats && (
          <>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>PnL Jour</div>
              <div className={`${styles.statValue} ${dailyStats.dailyPnL >= 0 ? styles.positive : styles.negative}`}>
                {dailyStats.dailyPnL >= 0 ? '+' : ''}{symbol}{formatPrice(Math.abs(dailyStats.dailyPnL), market)}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Trades Jour</div>
              <div className={styles.statValue}>{dailyStats.dailyTrades}</div>
              <div className={styles.statSubtext}>
                WR: {formatPercentage(dailyStats.dailyWinrate)}
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.mode}>
        MODE: {stats.accountId ? 'PAPER TRADING' : 'SIMULATION'}
      </div>
    </div>
  );
}
