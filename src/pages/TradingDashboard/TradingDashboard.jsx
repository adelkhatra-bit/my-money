import React, { useState, useEffect, useCallback } from 'react';
import TradingChart from '../../components/TradingChart/TradingChart';
import SignalPopup from '../../components/SignalPopup/SignalPopup';
import PreAlertPopup from '../../components/PreAlertPopup/PreAlertPopup';
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
  const [showPreAlert, setShowPreAlert] = useState(false);
  const [preAlertData, setPreAlertData] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
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
    if (market === 'NASDAQ' || market === 'GOLD') {
      if (platform === 'binance' || platform === 'bybit' || platform === 'coinbase') {
        setPlatform('ftmo');
      }
    } else if (market === 'BTC' || market === 'ETH') {
      if (platform === 'ftmo' || platform === 'topstep' || platform === 'apex') {
        setPlatform('binance');
      }
    }
  }, [market]);

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
          loadStats(profile.id, accounts);
        } else {
          setActiveAccount(null);
          loadStats(profile.id, null);
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
        } else {
          setCredits({ remaining: 0, total: 0 });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadStats = async (userId, account = null) => {
    try {
      const accountToUse = account || activeAccount;

      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId);

      if (positions) {
        const closedPositions = positions.filter(p =>
          p.status === 'TP1_HIT' || p.status === 'TP2_HIT' || p.status === 'SL_HIT'
        );
        const wins = closedPositions.filter(p => p.status === 'TP1_HIT' || p.status === 'TP2_HIT').length;
        const losses = closedPositions.filter(p => p.status === 'SL_HIT').length;
        const totalPnl = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);

        setStats({
          balance: accountToUse?.capital || 0,
          pnl: totalPnl,
          wins,
          losses,
          winrate: closedPositions.length > 0 ? (wins / closedPositions.length) * 100 : 0,
          totalTrades: closedPositions.length
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
        if (result.signal.market !== market) {
          console.error(`Signal market mismatch: expected ${market}, got ${result.signal.market}`);
          setScanStatus(`Erreur: Signal généré pour ${result.signal.market} au lieu de ${market}`);
          setScanning(false);
          return;
        }

        setPreAlertData({
          market,
          platform,
          expectedDirection: result.signal.direction,
          timeRemaining: 300
        });
        setShowPreAlert(true);
        setShowAnalysis(true);
        audioAlerts.signalAlert();
        setScanStatus('Opportunité en préparation...');

        setTimeout(() => {
          if (activeAccount) {
            const calc = calculatePositionSize(activeAccount, result.signal);
            setRiskCalc(calc);
          }

          setCurrentSignal(result.signal);
          setShowSignalPopup(true);
          setShowPreAlert(false);
          audioAlerts.signalAlert();
          setScanStatus('Signal confirmé !');
        }, 300000);
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
    console.log('Accept signal clicked', { activeAccount, currentSignal, credits });

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
      console.log('Current user:', user);

      if (!user) {
        alert('Veuillez vous connecter');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('User profile:', profile);

      if (!profile) {
        alert('Profil introuvable');
        return;
      }

      const entryPrice = (currentSignal.entry_min + currentSignal.entry_max) / 2;
      const positionSize = riskCalc?.positionSize || 1;

      console.log('Creating position:', {
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

      const { data: positionData, error: positionError } = await supabase
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
        })
        .select();

      if (positionError) {
        console.error('Position creation error:', positionError);
        throw positionError;
      }

      console.log('Position created successfully:', positionData);

      const { data: creditData } = await supabase
        .from('position_credits')
        .select('*')
        .eq('user_id', profile.id)
        .eq('market', market)
        .maybeSingle();

      console.log('Credit data:', creditData);

      if (creditData) {
        const { error: creditError } = await supabase
          .from('position_credits')
          .update({ used_credits: creditData.used_credits + 1 })
          .eq('id', creditData.id);

        if (creditError) {
          console.error('Credit update error:', creditError);
        } else {
          console.log('Credits updated successfully');
        }

        setCredits(prev => ({
          ...prev,
          remaining: prev.remaining - 1
        }));
      }

      const newPosition = {
        direction: currentSignal.direction,
        entry_price: entryPrice,
        stop_loss: currentSignal.stop_loss,
        take_profit_1: currentSignal.take_profit_1,
        take_profit_2: currentSignal.take_profit_2,
        position_size: positionSize,
        status: 'OPEN'
      };

      console.log('Setting current position:', newPosition);
      setCurrentPosition(newPosition);

      setShowSignalPopup(false);
      setCurrentSignal(null);

      console.log('Position accepted successfully, reloading user data...');
      alert('Position enregistrée avec succès !');
      await loadUserData();
    } catch (error) {
      console.error('Error accepting signal:', error);
      alert('Erreur lors de l\'enregistrement de la position: ' + error.message);
    }
  };

  const handleRejectSignal = () => {
    setShowSignalPopup(false);
    setCurrentSignal(null);
    setShowAnalysis(false);
    setScanStatus('Signal refusé');
  };

  const handleClosePreAlert = () => {
    setShowPreAlert(false);
  };

  const { supports, resistances } = findSupportResistance(candles);
  const { bullish: bullishOB, bearish: bearishOB } = detectOrderBlocks(candles);

  return (
    <div className={styles.dashboard}>
      {!marketStatus.open && (
        <div className={styles.marketClosedBanner}>
          ⚠️ Marché {market} fermé - {marketStatus.message}
        </div>
      )}

      {!activeAccount && (
        <div className={styles.warningBanner}>
          Aucun compte de trading actif configuré. <a href="/accounts">Créez un compte</a> pour commencer à recevoir des signaux.
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1>AI Trading Platform</h1>
          <div className={styles.paperTradingBadge}>PAPER TRADING MODE</div>
        </div>

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
          hasCredits={credits.remaining > 0}
          showAnalysis={showAnalysis || credits.remaining > 0}
        />
      </div>

      {showPreAlert && preAlertData && (
        <PreAlertPopup
          market={preAlertData.market}
          platform={preAlertData.platform}
          expectedDirection={preAlertData.expectedDirection}
          timeRemaining={preAlertData.timeRemaining}
          onClose={handleClosePreAlert}
        />
      )}

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
