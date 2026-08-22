class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('arcade_sfx_muted') === 'true';
    this.isBgmMuted = localStorage.getItem('arcade_bgm_muted') === 'true';
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmGain = null;
    this.masterGain = null;

    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.initContext();
        ['touchstart', 'touchend', 'pointerdown', 'click'].forEach(e => {
          window.removeEventListener(e, unlock);
        });
      };
      ['touchstart', 'touchend', 'pointerdown', 'click'].forEach(e => {
        window.addEventListener(e, unlock, { once: true, passive: true });
      });
    }
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.9, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(this.isBgmMuted ? 0 : 0.15, this.ctx.currentTime);
        this.bgmGain.connect(this.ctx.destination);

        try {
          const buf = this.ctx.createBuffer(1, 1, 22050);
          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          src.connect(this.ctx.destination);
          src.start(0);
        } catch (e) {}
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  vibrate(pattern = 20) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.4, delay = 0) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    setTimeout(() => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.02);
      } catch (e) {}
    }, delay);
  }

  // Clear, rich tap sound for mobile speakers
  playClick() {
    this.playTone(720, 'triangle', 0.05, 0.45);
    this.playTone(1100, 'sine', 0.04, 0.25, 8);
    this.vibrate(12);
  }

  // Rich wooden stone placement sound
  playMove(isPlayer = true) {
    if (isPlayer) {
      this.playTone(560, 'sine', 0.07, 0.5);
      this.playTone(420, 'triangle', 0.06, 0.35, 8);
      this.vibrate(18);
    } else {
      this.playTone(440, 'sine', 0.07, 0.42);
      this.playTone(320, 'triangle', 0.06, 0.3, 8);
    }
  }

  // Softened win volume (0.35) so it doesn't blast or startle on phone speakers
  playWin() {
    if (this.isMuted) return;
    try {
      const audioEl = new Audio('/sounds/yay.mp3');
      audioEl.volume = 0.35;
      const promise = audioEl.play();
      if (promise !== undefined) {
        promise.catch(() => {
          this.playTone(523.25, 'triangle', 0.12, 0.25, 0);
          this.playTone(659.25, 'triangle', 0.12, 0.25, 100);
          this.playTone(783.99, 'triangle', 0.15, 0.28, 200);
          this.playTone(1046.50, 'triangle', 0.35, 0.3, 320);
        });
      }
    } catch (e) {
      this.playTone(523.25, 'triangle', 0.12, 0.25, 0);
      this.playTone(659.25, 'triangle', 0.12, 0.25, 100);
      this.playTone(783.99, 'triangle', 0.15, 0.28, 200);
      this.playTone(1046.50, 'triangle', 0.35, 0.3, 320);
    }
    this.vibrate([40, 60, 100]);
  }

  // Softened lose volume (0.35) so it doesn't blast or startle on phone speakers
  playLose() {
    if (this.isMuted) return;
    try {
      const audioEl = new Audio('/sounds/lose.mp3');
      audioEl.volume = 0.35;
      const promise = audioEl.play();
      if (promise !== undefined) {
        promise.catch(() => {
          this.playTone(340, 'sawtooth', 0.15, 0.22, 0);
          this.playTone(260, 'sawtooth', 0.2, 0.22, 120);
          this.playTone(190, 'sawtooth', 0.3, 0.25, 260);
        });
      }
    } catch (e) {
      this.playTone(340, 'sawtooth', 0.15, 0.22, 0);
      this.playTone(260, 'sawtooth', 0.2, 0.22, 120);
      this.playTone(190, 'sawtooth', 0.3, 0.25, 260);
    }
    this.vibrate(80);
  }

  toggleSFX() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('arcade_sfx_muted', this.isMuted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.9, this.ctx.currentTime);
    }
    return !this.isMuted;
  }
}

export const audio = new AudioManager();
