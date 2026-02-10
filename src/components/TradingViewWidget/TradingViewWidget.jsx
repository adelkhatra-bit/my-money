import React, { useEffect, useRef } from 'react';
import styles from './TradingViewWidget.module.css';

const TradingViewWidget = ({ symbol = 'MNQ', theme = 'dark' }) => {
  const containerRef = useRef(null);

  const getSymbolMapping = (symbol) => {
    const mapping = {
      'MNQ': 'CME_MINI:NQ1!',
      'MGC': 'COMEX_MINI:MGC1!',
      'BTC': 'BINANCE:BTCUSDT'
    };
    return mapping[symbol] || 'CME_MINI:NQ1!';
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: getSymbolMapping(symbol),
          interval: '5',
          timezone: 'America/New_York',
          theme: theme,
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: true,
          save_image: false,
          container_id: 'tradingview_widget',
          studies: [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies'
          ],
          disabled_features: [
            'use_localstorage_for_settings',
            'volume_force_overlay'
          ],
          enabled_features: [
            'hide_left_toolbar_by_default'
          ],
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#26a69a',
            'mainSeriesProperties.candleStyle.downColor': '#ef5350',
            'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
            'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350'
          }
        });
      }
    };

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return (
    <div className={styles.widgetContainer}>
      <div
        ref={containerRef}
        id="tradingview_widget"
        className={styles.widget}
      />
    </div>
  );
};

export default TradingViewWidget;
