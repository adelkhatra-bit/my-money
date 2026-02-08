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
      height: isFullscreen ? window.innerHeight - 100 : 280,
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
            height: isFullscreen ? window.innerHeight - 100 : 280,
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

    if (showAnalysis && supports && supports.length > 0) {
      supports.forEach((support, idx) => {
        const line = candleSeriesRef.current.createPriceLine({
          price: support,
          color: '#4caf50',
          lineWidth: 3,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `Support ${idx + 1}`,
        });
        priceLines.current.push(line);
      });
    }

    if (showAnalysis && resistances && resistances.length > 0) {
      resistances.forEach((resistance, idx) => {
        const line = candleSeriesRef.current.createPriceLine({
          price: resistance,
          color: '#f44336',
          lineWidth: 3,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `Résistance ${idx + 1}`,
        });
        priceLines.current.push(line);
      });
    }

    if (showAnalysis && orderBlocks) {
      if (orderBlocks.bullish && orderBlocks.bullish.length > 0) {
        orderBlocks.bullish.forEach((block, index) => {
          const lineHigh = candleSeriesRef.current.createPriceLine({
            price: block.high,
            color: '#00e676',
            lineWidth: 4,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Zone Achat Haut ${index + 1}`,
          });
          const lineLow = candleSeriesRef.current.createPriceLine({
            price: block.low,
            color: '#00e676',
            lineWidth: 4,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Zone Achat Bas ${index + 1}`,
          });
          priceLines.current.push(lineHigh, lineLow);
        });
      }

      if (orderBlocks.bearish && orderBlocks.bearish.length > 0) {
        orderBlocks.bearish.forEach((block, index) => {
          const lineHigh = candleSeriesRef.current.createPriceLine({
            price: block.high,
            color: '#e91e63',
            lineWidth: 4,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Zone Vente Haut ${index + 1}`,
          });
          const lineLow = candleSeriesRef.current.createPriceLine({
            price: block.low,
            color: '#e91e63',
            lineWidth: 4,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Zone Vente Bas ${index + 1}`,
          });
          priceLines.current.push(lineHigh, lineLow);
        });
      }
    }

    if (signal && signal.status === 'ACTIVE') {
      const directionLabel = signal.direction === 'LONG' ? 'Achat' : 'Vente';

      const lineEntryMin = candleSeriesRef.current.createPriceLine({
        price: signal.entry_min,
        color: '#ffc107',
        lineWidth: 3,
        axisLabelVisible: true,
        title: `Entrée Min ${directionLabel}`,
      });

      const lineEntryMax = candleSeriesRef.current.createPriceLine({
        price: signal.entry_max,
        color: '#ffc107',
        lineWidth: 3,
        axisLabelVisible: true,
        title: `Entrée Max ${directionLabel}`,
      });

      const lineSL = candleSeriesRef.current.createPriceLine({
        price: signal.stop_loss,
        color: '#e91e63',
        lineWidth: 4,
        axisLabelVisible: true,
        title: 'Stop Loss',
      });

      const lineTP1 = candleSeriesRef.current.createPriceLine({
        price: signal.take_profit_1,
        color: '#00e676',
        lineWidth: 4,
        axisLabelVisible: true,
        title: 'TP1',
      });

      priceLines.current.push(lineEntryMin, lineEntryMax, lineSL, lineTP1);

      if (signal.take_profit_2) {
        const lineTP2 = candleSeriesRef.current.createPriceLine({
          price: signal.take_profit_2,
          color: '#00e676',
          lineWidth: 4,
          axisLabelVisible: true,
          title: 'TP2',
        });
        priceLines.current.push(lineTP2);
      }
    }

    if (position && position.status === 'OPEN') {
      const posDirectionLabel = position.direction === 'LONG' ? 'Achat' : 'Vente';

      const lineEntry = candleSeriesRef.current.createPriceLine({
        price: position.entry_price,
        color: '#2196f3',
        lineWidth: 4,
        axisLabelVisible: true,
        title: `Position ${posDirectionLabel}`,
      });

      const lineSL = candleSeriesRef.current.createPriceLine({
        price: position.stop_loss,
        color: '#e91e63',
        lineWidth: 4,
        axisLabelVisible: true,
        title: 'Stop Loss',
      });

      const lineTP1 = candleSeriesRef.current.createPriceLine({
        price: position.take_profit_1,
        color: '#00e676',
        lineWidth: 4,
        axisLabelVisible: true,
        title: 'TP1',
      });

      priceLines.current.push(lineEntry, lineSL, lineTP1);

      if (position.take_profit_2) {
        const lineTP2 = candleSeriesRef.current.createPriceLine({
          price: position.take_profit_2,
          color: '#00e676',
          lineWidth: 4,
          axisLabelVisible: true,
          title: 'TP2',
        });
        priceLines.current.push(lineTP2);
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
