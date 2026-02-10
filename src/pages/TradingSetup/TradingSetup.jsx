import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import styles from './TradingSetup.module.css';

export default function TradingSetup() {
  const navigate = useNavigate();
  const [signalsEnabled, setSignalsEnabled] = useState(false);
  const [lastSignal, setLastSignal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSignalsStatus();
    loadLastSignal();

    const subscription = supabase
      .channel('tradingview_alerts_user')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tradingview_alerts'
      }, (payload) => {
        setLastSignal(payload.new);
        setSignalsEnabled(true);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSignalsStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('tradingview_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setSignalsEnabled(true);
        setLastSignal(data);
      }
    } catch (error) {
      console.error('Error checking signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLastSignal = async () => {
    try {
      const { data, error } = await supabase
        .from('tradingview_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setLastSignal(data);
      }
    } catch (error) {
      console.error('Error loading last signal:', error);
    }
  };

  const handleActivateSignals = () => {
    setSignalsEnabled(true);
    navigate('/signals');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1>Signaux TradingView</h1>
        <p className={styles.subtitle}>
          Les signaux sont configurés par l'admin. Active-les pour recevoir les alertes.
        </p>
      </div>

      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <div className={styles.statusIcon}>
            {signalsEnabled ? '✅' : '⏳'}
          </div>
          <div>
            <h2>
              {signalsEnabled ? 'Signaux activés' : 'En attente de signaux'}
            </h2>
            <p className={styles.statusText}>
              {signalsEnabled
                ? 'Les signaux TradingView sont actifs et seront affichés en temps réel'
                : 'Clique sur le bouton ci-dessous pour activer la réception des signaux'
              }
            </p>
          </div>
        </div>

        {!signalsEnabled && (
          <button
            onClick={handleActivateSignals}
            className={styles.activateBtn}
          >
            Activer les signaux TradingView
          </button>
        )}

        {signalsEnabled && lastSignal && (
          <div className={styles.lastSignal}>
            <h3>Dernier signal reçu</h3>
            <div className={styles.signalInfo}>
              <div className={styles.signalRow}>
                <span className={styles.label}>Symbole:</span>
                <span className={styles.value}>{lastSignal.symbol}</span>
              </div>
              <div className={styles.signalRow}>
                <span className={styles.label}>Direction:</span>
                <span className={`${styles.value} ${styles[lastSignal.side.toLowerCase()]}`}>
                  {lastSignal.side}
                </span>
              </div>
              <div className={styles.signalRow}>
                <span className={styles.label}>Timeframe:</span>
                <span className={styles.value}>{lastSignal.timeframe}</span>
              </div>
              <div className={styles.signalRow}>
                <span className={styles.label}>Entry:</span>
                <span className={styles.value}>{lastSignal.entry}</span>
              </div>
              <div className={styles.signalRow}>
                <span className={styles.label}>SL:</span>
                <span className={styles.value}>{lastSignal.sl}</span>
              </div>
              {lastSignal.tp1 && (
                <div className={styles.signalRow}>
                  <span className={styles.label}>TP1:</span>
                  <span className={styles.value}>{lastSignal.tp1}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/signals')}
              className={styles.viewAllBtn}
            >
              Voir tous les signaux →
            </button>
          </div>
        )}
      </div>

      <div className={styles.infoSection}>
        <h3>Comment ça marche ?</h3>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4>Configuration Admin</h4>
              <p>Les alertes TradingView sont configurées par l'admin de la plateforme</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4>Réception Automatique</h4>
              <p>Les signaux arrivent automatiquement en temps réel depuis TradingView</p>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4>Validation Simple</h4>
              <p>Tu reçois le signal, tu valides, le bot prépare l'entrée</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
