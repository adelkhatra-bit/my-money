class NewsDetectionService {
  constructor() {
    this.newsActive = false;
    this.suspendUntil = null;
    this.listeners = [];
    this.checkInterval = null;
  }

  isNewsSuspension() {
    if (!this.newsActive) return false;

    if (this.suspendUntil && Date.now() < this.suspendUntil) {
      return true;
    }

    if (this.suspendUntil && Date.now() >= this.suspendUntil) {
      this.newsActive = false;
      this.suspendUntil = null;
      this.notifyListeners(false);
      return false;
    }

    return false;
  }

  getRemainingTime() {
    if (!this.suspendUntil) return 0;
    const remaining = this.suspendUntil - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000 / 60));
  }

  activateNewsSuspension(durationMinutes = 30) {
    console.log(`[NewsDetection] Suspension activée pour ${durationMinutes} minutes`);
    this.newsActive = true;
    this.suspendUntil = Date.now() + (durationMinutes * 60 * 1000);
    this.notifyListeners(true);
  }

  deactivateNewsSuspension() {
    console.log('[NewsDetection] Suspension désactivée manuellement');
    this.newsActive = false;
    this.suspendUntil = null;
    this.notifyListeners(false);
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  notifyListeners(isActive) {
    this.listeners.forEach(callback => {
      try {
        callback(isActive);
      } catch (e) {
        console.error('[NewsDetection] Error notifying listener:', e);
      }
    });
  }

  startAutoCheck(markets = ['BTC', 'ETH', 'NASDAQ', 'GOLD']) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkForHighImpactNews(markets);
    }, 60000);
  }

  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkForHighImpactNews(markets) {
    try {
      const now = new Date();
      const hour = now.getUTCHours();
      const minute = now.getUTCMinutes();
      const day = now.getUTCDay();

      const highImpactEvents = [
        { hour: 13, minute: 30, days: [1, 2, 3, 4, 5], name: 'US Market Open', duration: 5 },
        { hour: 14, minute: 0, days: [3], name: 'Fed Decision', duration: 60 },
        { hour: 12, minute: 30, days: [5], name: 'NFP Release', duration: 30 },
        { hour: 14, minute: 30, days: [2, 4], name: 'CPI/PPI Data', duration: 30 }
      ];

      for (const event of highImpactEvents) {
        if (event.days.includes(day)) {
          const eventTime = event.hour * 60 + event.minute;
          const currentTime = hour * 60 + minute;
          const timeDiff = currentTime - eventTime;

          if (timeDiff >= 0 && timeDiff < event.duration) {
            console.log(`[NewsDetection] High-impact event detected: ${event.name}`);
            this.activateNewsSuspension(event.duration - timeDiff);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('[NewsDetection] Error checking for news:', error);
      return false;
    }
  }

  getStatus() {
    return {
      active: this.newsActive,
      remainingMinutes: this.getRemainingTime(),
      suspendUntil: this.suspendUntil
    };
  }
}

export const newsDetection = new NewsDetectionService();
