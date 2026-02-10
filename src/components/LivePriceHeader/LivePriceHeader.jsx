import { useState, useEffect } from 'react';
import { priceEngine } from '../../services/priceEngine';
import { displayPrice } from '../../utils/priceFormatter';
import styles from './LivePriceHeader.module.css';

export default function LivePriceHeader({ market }) {
  const [priceData, setPriceData] = useState({
    current: null,
    previous: null,
    direction: null,
    status: 'disconnected'
  });
  const [flash, setFlash] = useState(false);

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

  return (
    <div className={styles.container}>
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
  );
}
