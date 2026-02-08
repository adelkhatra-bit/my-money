class BotService {
  constructor() {
    this.intervalId = null;
    this.callbacks = new Set();
    this.isRunning = false;

    const savedState = localStorage.getItem('bot_state');
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.isRunning) {
        this.restore();
      }
    }
  }

  start(callback, intervalMs = 30000) {
    if (this.isRunning) {
      console.log('[BotService] Bot already running');
      return;
    }

    console.log('[BotService] Starting bot...');
    this.isRunning = true;
    this.callbacks.add(callback);

    localStorage.setItem('bot_state', JSON.stringify({
      isRunning: true,
      intervalMs,
      startedAt: Date.now()
    }));

    if (callback) {
      callback();
    }

    this.intervalId = setInterval(() => {
      this.callbacks.forEach(cb => {
        try {
          cb();
        } catch (error) {
          console.error('[BotService] Error in callback:', error);
        }
      });
    }, intervalMs);
  }

  stop() {
    console.log('[BotService] Stopping bot...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    localStorage.removeItem('bot_state');
  }

  restore() {
    const savedState = localStorage.getItem('bot_state');
    if (!savedState) return;

    const state = JSON.parse(savedState);
    console.log('[BotService] Restoring bot state:', state);
  }

  addCallback(callback) {
    this.callbacks.add(callback);
  }

  removeCallback(callback) {
    this.callbacks.delete(callback);
  }

  getState() {
    const savedState = localStorage.getItem('bot_state');
    return savedState ? JSON.parse(savedState) : { isRunning: false };
  }
}

export const botService = new BotService();
