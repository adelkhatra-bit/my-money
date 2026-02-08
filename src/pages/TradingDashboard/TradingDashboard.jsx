import React, { useState, useEffect, useCallback } from 'react';
import TradingChart from '../../components/TradingChart/TradingChart';
import SignalPopup from '../../components/SignalPopup/SignalPopup';
import { fetchHistoricalData, connectToMarketData, getCurrentPrice } from '../../services/marketData';
import { generateSignal } from '../../services/signalEngine';
import { calculatePositionSize } from '../../services/riskCalculator';
import { audioAlerts } from '../../services/audioAlerts';
import { isMarketOpen, getMarketStatus } from '../../services/marketHours';
import { supabase } from '../../lib/supabaseClient';
import { findSupportResistance, detectOrderBlocks } from '../../services/indicators';
import styles from './TradingDashboard.module.css';

const TradingDashboard = () => {
  const [market, setMarket] = useState('BTC');
  const [platform, setPlatform] = useState('binance');
  const [timeframe, setTimeframe] = useState('5m');
  const [autoMode, setAutoMode] = useState(false);
  const [candles, setCandles] = useState([]);
  const [currentSignal, setCurrentSignal] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [showSignalPopup, setShowSignalPopup] = useState(false);
  const [riskCalc, setRiskCalc] = useState(null);
  const [stats, setStats] = useState({
    balance: 0,
    pnl: 0,
    wins: 0,
    losses: 0,
    winrate: 0,
    totalTrades: 0
  });
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [marketStatus, setMarketStatus] = useState({ open: true, message: '' });
  const [activeAccount, setActiveAccount] = useState(null);
  const [credits, setCredits] = useState({ remaining: 0, total: 0 });

  useEffect(() => {
    loadHistoricalData();
    checkMarketStatus();

    const interval = setInterval(() => {
      checkMarketStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [market, platform, timeframe]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (autoMode && marketStatus.open) {
      const scanInterval = setInterval(() => {
        performScan();
      }, 30000);

      return () => clearInterval(scanInterval);
    }
  }, [autoMode, market, platform, candles, marketStatus.open]);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        const { data: accounts } = await supabase
          .from('trading_accounts')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .maybeSingle();

        if (accounts) {
          setActiveAccount(accounts);
        }

        const { data: creditData } = await supabase
          .from('position_credits')
          .select('*')
          .eq('user_id', profile.id)
          .eq('market', market)
          .maybeSingle();

        if (creditData) {
          setCredits({
            remaining: creditData.remaining_credits,
            total: creditData.total_credits
          });
        }

        loadStats(profile.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadStats = async (userId) => {
    try {
      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId);

      if (positions) {
        const wins = positions.filter(p => p.status === 'TP1_HIT' || p.status === 'TP2_HIT').length;
        const losses = positions.filter(p => p.status === 'SL_HIT').length;
        const totalPnl = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);

        setStats({
          balance: activeAccount?.capital || 0,
          pnl: totalPnl,
          wins,
          losses,
          winrate: positions.length > 0 ? (wins / positions.length) * 100 : 0,
          totalTrades: positions.length
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkMarketStatus = () => {
    const status = getMarketStatus(market);
    setMarketStatus(status);
  };

  const loadHistoricalData = async () => {
    setScanStatus('Chargement des données...');
    const data = await fetchHistoricalData(market, platform, timeframe, 500);
    if (data && data.length > 0) {
      setCandles(data);
      setScanStatus('');
    } else {
      setScanStatus('Erreur de chargement des données');
    }
  };

  const performScan = async () => {
    if (!marketStatus.open) {
      setScanStatus(`Marché fermé: ${marketStatus.message}`);
      return;
    }

    if (credits.remaining <= 0) {
      setScanStatus('Crédits épuisés - Rechargez votre compte');
      return;
    }

    setScanning(true);
    setScanStatus('Analyse en cours...');

    try {
      const result = await generateSignal(market, platform, candles);

      if (result.signal) {
        if (activeAccount) {
          const calc = calculatePositionSize(activeAccount, result.signal);
          setRiskCalc(calc);
        }

        setCurrentSignal(result.signal);
        setShowSignalPopup(true);
        audioAlerts.signalAlert();
        setScanStatus('Signal détecté !');
      } else {
        setScanStatus(result.reason);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanStatus('Erreur lors de l\'analyse');
    } finally {
      setScanning(false);
    }
  };

  const handleManualScan = () => {
    if (!marketStatus.open) {
      alert(`Le marché ${market} est actuellement fermé. ${marketStatus.message}`);
      return;
    }
    performScan();
  };

  const handleAcceptSignal = async () => {
    if (!activeAccount || !currentSignal) {
      alert('Veuillez configurer un compte de trading');
      return;
    }

    if (credits.remaining <= 0) {
      alert('Vous n\'avez plus de crédits disponibles');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Veuillez vous connecter');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        alert('Profil introuvable');
        return;
      }

      const entryPrice = (currentSignal.entry_min + currentSignal.entry_max) / 2;
      const positionSize = riskCalc?.positionSize || 1;

      const { error: positionError } = await supabase
        .from('positions')
        .insert({
          user_id: profile.id,
          account_id: activeAccount.id,
          market,
          platform,
          direction: currentSignal.direction,
          entry_price: entryPrice,
          stop_loss: currentSignal.stop_loss,
          take_profit_1: currentSignal.take_profit_1,
          take_profit_2: currentSignal.take_profit_2,
          position_size: positionSize,
          status: 'OPEN'
        });

      if (positionError) throw positionError;

      const { data: creditData } = await supabase
        .from('position_credits')
        .select('*')
        .eq('user_id', profile.id)
        .eq('market', market)
        .maybeSingle();

      if (creditData) {
        await supabase
          .from('position_credits')
          .update({ used_credits: creditData.used_credits + 1 })
          .eq('id', creditData.id);

        setCredits(prev => ({
          ...prev,
          remaining: prev.remaining - 1
        }));
      }

      setCurrentPosition({
        direction: currentSignal.direction,
        entry_price: entryPrice,
        stop_loss: currentSignal.stop_loss,
        take_profit_1: currentSignal.take_profit_1,
        take_profit_2: currentSignal.take_profit_2,
        position_size: positionSize,
        status: 'OPEN'
      });

      setShowSignalPopup(false);
      setCurrentSignal(null);

      alert('Position enregistrée avec succès !');
      loadUserData();
    } catch (error) {
      console.error('Error accepting signal:', error);
      alert('Erreur lors de l\'enregistrement de la position: ' + error.message);
    }
  };

  const handleRejectSignal = () => {
    setShowSignalPopup(false);
    setCurrentSignal(null);
    setScanStatus('Signal refusé');
  };

  const { supports, resistances } = findSupportResistance(candles);
  const { bullish: bullishOB, bearish: bearishOB } = detectOrderBlocks(candles);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>AI Trading Platform</h1>

        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Marché:</label>
            <select value={market} onChange={(e) => setMarket(e.target.value)}>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="NASDAQ">NASDAQ</option>
              <option value="GOLD">GOLD</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label>Plateforme:</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {(market === 'BTC' || market === 'ETH') && (
                <>
                  <option value="binance">Binance</option>
                  <option value="bybit">Bybit</option>
                  <option value="coinbase">Coinbase</option>
                </>
              )}
              {(market === 'NASDAQ' || market === 'GOLD') && (
                <>
                  <option value="ftmo">FTMO</option>
                  <option value="topstep">TopStep</option>
                </>
              )}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label>Timeframe:</label>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label>Mode Auto:</label>
            <button
              className={`${styles.toggleBtn} ${autoMode ? styles.active : ''}`}
              onClick={() => setAutoMode(!autoMode)}
            >
              {autoMode ? 'ON' : 'OFF'}
            </button>
          </div>

          <button
            className={styles.scanBtn}
            onClick={handleManualScan}
            disabled={scanning || !marketStatus.open}
          >
            {scanning ? 'Analyse...' : 'Scanner'}
          </button>
        </div>

        <div className={styles.marketStatus}>
          <span className={`${styles.statusDot} ${marketStatus.open ? styles.open : styles.closed}`} />
          {marketStatus.message}
        </div>

        <div className={styles.credits}>
          Crédits: {credits.remaining} / {credits.total}
        </div>
      </div>

      {scanStatus && (
        <div className={styles.scanStatus}>
          {scanStatus}
        </div>
      )}

      <div className={styles.chartSection}>
        <TradingChart
          candles={candles}
          signal={currentSignal}
          position={currentPosition}
          supports={supports}
          resistances={resistances}
        />
      </div>

      {showSignalPopup && currentSignal && (
        <SignalPopup
          signal={currentSignal}
          riskCalc={riskCalc}
          onAccept={handleAcceptSignal}
          onReject={handleRejectSignal}
        />
      )}

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Balance</span>
          <span className={styles.statValue}>${stats.balance.toFixed(2)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>PnL</span>
          <span className={`${styles.statValue} ${stats.pnl >= 0 ? styles.positive : styles.negative}`}>
            ${stats.pnl.toFixed(2)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Trades</span>
          <span className={styles.statValue}>{stats.totalTrades}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Gains</span>
          <span className={`${styles.statValue} ${styles.positive}`}>{stats.wins}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Pertes</span>
          <span className={`${styles.statValue} ${styles.negative}`}>{stats.losses}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Winrate</span>
          <span className={styles.statValue}>{stats.winrate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
