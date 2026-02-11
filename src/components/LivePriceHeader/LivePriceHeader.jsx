import { useState, useEffect } from 'react';
import { priceEngine } from '../../services/priceEngine';
import { displayPrice } from '../../utils/priceFormatter';
import { isMarketOpen } from '../../services/marketHours';
import styles from './LivePriceHeader.module.css';

export default function LivePriceHeader({ market }) {
  const [priceData, setPriceData] = useState({
    current: null,
    previous: null,
    direction: null,
    status: 'disconnected'
  });
  const [flash, setFlash] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketOpen, setMarketOpen] = useState(true);

  useEffect(() => {
    if (!market) return;

    priceEngine.connectMarket(market);

    const unsubscribe = priceEngine.subscribe(market, (data) => {
      setPriceData({
        current: data.current,
        previous: data.previous,
        direction: data.direction,
        status: data.status
      });

      if (data.direction === 'UP' || data.direction === 'DOWN') {
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [market]);

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date());
      setMarketOpen(isMarketOpen(market === 'NASDAQ' ? 'NASDAQ' : market === 'GOLD' ? 'GOLD' : market));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, [market]);

  if (!priceData.current) {
    return (
      <div className={styles.container}>
        <div className={styles.marketName}>{market}</div>
        <div className={styles.loading}>
          {priceData.status === 'connected' ? 'Waiting for price...' : 'Connecting...'}
        </div>
      </div>
    );
  }

  const formattedPrice = displayPrice(priceData.current, market);
  const flashClass = flash
    ? priceData.direction === 'UP'
      ? styles.flashUp
      : styles.flashDown
    : '';

  const parisTime = currentTime.toLocaleTimeString('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parisDate = currentTime.toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const marketStatus = marketOpen ? 'OUVERT' : 'FERMÉ';
  const marketStatusClass = marketOpen ? styles.open : styles.closed;

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.marketName}>{market}</div>
        <div className={`${styles.price} ${flashClass}`}>
          {formattedPrice}
        </div>
        <div className={styles.statusIndicator}>
          <span className={`${styles.dot} ${styles[priceData.status]}`}></span>
          <span className={styles.statusText}>
            {priceData.status === 'connected' ? 'Live' :
             priceData.status === 'widget' ? 'Live' :
             priceData.status === 'disconnected' ? 'Disconnected' :
             priceData.status === 'error' ? 'Error' : 'Unknown'}
          </span>
        </div>
      </div>
      <div className={styles.rightSection}>
        <div className={styles.clockContainer}>
          <div className={styles.clock}>{parisTime}</div>
          <div className={styles.date}>{parisDate} (Paris)</div>
        </div>
        <div className={`${styles.marketStatus} ${marketStatusClass}`}>
          {marketStatus}
        </div>
      </div>
    </div>
  );
}
