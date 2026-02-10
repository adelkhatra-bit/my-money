import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './TradingViewSignals.module.css';

export default function TradingViewSignals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSignals();

    const subscription = supabase
      .channel('tradingview_alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tradingview_alerts'
      }, (payload) => {
        console.log('New signal received:', payload);
        setSignals(prev => [payload.new, ...prev]);
      })
      .subscribe();

    const interval = setInterval(() => {
      loadSignals();
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('tradingview_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading signals:', error);
        return;
      }

      setSignals(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#fbbf24';
      case 'confirmed': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'executed': return '#3b82f6';
      default: return '#888888';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Reçu';
      case 'confirmed': return 'Confirmé';
      case 'rejected': return 'Refusé';
      case 'executed': return 'Exécuté';
      default: return status;
    }
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return price.toFixed(2);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const confirmSignal = async (id) => {
    try {
      const { error } = await supabase
        .from('tradingview_alerts')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (error) throw error;
      loadSignals();
    } catch (error) {
      console.error('Error confirming signal:', error);
    }
  };

  const rejectSignal = async (id) => {
    try {
      const { error } = await supabase
        .from('tradingview_alerts')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      loadSignals();
    } catch (error) {
      console.error('Error rejecting signal:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Chargement des signaux...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Signaux TradingView</h2>
        <div className={styles.status}>
          <div className={styles.statusDot}></div>
          <span>En écoute</span>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className={styles.empty}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Aucun signal reçu</h3>
          <p>Les signaux de TradingView apparaîtront ici en temps réel</p>
        </div>
      ) : (
        <div className={styles.signalsList}>
          {signals.map((signal) => (
            <div key={signal.id} className={styles.signalCard}>
              <div className={styles.signalHeader}>
                <div className={styles.signalInfo}>
                  <div className={styles.symbolBadge}>
                    {signal.symbol}
                  </div>
                  <div className={styles.timeframeBadge}>
                    {signal.timeframe}
                  </div>
                  <div
                    className={styles.directionBadge}
                    data-direction={signal.side.toLowerCase()}
                  >
                    {signal.side}
                  </div>
                </div>
                <div
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(signal.status) }}
                >
                  {getStatusLabel(signal.status)}
                </div>
              </div>

              <div className={styles.signalBody}>
                <div className={styles.priceRow}>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>Entry</span>
                    <span className={styles.priceValue}>{formatPrice(signal.entry)}</span>
                  </div>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>SL</span>
                    <span className={styles.priceValue}>{formatPrice(signal.sl)}</span>
                  </div>
                  {signal.tp1 && (
                    <div className={styles.priceItem}>
                      <span className={styles.priceLabel}>TP1</span>
                      <span className={styles.priceValue}>{formatPrice(signal.tp1)}</span>
                    </div>
                  )}
                  {signal.tp2 && (
                    <div className={styles.priceItem}>
                      <span className={styles.priceLabel}>TP2</span>
                      <span className={styles.priceValue}>{formatPrice(signal.tp2)}</span>
                    </div>
                  )}
                </div>

                <div className={styles.signalFooter}>
                  <div className={styles.timestamp}>
                    {formatDate(signal.created_at)}
                  </div>
                  {signal.status === 'pending' && (
                    <div className={styles.actions}>
                      <button
                        className={styles.confirmBtn}
                        onClick={() => confirmSignal(signal.id)}
                      >
                        Confirmer
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => rejectSignal(signal.id)}
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
