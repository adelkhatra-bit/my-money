import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import DebugSnapshot from '../DebugSnapshot/DebugSnapshot';
import { displayPrice } from '../../utils/priceFormatter';
import styles from './TradingChart.module.css';

const TradingChart = ({ candles, signal, position, supports, resistances, orderBlocks, hasCredits = false, showAnalysis = false, potentialEntry = null, platform = null, market = null, metadata = null, showProofMode = false }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const priceLines = useRef([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dataError, setDataError] = useState(null);
  const isInitialized = useRef(false);
  const lastCandleTimeRef = useRef(null);

  const clearPriceLines = useCallback(() => {
    if (candleSeriesRef.current && priceLines.current.length > 0) {
      priceLines.current.forEach(line => {
        try {
          candleSeriesRef.current.removePriceLine(line);
        } catch (e) {}
      });
      priceLines.current = [];
    }
  }, []);

  const cleanAndValidateCandles = useCallback((rawCandles) => {
    if (!Array.isArray(rawCandles) || rawCandles.length === 0) {
      return { error: true, message: 'Aucune donnée disponible', data: [] };
    }

    const validCandles = rawCandles.filter(c =>
      c &&
      typeof c.time === 'number' &&
      typeof c.open === 'number' &&
      typeof c.high === 'number' &&
      typeof c.low === 'number' &&
      typeof c.close === 'number' &&
      !isNaN(c.time) &&
      !isNaN(c.open) &&
      !isNaN(c.high) &&
      !isNaN(c.low) &&
      !isNaN(c.close)
    );

    const uniqueCandles = [];
    const seenTimes = new Set();

    for (const candle of validCandles) {
      if (!seenTimes.has(candle.time)) {
        seenTimes.add(candle.time);
        uniqueCandles.push(candle);
      }
    }

    uniqueCandles.sort((a, b) => a.time - b.time);

    if (uniqueCandles.length < 300) {
      return {
        error: true,
        message: `Données insuffisantes: ${uniqueCandles.length}/300 bougies (${rawCandles.length - uniqueCandles.length} doublons supprimés)`,
        data: uniqueCandles
      };
    }

    console.log('✅ [TradingChart] Données nettoyées:', {
      bougiesOriginales: rawCandles.length,
      doublonsSupprimés: rawCandles.length - uniqueCandles.length,
      bougiesFinales: uniqueCandles.length,
      premièreBougie: new Date(uniqueCandles[0].time * 1000).toISOString(),
      dernièreBougie: new Date(uniqueCandles[uniqueCandles.length - 1].time * 1000).toISOString()
    });

    return { error: false, data: uniqueCandles };
  }, []);

  useEffect(() => {
    if (candles && candles.error) {
      setDataError(candles.message || 'Données insuffisantes');
      return;
    }

    const cleaned = cleanAndValidateCandles(candles);

    if (cleaned.error) {
      setDataError(cleaned.message);
      return;
    }

    setDataError(null);
  }, [candles, cleanAndValidateCandles]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (dataError) return;
    if (!Array.isArray(candles) || candles.length === 0) return;

    const cleaned = cleanAndValidateCandles(candles);
    if (cleaned.error || cleaned.data.length === 0) return;

    const cleanedCandles = cleaned.data;

    const chartHeight = isFullscreen
      ? window.innerHeight - 100
      : Math.max(450, window.innerHeight * 0.5);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b2b' },
        horzLines: { color: '#2b2b2b' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      rightPriceScale: {
        borderColor: '#3a3a3a',
      },
      timeScale: {
        borderColor: '#3a3a3a',
        rightOffset: 80,
        barSpacing: 15,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#758696',
          style: 3,
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 3,
        },
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candleSeries.setData(cleanedCandles);
    lastCandleTimeRef.current = cleanedCandles[cleanedCandles.length - 1].time;
    isInitialized.current = true;

    console.log('✅ [TradingChart] Graphique initialisé avec setData():', {
      bougies: cleanedCandles.length,
      dernièreBougie: lastCandleTimeRef.current,
      date: new Date(lastCandleTimeRef.current * 1000).toISOString()
    });

    setTimeout(() => {
      try {
        if (chart && chart.timeScale) {
          chart.timeScale().fitContent();
        }
      } catch (e) {
        console.error('Erreur fitContent:', e);
      }
    }, 100);

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        try {
          const newHeight = isFullscreen
            ? window.innerHeight - 100
            : Math.max(450, window.innerHeight * 0.5);
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: newHeight,
          });
        } catch (e) {
          console.error('Erreur resize:', e);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
        candleSeriesRef.current = null;
        isInitialized.current = false;
        lastCandleTimeRef.current = null;
      }
    };
  }, [candles, isFullscreen, dataError, cleanAndValidateCandles]);

  useEffect(() => {
    if (!candleSeriesRef.current || !Array.isArray(candles) || candles.length === 0 || dataError) return;
    if (!isInitialized.current) return;

    try {
      const lastCandle = candles[candles.length - 1];

      if (!lastCandle || typeof lastCandle.time !== 'number') {
        console.warn('⚠️ [TradingChart] Dernière bougie invalide, ignorée');
        return;
      }

      if (lastCandleTimeRef.current !== lastCandle.time) {
        console.log('🔄 [TradingChart] Mise à jour avec update():', {
          ancienTime: lastCandleTimeRef.current,
          nouveauTime: lastCandle.time,
          date: new Date(lastCandle.time * 1000).toISOString(),
          prix: lastCandle.close
        });
        candleSeriesRef.current.update(lastCandle);
        lastCandleTimeRef.current = lastCandle.time;
      }
    } catch (e) {
      console.error('❌ [TradingChart] Erreur update:', e.message);
    }
  }, [candles, dataError]);

  useEffect(() => {
    if (!candleSeriesRef.current) return;

    clearPriceLines();

    if (position && position.status === 'OPEN') {
      const isLong = position.direction === 'LONG';

      console.log('📊 [TradingChart] LECTURE POSITION (PAS de recalcul):', {
        id: position.id,
        market: position.market,
        direction: position.direction,
        entry: displayPrice(position.entry_price, position.market),
        sl: displayPrice(position.stop_loss, position.market),
        tp1: displayPrice(position.take_profit_1, position.market),
        pnl: position.pnl?.toFixed(2) || '0.00',
        debugSnapshot: position.debugSnapshot
      });

      const lineEntry = candleSeriesRef.current.createPriceLine({
        price: position.entry_price,
        color: isLong ? '#26a69a' : '#ef5350',
        lineWidth: 3,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${isLong ? '🟢 LONG ↑' : '🔴 SHORT ↓'} - ${displayPrice(position.entry_price, position.market)}`,
      });

      const distanceToSL = isLong
        ? ((position.entry_price - position.stop_loss) / position.entry_price * 100)
        : ((position.stop_loss - position.entry_price) / position.entry_price * 100);

      const lineSL = candleSeriesRef.current.createPriceLine({
        price: position.stop_loss,
        color: '#ff1744',
        lineWidth: 4,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `🛑 STOP LOSS - ${displayPrice(position.stop_loss, position.market)} (-${distanceToSL.toFixed(2)}%)`,
      });

      const gainTP1 = isLong
        ? ((position.take_profit_1 - position.entry_price) / position.entry_price * 100)
        : ((position.entry_price - position.take_profit_1) / position.entry_price * 100);

      const lineTP1 = candleSeriesRef.current.createPriceLine({
        price: position.take_profit_1,
        color: '#00e676',
        lineWidth: 4,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `🎯 TP1 - ${displayPrice(position.take_profit_1, position.market)} (+${gainTP1.toFixed(2)}%)`,
      });

      priceLines.current.push(lineEntry, lineSL, lineTP1);

      if (position.take_profit_2) {
        const gainTP2 = isLong
          ? ((position.take_profit_2 - position.entry_price) / position.entry_price * 100)
          : ((position.entry_price - position.take_profit_2) / position.entry_price * 100);

        const lineTP2 = candleSeriesRef.current.createPriceLine({
          price: position.take_profit_2,
          color: '#00e676',
          lineWidth: 3,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `🎯 TP2 - ${displayPrice(position.take_profit_2, position.market)} (+${gainTP2.toFixed(2)}%)`,
        });
        priceLines.current.push(lineTP2);
      }
    }
    else if (signal && signal.status === 'ACTIVE') {
      const entryPrice = (signal.entry_min + signal.entry_max) / 2;

      const correctDirection = signal.take_profit_1 > entryPrice ? 'LONG' : 'SHORT';
      const isLong = correctDirection === 'LONG';

      if (signal.direction !== correctDirection) {
        console.warn('⚠️ DIRECTION INCORRECTE DÉTECTÉE ET CORRIGÉE', {
          signalDirection: signal.direction,
          correctDirection,
          entry: displayPrice(entryPrice, signal.market),
          tp1: displayPrice(signal.take_profit_1, signal.market),
          sl: displayPrice(signal.stop_loss, signal.market)
        });
      }

      console.log('📊 CHART DRAWING SIGNAL:', {
        direction: correctDirection,
        entry: displayPrice(entryPrice, signal.market),
        sl: displayPrice(signal.stop_loss, signal.market),
        tp1: displayPrice(signal.take_profit_1, signal.market),
        tp2: signal.take_profit_2 ? displayPrice(signal.take_profit_2, signal.market) : 'N/A',
        isLong,
        validation: isLong
          ? `TP1(${displayPrice(signal.take_profit_1, signal.market)}) > Entry(${displayPrice(entryPrice, signal.market)}) > SL(${displayPrice(signal.stop_loss, signal.market)})`
          : `SL(${displayPrice(signal.stop_loss, signal.market)}) > Entry(${displayPrice(entryPrice, signal.market)}) > TP1(${displayPrice(signal.take_profit_1, signal.market)})`
      });

      const lineEntry = candleSeriesRef.current.createPriceLine({
        price: entryPrice,
        color: isLong ? '#26a69a' : '#ef5350',
        lineWidth: 3,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${isLong ? '🟢 LONG ↑' : '🔴 SHORT ↓'} - ${displayPrice(entryPrice, signal.market)}`,
      });

      const signalDistanceToSL = isLong
        ? ((entryPrice - signal.stop_loss) / entryPrice * 100)
        : ((signal.stop_loss - entryPrice) / entryPrice * 100);

      const lineSL = candleSeriesRef.current.createPriceLine({
        price: signal.stop_loss,
        color: '#ff1744',
        lineWidth: 4,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `🛑 STOP LOSS - ${displayPrice(signal.stop_loss, signal.market)} (-${signalDistanceToSL.toFixed(2)}%)`,
      });

      const signalGainTP1 = isLong
        ? ((signal.take_profit_1 - entryPrice) / entryPrice * 100)
        : ((entryPrice - signal.take_profit_1) / entryPrice * 100);

      const lineTP1 = candleSeriesRef.current.createPriceLine({
        price: signal.take_profit_1,
        color: '#00e676',
        lineWidth: 4,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `🎯 TP1 - ${displayPrice(signal.take_profit_1, signal.market)} (+${signalGainTP1.toFixed(2)}%)`,
      });

      priceLines.current.push(lineEntry, lineSL, lineTP1);

      if (signal.take_profit_2) {
        const signalGainTP2 = isLong
          ? ((signal.take_profit_2 - entryPrice) / entryPrice * 100)
          : ((entryPrice - signal.take_profit_2) / entryPrice * 100);

        const lineTP2 = candleSeriesRef.current.createPriceLine({
          price: signal.take_profit_2,
          color: '#00e676',
          lineWidth: 3,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `🎯 TP2 - ${displayPrice(signal.take_profit_2, signal.market)} (+${signalGainTP2.toFixed(2)}%)`,
        });
        priceLines.current.push(lineTP2);
      }
    }
    else if (potentialEntry) {
      const entryPrice = (potentialEntry.entry_min + potentialEntry.entry_max) / 2;
      const correctDirection = potentialEntry.take_profit_1 > entryPrice ? 'LONG' : 'SHORT';
      const isLong = correctDirection === 'LONG';

      console.log('📍 GRAPHIQUE - ZONE D\'ENTRÉE POTENTIELLE:', {
        direction: correctDirection,
        entry: displayPrice(entryPrice, potentialEntry.market),
        sl: displayPrice(potentialEntry.stop_loss, potentialEntry.market),
        tp1: displayPrice(potentialEntry.take_profit_1, potentialEntry.market)
      });

      const lineEntry = candleSeriesRef.current.createPriceLine({
        price: entryPrice,
        color: isLong ? '#26a69a' : '#ef5350',
        lineWidth: 3,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `${isLong ? '🟢 ZONE ENTRÉE LONG ↑' : '🔴 ZONE ENTRÉE SHORT ↓'} - ${displayPrice(entryPrice, potentialEntry.market)}`,
      });

      const lineSL = candleSeriesRef.current.createPriceLine({
        price: potentialEntry.stop_loss,
        color: '#ff1744',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `🛑 SL - ${displayPrice(potentialEntry.stop_loss, potentialEntry.market)}`,
      });

      const lineTP1 = candleSeriesRef.current.createPriceLine({
        price: potentialEntry.take_profit_1,
        color: '#00e676',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `🎯 TP1 - ${displayPrice(potentialEntry.take_profit_1, potentialEntry.market)}`,
      });

      priceLines.current.push(lineEntry, lineSL, lineTP1);

      if (potentialEntry.take_profit_2) {
        const lineTP2 = candleSeriesRef.current.createPriceLine({
          price: potentialEntry.take_profit_2,
          color: '#00e676',
          lineWidth: 2,
          lineStyle: 3,
          axisLabelVisible: true,
          title: `🎯 TP2 - ${displayPrice(potentialEntry.take_profit_2, potentialEntry.market)}`,
        });
        priceLines.current.push(lineTP2);
      }
    }
    else if (showAnalysis) {
      if (supports && supports.length > 0) {
        const topSupports = supports.slice(0, 2);
        topSupports.forEach((support, idx) => {
          const line = candleSeriesRef.current.createPriceLine({
            price: support,
            color: '#4caf50',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `S${idx + 1}`,
          });
          priceLines.current.push(line);
        });
      }

      if (resistances && resistances.length > 0) {
        const topResistances = resistances.slice(0, 2);
        topResistances.forEach((resistance, idx) => {
          const line = candleSeriesRef.current.createPriceLine({
            price: resistance,
            color: '#f44336',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `R${idx + 1}`,
          });
          priceLines.current.push(line);
        });
      }

      if (orderBlocks) {
        if (orderBlocks.bullish && orderBlocks.bullish.length > 0) {
          const block = orderBlocks.bullish[0];
          const lineHigh = candleSeriesRef.current.createPriceLine({
            price: block.high,
            color: '#26a69a',
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: false,
            title: '',
          });
          const lineLow = candleSeriesRef.current.createPriceLine({
            price: block.low,
            color: '#26a69a',
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: false,
            title: '',
          });
          priceLines.current.push(lineHigh, lineLow);
        }

        if (orderBlocks.bearish && orderBlocks.bearish.length > 0) {
          const block = orderBlocks.bearish[0];
          const lineHigh = candleSeriesRef.current.createPriceLine({
            price: block.high,
            color: '#ef5350',
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: false,
            title: '',
          });
          const lineLow = candleSeriesRef.current.createPriceLine({
            price: block.low,
            color: '#ef5350',
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: false,
            title: '',
          });
          priceLines.current.push(lineHigh, lineLow);
        }
      }
    }
  }, [signal, position, supports, resistances, orderBlocks, showAnalysis, potentialEntry, clearPriceLines]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const recenter = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  if (dataError) {
    return (
      <div className={`${styles.chartWrapper}`}>
        <div className={styles.dataErrorOverlay}>
          <div className={styles.dataErrorMessage}>
            <h3>Données insuffisantes</h3>
            <p>{dataError}</p>
            <p className={styles.dataErrorHint}>
              Le graphique nécessite au minimum 300 bougies pour s'afficher correctement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.chartWrapper} ${isFullscreen ? styles.fullscreen : ''}`}>
      {metadata && metadata.source === 'marketDataUnified' && (
        <div className={styles.simulationBadge}>
          <span className={styles.simulationIcon}>🔶</span>
          <span className={styles.simulationText}>SIMULATION — Données fictives calibrées</span>
        </div>
      )}
      {showProofMode && metadata && (
        <div className={styles.proofModeBar}>
          <div className={styles.proofModeTitle}>🔍 MODE PREUVE - {metadata.symbol || 'N/A'} / {metadata.platform || 'N/A'} / {metadata.market || 'N/A'}</div>
          <div className={styles.proofModeGrid}>
            <div className={styles.proofModeItem}>
              <span className={styles.proofModeLabel}>Source:</span>
              <span className={styles.proofModeValue}>{metadata.source}</span>
            </div>
            <div className={styles.proofModeItem}>
              <span className={styles.proofModeLabel}>Timeframe:</span>
              <span className={styles.proofModeValue}>{metadata.timeframe || 'N/A'}</span>
            </div>
            <div className={styles.proofModeItem}>
              <span className={styles.proofModeLabel}>Baseline 1m:</span>
              <span className={styles.proofModeValue}>{metadata.baseline1mCount} bougies</span>
            </div>
            <div className={styles.proofModeItem}>
              <span className={styles.proofModeLabel}>Agrégées:</span>
              <span className={styles.proofModeValue}>{metadata.aggregatedCount} bougies</span>
            </div>
            <div className={styles.proofModeItem}>
              <span className={styles.proofModeLabel}>Doublons retirés:</span>
              <span className={styles.proofModeValue}>{metadata.duplicatesRemoved || 0}</span>
            </div>
            <div className={styles.proofModeItem}>
              <span className={styles.proofModeLabel}>Prix baseline:</span>
              <span className={styles.proofModeValue}>{metadata.lastPriceBaseline?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className={styles.proofModeItem}>
              <span className={styles.proofModeLabel}>Prix agrégé:</span>
              <span className={styles.proofModeValue}>{metadata.lastPriceAggregated?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className={styles.proofModeItem}>
              <span className={styles.proofModeLabel}>Différence:</span>
              <span className={styles.proofModeValue}>{metadata.priceDiff?.toFixed(4) || '0.0000'}</span>
            </div>
            <div className={styles.proofModeItem}>
              <span className={styles.proofModeLabel}>Statut:</span>
              <span className={`${styles.proofModeValue} ${styles[`status${metadata.status}`]}`}>
                {metadata.status === 'OK' ? '✅ OK' : '❌ BLOQUÉ'}
              </span>
            </div>
            {metadata.reason && (
              <div className={`${styles.proofModeItem} ${styles.fullWidth}`}>
                <span className={styles.proofModeLabel}>Raison:</span>
                <span className={styles.proofModeValue}>{metadata.reason}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {!hasCredits && (
        <div className={styles.noCreditsOverlay}>
          <div className={styles.noCreditsMessage}>
            <h3>🔒 Crédits requis</h3>
            <p>Rechargez votre compte pour accéder aux analyses et recevoir des signaux</p>
          </div>
        </div>
      )}
      <div className={styles.chartControls}>
        <button onClick={recenter} className={styles.controlBtn}>
          Recentrer
        </button>
        <button onClick={toggleFullscreen} className={styles.controlBtn}>
          {isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
        </button>
      </div>
      <div ref={chartContainerRef} className={styles.chartContainer} />
      {position && position.debugSnapshot && (
        <DebugSnapshot data={position.debugSnapshot} location="CHART" />
      )}
    </div>
  );
};

export default TradingChart;
