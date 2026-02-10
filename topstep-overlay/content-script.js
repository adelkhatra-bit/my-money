console.log('🤖 AI Trading Bot Overlay - Initialisation...');

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

    this.init();
  }

  init() {
    setTimeout(() => {
      this.detectChartContainer();
      this.createOverlayUI();
      this.createCanvasOverlay();
      this.startPriceMonitoring();
      console.log('✅ AI Trading Bot Overlay activé');
    }, 2000);
  }

  detectChartContainer() {
    const selectors = [
      '.chart-container',
      '[class*="chart"]',
      '[class*="Chart"]',
      '#chart-area',
      'canvas[class*="chart"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        this.chartContainer = element.parentElement || element;
        console.log('📊 Chart container trouvé:', selector);
        return;
      }
    }

    const canvases = document.querySelectorAll('canvas');
    if (canvases.length > 0) {
      this.chartContainer = canvases[0].parentElement;
      console.log('📊 Chart container trouvé via canvas');
    } else {
      console.warn('⚠️ Chart container non trouvé, utilisation du body');
      this.chartContainer = document.body;
    }
  }

  createOverlayUI() {
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
          <div class="signal-row">
            <span>Risk/Reward:</span>
            <span id="signal-rr" class="signal-value"></span>
          </div>
        </div>
      </div>

      <div id="position-preview" class="position-preview" style="display: none;">
        <div class="preview-header">📊 Aperçu Position</div>
        <div class="preview-details">
          <div class="preview-row">
            <span>Symbole:</span>
            <span id="preview-symbol" class="preview-value"></span>
          </div>
          <div class="preview-row">
            <span>Direction:</span>
            <span id="preview-direction" class="preview-value"></span>
          </div>
          <div class="preview-row">
            <span>Taille:</span>
            <span id="preview-size" class="preview-value"></span>
          </div>
          <div class="preview-row">
            <span>P&L:</span>
            <span id="preview-pnl" class="preview-value"></span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('bot-toggle').addEventListener('change', (e) => {
      this.toggleBot(e.target.checked);
    });

    document.getElementById('scan-btn').addEventListener('click', () => {
      this.runScan();
    });
  }

  createCanvasOverlay() {
    if (!this.chartContainer) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'trading-overlay-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';

    const updateCanvasSize = () => {
      const rect = this.chartContainer.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.priceData.chartWidth = rect.width;
      this.priceData.chartHeight = rect.height;

      if (this.currentSignal) {
        this.drawSignalOnChart(this.currentSignal);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    this.chartContainer.style.position = 'relative';
    this.chartContainer.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    console.log('🎨 Canvas overlay créé');
  }

  startPriceMonitoring() {
    setInterval(() => {
      this.updatePriceData();
    }, 100);
  }

  updatePriceData() {
    const priceSelectors = [
      '[class*="price"]',
      '[class*="last"]',
      '[class*="quote"]',
      '.price-display',
      '.last-price'
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
            return;
          }
        }
      }
    }

    const allText = document.body.innerText;
    const priceMatch = allText.match(/(\d{4,5}\.\d{2})/);
    if (priceMatch) {
      this.priceData.lastPrice = parseFloat(priceMatch[1]);
    }
  }

  toggleBot(enabled) {
    this.botEnabled = enabled;
    const statusEl = document.getElementById('bot-status');

    if (enabled) {
      statusEl.textContent = 'ON';
      statusEl.className = 'status-on';
      this.startAutoScan();
      console.log('🟢 Bot activé - Scan auto démarré');
    } else {
      statusEl.textContent = 'OFF';
      statusEl.className = 'status-off';
      this.stopAutoScan();
      console.log('🔴 Bot désactivé');
    }
  }

  startAutoScan() {
    this.stopAutoScan();
    this.runScan();
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
    console.log('🔍 Scan en cours...');

    const now = new Date();
    this.lastScanTime = now;
    document.getElementById('last-scan-time').textContent =
      `Dernier scan: ${now.toLocaleTimeString()}`;

    const signal = this.generateSignal();

    if (signal) {
      this.currentSignal = signal;
      this.displaySignal(signal);
      this.drawSignalOnChart(signal);
      console.log('✅ Signal généré:', signal);
    } else {
      console.log('⚠️ Aucun signal détecté');
    }
  }

  generateSignal() {
    const currentPrice = this.priceData.lastPrice || 5850;

    const direction = Math.random() > 0.5 ? 'LONG' : 'SHORT';

    const volatility = currentPrice * 0.002;
    const entry = currentPrice + (Math.random() - 0.5) * volatility;

    let sl, tp1, tp2;

    if (direction === 'LONG') {
      sl = entry - (volatility * 2);
      tp1 = entry + (volatility * 3);
      tp2 = entry + (volatility * 5);
    } else {
      sl = entry + (volatility * 2);
      tp1 = entry - (volatility * 3);
      tp2 = entry - (volatility * 5);
    }

    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp1 - entry);
    const rr = (reward / risk).toFixed(2);

    return {
      direction,
      entry: entry.toFixed(2),
      sl: sl.toFixed(2),
      tp1: tp1.toFixed(2),
      tp2: tp2.toFixed(2),
      rr,
      timestamp: new Date(),
      currentPrice: currentPrice.toFixed(2)
    };
  }

  displaySignal(signal) {
    document.getElementById('signal-display').style.display = 'block';
    document.getElementById('signal-time').textContent =
      signal.timestamp.toLocaleTimeString();
    document.getElementById('signal-direction').textContent = signal.direction;
    document.getElementById('signal-direction').style.color =
      signal.direction === 'LONG' ? '#10b981' : '#ef4444';
    document.getElementById('signal-entry').textContent = signal.entry;
    document.getElementById('signal-sl').textContent = signal.sl;
    document.getElementById('signal-tp1').textContent = signal.tp1;
    document.getElementById('signal-tp2').textContent = signal.tp2;
    document.getElementById('signal-rr').textContent = `1:${signal.rr}`;

    this.showPositionPreview(signal);
  }

  showPositionPreview(signal) {
    const previewEl = document.getElementById('position-preview');
    previewEl.style.display = 'block';

    document.getElementById('preview-symbol').textContent = 'MES';
    document.getElementById('preview-direction').textContent = signal.direction;
    document.getElementById('preview-direction').style.color =
      signal.direction === 'LONG' ? '#10b981' : '#ef4444';
    document.getElementById('preview-size').textContent = '1 contrat';

    const currentPrice = parseFloat(this.priceData.lastPrice || signal.currentPrice);
    const entryPrice = parseFloat(signal.entry);
    const pnl = signal.direction === 'LONG'
      ? (currentPrice - entryPrice) * 5
      : (entryPrice - currentPrice) * 5;

    const pnlEl = document.getElementById('preview-pnl');
    pnlEl.textContent = `$${pnl.toFixed(2)}`;
    pnlEl.style.color = pnl >= 0 ? '#10b981' : '#ef4444';
  }

  drawSignalOnChart(signal) {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const prices = [
      parseFloat(signal.entry),
      parseFloat(signal.sl),
      parseFloat(signal.tp1),
      parseFloat(signal.tp2)
    ];

    const minPrice = Math.min(...prices) * 0.998;
    const maxPrice = Math.max(...prices) * 1.002;
    this.priceData.priceRange = { min: minPrice, max: maxPrice };

    const priceToY = (price) => {
      const range = maxPrice - minPrice;
      const ratio = (maxPrice - price) / range;
      return this.canvas.height * 0.1 + ratio * (this.canvas.height * 0.8);
    };

    const entryY = priceToY(parseFloat(signal.entry));
    const slY = priceToY(parseFloat(signal.sl));
    const tp1Y = priceToY(parseFloat(signal.tp1));
    const tp2Y = priceToY(parseFloat(signal.tp2));

    const zoneHeight = Math.abs(entryY - slY) * 0.3;
    this.ctx.fillStyle = signal.direction === 'LONG'
      ? 'rgba(16, 185, 129, 0.1)'
      : 'rgba(239, 68, 68, 0.1)';
    this.ctx.fillRect(
      this.canvas.width * 0.1,
      entryY - zoneHeight / 2,
      this.canvas.width * 0.8,
      zoneHeight
    );

    this.ctx.strokeStyle = signal.direction === 'LONG' ? '#10b981' : '#ef4444';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width * 0.1, entryY);
    this.ctx.lineTo(this.canvas.width * 0.9, entryY);
    this.ctx.stroke();

    this.ctx.fillStyle = signal.direction === 'LONG' ? '#10b981' : '#ef4444';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(
      `ENTRY ${signal.entry}`,
      this.canvas.width * 0.91,
      entryY + 5
    );

    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width * 0.1, slY);
    this.ctx.lineTo(this.canvas.width * 0.9, slY);
    this.ctx.stroke();

    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillText(`SL ${signal.sl}`, this.canvas.width * 0.91, slY + 5);

    this.ctx.strokeStyle = '#10b981';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width * 0.1, tp1Y);
    this.ctx.lineTo(this.canvas.width * 0.9, tp1Y);
    this.ctx.stroke();

    this.ctx.fillStyle = '#10b981';
    this.ctx.fillText(`TP1 ${signal.tp1}`, this.canvas.width * 0.91, tp1Y + 5);

    this.ctx.strokeStyle = '#10b981';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width * 0.1, tp2Y);
    this.ctx.lineTo(this.canvas.width * 0.9, tp2Y);
    this.ctx.stroke();

    this.ctx.fillStyle = '#10b981';
    this.ctx.fillText(`TP2 ${signal.tp2}`, this.canvas.width * 0.91, tp2Y + 5);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 200, 30);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(
      `Scan: ${signal.timestamp.toLocaleTimeString()}`,
      20,
      30
    );

    console.log('🎨 Tracé dessiné sur le chart');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TopstepOverlay();
  });
} else {
  new TopstepOverlay();
}
