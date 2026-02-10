import { useState } from 'react';
import styles from './TradingViewSetup.module.css';

export default function TradingViewSetup({ webhookUrl }) {
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  const exampleAlert = {
    symbol: "CME_MINI:MNQ1!",
    timeframe: "5m",
    direction: "LONG",
    entry: 21450.50,
    stop_loss: 21400.00,
    take_profit_1: 21500.00,
    platform: "topstep",
    market: "NASDAQ"
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openTradingView = () => {
    window.open('https://www.tradingview.com/chart/', '_blank');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Configuration TradingView</h1>
        <p className={styles.subtitle}>Connectez TradingView à votre bot en 3 étapes simples</p>
      </div>

      <div className={styles.steps}>
        <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepContent}>
            <h3>Ouvre TradingView</h3>
            <p>Utilise TradingView pour voir le graphique et préparer tes entrées</p>
            <button onClick={openTradingView} className={styles.primaryBtn}>
              🚀 Ouvrir TradingView
            </button>
          </div>
        </div>

        <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepContent}>
            <h3>Crée une alerte</h3>
            <div className={styles.instructions}>
              <p><strong>Sur ton graphique TradingView:</strong></p>
              <ol>
                <li>Clique droit → <strong>Ajouter une alerte</strong></li>
                <li>Configure ta condition (MACD, RSI, etc.)</li>
                <li>Dans "Notifications" → coche <strong>Webhook URL</strong></li>
              </ol>
            </div>

            <div className={styles.webhookSection}>
              <label>URL Webhook (à copier dans TradingView)</label>
              <div className={styles.copyBox}>
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={() => copyToClipboard(webhookUrl)}
                  className={styles.copyBtn}
                >
                  {copied ? '✓ Copié' : '📋 Copier'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepContent}>
            <h3>Configure le message</h3>
            <div className={styles.instructions}>
              <p><strong>Dans le champ "Message" de l'alerte TradingView:</strong></p>
            </div>

            <div className={styles.codeBlock}>
              <pre>{JSON.stringify(exampleAlert, null, 2)}</pre>
              <button
                onClick={() => copyToClipboard(JSON.stringify(exampleAlert, null, 2))}
                className={styles.copyCodeBtn}
              >
                {copied ? '✓ Copié' : '📋 Copier'}
              </button>
            </div>

            <div className={styles.help}>
              <p><strong>Personnalise le message:</strong></p>
              <ul>
                <li><code>symbol</code>: Ton marché (CME_MINI:MNQ1!, FX:NAS100...)</li>
                <li><code>direction</code>: LONG ou SHORT</li>
                <li><code>entry</code>: Prix d'entrée</li>
                <li><code>stop_loss</code>: Stop Loss</li>
                <li><code>take_profit_1</code>: Take Profit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.status}>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot}></span>
            <span>En attente d'alertes TradingView</span>
          </div>
        </div>

        <div className={styles.helpLinks}>
          <p>Besoin d'aide ?</p>
          <a href="/docs/tradingview-guide" target="_blank">Guide complet TradingView →</a>
        </div>
      </div>
    </div>
  );
}
