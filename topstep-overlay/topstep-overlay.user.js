// ==UserScript==
// @name         TopstepOverlay - AI Trading Bot
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Overlay AI Trading Bot sur Tradovate avec scan et tracés en temps réel
// @author       You
// @match        https://trader.tradovate.com/*
// @match        http://trader.tradovate.com/*
// @match        https://live.tradovate.com/*
// @match        http://live.tradovate.com/*
// @match        https://demo.tradovate.com/*
// @match        http://demo.tradovate.com/*
// @match        https://*.tradovate.com/*
// @match        http://*.tradovate.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log('[TOPSTEPOVERLAY USERSCRIPT] ✅ Script injected - URL:', window.location.href);

    const CSS = `
#ai-trading-overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(17, 24, 39, 0.95);
  border: 2px solid #374151;
  border-radius: 12px;
  padding: 16px;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  color: #f3f4f6;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

.overlay-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #374151;
}

.overlay-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  flex: 1;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4b5563;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #10b981;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.status-off {
  font-size: 14px;
  font-weight: 600;
  color: #ef4444;
}

.status-on {
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
}

.overlay-debug {
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
  font-size: 12px;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}

.debug-row:last-child {
  margin-bottom: 0;
}

.debug-row span {
  color: #d1d5db;
}

.debug-row strong {
  color: #10b981;
}

.btn-debug {
  background: #374151;
  color: #f3f4f6;
  border: 1px solid #4b5563;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-top: 6px;
}

.btn-debug:hover {
  background: #4b5563;
  border-color: #6b7280;
}

.overlay-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.btn-scan {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-scan:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-scan:active {
  transform: translateY(0);
}

.scan-time {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
}

.signal-display {
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.signal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #374151;
}

.signal-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.signal-time {
  font-size: 11px;
  color: #9ca3af;
}

.signal-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.signal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.signal-row span:first-child {
  color: #9ca3af;
}

.signal-value {
  font-weight: 600;
  color: #ffffff;
}

#trading-overlay-canvas {
  pointer-events: none;
}
`;

    const injectCSS = () => {
        const style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);
        console.log('[TOPSTEPOVERLAY] CSS injecté');
    };

    class TopstepOverlay {
        constructor() {
            this.botEnabled = false;
            this.scanInterval = null;
            this.currentSignal = null;
            this.lastScanTime = null;
            this.chartContainer = null;
            this.canvas = null;
            this.ctx = null;
            this.priceData = {
                symbol: 'MES',
                lastPrice: 0,
                high: 0,
                low: 0,
                chartHeight: 0,
                chartWidth: 0,
                priceRange: { min: 0, max: 0 }
            };
            this.debugInfo = {
                url: window.location.href,
                injected: true,
                priceFound: false,
                selectorUsed: '',
                priceValue: '',
                contextAround: ''
            };

            this.init();
        }

        init() {
            console.log('[TOPSTEPOVERLAY] init() appelé');
            this.waitForChart();
        }

        waitForChart() {
            console.log('[TOPSTEPOVERLAY] attente du chart...');

            const checkChart = () => {
                const selectors = [
                    'canvas',
                    '[class*="chart"]',
                    '[class*="Chart"]',
                    '[id*="chart"]',
                    '[data-chart]',
                    '.trading-chart'
                ];

                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log('[TOPSTEPOVERLAY] ✅ Chart trouvé:', selector);
                        this.chartContainer = element.parentElement || element;
                        this.onChartReady();
                        return true;
                    }
                }
                return false;
            };

            if (checkChart()) return;

            const observer = new MutationObserver(() => {
                if (checkChart()) {
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                if (!this.chartContainer) {
                    console.warn('[TOPSTEPOVERLAY] Chart non trouvé après 10s, injection sur body');
                    this.chartContainer = document.body;
                    this.onChartReady();
                }
            }, 10000);
        }

        onChartReady() {
            console.log('[TOPSTEPOVERLAY] ✅ Chart ready - création overlay');
            this.createOverlayUI();
            this.createCanvasOverlay();
            this.startPriceMonitoring();
            console.log('[TOPSTEPOVERLAY] ✅✅✅ OVERLAY ACTIVÉ ET VISIBLE ✅✅✅');
        }

        createOverlayUI() {
            const existing = document.getElementById('ai-trading-overlay');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'ai-trading-overlay';
            overlay.innerHTML = `
                <div class="overlay-header">
                    <span class="overlay-title">🤖 AI Trading Bot</span>
                    <label class="switch">
                        <input type="checkbox" id="bot-toggle">
                        <span class="slider"></span>
                    </label>
                    <span id="bot-status" class="status-off">OFF</span>
                </div>

                <div class="overlay-debug">
                    <div class="debug-row">
                        <span>📍 URL: <strong>${window.location.hostname}</strong></span>
                    </div>
                    <div class="debug-row">
                        <span id="debug-injection">✅ Injected</span>
                        <span id="debug-price">⏳ Searching price...</span>
                    </div>
                    <button id="debug-copy-btn" class="btn-debug">📋 Copy Debug</button>
                </div>

                <div class="overlay-controls">
                    <button id="scan-btn" class="btn-scan">🔍 Scan</button>
                    <span id="last-scan-time" class="scan-time">Aucun scan</span>
                </div>

                <div id="signal-display" class="signal-display" style="display: none;">
                    <div class="signal-header">
                        <span class="signal-title">📍 Signal détecté</span>
                        <span id="signal-time" class="signal-time"></span>
                    </div>
                    <div class="signal-details">
                        <div class="signal-row">
                            <span>Direction:</span>
                            <span id="signal-direction" class="signal-value"></span>
                        </div>
                        <div class="signal-row">
                            <span>Entry:</span>
                            <span id="signal-entry" class="signal-value"></span>
                        </div>
                        <div class="signal-row">
                            <span>Stop Loss:</span>
                            <span id="signal-sl" class="signal-value"></span>
                        </div>
                        <div class="signal-row">
                            <span>TP1:</span>
                            <span id="signal-tp1" class="signal-value"></span>
                        </div>
                        <div class="signal-row">
                            <span>TP2:</span>
                            <span id="signal-tp2" class="signal-value"></span>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            console.log('[TOPSTEPOVERLAY] ✅ Overlay UI ajouté au DOM');

            document.getElementById('bot-toggle').addEventListener('change', (e) => {
                this.toggleBot(e.target.checked);
            });

            document.getElementById('scan-btn').addEventListener('click', () => {
                this.runScan();
            });

            document.getElementById('debug-copy-btn').addEventListener('click', () => {
                this.copyDebugInfo();
            });
        }

        createCanvasOverlay() {
            const existing = document.getElementById('trading-overlay-canvas');
            if (existing) existing.remove();

            this.canvas = document.createElement('canvas');
            this.canvas.id = 'trading-overlay-canvas';
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 999998;
            `;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.ctx = this.canvas.getContext('2d');

            document.body.appendChild(this.canvas);

            window.addEventListener('resize', () => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            });
        }

        startPriceMonitoring() {
            setInterval(() => {
                this.updatePriceData();
            }, 1000);
        }

        updatePriceData() {
            const priceSelectors = [
                '[class*="price"]',
                '[class*="last"]',
                '[class*="quote"]',
                '.price-display',
                '.last-price',
                '[data-price]',
                '[aria-label*="price"]'
            ];

            for (const selector of priceSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    const text = el.textContent.trim();
                    const match = text.match(/(\d+[\.,]\d+)/);
                    if (match) {
                        const price = parseFloat(match[1].replace(',', ''));
                        if (price > 1000 && price < 100000) {
                            this.priceData.lastPrice = price;
                            this.debugInfo.priceFound = true;
                            this.debugInfo.selectorUsed = selector;
                            this.debugInfo.priceValue = price;
                            this.debugInfo.contextAround = text.substring(0, 200);
                            this.updateDebugUI();
                            return;
                        }
                    }
                }
            }

            const allText = document.body.innerText;
            const priceMatch = allText.match(/(\d{4,5}\.\d{2})/);
            if (priceMatch) {
                this.priceData.lastPrice = parseFloat(priceMatch[1]);
                this.debugInfo.priceFound = true;
                this.debugInfo.selectorUsed = 'body.innerText';
                this.debugInfo.priceValue = parseFloat(priceMatch[1]);
                this.debugInfo.contextAround = allText.substring(allText.indexOf(priceMatch[1]) - 50, allText.indexOf(priceMatch[1]) + 150);
                this.updateDebugUI();
            } else {
                this.debugInfo.priceFound = false;
                this.updateDebugUI();
            }
        }

        updateDebugUI() {
            const debugPriceEl = document.getElementById('debug-price');
            if (debugPriceEl) {
                if (this.debugInfo.priceFound) {
                    debugPriceEl.innerHTML = `✅ Price: <strong>${this.debugInfo.priceValue}</strong>`;
                    debugPriceEl.style.color = '#10b981';
                } else {
                    debugPriceEl.innerHTML = '❌ No price';
                    debugPriceEl.style.color = '#ef4444';
                }
            }
        }

        copyDebugInfo() {
            const debugText = `
=== TOPSTEP OVERLAY DEBUG ===
URL: ${this.debugInfo.url}
Injected: ${this.debugInfo.injected ? 'YES ✅' : 'NO ❌'}
Price Found: ${this.debugInfo.priceFound ? 'YES ✅' : 'NO ❌'}
Selector Used: ${this.debugInfo.selectorUsed}
Price Value: ${this.debugInfo.priceValue}
Context Around Price:
${this.debugInfo.contextAround}

Chart Container: ${this.chartContainer ? 'FOUND ✅' : 'NOT FOUND ❌'}
Canvas Created: ${this.canvas ? 'YES ✅' : 'NO ❌'}

Timestamp: ${new Date().toISOString()}
            `.trim();

            console.log('[TOPSTEPOVERLAY] DEBUG INFO:', debugText);

            navigator.clipboard.writeText(debugText).then(() => {
                alert('✅ Debug info copied to clipboard!');
            }).catch(err => {
                console.error('[TOPSTEPOVERLAY] Failed to copy:', err);
                alert('❌ Failed to copy. Check console for debug info.');
            });
        }

        toggleBot(enabled) {
            this.botEnabled = enabled;
            const statusEl = document.getElementById('bot-status');

            if (enabled) {
                statusEl.textContent = 'ON';
                statusEl.className = 'status-on';
                console.log('[TOPSTEPOVERLAY] BOT ON - auto scan activé');
                this.startAutoScan();
            } else {
                statusEl.textContent = 'OFF';
                statusEl.className = 'status-off';
                console.log('[TOPSTEPOVERLAY] BOT OFF');
                this.stopAutoScan();
            }
        }

        startAutoScan() {
            if (this.scanInterval) clearInterval(this.scanInterval);
            this.scanInterval = setInterval(() => {
                this.runScan();
            }, 5000);
        }

        stopAutoScan() {
            if (this.scanInterval) {
                clearInterval(this.scanInterval);
                this.scanInterval = null;
            }
        }

        runScan() {
            console.log('[TOPSTEPOVERLAY] 🔍 Scan lancé...');

            const signal = this.generateMockSignal();
            this.displaySignal(signal);
            this.drawSignalOnChart(signal);

            const lastScanTimeEl = document.getElementById('last-scan-time');
            lastScanTimeEl.textContent = `Dernier scan: ${new Date().toLocaleTimeString('fr-FR')}`;
            this.lastScanTime = Date.now();

            console.log('[TOPSTEPOVERLAY] ✅ Signal généré:', signal);
        }

        generateMockSignal() {
            const direction = Math.random() > 0.5 ? 'LONG' : 'SHORT';
            const currentPrice = this.priceData.lastPrice || 5850;

            let entry, sl, tp1, tp2;
            if (direction === 'LONG') {
                entry = currentPrice + Math.random() * 10;
                sl = entry - 20;
                tp1 = entry + 30;
                tp2 = entry + 60;
            } else {
                entry = currentPrice - Math.random() * 10;
                sl = entry + 20;
                tp1 = entry - 30;
                tp2 = entry - 60;
            }

            return {
                direction,
                entry: entry.toFixed(2),
                sl: sl.toFixed(2),
                tp1: tp1.toFixed(2),
                tp2: tp2.toFixed(2),
                timestamp: Date.now()
            };
        }

        displaySignal(signal) {
            const signalDisplay = document.getElementById('signal-display');
            signalDisplay.style.display = 'block';

            document.getElementById('signal-time').textContent = new Date(signal.timestamp).toLocaleTimeString('fr-FR');
            document.getElementById('signal-direction').textContent = signal.direction;
            document.getElementById('signal-entry').textContent = signal.entry;
            document.getElementById('signal-sl').textContent = signal.sl;
            document.getElementById('signal-tp1').textContent = signal.tp1;
            document.getElementById('signal-tp2').textContent = signal.tp2;

            this.currentSignal = signal;
        }

        drawSignalOnChart(signal) {
            if (!this.ctx) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const rectWidth = 200;
            const rectHeight = 60;

            const color = signal.direction === 'LONG' ? '#10b981' : '#ef4444';

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(centerX - rectWidth / 2, centerY - rectHeight / 2, rectWidth, rectHeight);

            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${signal.direction} @ ${signal.entry}`, centerX, centerY - 10);

            this.ctx.font = '14px Arial';
            this.ctx.fillText(`SL: ${signal.sl}`, centerX - 60, centerY + 15);
            this.ctx.fillText(`TP1: ${signal.tp1}`, centerX, centerY + 15);
            this.ctx.fillText(`TP2: ${signal.tp2}`, centerX + 60, centerY + 15);

            console.log('[TOPSTEPOVERLAY] ✅ Signal tracé sur canvas');
        }
    }

    const init = () => {
        console.log('[TOPSTEPOVERLAY] Initialisation...');
        injectCSS();

        setTimeout(() => {
            new TopstepOverlay();
        }, 1000);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
