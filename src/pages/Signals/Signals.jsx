import React from 'react';
import TradingViewSignals from '../../components/TradingViewSignals/TradingViewSignals';
import styles from './Signals.module.css';

export default function Signals() {
  const webhookUrl = 'https://alsftpbjneityeyzwyzz.supabase.co/functions/v1/tradingview-webhook';

  const testWebhook = async () => {
    const testPayload = {
      symbol: 'CME_MINI:MNQ1!',
      timeframe: '5m',
      direction: 'LONG',
      entry: 21450.50,
      sl: 21400.00,
      tp1: 21500.00,
      platform: 'topstep',
      market: 'NASDAQ'
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Signal test envoyé avec succès!\n\nVérifiez ci-dessous dans la liste des signaux.');
      } else {
        alert('Erreur: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Erreur réseau: ' + error.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Signaux TradingView</h1>
        <p>Visualisez en temps réel les signaux reçus depuis TradingView</p>
      </div>

      <div className={styles.content}>
        <div className={styles.testSection}>
          <h2>Test Webhook</h2>
          <p>Envoyez un signal de test pour vérifier que le webhook fonctionne correctement.</p>

          <div className={styles.webhookInfo}>
            <label>URL Webhook</label>
            <div className={styles.urlBox}>
              <input
                type="text"
                value={webhookUrl}
                readOnly
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  alert('URL copiée!');
                }}
              >
                Copier
              </button>
            </div>
          </div>

          <button className={styles.testBtn} onClick={testWebhook}>
            Envoyer un Signal Test
          </button>

          <div className={styles.info}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div>
              <strong>Comment tester depuis TradingView:</strong>
              <ol>
                <li>Ouvrez TradingView et créez une alerte</li>
                <li>Dans "Notifications", cochez "Webhook URL"</li>
                <li>Collez l'URL ci-dessus</li>
                <li>Dans "Message", collez le JSON de configuration</li>
                <li>Déclenchez l'alerte</li>
              </ol>
            </div>
          </div>
        </div>

        <div className={styles.signalsSection}>
          <TradingViewSignals />
        </div>
      </div>
    </div>
  );
}
