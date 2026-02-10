import { useEffect, useRef } from 'react';
import styles from './Chart.module.css';

export default function Chart() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: 'tradingview-widget',
          autosize: true,
          symbol: 'CME_MINI:MNQ1!',
          interval: '1',
          timezone: 'America/New_York',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#000000',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          studies: [
            'MAExp@tv-basicstudies',
            'MAExp@tv-basicstudies',
            'VWAP@tv-basicstudies',
            'RSI@tv-basicstudies'
          ],
          studies_overrides: {
            'moving average exponential.length': 20,
            'moving average exponential.source': 'close',
            'moving average exponential#1.length': 50,
            'moving average exponential#1.source': 'close',
            'relative strength index.length': 14
          }
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className={styles.chartPage}>
      <div className={styles.header}>
        <div className={styles.symbolSelector}>
          <button
            className={styles.symbolBtn}
            onClick={() => {
              if (window.TradingView) {
                containerRef.current.innerHTML = '';
                new window.TradingView.widget({
                  container_id: 'tradingview-widget',
                  autosize: true,
                  symbol: 'CME_MINI:MNQ1!',
                  interval: '1',
                  timezone: 'America/New_York',
                  theme: 'dark',
                  style: '1',
                  locale: 'en',
                  toolbar_bg: '#000000',
                  enable_publishing: false,
                  hide_top_toolbar: false,
                  hide_legend: false,
                  save_image: false,
                  studies: [
                    'MAExp@tv-basicstudies',
                    'MAExp@tv-basicstudies',
                    'VWAP@tv-basicstudies',
                    'RSI@tv-basicstudies'
                  ],
                  studies_overrides: {
                    'moving average exponential.length': 20,
                    'moving average exponential.source': 'close',
                    'moving average exponential#1.length': 50,
                    'moving average exponential#1.source': 'close',
                    'relative strength index.length': 14
                  }
                });
              }
            }}
          >
            MNQ
          </button>
          <button
            className={styles.symbolBtn}
            onClick={() => {
              if (window.TradingView) {
                containerRef.current.innerHTML = '';
                new window.TradingView.widget({
                  container_id: 'tradingview-widget',
                  autosize: true,
                  symbol: 'CME_MINI:ES1!',
                  interval: '1',
                  timezone: 'America/New_York',
                  theme: 'dark',
                  style: '1',
                  locale: 'en',
                  toolbar_bg: '#000000',
                  enable_publishing: false,
                  hide_top_toolbar: false,
                  hide_legend: false,
                  save_image: false,
                  studies: [
                    'MAExp@tv-basicstudies',
                    'MAExp@tv-basicstudies',
                    'VWAP@tv-basicstudies',
                    'RSI@tv-basicstudies'
                  ],
                  studies_overrides: {
                    'moving average exponential.length': 20,
                    'moving average exponential.source': 'close',
                    'moving average exponential#1.length': 50,
                    'moving average exponential#1.source': 'close',
                    'relative strength index.length': 14
                  }
                });
              }
            }}
          >
            ES
          </button>
        </div>
        <div className={styles.timeframeInfo}>
          1min • 5min • 15min (via TradingView toolbar)
        </div>
      </div>
      <div
        id="tradingview-widget"
        ref={containerRef}
        className={styles.chartContainer}
      />
    </div>
  );
}
