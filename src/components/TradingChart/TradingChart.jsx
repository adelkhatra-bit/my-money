import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import styles from './TradingChart.module.css';

const TradingChart = ({ candles, signal, position, supports, resistances, orderBlocks, hasCredits = false, showAnalysis = false }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (candles.length === 0) return;

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
      height: isFullscreen ? window.innerHeight - 100 : 330,
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

    candleSeries.setData(candles);

    if (showAnalysis && supports && supports.length > 0) {
      supports.forEach((support, idx) => {
        candleSeries.createPriceLine({
          price: support,
          color: '#4caf50',
          lineWidth: 3,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `Support ${idx + 1}`,
        });
      });
    }

    if (showAnalysis && resistances && resistances.length > 0) {
      resistances.forEach((resistance, idx) => {
        candleSeries.createPriceLine({
          price: resistance,
          color: '#f44336',
          lineWidth: 3,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `Résistance ${idx + 1}`,
        });
      });
    }

    if (showAnalysis && orderBlocks) {
      if (orderBlocks.bullish && orderBlocks.bullish.length > 0) {
        orderBlocks.bullish.forEach((block, index) => {
          candleSeries.createPriceLine({
            price: block.high,
            color: '#00e676',
            lineWidth: 4,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Zone Achat Haut ${index + 1}`,
          });
          candleSeries.createPriceLine({
            price: block.low,
            color: '#00e676',
            lineWidth: 4,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Zone Achat Bas ${index + 1}`,
          });
        });
      }

      if (orderBlocks.bearish && orderBlocks.bearish.length > 0) {
        orderBlocks.bearish.forEach((block, index) => {
          candleSeries.createPriceLine({
            price: block.high,
            color: '#e91e63',
            lineWidth: 4,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Zone Vente Haut ${index + 1}`,
          });
          candleSeries.createPriceLine({
            price: block.low,
            color: '#e91e63',
            lineWidth: 4,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Zone Vente Bas ${index + 1}`,
          });
        });
      }
    }

    if (signal && signal.status === 'ACTIVE') {
      const directionLabel = signal.direction === 'LONG' ? 'Achat' : 'Vente';

      candleSeries.createPriceLine({
        price: signal.entry_min,
        color: '#ffc107',
        lineWidth: 3,
        axisLabelVisible: true,
        title: `Entrée Min ${directionLabel}`,
      });

      candleSeries.createPriceLine({
        price: signal.entry_max,
        color: '#ffc107',
        lineWidth: 3,
        axisLabelVisible: true,
        title: `Entrée Max ${directionLabel}`,
      });

      candleSeries.createPriceLine({
        price: signal.stop_loss,
        color: '#e91e63',
        lineWidth: 4,
        axisLabelVisible: true,
        title: 'Stop Loss',
      });

      candleSeries.createPriceLine({
        price: signal.take_profit_1,
        color: '#00e676',
        lineWidth: 4,
        axisLabelVisible: true,
        title: 'TP1',
      });

      if (signal.take_profit_2) {
        candleSeries.createPriceLine({
          price: signal.take_profit_2,
          color: '#00e676',
          lineWidth: 4,
          axisLabelVisible: true,
          title: 'TP2',
        });
      }
    }

    if (position && position.status === 'OPEN') {
      const posDirectionLabel = position.direction === 'LONG' ? 'Achat' : 'Vente';

      candleSeries.createPriceLine({
        price: position.entry_price,
        color: '#2196f3',
        lineWidth: 4,
        axisLabelVisible: true,
        title: `Position ${posDirectionLabel}`,
      });

      candleSeries.createPriceLine({
        price: position.stop_loss,
        color: '#e91e63',
        lineWidth: 4,
        axisLabelVisible: true,
        title: 'Stop Loss',
      });

      candleSeries.createPriceLine({
        price: position.take_profit_1,
        color: '#00e676',
        lineWidth: 4,
        axisLabelVisible: true,
        title: 'TP1',
      });

      if (position.take_profit_2) {
        candleSeries.createPriceLine({
          price: position.take_profit_2,
          color: '#00e676',
          lineWidth: 4,
          axisLabelVisible: true,
          title: 'TP2',
        });
      }
    }

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : 600,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, [candles, signal, position, supports, resistances, orderBlocks, isFullscreen, hasCredits, showAnalysis]);

  useEffect(() => {
    if (candleSeriesRef.current && candles.length > 0) {
      const latestCandle = candles[candles.length - 1];
      candleSeriesRef.current.update(latestCandle);
    }
  }, [candles]);

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
