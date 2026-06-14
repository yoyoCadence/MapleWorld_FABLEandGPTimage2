// 用 WebAudio 合成的簡單音效（不需任何音檔）
const Sound = {
  ctx: null,
  muted: false,

  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { /* 不支援就靜音 */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggle() {
    this.muted = !this.muted;
    return !this.muted;
  },

  beep(f0, f1, dur, type, vol, delay) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(Math.max(1, f0), t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    g.gain.setValueAtTime(vol || 0.07, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  },

  play(name) {
    switch (name) {
      case 'jump':    this.beep(300, 540, 0.12, 'square', 0.05); break;
      case 'attack':  this.beep(190, 90, 0.08, 'sawtooth', 0.06); break;
      case 'hit':     this.beep(520, 160, 0.09, 'square', 0.06); break;
      case 'crit':    this.beep(700, 200, 0.12, 'square', 0.08); break;
      case 'hurt':    this.beep(220, 80, 0.22, 'sawtooth', 0.09); break;
      case 'die':     this.beep(300, 50, 0.6, 'sawtooth', 0.1); break;
      case 'pickup':  this.beep(660, 990, 0.08, 'square', 0.05); this.beep(990, 1320, 0.08, 'square', 0.05, 0.07); break;
      case 'meso':    this.beep(880, 1760, 0.07, 'triangle', 0.06); break;
      case 'potion':  this.beep(420, 700, 0.15, 'sine', 0.08); break;
      case 'equip':   this.beep(380, 380, 0.07, 'square', 0.06); this.beep(560, 560, 0.08, 'square', 0.06, 0.08); break;
      case 'skill':   this.beep(440, 880, 0.16, 'sawtooth', 0.07); break;
      case 'heal':    this.beep(580, 920, 0.25, 'sine', 0.08); break;
      case 'portal':  this.beep(280, 980, 0.35, 'sine', 0.07); break;
      case 'error':   this.beep(180, 150, 0.12, 'square', 0.06); break;
      case 'mobdie':  this.beep(400, 100, 0.2, 'triangle', 0.07); break;
      case 'levelup':
        [523, 659, 784, 1047].forEach((f, i) => this.beep(f, f, 0.16, 'square', 0.07, i * 0.11));
        break;
      case 'boss':    this.beep(130, 55, 0.5, 'sawtooth', 0.11); this.beep(110, 50, 0.5, 'sawtooth', 0.1, 0.25); break;
      case 'victory':
        [523, 523, 523, 659, 784, 1047].forEach((f, i) => this.beep(f, f, 0.15, 'square', 0.07, i * 0.13));
        break;
    }
  },
};
