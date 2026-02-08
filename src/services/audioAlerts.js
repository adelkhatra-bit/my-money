class AudioAlertService {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.5;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
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
    this.playBeep(1000, 300);
    setTimeout(() => this.playBeep(1200, 300), 350);
  }

  takeProfitAlert() {
    this.playBeep(1500, 200);
    setTimeout(() => this.playBeep(1700, 200), 250);
    setTimeout(() => this.playBeep(2000, 200), 500);
  }

  stopLossAlert() {
    this.playBeep(400, 400);
    setTimeout(() => this.playBeep(350, 400), 450);
  }

  warningAlert() {
    this.playBeep(600, 300);
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
}

export const audioAlerts = new AudioAlertService();
