import React, { useState, useEffect, useRef } from 'react';
import styles from './BotActivityLog.module.css';

export default function BotActivityLog({ isActive, currentState, onActivityUpdate }) {
  const [logs, setLogs] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentIndicator, setCurrentIndicator] = useState('');
  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    if (onActivityUpdate) {
      onActivityUpdate((log) => {
        addLog(log.message, log.type);
      });
    }
  }, [onActivityUpdate]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp,
      message,
      type
    };

    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  useEffect(() => {
    if (currentState === 'scanning') {
      const indicators = [
        'RSI (14)',
        'MACD (12,26,9)',
        'Bandes de Bollinger',
        'EMA 20/50',
        'Volume relatif',
        'Support/Résistance',
        'Momentum',
        'Stochastique'
      ];

      let step = 0;
      const scanInterval = setInterval(() => {
        if (step < indicators.length) {
          setCurrentIndicator(indicators[step]);
          setScanProgress(((step + 1) / indicators.length) * 100);
          step++;
        } else {
          clearInterval(scanInterval);
          setCurrentIndicator('');
          setScanProgress(0);
        }
      }, 150);

      return () => clearInterval(scanInterval);
    } else {
      setScanProgress(0);
      setCurrentIndicator('');
    }
  }, [currentState]);

  const getLogIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'scan': return '🔍';
      case 'signal': return '🎯';
      case 'position': return '📊';
      default: return '💬';
    }
  };

  const getLogClass = (type) => {
    switch(type) {
      case 'success': return styles.logSuccess;
      case 'warning': return styles.logWarning;
      case 'error': return styles.logError;
      case 'scan': return styles.logScan;
      case 'signal': return styles.logSignal;
      case 'position': return styles.logPosition;
      default: return styles.logInfo;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Activité du Bot en Temps Réel</h3>
        <div className={styles.controls}>
          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className={styles.clearBtn}
              title="Effacer les logs"
            >
              🗑️ Effacer
            </button>
          )}
        </div>
      </div>

      {currentState === 'scanning' && (
        <div className={styles.scanningIndicator}>
          <div className={styles.scanHeader}>
            <span className={styles.scanIcon}>🔍</span>
            <span className={styles.scanText}>Analyse du marché en cours...</span>
          </div>
          {currentIndicator && (
            <div className={styles.currentIndicator}>
              <span>Vérification: {currentIndicator}</span>
            </div>
          )}
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className={styles.logsContainer}>
        {!isActive ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🤖</div>
            <p>Le bot est éteint</p>
            <p className={styles.emptySubtext}>Activez le bot pour voir son activité en temps réel</p>
          </div>
        ) : logs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⏳</div>
            <p>En attente d'activité...</p>
            <p className={styles.emptySubtext}>Le bot commence à scanner le marché</p>
          </div>
        ) : (
          <div className={styles.logsList}>
            {logs.map((log) => (
              <div key={log.id} className={`${styles.logEntry} ${getLogClass(log.type)}`}>
                <span className={styles.logIcon}>{getLogIcon(log.type)}</span>
                <span className={styles.logTime}>{log.timestamp}</span>
                <span className={styles.logMessage}>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
