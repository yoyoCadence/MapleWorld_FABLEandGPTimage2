// 用 WebAudio 合成的簡單音效（不需任何音檔）
const Sound = {
  ctx: null,
  muted: false,
  bgmTimer: null,
  bgmAudio: null,
  bgmTheme: null,
  bgmStep: 0,
  BGM_BASE: 'assets/audio/',
  // 各主題的簡單旋律（程序化合成；有真實音檔則優先用音檔）
  BGM: {
    meadow: [523, 659, 784, 659, 587, 698, 880, 698],
    forest: [440, 523, 659, 523, 494, 587, 740, 587],
    cave:   [392, 494, 587, 494, 440, 523, 659, 523],
    altar:  [330, 415, 494, 415, 349, 440, 523, 440],
    snow:   [587, 740, 880, 740, 659, 784, 988, 784],
    lava:   [349, 440, 523, 440, 392, 494, 587, 494],
    castle: [294, 370, 440, 370, 330, 415, 494, 415],
  },

  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { /* 不支援就靜音 */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggle() {
    this.muted = !this.muted;
    if (this.bgmAudio) this.bgmAudio.volume = this.muted ? 0 : 0.4;
    return !this.muted;
  },

  // ── 背景音樂 ──
  startBgm(theme) {
    if (!this.ctx) return;                       // 尚無音訊環境（或 node 測試）→ 不啟動
    if (this.bgmTheme === theme && (this.bgmTimer || this.bgmAudio)) return;
    this.stopBgm();
    this.bgmTheme = theme;
    this._startProc(theme);                       // 程序化合成（保底）
    if (typeof Audio !== 'undefined') this._startAudioBgm(theme, ['mp3', 'wav']);
  },
  _startAudioBgm(theme, formats, index = 0) {
    if (index >= formats.length) return;
    try {
      const bust = (typeof BUILD !== 'undefined') ? '?v=' + BUILD : '';
      const a = new Audio(this.BGM_BASE + 'bgm_' + theme + '.' + formats[index] + bust);
      let settled = false;
      const useAudio = () => {
        if (settled || this.bgmTheme !== theme) return;
        settled = true;
        this.bgmAudio = a;
        if (this.bgmTimer) { clearInterval(this.bgmTimer); this.bgmTimer = null; }
      };
      const tryNext = () => {
        if (settled || this.bgmTheme !== theme) return;
        settled = true;
        try { a.pause(); } catch (e) {}
        this._startAudioBgm(theme, formats, index + 1);
      };
      a.loop = true;
      a.volume = this.muted ? 0 : 0.4;
      if (a.addEventListener) a.addEventListener('error', tryNext, { once: true });
      const p = a.play();
      if (p && p.then) p.then(useAudio).catch(tryNext);
      else setTimeout(useAudio, 0);
    } catch (e) {
      this._startAudioBgm(theme, formats, index + 1);
    }
  },
  stopBgm() {
    if (this.bgmTimer) { clearInterval(this.bgmTimer); this.bgmTimer = null; }
    if (this.bgmAudio) { try { this.bgmAudio.pause(); } catch (e) {} this.bgmAudio = null; }
    this.bgmTheme = null;
  },
  _startProc(theme) {
    if (typeof setInterval === 'undefined') return;
    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => this._bgmTick(), 360);
  },
  _bgmTick() {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const seq = this.BGM[this.bgmTheme] || this.BGM.meadow;
    const n = seq[this.bgmStep % seq.length];
    this.bgmStep++;
    this._bgmNote(n, 0.32, 0.028, 'triangle');
    if (this.bgmStep % 2 === 0) this._bgmNote(n / 2, 0.5, 0.020, 'sine');
  },
  _bgmNote(f, dur, vol, type) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
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
