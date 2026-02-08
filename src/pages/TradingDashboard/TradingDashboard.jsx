import React, { useState, useEffect, useCallback } from 'react';
import TradingChart from '../../components/TradingChart/TradingChart';
import SignalProcess from '../../components/SignalProcess/SignalProcess';
import BotStatus from '../../components/BotStatus/BotStatus';
import PositionHistory from '../../components/PositionHistory/PositionHistory';
import { fetchHistoricalData, connectToMarketData, getCurrentPrice } from '../../services/marketData';
import { generateSignal } from '../../services/signalEngine';
import { calculatePositionSize } from '../../services/riskCalculator';
import { audioAlerts } from '../../services/audioAlerts';
import { isMarketOpen, getMarketStatus } from '../../services/marketHours';
import { logAction } from '../../services/actionHistory';
import { botService } from '../../services/botService';
import { newsDetection } from '../../services/newsDetection';
import { supabase } from '../../lib/supabaseClient';
import styles from './TradingDashboard.module.css';

const TradingDashboard = () => {
  const [market, setMarket] = useState('BTC');
  const [platform, setPlatform] = useState('binance');
  const [timeframe, setTimeframe] = useState('5m');
  const [autoMode, setAutoMode] = useState(false);
  const [candles, setCandles] = useState([]);
  const [currentSignal, setCurrentSignal] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [showPreAlert, setShowPreAlert] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [riskCalc, setRiskCalc] = useState(null);
  const [signalState, setSignalState] = useState({ isScanning: false, preAlert: null, signal: null });
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
  const [botState, setBotState] = useState('idle');
  const [nextScanIn, setNextScanIn] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [nextScanTime, setNextScanTime] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [supports, setSupports] = useState([]);
  const [resistances, setResistances] = useState([]);
  const [orderBlocks, setOrderBlocks] = useState({ bullish: [], bearish: [] });
  const [dismissedSignals, setDismissedSignals] = useState(new Set());
  const [userId, setUserId] = useState(null);
  const [newsSuspension, setNewsSuspension] = useState(false);
  const [positionsHistory, setPositionsHistory] = useState([]);

  useEffect(() => {
    if (market === 'NASDAQ' || market === 'GOLD') {
      if (platform === 'binance' || platform === 'bybit' || platform === 'okx' || platform === 'coinbase') {
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
  }, [market]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(`bot_active_${market}`, autoMode.toString());

    if (userId && autoMode !== null) {
      supabase
        .from('user_settings')
        .update({ bot_auto_mode: autoMode })
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.error('Error saving bot state:', error);
        });
    }
  }, [autoMode, market, userId]);

  useEffect(() => {
    const newsListener = (isActive) => {
      setNewsSuspension(isActive);
      if (isActive) {
        const status = newsDetection.getStatus();
        setScanStatus(`🚨 TRADING SUSPENDU - Événement majeur détecté (${status.remainingMinutes} min restantes)`);
        setBotState('idle');
      }
    };

    newsDetection.addListener(newsListener);
    newsDetection.startAutoCheck([market]);

    return () => {
      newsDetection.removeListener(newsListener);
    };
  }, [market]);

  useEffect(() => {
    const updatePnL = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        await updateRealTimePnL(profile.id, activeAccount);
      }
    };

    updatePnL();
    const pnlInterval = setInterval(updatePnL, 5000);

    return () => clearInterval(pnlInterval);
  }, [activeAccount]);

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
        setUserId(profile.id);

        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (settingsData) {
          audioAlerts.setEnabled(settingsData.audio_enabled);
          audioAlerts.setVolume(parseFloat(settingsData.audio_volume));
        }

        const { data: accounts } = await supabase
          .from('trading_accounts')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .maybeSingle();

        if (accounts) {
          setActiveAccount(accounts);
          loadStats(profile.id, accounts);
          loadPositionsHistory(profile.id);
        } else {
          setActiveAccount(null);
          loadStats(profile.id, null);
          loadPositionsHistory(profile.id);
        }

        const { data: creditData } = await supabase
          .from('position_credits')
          .select('*')
          .eq('user_id', profile.id)
          .eq('market', market)
          .maybeSingle();

        if (creditData) {
          const remaining = creditData.total_credits - creditData.used_credits;
          setCredits({
            remaining: remaining,
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

  const loadPositionsHistory = async (userId) => {
    try {
      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('market', market)
        .order('created_at', { ascending: false })
        .limit(20);

      if (positions) {
        setPositionsHistory(positions);

        const openPosition = positions.find(p => p.status === 'OPEN');
        if (openPosition) {
          setCurrentPosition(openPosition);
        } else {
          setCurrentPosition(null);
        }
      }
    } catch (error) {
      console.error('Error loading positions history:', error);
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
          balance: (accountToUse?.capital || 0) + totalPnl,
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

  const updateRealTimePnL = async (userId, account = null) => {
    try {
      const accountToUse = account || activeAccount;
      if (!accountToUse) return;

      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId);

      if (!positions) return;

      let hasUpdates = false;

      for (const position of positions) {
        if (position.status === 'OPEN') {
          const currentPrice = await getCurrentPrice(position.market, position.platform);

          if (!currentPrice) continue;

          let unrealizedPnl = 0;
          let newStatus = 'OPEN';
          let hitPrice = null;

          if (position.direction === 'LONG') {
            if (currentPrice <= position.stop_loss) {
              newStatus = 'SL_HIT';
              hitPrice = position.stop_loss;
              unrealizedPnl = (position.stop_loss - position.entry_price) * position.position_size * 100000;
            } else if (currentPrice >= position.take_profit_2 && position.take_profit_2) {
              newStatus = 'TP2_HIT';
              hitPrice = position.take_profit_2;
              unrealizedPnl = (position.take_profit_2 - position.entry_price) * position.position_size * 100000;
            } else if (currentPrice >= position.take_profit_1) {
              newStatus = 'TP1_HIT';
              hitPrice = position.take_profit_1;
              unrealizedPnl = (position.take_profit_1 - position.entry_price) * position.position_size * 100000;
            } else {
              unrealizedPnl = (currentPrice - position.entry_price) * position.position_size * 100000;
            }
          } else if (position.direction === 'SHORT') {
            if (currentPrice >= position.stop_loss) {
              newStatus = 'SL_HIT';
              hitPrice = position.stop_loss;
              unrealizedPnl = (position.entry_price - position.stop_loss) * position.position_size * 100000;
            } else if (currentPrice <= position.take_profit_2 && position.take_profit_2) {
              newStatus = 'TP2_HIT';
              hitPrice = position.take_profit_2;
              unrealizedPnl = (position.entry_price - position.take_profit_2) * position.position_size * 100000;
            } else if (currentPrice <= position.take_profit_1) {
              newStatus = 'TP1_HIT';
              hitPrice = position.take_profit_1;
              unrealizedPnl = (position.entry_price - position.take_profit_1) * position.position_size * 100000;
            } else {
              unrealizedPnl = (position.entry_price - currentPrice) * position.position_size * 100000;
            }
          }

          if (newStatus !== 'OPEN') {
            hasUpdates = true;
            const closedAt = new Date().toISOString();
            await supabase
              .from('positions')
              .update({
                status: newStatus,
                pnl: unrealizedPnl,
                closed_at: closedAt,
                exit_price: hitPrice
              })
              .eq('id', position.id);

            if (newStatus === 'TP1_HIT' || newStatus === 'TP2_HIT') {
              await logAction(userId, newStatus === 'TP1_HIT' ? 'TP1_HIT' : 'TP2_HIT', position.market, position.platform, {
                direction: position.direction,
                entry_price: position.entry_price,
                exit_price: hitPrice,
                pnl: unrealizedPnl,
                position_id: position.id
              });
            } else if (newStatus === 'SL_HIT') {
              await logAction(userId, 'SL_HIT', position.market, position.platform, {
                direction: position.direction,
                entry_price: position.entry_price,
                exit_price: hitPrice,
                pnl: unrealizedPnl,
                position_id: position.id
              });
            }
          } else {
            await supabase
              .from('positions')
              .update({ pnl: unrealizedPnl })
              .eq('id', position.id);
          }
        }
      }

      if (hasUpdates) {
        await loadStats(userId, accountToUse);
        await loadPositionsHistory(userId);
      }

      const allPositions = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId);

      if (allPositions.data) {
        const closedPositions = allPositions.data.filter(p =>
          p.status === 'TP1_HIT' || p.status === 'TP2_HIT' || p.status === 'SL_HIT'
        );
        const openPositions = allPositions.data.filter(p => p.status === 'OPEN');

        const wins = closedPositions.filter(p => p.status === 'TP1_HIT' || p.status === 'TP2_HIT').length;
        const losses = closedPositions.filter(p => p.status === 'SL_HIT').length;
        const realizedPnl = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
        const unrealizedPnl = openPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
        const totalPnl = realizedPnl + unrealizedPnl;

        setStats({
          balance: (accountToUse?.capital || 0) + totalPnl,
          pnl: totalPnl,
          wins,
          losses,
          winrate: closedPositions.length > 0 ? (wins / closedPositions.length) * 100 : 0,
          totalTrades: closedPositions.length + openPositions.length
        });
      }
    } catch (error) {
      console.error('Error updating real-time PnL:', error);
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
      setBotState('idle');
      return;
    }

    if (newsDetection.isNewsSuspension()) {
      const status = newsDetection.getStatus();
      setScanStatus(`🚨 TRADING SUSPENDU - Événement majeur en cours (${status.remainingMinutes} min restantes)`);
      setBotState('idle');
      return;
    }

    if (credits.remaining <= 0) {
      setScanStatus('Crédits épuisés - Rechargez votre compte');
      setBotState('idle');
      return;
    }

    const now = new Date();
    setLastScanTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

    const nextScan = new Date(now.getTime() + 30000);
    setNextScanTime(nextScan.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

    setSignalState({ isScanning: true, preAlert: null, signal: null });
    setScanning(true);
    setBotState('scanning');
    setScanStatus('🔍 Le robot analyse le marché en temps réel...');
    setShowAnalysis(false);

    try {
      const result = await generateSignal(market, platform, candles);

      if (result.analysis) {
        setSupports(result.analysis.supports || []);
        setResistances(result.analysis.resistances || []);
        setOrderBlocks(result.analysis.orderBlocks || { bullish: [], bearish: [] });
      }

      if (result.signal) {
        if (result.signal.market !== market) {
          console.error(`Signal market mismatch: expected ${market}, got ${result.signal.market}`);
          setScanStatus(`❌ Erreur: Signal pour ${result.signal.market} au lieu de ${market}`);
          setScanning(false);
          setSignalState({ isScanning: false, preAlert: null, signal: null });
          return;
        }

        if (dismissedSignals.has(result.signal.id)) {
          console.log('Signal déjà ignoré, skip:', result.signal.id);
          setScanning(false);
          setScanStatus('Signal déjà vu - En attente du prochain');
          setBotState('idle');
          return;
        }

        if (userId) {
          await logAction(userId, 'SIGNAL_GENERATED', market, platform, {
            direction: result.signal.direction,
            entry_min: result.signal.entry_min,
            entry_max: result.signal.entry_max,
            stop_loss: result.signal.stop_loss,
            take_profit_1: result.signal.take_profit_1,
            take_profit_2: result.signal.take_profit_2,
            confidence: result.signal.confidence
          });
        }

        setShowAnalysis(true);
        setSignalState({
          isScanning: false,
          preAlert: { market, platform, direction: result.signal.direction },
          signal: null
        });
        setBotState('pre_alert');
        setScanStatus(`⚠️ PRÉPARE-TOI : Une position ${result.signal.direction === 'LONG' ? 'ACHAT' : 'VENTE'} est en préparation sur ${market}`);

        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification('🤖 Signal de Trading Détecté!', {
            body: `Une position ${result.signal.direction === 'LONG' ? 'ACHAT' : 'VENTE'} est en préparation sur ${market}`,
            icon: '/logo192.png',
            tag: 'trading-signal',
            requireInteraction: true
          });
        }

        setTimeout(() => {
          if (activeAccount) {
            const calc = calculatePositionSize(activeAccount, result.signal);
            setRiskCalc(calc);
          }

          const signalWithTimer = {
            ...result.signal,
            validUntil: Date.now() + 120000,
            entryMin: result.signal.entry_min,
            entryMax: result.signal.entry_max,
            sl: result.signal.stop_loss,
            tp1: result.signal.take_profit_1,
            tp2: result.signal.take_profit_2,
            lots: calculatePositionSize(activeAccount, result.signal)?.positionSize || 1,
            risk: activeAccount?.risk_per_trade_percent || 1,
            confidence: result.signal.confidence || 75
          };

          setSignalState({
            isScanning: false,
            preAlert: null,
            signal: signalWithTimer
          });
          setCurrentSignal(result.signal);
          setBotState('signal_ready');
          audioAlerts.signalAlert();
          setScanStatus(`✅ POSITION ${result.signal.direction === 'LONG' ? 'ACHAT' : 'VENTE'} CONFIRMÉE - Clique OK pour accepter`);

          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            new Notification('✅ Signal Confirmé!', {
              body: `Position ${result.signal.direction === 'LONG' ? 'ACHAT (LONG)' : 'VENTE (SHORT)'} confirmée sur ${market}. Reviens vite pour accepter!`,
              icon: '/logo192.png',
              tag: 'trading-signal-confirmed',
              requireInteraction: true
            });
          }
        }, 120000);
      } else {
        setScanStatus(`ℹ️ ${result.reason || 'Aucune opportunité détectée pour le moment'}`);
        setSignalState({ isScanning: false, preAlert: null, signal: null });
        setBotState('idle');

        setTimeout(() => {
          setShowAnalysis(false);
          setScanStatus('');
        }, 5000);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanStatus('❌ Erreur lors de l\'analyse du marché');
      setSignalState({ isScanning: false, preAlert: null, signal: null });
      setBotState('idle');
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

  useEffect(() => {
    const scanCallback = () => {
      if (!scanning && marketStatus.open) {
        performScan();
      }
    };

    if (autoMode && marketStatus.open) {
      botService.addCallback(scanCallback);
      botService.start(scanCallback, 30000);
    } else {
      botService.removeCallback(scanCallback);
      if (!autoMode) {
        botService.stop();
      }
    }

    return () => {
      botService.removeCallback(scanCallback);
    };
  }, [autoMode, marketStatus.open]);

  const handleAcceptSignal = async (signal) => {
    if (!activeAccount) {
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

      const entryPrice = (signal.entry_min + signal.entry_max) / 2;
      const positionSize = riskCalc?.positionSize || 1;

      console.log('[Position] Tentative de création:', {
        user_id: profile.id,
        account_id: activeAccount.id,
        market: signal.market,
        platform: signal.platform,
        direction: signal.direction,
        entry_price: entryPrice,
        stop_loss: signal.stop_loss,
        take_profit_1: signal.take_profit_1,
        take_profit_2: signal.take_profit_2,
        position_size: positionSize
      });

      const { data: positionData, error: positionError } = await supabase
        .from('positions')
        .insert({
          user_id: profile.id,
          account_id: activeAccount.id,
          market: signal.market,
          platform: signal.platform,
          direction: signal.direction,
          entry_price: entryPrice,
          stop_loss: signal.stop_loss,
          take_profit_1: signal.take_profit_1,
          take_profit_2: signal.take_profit_2,
          position_size: positionSize,
          status: 'OPEN'
        })
        .select();

      if (positionError) {
        console.error('[Position] Erreur lors de l\'insertion:', positionError);
        throw positionError;
      }

      console.log('[Position] Position créée avec succès:', positionData);

      await supabase
        .from('signal_history')
        .insert({
          user_id: profile.id,
          market: signal.market,
          platform: signal.platform,
          timeframe: signal.timeframe || timeframe,
          direction: signal.direction,
          entry_price: entryPrice,
          stop_loss: signal.stop_loss,
          take_profit_1: signal.take_profit_1,
          take_profit_2: signal.take_profit_2,
          lots: positionSize,
          status: 'pris',
          result: 'en_cours'
        });

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

      await logAction(profile.id, 'POSITION_OPENED', signal.market, signal.platform, {
        direction: signal.direction,
        entry_price: entryPrice,
        stop_loss: signal.stop_loss,
        take_profit_1: signal.take_profit_1,
        take_profit_2: signal.take_profit_2,
        position_size: positionSize
      });

      const newPosition = {
        direction: signal.direction,
        entry_price: entryPrice,
        stop_loss: signal.stop_loss,
        take_profit_1: signal.take_profit_1,
        take_profit_2: signal.take_profit_2,
        position_size: positionSize,
        status: 'OPEN'
      };

      setCurrentPosition(newPosition);
      setSignalState({ isScanning: false, preAlert: null, signal: null });
      setCurrentSignal(null);
      setBotState('position_locked');
      await loadUserData();
      await loadStats(profile.id, activeAccount);
      await loadPositionsHistory(profile.id);
    } catch (error) {
      console.error('[Position] Error accepting signal:', error);

      let errorMessage = 'Erreur lors de l\'enregistrement de la position';

      if (error.message) {
        errorMessage += ': ' + error.message;
      }

      if (error.code === 'PGRST116') {
        errorMessage = 'Erreur de permissions - Veuillez réessayer ou contacter le support';
      } else if (error.code === '23503') {
        errorMessage = 'Erreur de référence de données - Vérifiez votre compte de trading';
      } else if (error.code === '23505') {
        errorMessage = 'Cette position existe déjà';
      }

      console.error('[Position] Formatted error:', errorMessage);
      alert(errorMessage);
    }
  };

  const handleDeclineSignal = () => {
    setSignalState({ isScanning: false, preAlert: null, signal: null });
    setCurrentSignal(null);
    setShowAnalysis(false);
    setBotState('idle');
    setScanStatus('Signal refusé');
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

  const handleDismissSignal = async () => {
    if (signalState.signal && signalState.signal.id) {
      setDismissedSignals(prev => new Set(prev).add(signalState.signal.id));

      if (userId && signalState.signal) {
        await logAction(userId, 'SIGNAL_DISMISSED', signalState.signal.market, signalState.signal.platform, {
          direction: signalState.signal.direction,
          entry_min: signalState.signal.entry_min,
          entry_max: signalState.signal.entry_max
        });
      }
    }
    setSignalState({ isScanning: false, preAlert: null, signal: null });
    setCurrentSignal(null);
    setShowAnalysis(false);
    setBotState('idle');
    setScanStatus('Signal ignoré');
  };

  return (
    <div className={styles.dashboard}>
      {!marketStatus.open && (
        <div className={styles.marketClosedBanner}>
          ⚠️ Marché {market} fermé - {marketStatus.message}
        </div>
      )}

      {newsSuspension && (
        <div className={styles.newsSuspensionBanner}>
          🚨 TRADING SUSPENDU - Événement majeur en cours ({newsDetection.getStatus().remainingMinutes} min restantes)
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
                  <option value="okx">OKX</option>
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
            <button
              className={`${styles.toggleBtn} ${autoMode ? styles.active : ''}`}
              onClick={() => setAutoMode(!autoMode)}
              title={autoMode ? 'Robot activé - Scan automatique toutes les 30s' : 'Robot désactivé - Scan manuel uniquement'}
            >
              {autoMode ? '🤖 ROBOT ON' : '⏸️ ROBOT OFF'}
            </button>
          </div>

          <button
            className={styles.scanBtn}
            onClick={handleManualScan}
            disabled={scanning || !marketStatus.open}
          >
            {scanning ? '🔍 Analyse...' : '🎯 Scan Manuel'}
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

      <BotStatus
        isActive={autoMode && marketStatus.open}
        currentState={botState}
        nextScanIn={nextScanIn}
        lastScanTime={lastScanTime}
        nextScanTime={nextScanTime}
        etaMinutes={etaMinutes || 5}
      />

      {signalState.isScanning && (
        <div className={styles.scanningIndicator}>
          <div className={styles.scanningPulse}></div>
          <span className={styles.scanningText}>PATIENTEZ - ANALYSE EN COURS</span>
          <div className={styles.scanningDots}>
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      )}

      {scanStatus && (
        <div className={styles.scanStatus}>
          {scanStatus}
        </div>
      )}

      <div className={styles.chartSection}>
        {candles.length === 0 ? (
          <div className={styles.loadingChart}>
            <div className={styles.loadingSpinner}></div>
            <p>Chargement des données de marché...</p>
          </div>
        ) : (
          <TradingChart
            candles={candles}
            signal={currentSignal}
            position={currentPosition}
            supports={credits.remaining > 0 ? supports : []}
            resistances={credits.remaining > 0 ? resistances : []}
            orderBlocks={credits.remaining > 0 ? orderBlocks : { bullish: [], bearish: [] }}
            hasCredits={credits.remaining > 0}
            showAnalysis={credits.remaining > 0 && (showAnalysis || signalState.preAlert || signalState.signal)}
          />
        )}
      </div>

      <SignalProcess
        isScanning={signalState.isScanning}
        preAlert={signalState.preAlert}
        signal={signalState.signal}
        onAcceptSignal={handleAcceptSignal}
        onDeclineSignal={handleDeclineSignal}
        onDismissSignal={handleDismissSignal}
        userCredits={credits.remaining}
      />

      <PositionHistory positions={positionsHistory} />

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
