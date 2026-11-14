class TacticalAudio {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.08,
    delay = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(gainVal, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  move() {
    this.playTone(220, 0.07, 'triangle', 0.05);
  }

  pickup() {
    this.playTone(523.25, 0.09, 'sine', 0.07, 0);
    this.playTone(659.25, 0.12, 'sine', 0.07, 0.07);
  }

  heal() {
    this.playTone(440, 0.12, 'sine', 0.06, 0);
    this.playTone(554.37, 0.16, 'sine', 0.07, 0.09);
  }

  rescue() {
    this.playTone(440, 0.1, 'triangle', 0.08, 0);
    this.playTone(587.33, 0.12, 'triangle', 0.08, 0.08);
    this.playTone(783.99, 0.22, 'sine', 0.09, 0.16);
  }

  hazard() {
    this.playTone(135, 0.18, 'sawtooth', 0.05, 0);
    this.playTone(110, 0.22, 'sawtooth', 0.04, 0.09);
  }

  victory() {
    this.playTone(523.25, 0.14, 'triangle', 0.08, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.08, 0.11);
    this.playTone(783.99, 0.18, 'triangle', 0.09, 0.22);
    this.playTone(1046.5, 0.35, 'sine', 0.1, 0.34);
  }

  fail() {
    this.playTone(220, 0.2, 'sawtooth', 0.06, 0);
    this.playTone(174.61, 0.28, 'sawtooth', 0.06, 0.18);
  }

  jump() {
    const ctx = this.getContext();
    if (!ctx) return;
    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, start);
    osc.frequency.exponentialRampToValueAtTime(290, start + 0.11);
    gain.gain.setValueAtTime(0.06, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.14);
  }

  warning() {
    this.playTone(880, 0.11, 'square', 0.045, 0);
    this.playTone(660, 0.14, 'square', 0.045, 0.13);
  }

  thunder() {
    this.playTone(72, 0.45, 'sawtooth', 0.055, 0);
    this.playTone(54, 0.55, 'triangle', 0.06, 0.12);
  }

  cutsceneCue() {
    this.playTone(329.63, 0.22, 'triangle', 0.06, 0);
    this.playTone(440, 0.28, 'sine', 0.06, 0.16);
    this.playTone(523.25, 0.35, 'sine', 0.05, 0.34);
  }

  shoot() {
    const ctx = this.getContext();
    if (!ctx) return;
    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, start);
    osc.frequency.exponentialRampToValueAtTime(95, start + 0.12);
    gain.gain.setValueAtTime(0.085, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.14);
  }

  predatorDown() {
    this.playTone(340, 0.08, 'square', 0.05, 0);
    this.playTone(180, 0.16, 'triangle', 0.07, 0.05);
  }

  predatorBite() {
    this.playTone(110, 0.14, 'sawtooth', 0.09, 0);
    this.playTone(82, 0.18, 'square', 0.06, 0.06);
  }

  signRead() {
    this.playTone(493.88, 0.07, 'sine', 0.05, 0);
    this.playTone(659.25, 0.09, 'sine', 0.05, 0.06);
  }

  siren() {
    this.playTone(620, 0.18, 'triangle', 0.05, 0);
    this.playTone(480, 0.22, 'triangle', 0.05, 0.18);
  }

  allClear() {
    this.playTone(587.33, 0.12, 'sine', 0.065, 0);
    this.playTone(739.99, 0.14, 'sine', 0.07, 0.11);
    this.playTone(880, 0.24, 'sine', 0.08, 0.23);
  }

  doorOpen() {
    this.playTone(340, 0.055, 'triangle', 0.065, 0);
    this.playTone(460, 0.09, 'sine', 0.06, 0.045);
  }

  doorClose() {
    this.playTone(260, 0.06, 'triangle', 0.07, 0);
    this.playTone(155, 0.09, 'square', 0.05, 0.045);
  }
}

export const soundFX = new TacticalAudio();
