import { useState, useEffect } from 'react';
import { tradingViewAlertService } from '../../services/tradingViewAlertService';
import { supabase } from '../../lib/supabaseClient';
import styles from './TradingViewAlerts.module.css';

export default function TradingViewAlerts({ userId, onAlertConfirm }) {
  const [alerts, setAlerts] = useState([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!userId) return;

    loadAlerts();

    const handleNewAlert = (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 20));
    };

    tradingViewAlertService.addCallback(handleNewAlert);

    return () => {
      tradingViewAlertService.removeCallback(handleNewAlert);
    };
  }, [userId]);

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('tradingview_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading alerts:', error);
    } else {
      setAlerts(data || []);
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      tradingViewAlertService.stopListening();
      setIsListening(false);
    } else {
      await tradingViewAlertService.startListening(userId, (alert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 20));
      });
      setIsListening(true);
    }
  };

  const handleConfirm = async (alert) => {
    await tradingViewAlertService.confirmAlert(alert.id);
    await loadAlerts();
    if (onAlertConfirm) {
      onAlertConfirm(alert);
    }
  };

  const handleReject = async (alert) => {
    await tradingViewAlertService.rejectAlert(alert.id, 'User rejected');
    await loadAlerts();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <h3>TradingView Alerts</h3>
          <span className={styles.count}>{alerts.length}</span>
        </div>
        <button
          onClick={toggleListening}
          className={`${styles.listenBtn} ${isListening ? styles.active : ''}`}
        >
          {isListening ? 'Listening' : 'Start Listening'}
        </button>
      </div>

      <div className={styles.webhookInfo}>
        <div className={styles.webhookLabel}>Webhook URL:</div>
        <code className={styles.webhookUrl}>
          {process.env.REACT_APP_SUPABASE_URL}/functions/v1/tradingview-webhook
        </code>
      </div>

      <div className={styles.alertsList}>
        {alerts.length === 0 ? (
          <div className={styles.empty}>
            No alerts yet. Configure your TradingView alerts to send signals here.
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`${styles.alert} ${styles[alert.status]}`}
            >
              <div className={styles.alertHeader}>
                <div className={styles.symbolSide}>
                  <span className={styles.symbol}>{alert.symbol}</span>
                  <span className={`${styles.side} ${styles[alert.side.toLowerCase()]}`}>
                    {alert.side}
                  </span>
                  <span className={styles.timeframe}>{alert.timeframe}m</span>
                </div>
                <span className={styles.status}>{alert.status}</span>
              </div>

              <div className={styles.prices}>
                <div className={styles.priceItem}>
                  <span className={styles.label}>Entry:</span>
                  <span className={styles.value}>{alert.entry}</span>
                </div>
                <div className={styles.priceItem}>
                  <span className={styles.label}>SL:</span>
                  <span className={styles.value}>{alert.sl}</span>
                </div>
                {alert.tp1 && (
                  <div className={styles.priceItem}>
                    <span className={styles.label}>TP1:</span>
                    <span className={styles.value}>{alert.tp1}</span>
                  </div>
                )}
                {alert.tp2 && (
                  <div className={styles.priceItem}>
                    <span className={styles.label}>TP2:</span>
                    <span className={styles.value}>{alert.tp2}</span>
                  </div>
                )}
              </div>

              {alert.bot_response && (
                <div className={styles.botResponse}>
                  <div className={styles.decision}>
                    Decision: {alert.bot_response.decision}
                  </div>
                  <div className={styles.reason}>
                    {alert.bot_response.reason}
                  </div>
                  {alert.bot_response.risk_reward && (
                    <div className={styles.metrics}>
                      R:R {alert.bot_response.risk_reward} • SL Distance: {alert.bot_response.stop_loss_distance}
                    </div>
                  )}
                </div>
              )}

              {alert.status === 'pending' && (
                <div className={styles.actions}>
                  <button
                    onClick={() => handleConfirm(alert)}
                    className={styles.confirmBtn}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleReject(alert)}
                    className={styles.rejectBtn}
                  >
                    Reject
                  </button>
                </div>
              )}

              <div className={styles.time}>
                {new Date(alert.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
