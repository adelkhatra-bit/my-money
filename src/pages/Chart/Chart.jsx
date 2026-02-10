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
          width: '100%',
          height: '100%',
          symbol: 'CME_MINI:MNQ1!',
          interval: '30',
          timezone: 'America/New_York',
          theme: 'dark',
          style: '1',
          locale: 'fr',
          toolbar_bg: '#000000',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          allow_symbol_change: true,
          details: true,
          hotlist: true,
          calendar: true,
          studies: [],
          show_popup_button: false,
          popup_width: '1000',
          popup_height: '650'
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
        <h1>TradingView - Source Unique</h1>
        <div className={styles.info}>
          <span>Symboles supportés: MNQ, NQ, NAS100, ES, YM, RTY, tous symboles TradingView</span>
          <span className={styles.separator}>•</span>
          <span>Timeframes: Via toolbar TradingView (1m, 5m, 15m, 30m, 1h, etc.)</span>
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
