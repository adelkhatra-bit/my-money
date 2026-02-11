import React, { useState, useEffect } from 'react';
import LivePriceHeader from '../../components/LivePriceHeader/LivePriceHeader';
import TradingViewWidget from '../../components/TradingViewWidget/TradingViewWidget';
import PositionMonitor from '../../components/PositionMonitor/PositionMonitor';
import BotStatus from '../../components/BotStatus/BotStatus';
import ScanOpportunity from '../../components/ScanOpportunity/ScanOpportunity';
import { isMarketOpen, getMarketStatus } from '../../services/marketHours';
import { generateSignal } from '../../services/signalEngine';
import { marketDataProvider } from '../../services/MarketDataProvider';
import { positionService } from '../../services/positionService';
import { supabase } from '../../lib/supabaseClient';
import styles from './TradingDashboardSimple.module.css';

const mapMarketToPriceEngine = (market) => {
  const mapping = {
    'NASDAQ': 'MNQ',
    'GOLD': 'MGC',
    'BTC': 'BTC'
  };
  return mapping[market] || market;
};

const TradingDashboardSimple = () => {
  const [market, setMarket] = useState('NASDAQ');
  const [timeframe, setTimeframe] = useState('5m');
  const [marketStatus, setMarketStatus] = useState({ open: true, message: '' });
  const [autoMode, setAutoMode] = useState(false);
  const [activeAccount, setActiveAccount] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [scanOpportunity, setScanOpportunity] = useState(null);
  const [candles, setCandles] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(interval);
  }, [market]);

  useEffect(() => {
    loadActiveAccount();
    loadUserId();
  }, [market]);

  useEffect(() => {
    loadCurrentPosition();
  }, [userId, activeAccount]);

  const checkMarketStatus = () => {
    const open = isMarketOpen(market);
    const status = getMarketStatus(market);
    setMarketStatus({ open, message: status });
  };

  const loadUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) {
      setUserId(profile.id);
    }
  };

  const loadActiveAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) return;

    const { data: accounts } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .eq('market', market.toUpperCase())
      .order('created_at', { ascending: false })
      .limit(1);

    if (accounts && accounts.length > 0) {
      setActiveAccount(accounts[0]);
    }
  };

  const loadCurrentPosition = async () => {
    if (!userId || !activeAccount) return;

    try {
      const openPosition = await positionService.getOpenPosition(userId, activeAccount.id);
      setCurrentPosition(openPosition);
    } catch (error) {
      console.error('Erreur chargement position:', error);
    }
  };

  const handleMarketChange = (newMarket) => {
    setMarket(newMarket);
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  const handleToggleBot = () => {
    if (!marketStatus.open) {
      alert(`⚠️ Marché ${market} fermé - ${marketStatus.message}\n\nLe BOT ne peut pas être activé lorsque le marché est fermé.`);
      return;
    }
    setAutoMode(!autoMode);
  };

  const handleScan = async () => {
    if (!marketStatus.open) {
      alert(`⚠️ Marché ${market} fermé - ${marketStatus.message}\n\nLe SCAN ne peut pas être lancé lorsque le marché est fermé.`);
      return;
    }

    if (!activeAccount) {
      alert('⚠️ Aucun compte actif - Configurez un compte de trading');
      return;
    }

    if (currentPosition) {
      const dir = currentPosition.direction === 'LONG' ? '🟢 LONG' : '🔴 SHORT';
      alert(`⛔ POSITION ACTIVE\n\n${dir} sur ${currentPosition.market}\nPrix d'entrée: ${parseFloat(currentPosition.entry_price).toFixed(2)}\n\nVous devez fermer cette position avant de pouvoir scanner à nouveau.`);
      return;
    }

    if (scanning) {
      alert('⏳ Un scan est déjà en cours\n\nVeuillez patienter...');
      return;
    }

    setScanning(true);
    setScanStatus('🔍 Chargement des données...');

    try {
      const data = await marketDataProvider.getOHLC(market, 'topstep', '5m');

      if (!data || data.error || !Array.isArray(data) || data.length < 100) {
        setScanStatus('❌ Données insuffisantes');
        alert('❌ Impossible de charger les données de marché');
        setScanning(false);
        return;
      }

      setCandles(data);
      setScanStatus('🧠 Analyse du marché...');

      const result = await generateSignal(market, 'topstep', data, activeAccount);

      if (result && result.signal) {
        console.log('✅ Signal trouvé:', result.signal);
        setScanStatus('✅ Opportunité détectée!');

        const currentPrice = data[data.length - 1].close;
        setScanOpportunity({
          ...result.signal,
          currentPrice
        });
      } else {
        const reason = result?.reason || 'Aucune opportunité détectée';
        setScanStatus(`ℹ️ ${reason}`);
        alert(`ℹ️ Résultat du scan:\n\n${reason}`);
      }
    } catch (error) {
      console.error('Erreur scan:', error);
      setScanStatus('❌ Erreur lors du scan');
      alert(`❌ Erreur:\n\n${error.message || 'Erreur inconnue'}`);
    } finally {
      setScanning(false);
    }
  };

  const handlePreview = () => {
    if (!marketStatus.open) {
      alert(`⚠️ Marché ${market} fermé - ${marketStatus.message}\n\nL'APERÇU n'est pas disponible lorsque le marché est fermé.`);
      return;
    }
    alert('👁️ Fonction APERÇU en cours de développement');
  };

  const handleConfirmOpportunity = async () => {
    if (!scanOpportunity || !activeAccount || !userId) {
      alert('❌ Erreur: informations manquantes');
      return;
    }

    try {
      const entryPrice = (scanOpportunity.entry_min + scanOpportunity.entry_max) / 2;

      const positionData = {
        user_id: userId,
        account_id: activeAccount.id,
        market: market.toUpperCase(),
        platform: 'topstep',
        direction: scanOpportunity.direction,
        entry_price: entryPrice,
        position_size: 1,
        stop_loss: scanOpportunity.stop_loss,
        take_profit_1: scanOpportunity.take_profit_1,
        take_profit_2: scanOpportunity.take_profit_2,
        status: 'OPEN'
      };

      const newPosition = await positionService.createPosition(positionData);

      if (newPosition) {
        alert(`✅ Position ${scanOpportunity.direction} ouverte avec succès!\n\nPrix d'entrée: ${entryPrice.toFixed(2)}\nStop Loss: ${scanOpportunity.stop_loss.toFixed(2)}\nTake Profit 1: ${scanOpportunity.take_profit_1.toFixed(2)}`);
        setScanOpportunity(null);
        setScanStatus('');
        loadCurrentPosition();
      }
    } catch (error) {
      console.error('Erreur ouverture position:', error);
      alert(`❌ Erreur:\n\n${error.message || 'Impossible d\'ouvrir la position'}`);
    }
  };

  const handleDismissOpportunity = () => {
    setScanOpportunity(null);
    setScanStatus('');
  };

  const isActionDisabled = !marketStatus.open || !activeAccount;

  return (
    <div className={styles.dashboard}>
      {!marketStatus.open && (
        <div className={styles.marketClosedBanner}>
          ⚠️ Marché {market} fermé - {marketStatus.message}
        </div>
      )}

      {!activeAccount && (
        <div className={styles.warningBanner}>
          ⚠️ AUCUN COMPTE DE TRADING ACTIF pour {market}
          <br />
          <a href="/accounts" style={{ color: '#00ff88', fontWeight: 'bold', textDecoration: 'underline' }}>
            Créez un compte de trading
          </a> pour commencer.
        </div>
      )}

      <div className={styles.header}>
        <h1>AI Trading Platform</h1>
        <LivePriceHeader market={mapMarketToPriceEngine(market)} />
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Marché:</label>
          <select value={market} onChange={(e) => handleMarketChange(e.target.value)} className={styles.select}>
            <option value="NASDAQ">NASDAQ (MNQ)</option>
            <option value="GOLD">GOLD (MGC)</option>
            <option value="BTC">BTC</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label>Timeframe (graphique uniquement):</label>
          <select value={timeframe} onChange={(e) => handleTimeframeChange(e.target.value)} className={styles.select}>
            <option value="1m">1 minute</option>
            <option value="5m">5 minutes (par défaut)</option>
            <option value="15m">15 minutes</option>
            <option value="30m">30 minutes</option>
          </select>
          <span className={styles.helperText}>Le prix de trading reste le même quel que soit le timeframe</span>
        </div>
      </div>

      <div className={styles.tradingViewSection}>
        {(market === 'NASDAQ' || market === 'GOLD') && (
          <div className={styles.dataDisclaimer}>
            ℹ️ Graphique TradingView - Les données peuvent être différées de 15 minutes selon votre abonnement TradingView
          </div>
        )}
        <TradingViewWidget symbol={mapMarketToPriceEngine(market)} />
      </div>

      <div className={styles.actions}>
        <button
          onClick={handleToggleBot}
          disabled={isActionDisabled}
          className={`${styles.actionButton} ${autoMode ? styles.botActive : ''}`}
          title={isActionDisabled ? "Marché fermé ou compte inactif" : "Active ou désactive le trading automatique"}
        >
          {autoMode ? '🤖 BOT: ON' : '🤖 BOT: OFF'}
        </button>

        <button
          onClick={handleScan}
          disabled={isActionDisabled}
          className={styles.actionButton}
          title={isActionDisabled ? "Marché fermé ou compte inactif" : "Lance un scan manuel pour trouver des opportunités"}
        >
          🔍 SCAN
        </button>

        <button
          onClick={handlePreview}
          disabled={isActionDisabled}
          className={styles.actionButton}
          title={isActionDisabled ? "Marché fermé ou compte inactif" : "Affiche un aperçu de la position potentielle"}
        >
          👁️ APERÇU
        </button>
      </div>

      <div className={styles.info}>
        <div className={styles.infoBox}>
          <h3>🤖 BOT ON/OFF</h3>
          <p>Active le trading automatique. Le système scanne le marché et ouvre des positions selon les signaux détectés.</p>
        </div>
        <div className={styles.infoBox}>
          <h3>🔍 SCAN</h3>
          <p>Lance un scan manuel immédiat du marché pour identifier des opportunités de trading.</p>
        </div>
        <div className={styles.infoBox}>
          <h3>👁️ APERÇU</h3>
          <p>Affiche un aperçu de la position potentielle avec les niveaux d'entrée, stop loss et take profit.</p>
        </div>
      </div>

      <div className={styles.statusSection}>
        <BotStatus autoMode={autoMode} market={market} />
        <PositionMonitor market={market} />
      </div>

      {scanStatus && (
        <div className={styles.scanStatusBar}>
          {scanStatus}
        </div>
      )}

      {scanOpportunity && (
        <div className={styles.opportunityOverlay}>
          <ScanOpportunity
            opportunity={scanOpportunity}
            onConfirm={handleConfirmOpportunity}
            onDismiss={handleDismissOpportunity}
          />
        </div>
      )}
    </div>
  );
};

export default TradingDashboardSimple;
