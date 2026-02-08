class AudioAlertService {
  constructor() {
    this.audioContext = null;
    this.enabled = false;
    this.volume = 0.15;
    this.lastAlertTime = {};
    this.minTimeBetweenAlerts = 5000;
    this.isPlaying = false;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  canPlayAlert(alertType) {
    if (!this.enabled) {
      console.log(`[AudioAlerts] Alert "${alertType}" bloqué - Audio désactivé`);
      return false;
    }

    if (this.isPlaying) {
      console.log(`[AudioAlerts] Alert "${alertType}" bloqué - Son déjà en cours`);
      return false;
    }

    const now = Date.now();
    const lastTime = this.lastAlertTime[alertType] || 0;
    const minTime = alertType === 'signal' ? 30000 : this.minTimeBetweenAlerts;

    if (now - lastTime < minTime) {
      console.log(`[AudioAlerts] Alert "${alertType}" bloqué - Trop rapide (${now - lastTime}ms depuis le dernier, minimum ${minTime}ms)`);
      return false;
    }

    this.lastAlertTime[alertType] = now;
    console.log(`[AudioAlerts] ✅ Alert "${alertType}" autorisé`);
    return true;
  }

  playBeep(frequency = 800, duration = 200) {
    if (!this.enabled) return;

    this.init();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration / 1000
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  signalAlert() {
    if (!this.canPlayAlert('signal')) return;
    this.isPlaying = true;
    this.playBeep(1000, 300);
    setTimeout(() => this.playBeep(1200, 300), 350);
    setTimeout(() => { this.isPlaying = false; }, 800);
  }

  takeProfitAlert() {
    if (!this.canPlayAlert('takeProfit')) return;
    this.isPlaying = true;
    this.playBeep(1500, 200);
    setTimeout(() => this.playBeep(1700, 200), 250);
    setTimeout(() => this.playBeep(2000, 200), 500);
    setTimeout(() => { this.isPlaying = false; }, 800);
  }

  stopLossAlert() {
    if (!this.canPlayAlert('stopLoss')) return;
    this.isPlaying = true;
    this.playBeep(400, 400);
    setTimeout(() => this.playBeep(350, 400), 450);
    setTimeout(() => { this.isPlaying = false; }, 900);
  }

  warningAlert() {
    if (!this.canPlayAlert('warning')) return;
    this.isPlaying = true;
    this.playBeep(600, 300);
    setTimeout(() => { this.isPlaying = false; }, 350);
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  getVolume() {
    return this.volume;
  }
}

export const audioAlerts = new AudioAlertService();
