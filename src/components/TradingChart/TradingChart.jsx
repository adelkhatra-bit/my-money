import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import styles from './TradingChart.module.css';

const TradingChart = ({ candles, signal, position, supports, resistances, orderBlocks, hasCredits = false, showAnalysis = false }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const priceLines = useRef([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  useEffect(() => {
    if (!chartContainerRef.current) return;

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
      height: isFullscreen ? window.innerHeight - 100 : 320,
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

    if (candles.length > 0) {
      candleSeries.setData(candles);
      setTimeout(() => {
        try {
          if (chart && chart.timeScale) {
            chart.timeScale().fitContent();
          }
        } catch (e) {}
      }, 100);
    }

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        try {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: isFullscreen ? window.innerHeight - 100 : 320,
          });
        } catch (e) {}
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
      }
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    try {
      candleSeriesRef.current.setData(candles);
      if (chartRef.current && chartRef.current.timeScale) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (e) {
      console.warn('Chart update error:', e);
    }
  }, [candles]);

  useEffect(() => {
    if (!candleSeriesRef.current) return;

    clearPriceLines();

    if (position && position.status === 'OPEN') {
      const correctDirection = position.take_profit_1 > position.entry_price ? 'LONG' : 'SHORT';
      const isLong = correctDirection === 'LONG';

      console.log('📊 GRAPHIQUE MIS À JOUR avec position:', {
        id: position.id,
        market: position.market,
        direction: correctDirection,
        entry: position.entry_price.toFixed(5),
        sl: position.stop_loss.toFixed(5),
        tp1: position.take_profit_1.toFixed(5),
        pnl: position.pnl?.toFixed(2) || '0.00'
      });

      if (position.direction !== correctDirection) {
        console.warn('⚠️ DIRECTION POSITION INCORRECTE DÉTECTÉE ET CORRIGÉE', {
          positionDirection: position.direction,
          correctDirection,
          entry: position.entry_price.toFixed(5),
          tp1: position.take_profit_1.toFixed(5),
          sl: position.stop_loss.toFixed(5)
        });
      }

      const lineEntry = candleSeriesRef.current.createPriceLine({
        price: position.entry_price,
        color: isLong ? '#26a69a' : '#ef5350',
        lineWidth: 3,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${isLong ? '🟢 LONG ↑' : '🔴 SHORT ↓'} - ${position.entry_price.toFixed(5)}`,
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
        title: `🛑 STOP LOSS - ${position.stop_loss.toFixed(5)} (-${distanceToSL.toFixed(2)}%)`,
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
        title: `🎯 TP1 - ${position.take_profit_1.toFixed(5)} (+${gainTP1.toFixed(2)}%)`,
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
          title: `🎯 TP2 - ${position.take_profit_2.toFixed(5)} (+${gainTP2.toFixed(2)}%)`,
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
          entry: entryPrice.toFixed(5),
          tp1: signal.take_profit_1.toFixed(5),
          sl: signal.stop_loss.toFixed(5)
        });
      }

      console.log('📊 CHART DRAWING SIGNAL:', {
        direction: correctDirection,
        entry: entryPrice.toFixed(5),
        sl: signal.stop_loss.toFixed(5),
        tp1: signal.take_profit_1.toFixed(5),
        tp2: signal.take_profit_2 ? signal.take_profit_2.toFixed(5) : 'N/A',
        isLong,
        validation: isLong
          ? `TP1(${signal.take_profit_1.toFixed(5)}) > Entry(${entryPrice.toFixed(5)}) > SL(${signal.stop_loss.toFixed(5)})`
          : `SL(${signal.stop_loss.toFixed(5)}) > Entry(${entryPrice.toFixed(5)}) > TP1(${signal.take_profit_1.toFixed(5)})`
      });

      const lineEntry = candleSeriesRef.current.createPriceLine({
        price: entryPrice,
        color: isLong ? '#26a69a' : '#ef5350',
        lineWidth: 3,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${isLong ? '🟢 LONG ↑' : '🔴 SHORT ↓'} - ${entryPrice.toFixed(5)}`,
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
        title: `🛑 STOP LOSS - ${signal.stop_loss.toFixed(5)} (-${signalDistanceToSL.toFixed(2)}%)`,
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
        title: `🎯 TP1 - ${signal.take_profit_1.toFixed(5)} (+${signalGainTP1.toFixed(2)}%)`,
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
          title: `🎯 TP2 - ${signal.take_profit_2.toFixed(5)} (+${signalGainTP2.toFixed(2)}%)`,
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
  }, [signal, position, supports, resistances, orderBlocks, showAnalysis, clearPriceLines]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const recenter = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  return (
    <div className={`${styles.chartWrapper} ${isFullscreen ? styles.fullscreen : ''}`}>
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
    </div>
  );
};

export default TradingChart;
