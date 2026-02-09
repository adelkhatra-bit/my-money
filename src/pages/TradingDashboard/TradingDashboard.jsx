import React, { useState, useEffect, useCallback } from 'react';
import TradingChart from '../../components/TradingChart/TradingChart';
import SignalProcess from '../../components/SignalProcess/SignalProcess';
import BotStatus from '../../components/BotStatus/BotStatus';
import PositionHistory from '../../components/PositionHistory/PositionHistory';
import TrailingStopPopup from '../../components/TrailingStopPopup/TrailingStopPopup';
import BotActivityLog from '../../components/BotActivityLog/BotActivityLog';
import ScanOpportunity from '../../components/ScanOpportunity/ScanOpportunity';
import { fetchHistoricalData, connectToMarketData, getCurrentPrice } from '../../services/marketData';
import { generateSignal } from '../../services/signalEngine';
import { calculatePositionSize } from '../../services/riskCalculator';
import { audioAlerts } from '../../services/audioAlerts';
import { isMarketOpen, getMarketStatus } from '../../services/marketHours';
import { logAction } from '../../services/actionHistory';
import { botService } from '../../services/botService';
import { newsDetection } from '../../services/newsDetection';
import { calculateTrailingStop, shouldUpdateTrailingStop } from '../../services/trailingStop';
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
  const [showTrailingStopPopup, setShowTrailingStopPopup] = useState(false);
  const [trailingStopData, setTrailingStopData] = useState(null);
  const [lastTrailingStopUpdate, setLastTrailingStopUpdate] = useState(null);
  const [activityLogCallback, setActivityLogCallback] = useState(null);
  const [potentialEntry, setPotentialEntry] = useState(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [scanOpportunity, setScanOpportunity] = useState(null);

  const addActivityLog = (message, type = 'info') => {
    if (activityLogCallback) {
      activityLogCallback({ message, type });
    }
  };

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
    loadUserData();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

        const { data: accounts, error: accountError } = await supabase
          .from('trading_accounts')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_active', true);

        if (accountError) {
          console.error('Erreur chargement comptes:', accountError);
        }

        console.log('📊 Comptes trouvés:', accounts?.length || 0, accounts);

        if (accounts && accounts.length > 0) {
          const activeAcc = accounts[0];
          console.log('✅ Compte actif sélectionné:', activeAcc);
          setActiveAccount(activeAcc);
          loadStats(profile.id, activeAcc);
          loadPositionsHistory(profile.id, activeAcc);
        } else {
          console.warn('⚠️ Aucun compte actif trouvé');
          setActiveAccount(null);
          loadStats(profile.id, null);
          loadPositionsHistory(profile.id, null);
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

  const loadPositionsHistory = async (userId, account = null) => {
    try {
      const accountToUse = account || activeAccount;

      if (!accountToUse) {
        console.log('⚠️ Aucun compte actif');
        setPositionsHistory([]);
        setCurrentPosition(null);
        return;
      }

      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('market', market)
        .eq('trading_account_id', accountToUse.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (positions) {
        setPositionsHistory(positions);

        const openPosition = positions.find(p => p.status === 'OPEN');
        if (openPosition) {
          console.log('📊 Position OUVERTE chargée pour le graphique:', {
            id: openPosition.id,
            market: openPosition.market,
            account: openPosition.trading_account_id,
            entry: openPosition.entry_price,
            sl: openPosition.stop_loss,
            tp1: openPosition.take_profit_1
          });
          setCurrentPosition(openPosition);
        } else {
          console.log('✅ Aucune position ouverte sur', market);
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

      if (!accountToUse) {
        console.log('⚠️ Aucun compte actif pour loadStats');
        setStats({
          balance: 0,
          pnl: 0,
          wins: 0,
          losses: 0,
          winrate: 0,
          totalTrades: 0
        });
        return;
      }

      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('trading_account_id', accountToUse.id);

      console.log('📊 Stats pour compte:', {
        accountId: accountToUse.id,
        accountName: accountToUse.name,
        capital: accountToUse.capital,
        totalPositions: positions?.length || 0
      });

      if (positions) {
        const closedPositions = positions.filter(p =>
          p.status === 'TP1_HIT' || p.status === 'TP2_HIT' || p.status === 'SL_HIT'
        );
        const openPositions = positions.filter(p => p.status === 'OPEN');

        const wins = closedPositions.filter(p => p.status === 'TP1_HIT' || p.status === 'TP2_HIT').length;
        const losses = closedPositions.filter(p => p.status === 'SL_HIT').length;

        const closedPnl = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
        const openPnl = openPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
        const totalPnl = closedPnl + openPnl;

        console.log('📈 Statistiques calculées:', {
          closed: closedPositions.length,
          open: openPositions.length,
          wins,
          losses,
          closedPnl: closedPnl.toFixed(2),
          openPnl: openPnl.toFixed(2),
          totalPnl: totalPnl.toFixed(2),
          balance: (accountToUse.capital + totalPnl).toFixed(2)
        });

        setStats({
          balance: accountToUse.capital + totalPnl,
          pnl: totalPnl,
          wins,
          losses,
          winrate: closedPositions.length > 0 ? (wins / closedPositions.length) * 100 : 0,
          totalTrades: positions.length
        });
      } else {
        setStats({
          balance: accountToUse.capital,
          pnl: 0,
          wins: 0,
          losses: 0,
          winrate: 0,
          totalTrades: 0
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

      const openPositions = positions.filter(p => p.status === 'OPEN');
      if (openPositions.length > 0) {
        console.log('🔄 SUIVI TEMPS RÉEL:', {
          totalPositions: openPositions.length,
          comptes: [...new Set(openPositions.map(p => p.trading_account_id))],
          markets: [...new Set(openPositions.map(p => p.market))],
          currentAccount: accountToUse?.id
        });
      }

      let hasUpdates = false;

      for (const position of positions) {
        if (position.status === 'OPEN') {
          const currentPrice = await getCurrentPrice(position.market, position.platform);

          if (!currentPrice) continue;

          if (shouldUpdateTrailingStop(position, lastTrailingStopUpdate)) {
            const positionSupports = position.market === market ? supports : [];
            const positionResistances = position.market === market ? resistances : [];
            const trailingResult = calculateTrailingStop(position, currentPrice, positionSupports, positionResistances);

            if (trailingResult) {
              console.log('🛡️ TRAILING STOP ACTIVÉ:', {
                market: position.market,
                platform: position.platform,
                ...trailingResult
              });

              addActivityLog(`🛡️ Trailing Stop activé sur ${position.market}!`, 'success');
              addActivityLog(`📈 SL déplacé pour protéger +${trailingResult.gainProtected}% de gains`, 'position');

              const oldSL = position.stop_loss;
              const newSL = trailingResult.newStopLoss;

              await supabase
                .from('positions')
                .update({ stop_loss: newSL })
                .eq('id', position.id);

              await logAction(userId, 'TRAILING_STOP_MOVED', position.market, position.platform, {
                direction: position.direction,
                old_stop_loss: oldSL,
                new_stop_loss: newSL,
                current_price: currentPrice,
                reason: trailingResult.reason,
                gain_protected: trailingResult.gainProtected
              });

              setTrailingStopData({
                direction: position.direction,
                oldSL,
                newSL,
                currentPrice,
                reason: trailingResult.reason,
                gainProtected: trailingResult.gainProtected
              });
              setShowTrailingStopPopup(true);
              setLastTrailingStopUpdate(Date.now());

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🛡️ Stop Loss Sécurisé!', {
                  body: `+${trailingResult.gainProtected}% de gains protégés sur ${position.market}`,
                  icon: '/logo192.png',
                  tag: 'trailing-stop'
                });
              }

              position.stop_loss = newSL;
              hasUpdates = true;

              if (currentPosition &&
                  currentPosition.id === position.id) {
                console.log('📈 MISE À JOUR DU SL AFFICHÉ SUR LE GRAPHIQUE:', {
                  positionId: position.id,
                  market: position.market,
                  platform: position.platform,
                  account: position.trading_account_id,
                  ancien: currentPosition.stop_loss,
                  nouveau: newSL
                });
                setCurrentPosition({
                  ...currentPosition,
                  stop_loss: newSL
                });
              }
            }
          }

          let unrealizedPnl = 0;
          let newStatus = 'OPEN';
          let hitPrice = null;

          const correctDirection = position.take_profit_1 > position.entry_price ? 'LONG' : 'SHORT';

          if (position.direction !== correctDirection) {
            console.warn('⚠️ [PnL Calculation] Direction incorrecte détectée et corrigée:', {
              stored: position.direction,
              correct: correctDirection,
              entry: position.entry_price.toFixed(5),
              tp1: position.take_profit_1.toFixed(5),
              sl: position.stop_loss.toFixed(5)
            });
          }

          if (correctDirection === 'LONG') {
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
          } else if (correctDirection === 'SHORT') {
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
              const tpLabel = newStatus === 'TP1_HIT' ? 'TP1' : 'TP2';
              addActivityLog(`🎯 ${tpLabel} ATTEINT sur ${position.market}!`, 'success');
              addActivityLog(`💰 Profit réalisé: ${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toFixed(2)}`, 'success');

              await logAction(userId, newStatus === 'TP1_HIT' ? 'TP1_HIT' : 'TP2_HIT', position.market, position.platform, {
                direction: position.direction,
                entry_price: position.entry_price,
                exit_price: hitPrice,
                pnl: unrealizedPnl,
                position_id: position.id
              });
            } else if (newStatus === 'SL_HIT') {
              addActivityLog(`🛑 STOP LOSS atteint sur ${position.market}`, 'error');
              addActivityLog(`💸 Perte: ${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toFixed(2)}`, 'error');

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

            if (currentPosition && currentPosition.id === position.id) {
              setCurrentPosition({
                ...currentPosition,
                pnl: unrealizedPnl
              });
            }
          }
        }
      }

      if (hasUpdates) {
        await loadStats(userId, accountToUse);
        await loadPositionsHistory(userId, accountToUse);
      }

      if (!accountToUse) {
        console.log('⚠️ Aucun compte actif pour updateRealTimePnL stats');
        return;
      }

      const allPositions = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('trading_account_id', accountToUse.id);

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
          balance: accountToUse.capital + totalPnl,
          pnl: totalPnl,
          wins,
          losses,
          winrate: closedPositions.length > 0 ? (wins / closedPositions.length) * 100 : 0,
          totalTrades: allPositions.data.length
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
    addActivityLog('🔄 Démarrage du scan automatique...', 'scan');

    if (!marketStatus.open) {
      setScanStatus(`Marché fermé: ${marketStatus.message}`);
      setBotState('idle');
      addActivityLog(`⏸️ Marché ${market} fermé - ${marketStatus.message}`, 'warning');
      return;
    }

    if (newsDetection.isNewsSuspension()) {
      const status = newsDetection.getStatus();
      setScanStatus(`🚨 TRADING SUSPENDU - Événement majeur en cours (${status.remainingMinutes} min restantes)`);
      setBotState('idle');
      addActivityLog(`🚨 Trading suspendu - Événement majeur détecté (${status.remainingMinutes} min)`, 'warning');
      return;
    }

    if (credits.remaining <= 0) {
      setScanStatus('❌ Crédits épuisés - Rechargez votre compte');
      setBotState('idle');
      addActivityLog('❌ Crédits épuisés - Impossible de prendre une position', 'error');
      return;
    }

    if (currentPosition && currentPosition.status === 'OPEN') {
      const dir = currentPosition.direction === 'LONG' ? '🟢 LONG' : '🔴 SHORT';
      setScanStatus(`⏸️ Position active: ${dir} sur ${currentPosition.market} - Bot en pause`);
      setBotState('position_locked');
      return;
    }

    if (!activeAccount) {
      setScanStatus('⚠️ Aucun compte actif - Configurez un compte');
      setBotState('idle');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setScanStatus('⚠️ Non connecté');
        setBotState('idle');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        setScanStatus('❌ Profil introuvable');
        setBotState('idle');
        return;
      }

      const { data: openPositions } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('trading_account_id', activeAccount.id)
        .eq('market', market)
        .eq('status', 'OPEN');

      if (openPositions && openPositions.length > 0) {
        const position = openPositions[0];
        const dir = position.direction === 'LONG' ? '🟢 LONG' : '🔴 SHORT';
        setScanStatus(`⏸️ Position active: ${dir} - Bot en pause jusqu'à fermeture`);
        setBotState('position_locked');
        setCurrentPosition(position);
        return;
      }
    } catch (error) {
      console.error('Error checking positions:', error);
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

    addActivityLog(`📊 Analyse du marché ${market} sur ${platform} en cours...`, 'scan');
    addActivityLog('🔍 Calcul des indicateurs techniques (RSI, MACD, EMA...)', 'scan');

    try {
      const result = await generateSignal(market, platform, candles, activeAccount);

      addActivityLog('✅ Analyse technique terminée', 'success');
      addActivityLog(`📈 Vérification des conditions d'entrée...`, 'scan');

      if (result.analysis) {
        setSupports(result.analysis.supports || []);
        setResistances(result.analysis.resistances || []);
        setOrderBlocks(result.analysis.orderBlocks || { bullish: [], bearish: [] });

        if (result.analysis.potentialEntry) {
          setPotentialEntry(result.analysis.potentialEntry);
          addActivityLog(`📍 Zone d'entrée potentielle détectée: ${result.analysis.potentialEntry.direction}`, 'info');
        }
      }

      if (result.signal) {
        setPotentialEntry(null);

        if (result.signal.market !== market) {
          console.error(`Signal market mismatch: expected ${market}, got ${result.signal.market}`);
          setScanStatus(`❌ Erreur: Signal pour ${result.signal.market} au lieu de ${market}`);
          addActivityLog(`❌ Erreur: Signal reçu pour ${result.signal.market} au lieu de ${market}`, 'error');
          setScanning(false);
          setSignalState({ isScanning: false, preAlert: null, signal: null });
          return;
        }

        if (dismissedSignals.has(result.signal.id)) {
          console.log('Signal déjà ignoré, skip:', result.signal.id);
          setScanning(false);
          setScanStatus('Signal déjà vu - En attente du prochain');
          addActivityLog('⏭️ Signal déjà vu, en attente du prochain', 'info');
          setBotState('idle');
          return;
        }

        addActivityLog(`⚠️ Zone d'entrée détectée! Direction: ${result.signal.direction}`, 'warning');
        addActivityLog(`📍 Zone: ${result.signal.entry_min} - ${result.signal.entry_max}`, 'info');

        if (userId) {
          await logAction(userId, 'PRE_ALERT', market, platform, {
            direction: result.signal.direction,
            entry_min: result.signal.entry_min,
            entry_max: result.signal.entry_max
          });
        }

        const currentPrice = candles && candles.length > 0 ? candles[candles.length - 1].close : null;

        setShowAnalysis(false);
        setSignalState({
          isScanning: false,
          preAlert: {
            market,
            platform,
            direction: result.signal.direction,
            currentPrice,
            entry_min: result.signal.entry_min,
            entry_max: result.signal.entry_max,
            stop_loss: result.signal.stop_loss,
            take_profit_1: result.signal.take_profit_1,
            take_profit_2: result.signal.take_profit_2,
            supports: supports || [],
            resistances: resistances || [],
            confidence: result.signal.confidence || 75
          },
          signal: null
        });
        setBotState('pre_alert');
        setScanStatus(`⚠️ PRÉPARE-TOI: Position ${result.signal.direction} en approche sur ${market}`);

        audioAlerts.playAlert('pre_alert');

        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification('⚠️ Position en Approche!', {
            body: `Une position ${result.signal.direction} arrive sur ${market}. Prépare-toi!`,
            icon: '/logo192.png',
            tag: 'trading-pre-alert',
            requireInteraction: true
          });
        }

        setTimeout(async () => {
          addActivityLog(`🎯 SIGNAL CONFIRMÉ! Direction: ${result.signal.direction}`, 'signal');
          addActivityLog(`📍 Entrée: ${result.signal.entry_min} - ${result.signal.entry_max}`, 'signal');
          addActivityLog(`🛡️ Stop Loss: ${result.signal.stop_loss}`, 'info');
          addActivityLog(`🎯 Take Profit 1: ${result.signal.take_profit_1}`, 'info');
          if (result.signal.take_profit_2) {
            addActivityLog(`🎯 Take Profit 2: ${result.signal.take_profit_2}`, 'info');
          }
          addActivityLog(`💪 Confiance: ${result.signal.confidence}%`, result.signal.confidence >= 75 ? 'success' : 'warning');

          if (userId) {
            await logAction(userId, 'SIGNAL_CONFIRMED', market, platform, {
              direction: result.signal.direction,
              entry_min: result.signal.entry_min,
              entry_max: result.signal.entry_max,
              stop_loss: result.signal.stop_loss,
              take_profit_1: result.signal.take_profit_1,
              take_profit_2: result.signal.take_profit_2,
              confidence: result.signal.confidence
            });
          }

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

          setShowAnalysis(true);
          setSignalState({
            isScanning: false,
            preAlert: null,
            signal: signalWithTimer
          });
          setCurrentSignal(result.signal);
          setBotState('signal_ready');
          setScanStatus(`✅ SIGNAL PRÊT: Position ${result.signal.direction} - Clique OK pour ouvrir`);

          audioAlerts.playAlert('signal');

          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            new Notification('✅ Signal Confirmé!', {
              body: `Position ${result.signal.direction} confirmée sur ${market}. Clique pour ouvrir!`,
              icon: '/logo192.png',
              tag: 'trading-signal-confirmed',
              requireInteraction: true
            });
          }
        }, 5000);
      } else {
        const reason = result.reason || 'Aucune opportunité détectée pour le moment';
        setScanStatus(`ℹ️ ${reason}`);
        addActivityLog(`ℹ️ ${reason}`, 'info');
        setSignalState({ isScanning: false, preAlert: null, signal: null });
        setScanOpportunity(null);
        setBotState('idle');

        setTimeout(() => {
          setPotentialEntry(null);
        }, 10000);

        setTimeout(() => {
          setShowAnalysis(false);
          setScanStatus('');
        }, 5000);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanStatus('❌ Erreur lors de l\'analyse du marché');
      addActivityLog(`❌ Erreur: ${error.message || 'Erreur inconnue'}`, 'error');
      setSignalState({ isScanning: false, preAlert: null, signal: null });
      setScanOpportunity(null);
      setBotState('idle');
    } finally {
      setScanning(false);
      addActivityLog('⏸️ Scan terminé, prochaine analyse dans 30 secondes', 'info');
    }
  };

  const handleManualScan = () => {
    if (!marketStatus.open) {
      alert(`Le marché ${market} est actuellement fermé. ${marketStatus.message}`);
      return;
    }
    addActivityLog('🖱️ Scan manuel déclenché par l\'utilisateur', 'scan');
    performScan();
  };

  const handleTestSignal = () => {
    const currentPrice = candles && candles.length > 0 ? candles[candles.length - 1].close : 1.0850;
    const isLong = Math.random() > 0.5;
    const entryZone = currentPrice * (isLong ? 1.001 : 0.999);

    const testSignal = {
      direction: isLong ? 'LONG' : 'SHORT',
      entry_min: entryZone * 0.9995,
      entry_max: entryZone * 1.0005,
      stop_loss: isLong ? entryZone * 0.995 : entryZone * 1.005,
      take_profit_1: isLong ? entryZone * 1.01 : entryZone * 0.99,
      take_profit_2: isLong ? entryZone * 1.02 : entryZone * 0.98,
      market: market,
      platform: platform,
      confidence: 75 + Math.floor(Math.random() * 20),
      id: `test-${Date.now()}`
    };

    addActivityLog('🎮 DÉMO: Pré-alerte - Zone d\'entrée détectée', 'warning');
    addActivityLog(`📍 Direction: ${testSignal.direction}`, 'info');

    setSignalState({
      isScanning: false,
      preAlert: {
        market,
        platform,
        direction: testSignal.direction,
        currentPrice,
        entry_min: testSignal.entry_min,
        entry_max: testSignal.entry_max,
        stop_loss: testSignal.stop_loss,
        take_profit_1: testSignal.take_profit_1,
        take_profit_2: testSignal.take_profit_2,
        supports: supports || [],
        resistances: resistances || [],
        confidence: testSignal.confidence
      },
      signal: null
    });
    setBotState('pre_alert');
    setScanStatus(`⚠️ DÉMO: Position ${testSignal.direction} en approche`);

    audioAlerts.playAlert('pre_alert');

    setTimeout(() => {
      addActivityLog('🎮 DÉMO: Signal confirmé', 'signal');
      addActivityLog(`🎯 Entrée: ${testSignal.entry_min.toFixed(5)} - ${testSignal.entry_max.toFixed(5)}`, 'signal');
      addActivityLog(`🛡️ Stop Loss: ${testSignal.stop_loss.toFixed(5)}`, 'info');
      addActivityLog(`🎯 Take Profit 1: ${testSignal.take_profit_1.toFixed(5)}`, 'info');
      addActivityLog(`🎯 Take Profit 2: ${testSignal.take_profit_2.toFixed(5)}`, 'info');

      if (activeAccount) {
        const calc = calculatePositionSize(activeAccount, testSignal);
        setRiskCalc(calc);
      }

      const signalWithTimer = {
        ...testSignal,
        validUntil: Date.now() + 120000,
        entryMin: testSignal.entry_min,
        entryMax: testSignal.entry_max,
        sl: testSignal.stop_loss,
        tp1: testSignal.take_profit_1,
        tp2: testSignal.take_profit_2,
        lots: calculatePositionSize(activeAccount, testSignal)?.positionSize || 1,
        risk: activeAccount?.risk_per_trade_percent || 1,
        confidence: testSignal.confidence
      };

      setSignalState({
        isScanning: false,
        preAlert: null,
        signal: signalWithTimer
      });
      setCurrentSignal(testSignal);
      setBotState('signal_ready');
      setScanStatus(`✅ DÉMO: Signal ${testSignal.direction} prêt - Clique OK pour ouvrir`);

      audioAlerts.playAlert('signal');
    }, 5000);
  };

  const handleToggleBot = () => {
    const newState = !autoMode;
    setAutoMode(newState);
    if (newState) {
      addActivityLog('🤖 Robot activé - Scan automatique toutes les 30 secondes', 'success');
    } else {
      addActivityLog('⏸️ Robot désactivé - Scan manuel uniquement', 'warning');
    }
  };

  const handleConfirmOpportunity = () => {
    if (scanOpportunity) {
      audioAlerts.play('signal');
      addActivityLog('✅ Opportunité confirmée - Ouverture en cours', 'success');
      handleAcceptSignal(scanOpportunity);
      setScanOpportunity(null);
    }
  };

  const handleDismissOpportunity = () => {
    if (scanOpportunity) {
      addActivityLog('❌ Opportunité ignorée', 'warning');
      setDismissedSignals(prev => new Set([...prev, scanOpportunity.id]));
      setScanOpportunity(null);
      setScanning(false);
      setSignalState({ isScanning: false, preAlert: null, signal: null });
      setBotState('idle');
    }
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
        setSignalState({ isScanning: false, preAlert: null, signal: null });
        setScanStatus('');
        setBotState('idle');
      }
    }

    return () => {
      botService.removeCallback(scanCallback);
    };
  }, [autoMode, marketStatus.open]);

  const handleAcceptSignal = async (signal) => {
    addActivityLog(`✅ Signal accepté - Ouverture position ${signal.direction}`, 'position');

    if (!activeAccount) {
      alert('⚠️ Veuillez configurer un compte de trading avant d\'ouvrir une position');
      addActivityLog('❌ Erreur: Aucun compte configuré', 'error');
      return;
    }

    if (credits.remaining <= 0) {
      alert('❌ Vous n\'avez plus de crédits disponibles sur ce marché. Fermez une position ou rechargez vos crédits.');
      addActivityLog('❌ Crédits insuffisants pour ouvrir la position', 'error');
      return;
    }

    addActivityLog(`💰 Calcul de la taille de position...`, 'info');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('⚠️ Veuillez vous connecter pour ouvrir une position');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        alert('❌ Profil introuvable');
        return;
      }

      const { data: existingOpenPosition } = await supabase
        .from('positions')
        .select('id, market, platform, direction, entry_price')
        .eq('user_id', profile.id)
        .eq('trading_account_id', activeAccount.id)
        .eq('market', signal.market)
        .eq('status', 'OPEN')
        .maybeSingle();

      if (existingOpenPosition) {
        const dir = existingOpenPosition.direction === 'LONG' ? '🟢 LONG' : '🔴 SHORT';
        alert(`⚠️ UNE POSITION EST DÉJÀ OUVERTE\n\n${dir} sur ${existingOpenPosition.market}\nPrix d'entrée: ${existingOpenPosition.entry_price.toFixed(2)}\n\nVous devez fermer cette position avant d'en ouvrir une nouvelle.\n\nLe bot ne prendra pas de nouvelles positions tant que celle-ci est active.`);
        setSignalState({ isScanning: false, preAlert: null, signal: null });
        return;
      }

      if (credits.remaining < 2) {
        const confirmed = window.confirm(`⚠️ ATTENTION: Il vous reste seulement ${credits.remaining} crédit(s)\n\nSi vous ouvrez cette position, vous ne pourrez plus en ouvrir d'autres jusqu'à ce que celle-ci se ferme.\n\nVoulez-vous continuer?`);
        if (!confirmed) {
          setSignalState({ isScanning: false, preAlert: null, signal: null });
          return;
        }
      }

      const entryPrice = (signal.entry_min + signal.entry_max) / 2;
      const positionSize = riskCalc?.positionSize || 1;

      console.log('[Position] Tentative de création:', {
        user_id: profile.id,
        trading_account_id: activeAccount.id,
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
          trading_account_id: activeAccount.id,
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

      if (!positionData || positionData.length === 0) {
        throw new Error('Position créée mais aucune donnée retournée');
      }

      const createdPosition = positionData[0];

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

      addActivityLog(`🎉 Position ${signal.direction} ouverte avec succès!`, 'success');
      addActivityLog(`💼 Entrée: ${entryPrice.toFixed(5)} | SL: ${signal.stop_loss.toFixed(5)}`, 'position');
      addActivityLog(`🎯 TP1: ${signal.take_profit_1.toFixed(5)} | TP2: ${signal.take_profit_2.toFixed(5)}`, 'position');
      addActivityLog(`📦 Taille: ${positionSize} lots`, 'info');

      setCurrentPosition(createdPosition);
      setSignalState({ isScanning: false, preAlert: null, signal: null });
      setCurrentSignal(null);
      setBotState('position_locked');
      await loadUserData();
      await loadStats(profile.id, activeAccount);
      await loadPositionsHistory(profile.id, activeAccount);
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
      addActivityLog(`❌ ${errorMessage}`, 'error');
      alert(errorMessage);
    }
  };

  const handleDeclineSignal = async () => {
    addActivityLog('❌ Signal refusé par l\'utilisateur', 'warning');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && userId) {
        const { data: creditData } = await supabase
          .from('position_credits')
          .select('*')
          .eq('user_id', userId)
          .eq('market', market)
          .maybeSingle();

        if (creditData) {
          const newUsedCredits = creditData.used_credits + 1;
          await supabase
            .from('position_credits')
            .update({ used_credits: newUsedCredits })
            .eq('user_id', userId)
            .eq('market', market);

          setCredits({
            remaining: creditData.total_credits - newUsedCredits,
            total: creditData.total_credits
          });

          if (signalState.signal) {
            await supabase
              .from('signal_history')
              .insert({
                user_id: userId,
                market: signalState.signal.market,
                platform: signalState.signal.platform,
                timeframe: signalState.signal.timeframe || timeframe,
                direction: signalState.signal.direction,
                entry_price: (signalState.signal.entry_min + signalState.signal.entry_max) / 2,
                stop_loss: signalState.signal.stop_loss,
                take_profit_1: signalState.signal.take_profit_1,
                take_profit_2: signalState.signal.take_profit_2,
                lots: 0,
                status: 'refusé',
                result: 'refusé'
              });

            await logAction(userId, 'SIGNAL_REFUSED', signalState.signal.market, signalState.signal.platform, {
              direction: signalState.signal.direction,
              credit_debited: true
            });
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du refus du signal:', error);
    }

    setSignalState({ isScanning: false, preAlert: null, signal: null });
    setCurrentSignal(null);
    setShowAnalysis(false);
    setBotState('idle');
    setScanStatus('Signal refusé - 1 crédit débité');
    setPotentialEntry(null);
  };

  const handleRejectSignal = () => {
    setShowSignalPopup(false);
    setCurrentSignal(null);
    setShowAnalysis(false);
    setScanStatus('Signal refusé');
    setPotentialEntry(null);
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
    setPotentialEntry(null);
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
              onClick={handleToggleBot}
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

          <button
            className={styles.testBtn}
            onClick={handleTestSignal}
            title="Voir une démonstration du système"
          >
            🎮 DÉMO Signal
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

      <div className={styles.mainContent}>
        <div className={styles.chartSection}>
        {candles.length === 0 ? (
          <div className={styles.loadingChart}>
            <div className={styles.loadingSpinner}></div>
            <p>Chargement des données de marché...</p>
          </div>
        ) : (
          <>
            <TradingChart
              candles={candles}
              signal={signalState.signal || currentSignal}
              position={currentPosition}
              supports={credits.remaining > 0 ? supports : []}
              resistances={credits.remaining > 0 ? resistances : []}
              orderBlocks={credits.remaining > 0 ? orderBlocks : { bullish: [], bearish: [] }}
              hasCredits={credits.remaining > 0}
              showAnalysis={credits.remaining > 0 && showAnalysis}
              potentialEntry={credits.remaining > 0 ? potentialEntry : null}
            />
            {currentPosition && currentPosition.status === 'OPEN' && (
              <div className={styles.positionLevels}>
                <div className={styles.levelCard}>
                  <div className={styles.levelLabel}>🛑 STOP LOSS</div>
                  <div className={styles.levelPrice} style={{color: '#ff1744'}}>
                    {currentPosition.stop_loss.toFixed(5)}
                  </div>
                  <div className={styles.levelPercent}>
                    {((Math.abs(currentPosition.entry_price - currentPosition.stop_loss) / currentPosition.entry_price * 100).toFixed(2))}% de l'entry
                  </div>
                </div>

                <div className={styles.levelCard}>
                  <div className={styles.levelLabel}>
                    {currentPosition.take_profit_1 > currentPosition.entry_price ? '🟢 LONG' : '🔴 SHORT'}
                  </div>
                  <div className={styles.levelPrice} style={{color: '#ffeb3b'}}>
                    {currentPosition.entry_price.toFixed(5)}
                  </div>
                  <div className={styles.levelPercent}>Prix d'entrée</div>
                </div>

                <div className={styles.levelCard}>
                  <div className={styles.levelLabel}>🎯 TP1</div>
                  <div className={styles.levelPrice} style={{color: '#00e676'}}>
                    {currentPosition.take_profit_1.toFixed(5)}
                  </div>
                  <div className={styles.levelPercent}>
                    +{((Math.abs(currentPosition.take_profit_1 - currentPosition.entry_price) / currentPosition.entry_price * 100).toFixed(2))}% gain
                  </div>
                </div>

                {currentPosition.take_profit_2 && (
                  <div className={styles.levelCard}>
                    <div className={styles.levelLabel}>🎯 TP2</div>
                    <div className={styles.levelPrice} style={{color: '#00e676'}}>
                      {currentPosition.take_profit_2.toFixed(5)}
                    </div>
                    <div className={styles.levelPercent}>
                      +{((Math.abs(currentPosition.take_profit_2 - currentPosition.entry_price) / currentPosition.entry_price * 100).toFixed(2))}% gain
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        </div>

        <PositionHistory positions={positionsHistory} />
      </div>

      {scanOpportunity && (
        <div style={{ margin: '20px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          <ScanOpportunity
            opportunity={scanOpportunity}
            onConfirm={handleConfirmOpportunity}
            onDismiss={handleDismissOpportunity}
          />
        </div>
      )}

      <SignalProcess
        isScanning={signalState.isScanning}
        preAlert={signalState.preAlert}
        signal={signalState.signal}
        onAcceptSignal={handleAcceptSignal}
        onDeclineSignal={handleDeclineSignal}
        onDismissSignal={handleDismissSignal}
        userCredits={credits.remaining}
      />

      <TrailingStopPopup
        show={showTrailingStopPopup}
        direction={trailingStopData?.direction}
        oldSL={trailingStopData?.oldSL}
        newSL={trailingStopData?.newSL}
        currentPrice={trailingStopData?.currentPrice}
        reason={trailingStopData?.reason}
        gainProtected={trailingStopData?.gainProtected}
        onClose={() => setShowTrailingStopPopup(false)}
      />

      <div style={{ margin: '20px', maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Activité du Bot</h3>
          <button
            onClick={() => setShowActivityLog(!showActivityLog)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {showActivityLog ? '🔽 Masquer' : '▶️ Afficher'}
          </button>
        </div>
        {showActivityLog && (
          <BotActivityLog
            isActive={autoMode}
            currentState={botState}
            onActivityUpdate={(callback) => setActivityLogCallback(() => callback)}
          />
        )}
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>💰 Balance</span>
          <span className={styles.statValue}>
            {activeAccount?.currency === 'EUR' ? '€' : '$'}{stats.balance.toFixed(2)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>📊 PnL Total</span>
          <span className={`${styles.statValue} ${stats.pnl >= 0 ? styles.positive : styles.negative}`}>
            {stats.pnl >= 0 ? '+' : ''}{activeAccount?.currency === 'EUR' ? '€' : '$'}{stats.pnl.toFixed(2)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>📈 Total Trades</span>
          <span className={styles.statValue}>{stats.totalTrades}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>✅ Gains</span>
          <span className={`${styles.statValue} ${styles.positive}`}>{stats.wins}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>❌ Pertes</span>
          <span className={`${styles.statValue} ${styles.negative}`}>{stats.losses}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>🎯 Winrate</span>
          <span className={`${styles.statValue} ${stats.winrate >= 50 ? styles.positive : stats.winrate > 0 ? '' : styles.neutral}`}>
            {stats.winrate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
