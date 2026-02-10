import { useState } from 'react';
import styles from './Chart.module.css';

export default function Chart() {
  const [chartUrl, setChartUrl] = useState('https://fr.tradingview.com/chart/jI9UoWYW/');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);

  const extractChartId = (url) => {
    const match = url.match(/\/chart\/([a-zA-Z0-9]+)\/?/);
    return match ? match[1] : null;
  };

  const handleLoadChart = () => {
    if (!inputValue.trim()) return;

    let finalUrl = inputValue.trim();

    if (inputValue.includes('tradingview.com')) {
      finalUrl = inputValue;
    } else {
      finalUrl = `https://fr.tradingview.com/chart/${inputValue}/`;
    }

    setChartUrl(finalUrl);
    setLoading(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLoadChart();
    }
  };

  return (
    <div className={styles.chartPage}>
      <div className={styles.header}>
        <h1>TradingView - Graphique Partagé</h1>
        <div className={styles.urlInput}>
          <input
            type="text"
            placeholder="Collez l'URL TradingView ou l'ID du graphique (ex: jI9UoWYW)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.input}
          />
          <button onClick={handleLoadChart} className={styles.loadBtn}>
            Charger
          </button>
        </div>
        <div className={styles.info}>
          <span>Graphique actuel: {extractChartId(chartUrl) || 'jI9UoWYW'}</span>
          <span className={styles.separator}>•</span>
          <a
            href={chartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}
          >
            Ouvrir dans un nouvel onglet →
          </a>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Chargement du graphique TradingView...</p>
        </div>
      )}

      <iframe
        src={chartUrl}
        className={styles.chartIframe}
        title="TradingView Chart"
        frameBorder="0"
        allowFullScreen
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
