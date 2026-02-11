import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './TradingViewConfig.module.css';

export default function TradingViewConfig() {
  const [config, setConfig] = useState({
    symbols: {
      NASDAQ: 'CME_MINI:MNQ1!',
      BTC: 'COINBASE:BTCUSD',
      ETH: 'COINBASE:ETHUSD',
      GOLD: 'TVC:GOLD'
    },
    timeframes: ['5', '15', '30', '60', '240', 'D'],
    webhookUrl: ''
  });
  const [showGuide, setShowGuide] = useState(null);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
    loadRecentSignals();

    const webhookUrl = process.env.REACT_APP_SUPABASE_URL
      ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/tradingview-webhook`
      : 'https://alsftpbjneityeyzwyzz.supabase.co/functions/v1/tradingview-webhook';

    setConfig(prev => ({ ...prev, webhookUrl }));
  }, []);

  const loadConfig = async () => {
    setLoading(false);
  };

  const loadRecentSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('tradingview_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setSignals(data);
      }
    } catch (error) {
      console.error('Error loading signals:', error);
    }
  };

  const testWebhook = async () => {
    const testPayload = {
      symbol: config.symbols.NASDAQ,
      timeframe: '5m',
      direction: 'LONG',
      entry: 21450.50,
      sl: 21400.00,
      tp1: 21500.00,
      platform: 'topstep',
      market: 'NASDAQ'
    };

    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Signal test envoyé avec succès!\n\nVérifiez dans la liste des signaux ci-dessous.');
        loadRecentSignals();
      } else {
        alert('❌ Erreur: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Erreur réseau: ' + error.message);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`✅ ${label} copié!`);
  };

  const guides = {
    symbol: {
      title: 'Où trouver le symbole TradingView ?',
      steps: [
        'Ouvrez TradingView.com et connectez-vous',
        'Recherchez votre actif (ex: NAS100, BTC, GOLD)',
        'Le symbole apparaît en haut à gauche du graphique',
        'Format attendu: EXCHANGE:SYMBOL (ex: CME_MINI:MNQ1!)',
        'Copier/coller exactement ce symbole dans vos alertes'
      ],
      example: 'CME_MINI:MNQ1! pour le Nasdaq Mini'
    },
    alert: {
      title: 'Comment créer une alerte TradingView ?',
      steps: [
        'Ouvrez votre graphique TradingView',
        'Cliquez sur le bouton "Alerte" en haut à droite',
        'Configurez votre condition (ex: "Crossing", "Greater than")',
        'Dans "Notifications", cochez "Webhook URL"',
        'Collez l\'URL du webhook ci-dessous',
        'Dans "Message", collez le JSON de configuration',
        'Cliquez "Créer"'
      ],
      example: 'Alerte déclenchée quand le prix croise une EMA'
    },
    json: {
      title: 'Format JSON pour TradingView',
      steps: [
        'Utilisez ce format exact dans le champ "Message"',
        'Remplacez les valeurs selon votre stratégie',
        'Le webhook recevra ces données en temps réel',
        'Ne modifiez pas la structure du JSON'
      ],
      example: `{
  "symbol": "CME_MINI:MNQ1!",
  "timeframe": "5m",
  "direction": "LONG",
  "entry": {{close}},
  "sl": {{low}},
  "tp1": {{high}},
  "platform": "topstep",
  "market": "NASDAQ"
}`
    }
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Configuration TradingView</h2>
        <p className={styles.subtitle}>
          Configuration centralisée pour tous les utilisateurs
        </p>
      </div>

      <div className={styles.infoBox}>
        <h3>🎯 C'est quoi TradingView ?</h3>
        <p className={styles.infoText}>
          <strong>TradingView</strong> est la plateforme qui nous envoie les signaux de trading en temps réel.
        </p>
        <div className={styles.flowDiagram}>
          <div className={styles.flowStep}>
            <div className={styles.flowNumber}>1</div>
            <div className={styles.flowLabel}>TradingView détecte un signal</div>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep}>
            <div className={styles.flowNumber}>2</div>
            <div className={styles.flowLabel}>Signal envoyé via Webhook</div>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep}>
            <div className={styles.flowNumber}>3</div>
            <div className={styles.flowLabel}>Notre plateforme reçoit et traite</div>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep}>
            <div className={styles.flowNumber}>4</div>
            <div className={styles.flowLabel}>Utilisateurs voient le signal</div>
          </div>
        </div>
      </div>

      <div className={styles.usageBox}>
        <h3>🔍 Quand DOIS-TU intervenir sur TradingView ?</h3>
        <div className={styles.scenarioGrid}>
          <div className={styles.scenarioCard + ' ' + styles.manual}>
            <h4>✋ Tu DOIS intervenir si:</h4>
            <ul>
              <li>Tu veux créer une nouvelle stratégie de signaux</li>
              <li>Tu veux modifier les conditions d'entrée (EMA, RSI, etc.)</li>
              <li>Tu veux ajouter un nouveau marché (ex: EUR/USD)</li>
              <li>Tu veux changer les niveaux de TP/SL</li>
            </ul>
            <p className={styles.scenarioAction}>
              👉 Dans ce cas, tu vas sur TradingView → Créer une alerte → Configurer avec l'URL webhook ci-dessous
            </p>
          </div>
          <div className={styles.scenarioCard + ' ' + styles.auto}>
            <h4>✅ Tu N'AS RIEN À FAIRE si:</h4>
            <ul>
              <li>Les utilisateurs veulent juste trader avec le BOT</li>
              <li>Les signaux arrivent déjà correctement</li>
              <li>Tu veux juste voir l'activité des signaux</li>
              <li>Tu veux gérer les crédits utilisateurs</li>
            </ul>
            <p className={styles.scenarioAction}>
              👉 La plateforme fonctionne en autonomie complète
            </p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Webhook URL</h3>
        <div className={styles.webhookBox}>
          <input
            type="text"
            value={config.webhookUrl}
            readOnly
            className={styles.webhookInput}
          />
          <button
            onClick={() => copyToClipboard(config.webhookUrl, 'URL')}
            className={styles.copyBtn}
          >
            Copier
          </button>
        </div>
        <p className={styles.help}>
          Utilisez cette URL dans toutes vos alertes TradingView
        </p>
      </div>

      <div className={styles.section}>
        <h3>Symboles Configurés</h3>
        <div className={styles.symbolsGrid}>
          {Object.entries(config.symbols).map(([market, symbol]) => (
            <div key={market} className={styles.symbolCard}>
              <div className={styles.symbolLabel}>{market}</div>
              <div className={styles.symbolValue}>{symbol}</div>
              <button
                onClick={() => copyToClipboard(symbol, `Symbole ${market}`)}
                className={styles.copySmallBtn}
              >
                Copier
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Timeframes Autorisés</h3>
        <div className={styles.timeframesGrid}>
          {config.timeframes.map(tf => (
            <div key={tf} className={styles.timeframeBadge}>
              {tf === 'D' ? '1 Jour' : `${tf} min`}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Guides Visuels</h3>
        <div className={styles.guidesGrid}>
          <button
            onClick={() => setShowGuide('symbol')}
            className={styles.guideBtn}
          >
            📌 Où trouver le symbole ?
          </button>
          <button
            onClick={() => setShowGuide('alert')}
            className={styles.guideBtn}
          >
            📌 Créer une alerte TradingView
          </button>
          <button
            onClick={() => setShowGuide('json')}
            className={styles.guideBtn}
          >
            📌 Format JSON requis
          </button>
        </div>
      </div>

      {showGuide && (
        <div className={styles.guideModal} onClick={() => setShowGuide(null)}>
          <div className={styles.guideContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowGuide(null)}>
              ✕
            </button>
            <h3>{guides[showGuide].title}</h3>
            <ol className={styles.guideSteps}>
              {guides[showGuide].steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <div className={styles.guideExample}>
              <strong>Exemple:</strong>
              <pre>{guides[showGuide].example}</pre>
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h3>Test du Webhook</h3>
        <p className={styles.help}>
          Envoyez un signal de test pour vérifier que tout fonctionne
        </p>
        <button onClick={testWebhook} className={styles.testBtn}>
          Envoyer un Signal Test
        </button>
      </div>

      <div className={styles.section}>
        <h3>Signaux Récents</h3>
        {signals.length === 0 ? (
          <div className={styles.noSignals}>
            Aucun signal reçu récemment
          </div>
        ) : (
          <div className={styles.signalsList}>
            {signals.map(signal => (
              <div key={signal.id} className={styles.signalCard}>
                <div className={styles.signalHeader}>
                  <span className={styles.signalSymbol}>{signal.symbol}</span>
                  <span className={styles.signalTimeframe}>{signal.timeframe}</span>
                  <span className={`${styles.signalDirection} ${styles[signal.side.toLowerCase()]}`}>
                    {signal.side}
                  </span>
                  <span className={styles.signalStatus}>
                    {signal.status}
                  </span>
                </div>
                <div className={styles.signalBody}>
                  <div className={styles.signalPrice}>
                    Entry: {signal.entry}
                  </div>
                  <div className={styles.signalPrice}>
                    SL: {signal.sl}
                  </div>
                  {signal.tp1 && (
                    <div className={styles.signalPrice}>
                      TP1: {signal.tp1}
                    </div>
                  )}
                </div>
                <div className={styles.signalFooter}>
                  {new Date(signal.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
