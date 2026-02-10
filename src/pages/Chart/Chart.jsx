import { useEffect, useRef, useState } from 'react';
import styles from './Chart.module.css';

export default function Chart() {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const timeout = setTimeout(() => {
      if (loading) {
        setError('TradingView prend trop de temps à charger. Essayez de rafraîchir la page.');
      }
    }, 15000);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      try {
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
          setLoading(false);
          clearTimeout(timeout);
        } else {
          setError('TradingView n\'est pas disponible');
        }
      } catch (err) {
        console.error('TradingView error:', err);
        setError('Erreur lors du chargement du graphique');
      }
    };

    script.onerror = () => {
      setError('Impossible de charger TradingView. Vérifiez votre connexion internet.');
      clearTimeout(timeout);
    };

    document.head.appendChild(script);

    return () => {
      clearTimeout(timeout);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [loading]);

  return (
    <div className={styles.chartPage}>
      <div className={styles.header}>
        <h1>TradingView - Source Unique</h1>
        <div className={styles.info}>
          <span>Symboles supportés: MNQ, NQ, NAS100, ES, YM, RTY, tous symboles TradingView</span>
          <span className={styles.separator}>•</span>
          <span>Timeframes: Via toolbar TradingView (1m, 5m, 15m, 30m, 1h, etc.)</span>
        </div>
        <a
          href="https://www.tradingview.com/chart/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openExternal}
        >
          Ouvrir dans un nouvel onglet →
        </a>
      </div>

      {loading && !error && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Chargement du graphique TradingView...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorOverlay}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Impossible de charger le graphique</h3>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <button onClick={() => window.location.reload()} className={styles.retryBtn}>
              Réessayer
            </button>
            <a
              href="https://www.tradingview.com/chart/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalBtn}
            >
              Ouvrir TradingView →
            </a>
          </div>
        </div>
      )}

      <div
        id="tradingview-widget"
        ref={containerRef}
        className={styles.chartContainer}
        style={{ display: error ? 'none' : 'block' }}
      />
    </div>
  );
}
