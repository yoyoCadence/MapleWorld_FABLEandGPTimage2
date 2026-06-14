// 視覺場景渲染：多層視差背景、有機地形、大氣效果
// 重度繪製內容全部預渲染到離屏 Canvas（每主題/每地圖一次），執行期只做貼圖
const THEMES = {
  meadow: {
    sky: ['#5fb2ee', '#a8dcf8', '#fdf0cf'],
    tint: 'rgba(255,214,130,0.05)',
    grass: { light: '#a8e06c', base: '#6cc24a', deep: '#3f9434', fringe: '#358327' },
    soil: { top: '#a8744a', bottom: '#5e3a22', stone: '#b08a5e' },
  },
  forest: {
    sky: ['#2f5d3a', '#7cbf6e', '#dff2bc'],
    tint: 'rgba(110,200,110,0.07)',
    grass: { light: '#8fd86a', base: '#4fae45', deep: '#2f8434', fringe: '#256e2c' },
    soil: { top: '#7c5430', bottom: '#46301c', stone: '#94704a' },
  },
  cave: {
    sky: ['#120d26', '#2c2055', '#43317a'],
    tint: 'rgba(80,70,170,0.10)',
    grass: { light: '#b8b8e0', base: '#8d8fb0', deep: '#5d5d7e', fringe: '#4a4a66' },
    soil: { top: '#585874', bottom: '#2e2e44', stone: '#7a7a9a' },
  },
  altar: {
    sky: ['#160812', '#4a0f1c', '#7a2026'],
    tint: 'rgba(255,80,40,0.07)',
    grass: { light: '#e8c87a', base: '#c9a24b', deep: '#8a6a2a', fringe: '#6e5420' },
    soil: { top: '#4a3640', bottom: '#241a20', stone: '#6a5260' },
  },
};

const Renderer = {
  _bgCache: {},
  _mapCache: {},
  _assetBgCache: {},
  _vignette: null,
  ASSET_BASE: 'assets/',
  BG_ASSETS: {
    meadow: 'meadow-bg.png',
    forest: 'forest-bg.png',
    cave: 'cave-bg.png',
    altar: 'shrine-bg.png',
  },
  TILE_W: 1280,

  // ══════════════════ 公開介面 ══════════════════

  drawBackground(ctx, map, cam, t) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    const th = THEMES[map.theme];

    if (!this._drawAssetBackground(ctx, map, cam)) {
      this._sky(ctx, map.theme, th, t);

      const bg = this._bg(map.theme);
      this._blitTile(ctx, bg.far, cam.x * 0.15);
      this._blitTile(ctx, bg.mid, cam.x * 0.4);
    }

    if (map.theme === 'forest') this._lightShafts(ctx, t);
    this._mist(ctx, map.theme, t);
    this._particles(ctx, map.theme, cam, t, false);
  },

  // 在 Camera transform 內（世界座標）
  drawMapGeometry(ctx, map, t) {
    ctx.drawImage(this._world(map), 0, 0);
    for (const po of map.portals) {
      const targetName = MapDB[po.target] ? MapDB[po.target].name : '';
      Sprites.drawPortal(ctx, po.x, po.y, t, targetName);
    }
  },

  // 世界之上、HUD 之下的前景大氣層
  drawForeground(ctx, map, cam, t) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    this._particles(ctx, map.theme, cam, t, true);
    ctx.fillStyle = THEMES[map.theme].tint;
    ctx.fillRect(0, 0, W, H);
    if (!this._vignette) {
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.95);
      g.addColorStop(0, 'rgba(10,8,24,0)');
      g.addColorStop(1, 'rgba(10,8,24,0.36)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      this._vignette = cv;
    }
    ctx.drawImage(this._vignette, 0, 0);
  },

  _blitTile(ctx, tile, scroll) {
    const TW = this.TILE_W;
    const off = -(((scroll % TW) + TW) % TW);
    ctx.drawImage(tile, off, 0);
    ctx.drawImage(tile, off + TW, 0);
  },

  _assetBg(theme) {
    if (typeof Image === 'undefined') return null;
    const file = this.BG_ASSETS[theme];
    if (!file) return null;
    const path = this.ASSET_BASE + 'backgrounds/' + file;
    if (!this._assetBgCache[path]) {
      const img = new Image();
      img.decoding = 'async';
      img.src = path;
      this._assetBgCache[path] = img;
    }
    return this._assetBgCache[path];
  },

  _imageReady(img) {
    return img && img.complete && img.naturalWidth > 0;
  },

  _drawAssetBackground(ctx, map, cam) {
    const img = this._assetBg(map.theme);
    if (!this._imageReady(img)) return false;

    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const sw = W / scale;
    const sh = H / scale;
    const maxSx = Math.max(0, img.naturalWidth - sw);
    const maxSy = Math.max(0, img.naturalHeight - sh);
    const camRange = Math.max(1, map.w - W);
    const sx = Utils.clamp(maxSx * (cam.x / camRange), 0, maxSx);
    const sy = maxSy * 0.58;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

    const shade = ctx.createLinearGradient(0, H * 0.42, 0, H);
    shade.addColorStop(0, 'rgba(8,10,20,0)');
    shade.addColorStop(1, 'rgba(8,10,20,0.22)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    return true;
  },

  // ══════════════════ 天空（動態、便宜）══════════════════

  _sky(ctx, theme, th, t) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(0.55, th.sky[1]);
    g.addColorStop(1, th.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (theme === 'meadow') {
      // 太陽光暈
      const sun = ctx.createRadialGradient(840, 92, 8, 840, 92, 130);
      sun.addColorStop(0, 'rgba(255,250,220,0.95)');
      sun.addColorStop(0.25, 'rgba(255,240,180,0.5)');
      sun.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(680, 0, 330, 260);
      this._clouds(ctx, t, 'rgba(255,255,255,0.92)', 'rgba(196,214,236,0.9)');
    } else if (theme === 'cave') {
      // 閃爍星塵
      for (let i = 0; i < 22; i++) {
        const sx = (i * 173.3) % W;
        const sy = (i * 97.7) % (H * 0.55);
        const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * 1.6 + i * 1.7));
        ctx.globalAlpha = tw * 0.8;
        ctx.fillStyle = i % 3 === 0 ? '#aef3ff' : '#e8d8ff';
        ctx.save();
        ctx.translate(sx, sy);
        Art.sparkle(ctx, i % 4 === 0 ? 3.2 : 1.8);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    } else if (theme === 'altar') {
      // 血月
      const mx = 768, my = 108;
      const halo = ctx.createRadialGradient(mx, my, 30, mx, my, 150);
      halo.addColorStop(0, 'rgba(255,180,150,0.45)');
      halo.addColorStop(1, 'rgba(255,120,90,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(mx - 160, my - 160, 320, 320);
      ctx.fillStyle = '#f2dcc2';
      ctx.beginPath();
      ctx.arc(mx, my, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(196,158,138,0.55)';
      for (const [ox, oy, r] of [[-18, -8, 9], [12, 14, 12], [16, -20, 6], [-6, 22, 5]]) {
        ctx.beginPath();
        ctx.arc(mx + ox, my + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      this._clouds(ctx, t * 0.4, 'rgba(58,22,34,0.85)', 'rgba(34,10,22,0.85)');
    }
  },

  _clouds(ctx, t, lit, shade) {
    const W = CONFIG.CANVAS_W;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 433 + t * 13) % (W + 320)) - 160;
      const cy = 52 + ((i * 67) % 120);
      const s = 0.8 + (i % 3) * 0.35;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(s, s);
      // 底部陰影層
      ctx.fillStyle = shade;
      this._cloudPath(ctx, 3);
      ctx.fill();
      // 受光主體
      ctx.fillStyle = lit;
      this._cloudPath(ctx, 0);
      ctx.fill();
      ctx.restore();
    }
  },

  _cloudPath(ctx, dy) {
    ctx.beginPath();
    ctx.moveTo(-52, 12 + dy);
    ctx.bezierCurveTo(-58, -2 + dy, -42, -14 + dy, -26, -10 + dy);
    ctx.bezierCurveTo(-20, -26 + dy, 6, -28 + dy, 14, -14 + dy);
    ctx.bezierCurveTo(34, -22 + dy, 52, -8 + dy, 48, 6 + dy);
    ctx.bezierCurveTo(58, 12 + dy, 50, 14 + dy, 40, 14 + dy);
    ctx.lineTo(-44, 14 + dy);
    ctx.closePath();
  },

  // ══════════════════ 視差層（離屏快取）══════════════════

  _bg(theme) {
    if (this._bgCache[theme]) return this._bgCache[theme];
    const TW = this.TILE_W, TH = CONFIG.CANVAS_H;
    const mk = () => {
      const cv = document.createElement('canvas');
      cv.width = TW; cv.height = TH;
      return cv;
    };
    const far = mk(), mid = mk();
    const f = far.getContext('2d'), m = mid.getContext('2d');
    const rnd = Utils.seeded(Utils.hash(theme));
    this['_far_' + theme](f, TW, TH, rnd);
    this['_mid_' + theme](m, TW, TH, rnd);
    const out = { far, mid };
    this._bgCache[theme] = out;
    return out;
  },

  // 無縫起伏稜線（k 取整數保證左右接縫吻合）
  _ridge(c, TW, TH, baseY, amp, k, color, ph) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, TH);
    for (let x = 0; x <= TW; x += 8) {
      const a = (x / TW) * Math.PI * 2;
      const y = baseY - amp * (0.6 * Math.sin(k * a + ph) + 0.4 * Math.sin((k + 2) * a + ph * 2.3));
      c.lineTo(x, y);
    }
    c.lineTo(TW, TH);
    c.closePath();
    c.fill();
  },

  // 有機凹凸團塊（樹冠 / 灌木 / 苔蘚）
  _blob(c, cx, cy, rx, ry, lumps, ph) {
    c.beginPath();
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const wob = 1 + 0.13 * Math.sin(lumps * a + ph) + 0.07 * Math.sin((lumps + 3) * a + ph * 2.1);
      const px = cx + Math.cos(a) * rx * wob;
      const py = cy + Math.sin(a) * ry * wob;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  },

  // 一棵動漫風樹：彎曲樹幹 + 三層賽璐璐樹冠
  _tree(c, x, baseY, s, pal, ph) {
    // 樹幹（彎曲、基部外擴）
    c.fillStyle = pal.trunk;
    c.beginPath();
    c.moveTo(x - 7 * s, baseY);
    c.bezierCurveTo(x - 5 * s, baseY - 30 * s, x - 8 * s + Math.sin(ph) * 6 * s, baseY - 60 * s, x - 3 * s, baseY - 88 * s);
    c.lineTo(x + 3 * s, baseY - 88 * s);
    c.bezierCurveTo(x + 8 * s + Math.sin(ph) * 6 * s, baseY - 60 * s, x + 5 * s, baseY - 30 * s, x + 9 * s, baseY);
    c.closePath();
    c.fill();
    // 分枝
    c.strokeStyle = pal.trunk;
    c.lineWidth = 3.5 * s;
    c.beginPath();
    c.moveTo(x, baseY - 70 * s);
    c.quadraticCurveTo(x + 16 * s, baseY - 84 * s, x + 24 * s, baseY - 96 * s);
    c.stroke();
    // 樹冠：陰影層 → 主體 → 受光層
    const cy = baseY - 108 * s;
    c.fillStyle = pal.dark;
    this._blob(c, x + 4 * s, cy + 10 * s, 46 * s, 32 * s, 5, ph);
    c.fill();
    c.fillStyle = pal.mainCol;
    this._blob(c, x, cy, 46 * s, 33 * s, 6, ph + 2);
    c.fill();
    this._blob(c, x - 26 * s, cy + 14 * s, 24 * s, 17 * s, 5, ph + 4);
    c.fill();
    this._blob(c, x + 28 * s, cy + 12 * s, 22 * s, 16 * s, 5, ph + 1);
    c.fill();
    c.fillStyle = pal.lit;
    this._blob(c, x - 10 * s, cy - 10 * s, 26 * s, 16 * s, 5, ph + 3);
    c.fill();
    // 葉叢細點
    c.fillStyle = pal.dot;
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9 + ph;
      c.beginPath();
      c.arc(x + Math.cos(a) * 34 * s, cy + Math.sin(a) * 20 * s, 2.6 * s, 0, Math.PI * 2);
      c.fill();
    }
  },

  _bush(c, x, baseY, s, col, lit, ph) {
    c.fillStyle = col;
    this._blob(c, x, baseY - 9 * s, 16 * s, 10 * s, 5, ph);
    c.fill();
    c.fillStyle = lit;
    this._blob(c, x - 3 * s, baseY - 12 * s, 9 * s, 5 * s, 4, ph + 2);
    c.fill();
  },

  // ── 楓葉草原 ──
  _far_meadow(c, TW, TH, rnd) {
    this._ridge(c, TW, TH, 430, 38, 2, 'rgba(150,200,160,0.55)', 1.2);
    this._ridge(c, TW, TH, 472, 46, 3, 'rgba(110,178,120,0.75)', 3.8);
    // 稜線上的遠樹剪影
    c.fillStyle = 'rgba(88,150,100,0.7)';
    for (let i = 0; i < 9; i++) {
      const x = rnd() * TW;
      const y = 452 + rnd() * 24;
      for (const px of [x - TW, x, x + TW]) {
        this._blob(c, px, y - 14, 11, 12, 4, i);
        c.fill();
        c.fillRect(px - 1.5, y - 6, 3, 10);
      }
    }
  },

  _mid_meadow(c, TW, TH, rnd) {
    const greens = { trunk: '#6a4426', mainCol: '#5fae43', dark: '#3f8a33', lit: '#8fd45e', dot: '#a8e06c' };
    const maple = { trunk: '#5e3a22', mainCol: '#e07b35', dark: '#b8542a', lit: '#f2a64e', dot: '#ffc46a' };
    for (let i = 0; i < 4; i++) {
      const x = (i + 0.2 + rnd() * 0.6) * (TW / 4);
      const s = 0.8 + rnd() * 0.5;
      const pal = i % 2 === 0 ? maple : greens;
      for (const px of [x - TW, x, x + TW]) this._tree(c, px, 505, s, pal, i * 2.3 + 1);
    }
    for (let i = 0; i < 6; i++) {
      const x = rnd() * TW;
      for (const px of [x - TW, x, x + TW]) {
        this._bush(c, px, 508, 0.9 + rnd() * 0.7, '#4f9e3c', '#74c455', i * 1.7);
      }
    }
  },

  // ── 蘑菇森林 ──
  _far_forest(c, TW, TH, rnd) {
    // 頂部垂下的樹冠陰影
    c.fillStyle = 'rgba(24,52,30,0.85)';
    for (let i = 0; i < 7; i++) {
      const x = (i / 7) * TW + rnd() * 60;
      for (const px of [x - TW, x, x + TW]) {
        this._blob(c, px, -10, 90 + rnd() * 40, 56, 5, i * 1.3);
        c.fill();
      }
    }
    // 兩排針葉樹剪影
    for (const [baseY, col, n, sMin] of [[470, 'rgba(34,74,44,0.75)', 8, 0.7], [520, 'rgba(22,54,32,0.9)', 6, 1]]) {
      c.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const x = rnd() * TW;
        const s = sMin + rnd() * 0.5;
        for (const px of [x - TW, x, x + TW]) {
          for (let L = 0; L < 3; L++) {
            const ly = baseY - 36 * s - L * 30 * s;
            const lw = (56 - L * 14) * s;
            c.beginPath();
            c.moveTo(px - lw / 2, ly);
            c.quadraticCurveTo(px - lw * 0.1, ly - 6 * s, px, ly - 34 * s);
            c.quadraticCurveTo(px + lw * 0.1, ly - 6 * s, px + lw / 2, ly);
            c.closePath();
            c.fill();
          }
          c.fillRect(px - 3 * s, baseY - 40 * s, 6 * s, 42 * s);
        }
      }
    }
  },

  _mid_forest(c, TW, TH, rnd) {
    const pal = { trunk: '#54381f', mainCol: '#3f8f3a', dark: '#2c6e30', lit: '#67b350', dot: '#8fd86a' };
    for (let i = 0; i < 3; i++) {
      const x = (i + 0.3 + rnd() * 0.4) * (TW / 3);
      for (const px of [x - TW, x, x + TW]) this._tree(c, px, 530, 1.25 + rnd() * 0.4, pal, i * 3.1);
    }
    // 巨大紅蘑菇
    for (let i = 0; i < 2; i++) {
      const x = rnd() * TW;
      const s = 0.9 + rnd() * 0.5;
      for (const px of [x - TW, x, x + TW]) this._giantMushroom(c, px, 540, s, i);
    }
    // 垂藤
    c.strokeStyle = 'rgba(58,110,52,0.9)';
    for (let i = 0; i < 6; i++) {
      const x = rnd() * TW;
      const len = 70 + rnd() * 110;
      const sway = 14 + rnd() * 18;
      for (const px of [x - TW, x, x + TW]) {
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(px, 0);
        c.quadraticCurveTo(px + sway, len * 0.6, px - sway * 0.3, len);
        c.stroke();
        c.fillStyle = 'rgba(74,134,62,0.9)';
        for (let j = 1; j < 4; j++) {
          const ly = (len / 4) * j;
          const lx = px + sway * 0.5 * Math.sin(j * 1.8);
          c.beginPath();
          c.ellipse(lx + 5, ly, 6, 2.6, 0.6, 0, Math.PI * 2);
          c.fill();
          c.beginPath();
          c.ellipse(lx - 5, ly + 6, 6, 2.6, -0.6, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
  },

  _giantMushroom(c, x, baseY, s, ph) {
    c.fillStyle = '#d8c8a8';
    c.beginPath();
    c.moveTo(x - 9 * s, baseY);
    c.bezierCurveTo(x - 7 * s, baseY - 40 * s, x - 6 * s, baseY - 70 * s, x - 8 * s, baseY - 86 * s);
    c.lineTo(x + 8 * s, baseY - 86 * s);
    c.bezierCurveTo(x + 6 * s, baseY - 70 * s, x + 7 * s, baseY - 40 * s, x + 9 * s, baseY);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.fillRect(x - 8 * s, baseY - 86 * s, 16 * s, 7 * s);
    c.fillStyle = '#c84838';
    c.beginPath();
    c.moveTo(x - 46 * s, baseY - 84 * s);
    c.bezierCurveTo(x - 40 * s, baseY - 128 * s, x + 40 * s, baseY - 128 * s, x + 46 * s, baseY - 84 * s);
    c.bezierCurveTo(x + 30 * s, baseY - 92 * s, x - 30 * s, baseY - 92 * s, x - 46 * s, baseY - 84 * s);
    c.closePath();
    c.fill();
    c.fillStyle = '#e8685a';
    c.beginPath();
    c.moveTo(x - 38 * s, baseY - 96 * s);
    c.bezierCurveTo(x - 28 * s, baseY - 124 * s, x + 22 * s, baseY - 126 * s, x + 38 * s, baseY - 100 * s);
    c.bezierCurveTo(x + 20 * s, baseY - 108 * s, x - 24 * s, baseY - 110 * s, x - 38 * s, baseY - 96 * s);
    c.closePath();
    c.fill();
    c.fillStyle = '#f7e8d0';
    for (const [ox, oy, r] of [[-22, -106, 7], [6, -114, 9], [28, -100, 6]]) {
      c.beginPath();
      c.ellipse(x + ox * s, baseY + oy * s, r * s, r * 0.75 * s, 0.2, 0, Math.PI * 2);
      c.fill();
    }
  },

  // ── 水晶洞窟 ──
  _far_cave(c, TW, TH, rnd) {
    c.fillStyle = 'rgba(26,18,52,0.9)';
    for (let i = 0; i < 10; i++) {
      const x = rnd() * TW;
      const w = 36 + rnd() * 60;
      const h = 90 + rnd() * 150;
      for (const px of [x - TW, x, x + TW]) {
        // 鐘乳石（上）與石筍（下）
        c.beginPath();
        c.moveTo(px - w / 2, 0);
        c.quadraticCurveTo(px - w * 0.1, h * 0.5, px, h);
        c.quadraticCurveTo(px + w * 0.1, h * 0.5, px + w / 2, 0);
        c.closePath();
        c.fill();
        c.beginPath();
        c.moveTo(px - w / 2 - 14, TH);
        c.quadraticCurveTo(px - w * 0.1, TH - h * 0.45, px + 6, TH - h * 0.9);
        c.quadraticCurveTo(px + w * 0.12, TH - h * 0.4, px + w / 2 + 14, TH);
        c.closePath();
        c.fill();
      }
    }
  },

  _mid_cave(c, TW, TH, rnd) {
    for (let i = 0; i < 5; i++) {
      const x = rnd() * TW;
      const col = i % 2 === 0 ? '#6fe3ff' : '#f29bff';
      const s = 0.8 + rnd() * 0.9;
      for (const px of [x - TW, x, x + TW]) this._crystalCluster(c, px, 548, s, col, i);
    }
    // 岩柱
    c.fillStyle = 'rgba(46,36,82,0.95)';
    for (let i = 0; i < 2; i++) {
      const x = rnd() * TW;
      for (const px of [x - TW, x, x + TW]) {
        c.beginPath();
        c.moveTo(px - 26, TH);
        c.bezierCurveTo(px - 18, TH - 200, px - 30, TH - 320, px - 12, TH - 480);
        c.lineTo(px + 12, TH - 480);
        c.bezierCurveTo(px + 30, TH - 320, px + 18, TH - 200, px + 26, TH);
        c.closePath();
        c.fill();
      }
    }
  },

  _crystalCluster(c, x, baseY, s, col, ph) {
    // 光暈
    c.save();
    c.globalAlpha = 0.22;
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, baseY - 26 * s, 54 * s, 0, Math.PI * 2);
    c.fill();
    c.restore();
    const shards = [[0, 56, 13, 0], [-16, 38, 10, -0.3], [15, 42, 10, 0.32], [-26, 24, 7, -0.5], [26, 26, 7, 0.5]];
    for (const [ox, h, w, rot] of shards) {
      c.save();
      c.translate(x + ox * s, baseY);
      c.rotate(rot);
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-w * s * 0.5, 0);
      c.lineTo(-w * s * 0.35, -h * s * 0.75);
      c.lineTo(0, -h * s);
      c.lineTo(w * s * 0.35, -h * s * 0.75);
      c.lineTo(w * s * 0.5, 0);
      c.closePath();
      c.fill();
      // 晶面高光
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.beginPath();
      c.moveTo(-w * s * 0.18, 0);
      c.lineTo(-w * s * 0.1, -h * s * 0.7);
      c.lineTo(0, -h * s);
      c.lineTo(0, 0);
      c.closePath();
      c.fill();
      c.restore();
    }
  },

  // ── 王者祭壇 ──
  _far_altar(c, TW, TH, rnd) {
    // 廢墟城牆剪影
    c.fillStyle = 'rgba(30,10,18,0.92)';
    const wallY = 400;
    c.fillRect(0, wallY, TW, TH - wallY);
    for (let x = 0; x < TW; x += 46) {
      if ((x / 46) % 5 !== 3) c.fillRect(x, wallY - 16, 30, 16); // 缺口城齒
    }
    // 雙塔
    for (const tx of [TW * 0.22, TW * 0.74]) {
      c.fillRect(tx - 34, wallY - 170, 68, 170);
      c.beginPath();
      c.moveTo(tx - 44, wallY - 170);
      c.lineTo(tx, wallY - 236);
      c.lineTo(tx + 44, wallY - 170);
      c.closePath();
      c.fill();
      // 發光窗
      c.fillStyle = 'rgba(255,150,80,0.8)';
      c.beginPath();
      c.moveTo(tx - 7, wallY - 120);
      c.lineTo(tx, wallY - 134);
      c.lineTo(tx + 7, wallY - 120);
      c.lineTo(tx + 7, wallY - 100);
      c.lineTo(tx - 7, wallY - 100);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(30,10,18,0.92)';
    }
  },

  _mid_altar(c, TW, TH, rnd) {
    for (let i = 0; i < 3; i++) {
      const x = (i + 0.3 + rnd() * 0.4) * (TW / 3);
      const broken = i === 1;
      for (const px of [x - TW, x, x + TW]) this._pillar(c, px, 556, broken, i % 2 === 0);
    }
  },

  _pillar(c, x, baseY, broken, torch) {
    const h = broken ? 280 : 420;
    // 柱身
    const g = c.createLinearGradient(x - 26, 0, x + 26, 0);
    g.addColorStop(0, '#2c1820');
    g.addColorStop(0.5, '#4a2c36');
    g.addColorStop(1, '#241218');
    c.fillStyle = g;
    c.fillRect(x - 24, baseY - h, 48, h);
    // 凹槽線
    c.strokeStyle = 'rgba(0,0,0,0.4)';
    c.lineWidth = 2;
    for (const ox of [-12, 0, 12]) {
      c.beginPath();
      c.moveTo(x + ox, baseY - h + 18);
      c.lineTo(x + ox, baseY - 14);
      c.stroke();
    }
    // 柱頭 / 柱基（金邊）
    c.fillStyle = '#3a2430';
    c.fillRect(x - 32, baseY - h - 16, 64, 18);
    c.fillRect(x - 32, baseY - 14, 64, 14);
    c.fillStyle = '#c9a24b';
    c.fillRect(x - 32, baseY - h - 2, 64, 3);
    c.fillRect(x - 32, baseY - 16, 64, 3);
    if (broken) {
      // 斷裂頂部
      c.fillStyle = '#2c1820';
      c.beginPath();
      c.moveTo(x - 24, baseY - h);
      c.lineTo(x - 10, baseY - h - 22);
      c.lineTo(x + 4, baseY - h - 6);
      c.lineTo(x + 14, baseY - h - 16);
      c.lineTo(x + 24, baseY - h);
      c.closePath();
      c.fill();
    }
    if (torch) {
      // 火炬（火光由動態粒子補強）
      c.fillStyle = '#5a4030';
      c.fillRect(x + 24, baseY - h + 60, 6, 26);
      c.fillStyle = '#2c1c14';
      c.beginPath();
      c.arc(x + 27, baseY - h + 58, 7, 0, Math.PI * 2);
      c.fill();
      const fg = c.createRadialGradient(x + 27, baseY - h + 44, 2, x + 27, baseY - h + 44, 30);
      fg.addColorStop(0, 'rgba(255,210,110,0.95)');
      fg.addColorStop(0.4, 'rgba(255,130,50,0.55)');
      fg.addColorStop(1, 'rgba(255,90,40,0)');
      c.fillStyle = fg;
      c.fillRect(x - 6, baseY - h + 10, 66, 70);
      c.fillStyle = '#ffd86a';
      c.beginPath();
      c.moveTo(x + 27, baseY - h + 30);
      c.bezierCurveTo(x + 35, baseY - h + 44, x + 33, baseY - h + 54, x + 27, baseY - h + 56);
      c.bezierCurveTo(x + 21, baseY - h + 54, x + 19, baseY - h + 44, x + 27, baseY - h + 30);
      c.closePath();
      c.fill();
    }
  },

  // ══════════════════ 大氣（光束 / 薄霧 / 粒子）══════════════════

  _lightShafts(ctx, t) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const bx = 180 + i * 330;
      ctx.save();
      ctx.translate(bx, 0);
      ctx.rotate(0.32 + Math.sin(t * 0.3 + i * 2) * 0.025);
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.9);
      g.addColorStop(0, `rgba(255,250,200,${0.10 + Math.sin(t * 0.6 + i) * 0.03})`);
      g.addColorStop(1, 'rgba(255,250,200,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(58, 0);
      ctx.lineTo(150, H * 0.9);
      ctx.lineTo(30, H * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },

  _mist(ctx, theme, t) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    const col = theme === 'cave' ? '120,130,220' : theme === 'altar' ? '255,90,60' : '255,255,255';
    for (let i = 0; i < 2; i++) {
      const y = H - 130 - i * 60;
      const drift = Math.sin(t * 0.18 + i * 2.4) * 60;
      const g = ctx.createLinearGradient(0, y, 0, y + 70);
      g.addColorStop(0, `rgba(${col},0)`);
      g.addColorStop(0.5, `rgba(${col},${0.07 - i * 0.02})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(drift - 80, y, W + 160, 70);
    }
  },

  _particles(ctx, theme, cam, t, front) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    const mod = (v, m) => ((v % m) + m) % m;
    const n = front ? 5 : 9;
    const par = front ? 0.9 : 0.35;
    const sc = front ? 1.6 : 1;
    ctx.save();
    if (front) ctx.globalAlpha = 0.6;

    if (theme === 'meadow' || theme === 'forest') {
      // 飄落的楓葉 / 螢光孢子
      for (let i = 0; i < n; i++) {
        const x = mod(i * 331 + t * (16 + (i % 3) * 7) - cam.x * par, W + 100) - 50;
        const y = mod(i * 197 + t * (22 + (i % 4) * 6), H + 80) - 40;
        if (theme === 'meadow') {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(t * 1.6 + i * 2);
          ctx.fillStyle = ['#e07b35', '#c84838', '#e8a64e'][i % 3];
          Art.leaf(ctx, 5 * sc);
          ctx.fill();
          ctx.restore();
        } else {
          const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.4 + i * 1.3));
          const g = ctx.createRadialGradient(x, y, 0, x, y, 7 * sc);
          g.addColorStop(0, `rgba(214,255,140,${0.85 * pulse})`);
          g.addColorStop(1, 'rgba(214,255,140,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x - 8 * sc, y - 8 * sc, 16 * sc, 16 * sc);
        }
      }
    } else if (theme === 'cave') {
      for (let i = 0; i < n; i++) {
        const x = mod(i * 277 + Math.sin(t * 0.5 + i) * 40 - cam.x * par, W + 80) - 40;
        const y = mod(i * 151 - t * (10 + (i % 3) * 5), H + 60) - 30;
        const col = i % 2 === 0 ? '140,235,255' : '235,160,255';
        const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.8 + i * 2.1));
        const g = ctx.createRadialGradient(x, y, 0, x, y, 6 * sc);
        g.addColorStop(0, `rgba(${col},${0.9 * pulse})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - 7 * sc, y - 7 * sc, 14 * sc, 14 * sc);
      }
    } else if (theme === 'altar') {
      // 上升餘燼
      for (let i = 0; i < n; i++) {
        const x = mod(i * 311 + Math.sin(t * 0.8 + i * 2) * 30 - cam.x * par, W + 60) - 30;
        const y = H - mod(i * 131 + t * (34 + (i % 4) * 10), H + 100) + 50;
        const flick = 0.5 + 0.5 * Math.sin(t * 6 + i * 3);
        ctx.fillStyle = `rgba(255,${140 + flick * 60},60,${0.5 + flick * 0.4})`;
        ctx.beginPath();
        ctx.arc(x, y, (1.6 + (i % 3)) * sc * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  },

  // ══════════════════ 地形（離屏快取）══════════════════

  _world(map) {
    const key = map.name;
    if (this._mapCache[key]) return this._mapCache[key];
    const cv = document.createElement('canvas');
    cv.width = map.w;
    cv.height = map.h;
    const c = cv.getContext('2d');
    const rnd = Utils.seeded(Utils.hash(key));
    for (const r of map.ropes) this._rope(c, r, map.theme, rnd);
    for (const pl of map.platforms) this._platform(c, pl, map, rnd);
    this._mapCache[key] = cv;
    return cv;
  },

  _platform(c, pl, map, rnd) {
    const th = THEMES[map.theme];
    const x1 = pl.x1, x2 = pl.x2, y = pl.y, w = x2 - x1;

    if (pl.ground) {
      // ── 主地面：土壤漸層 + 地層 + 碎石 ──
      const g = c.createLinearGradient(0, y, 0, map.h);
      g.addColorStop(0, th.soil.top);
      g.addColorStop(1, th.soil.bottom);
      c.fillStyle = g;
      c.fillRect(x1, y, w, map.h - y);
      // 地層波紋
      c.strokeStyle = 'rgba(0,0,0,0.16)';
      c.lineWidth = 2;
      for (let L = 0; L < 2; L++) {
        const ly = y + 36 + L * 42;
        if (ly > map.h - 8) break;
        c.beginPath();
        for (let x = x1; x <= x2; x += 26) {
          const yy = ly + Math.sin(x * 0.04 + L * 3) * 4;
          x === x1 ? c.moveTo(x, yy) : c.lineTo(x, yy);
        }
        c.stroke();
      }
      // 埋藏的碎石
      for (let x = x1 + 20; x < x2 - 20; x += 90 + rnd() * 120) {
        this._stone(c, x, y + 26 + rnd() * (Math.min(90, map.h - y - 40)), 5 + rnd() * 7, th.soil.stone);
      }
    } else {
      // ── 浮空平台：底部垂墜的有機土塊 / 石板 ──
      c.fillStyle = th.soil.bottom;
      c.beginPath();
      c.moveTo(x1 + 3, y + 2);
      const lumpN = Math.max(3, Math.round(w / 70));
      for (let i = 0; i <= lumpN; i++) {
        const px = x1 + (w / lumpN) * i;
        const depth = 18 + Math.sin(i * 2.7 + x1) * 5 + rnd() * 6;
        if (i === 0) c.lineTo(x1 + 2, y + depth);
        else c.quadraticCurveTo(px - w / lumpN / 2, y + depth + 9, px, y + (i === lumpN ? 2 : depth));
      }
      c.lineTo(x2 - 3, y + 2);
      c.closePath();
      c.fill();
      // 上層較亮土
      const g2 = c.createLinearGradient(0, y, 0, y + 18);
      g2.addColorStop(0, th.soil.top);
      g2.addColorStop(1, th.soil.bottom);
      c.fillStyle = g2;
      Utils.rr(c, x1 + 1, y + 1, w - 2, 13, 5);
      c.fill();
      // 垂根 / 苔蘚滴
      for (let x = x1 + 14; x < x2 - 14; x += 60 + rnd() * 70) {
        if (map.theme === 'cave') continue;
        c.strokeStyle = map.theme === 'forest' ? '#2f6e2c' : '#54381f';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x, y + 16);
        c.quadraticCurveTo(x + 4, y + 24, x - 2, y + 30 + rnd() * 8);
        c.stroke();
      }
    }

    // ── 各主題的頂面 ──
    if (map.theme === 'altar') this._topAltar(c, x1, x2, y, w, rnd);
    else if (map.theme === 'cave') this._topCave(c, x1, x2, y, w, th, rnd);
    else this._topGrass(c, x1, x2, y, map.theme, th, rnd);
  },

  _topGrass(c, x1, x2, y, theme, th, rnd) {
    const G = th.grass;
    // 垂墜草簷（圓齒波浪）
    c.fillStyle = G.fringe;
    c.beginPath();
    c.moveTo(x1, y + 3);
    let x = x1;
    while (x < x2) {
      const step = 11 + rnd() * 9;
      const dip = 8 + rnd() * 6;
      c.quadraticCurveTo(x + step / 2, y + dip + 4, Math.min(x + step, x2), y + 3 + rnd() * 3);
      x += step;
    }
    c.lineTo(x2, y - 4);
    c.lineTo(x1, y - 4);
    c.closePath();
    c.fill();
    // 草皮主帶
    const g = c.createLinearGradient(0, y - 4, 0, y + 8);
    g.addColorStop(0, G.light);
    g.addColorStop(0.5, G.base);
    g.addColorStop(1, G.deep);
    c.fillStyle = g;
    Utils.rr(c, x1, y - 4, x2 - x1, 10, 4);
    c.fill();
    // 頂部受光線
    c.strokeStyle = 'rgba(255,255,240,0.5)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x1 + 4, y - 3);
    c.lineTo(x2 - 4, y - 3);
    c.stroke();
    // 直立草叢與裝飾
    for (let gx = x1 + 10; gx < x2 - 10; gx += 24 + rnd() * 22) {
      if (rnd() < 0.62) this._tuft(c, gx, y - 3, G, rnd);
      const roll = rnd();
      if (roll < 0.13) this._flower(c, gx + 8, y - 4, rnd);
      else if (roll < 0.2 && theme === 'forest') this._miniShroom(c, gx + 6, y - 3, rnd);
      else if (roll < 0.24) this._stone(c, gx + 7, y - 1, 3.5 + rnd() * 2.5, th.soil.stone);
    }
  },

  _topCave(c, x1, x2, y, w, th, rnd) {
    // 石板頂面
    const g = c.createLinearGradient(0, y - 4, 0, y + 9);
    g.addColorStop(0, '#a8a8cc');
    g.addColorStop(1, '#6a6a8c');
    c.fillStyle = g;
    Utils.rr(c, x1, y - 4, w, 12, 4);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x1 + 4, y - 3);
    c.lineTo(x2 - 4, y - 3);
    c.stroke();
    // 裂縫
    c.strokeStyle = 'rgba(20,20,40,0.5)';
    c.lineWidth = 1.5;
    for (let x = x1 + 24; x < x2 - 20; x += 70 + rnd() * 80) {
      c.beginPath();
      c.moveTo(x, y - 2);
      c.lineTo(x + 5 + rnd() * 5, y + 3);
      c.lineTo(x + 2, y + 7);
      c.stroke();
    }
    // 發光水晶簇
    for (let x = x1 + 26; x < x2 - 26; x += 110 + rnd() * 130) {
      const col = rnd() < 0.5 ? '#6fe3ff' : '#f29bff';
      this._crystalCluster(c, x, y - 2, 0.24 + rnd() * 0.14, col, x);
    }
  },

  _topAltar(c, x1, x2, y, w, rnd) {
    // 拋光黑石 + 金邊 + 符文
    const g = c.createLinearGradient(0, y - 4, 0, y + 10);
    g.addColorStop(0, '#5a4350');
    g.addColorStop(1, '#332430');
    c.fillStyle = g;
    Utils.rr(c, x1, y - 4, w, 13, 3);
    c.fill();
    c.fillStyle = '#d8b25e';
    c.fillRect(x1, y - 5, w, 2.4);
    c.fillRect(x1, y + 7, w, 1.6);
    // 石磚縫
    c.strokeStyle = 'rgba(0,0,0,0.45)';
    c.lineWidth = 1.5;
    for (let x = x1 + 56; x < x2 - 10; x += 56) {
      c.beginPath();
      c.moveTo(x, y - 3);
      c.lineTo(x, y + 7);
      c.stroke();
    }
    // 發光符文
    c.save();
    c.shadowColor = '#ff7a4a';
    c.shadowBlur = 6;
    c.strokeStyle = 'rgba(255,140,90,0.85)';
    c.lineWidth = 1.8;
    for (let x = x1 + 30; x < x2 - 24; x += 130 + rnd() * 90) {
      const v = Math.floor(rnd() * 3);
      c.beginPath();
      if (v === 0) {
        c.moveTo(x - 4, y + 4); c.lineTo(x, y - 1); c.lineTo(x + 4, y + 4); c.moveTo(x - 2, y + 2); c.lineTo(x + 2, y + 2);
      } else if (v === 1) {
        c.arc(x, y + 1.5, 3.4, 0, Math.PI * 2); c.moveTo(x, y - 2); c.lineTo(x, y + 5);
      } else {
        c.moveTo(x - 4, y - 1); c.lineTo(x + 4, y - 1); c.moveTo(x, y - 1); c.lineTo(x, y + 5); c.moveTo(x - 3, y + 5); c.lineTo(x + 3, y + 5);
      }
      c.stroke();
    }
    c.restore();
  },

  // ── 小裝飾 ──

  _tuft(c, x, y, G, rnd) {
    const n = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const ox = (i - n / 2) * 3.2;
      const h = 7 + rnd() * 7;
      const lean = (rnd() - 0.5) * 6;
      c.fillStyle = i % 2 === 0 ? G.base : G.light;
      c.beginPath();
      c.moveTo(x + ox - 1.6, y);
      c.quadraticCurveTo(x + ox - 1 + lean * 0.4, y - h * 0.6, x + ox + lean, y - h);
      c.quadraticCurveTo(x + ox + 1 + lean * 0.4, y - h * 0.5, x + ox + 1.6, y);
      c.closePath();
      c.fill();
    }
  },

  _flower(c, x, y, rnd) {
    const pal = [['#ffffff', '#ffd54f'], ['#ff9eb8', '#fff3f6'], ['#ffd54f', '#ff8a4a'], ['#b8a0ff', '#fff']][Math.floor(rnd() * 4)];
    const h = 8 + rnd() * 5;
    c.strokeStyle = '#3f9434';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + 2, y - h * 0.6, x, y - h);
    c.stroke();
    // 小葉
    c.fillStyle = '#54ae3f';
    c.beginPath();
    c.ellipse(x + 3, y - h * 0.45, 3.2, 1.4, 0.5, 0, Math.PI * 2);
    c.fill();
    // 五瓣花
    c.fillStyle = pal[0];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      c.beginPath();
      c.ellipse(x + Math.cos(a) * 3, y - h + Math.sin(a) * 3, 2.4, 1.7, a, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = pal[1];
    c.beginPath();
    c.arc(x, y - h, 1.7, 0, Math.PI * 2);
    c.fill();
  },

  _miniShroom(c, x, y, rnd) {
    const s = 0.8 + rnd() * 0.6;
    c.fillStyle = '#f2e3c8';
    Utils.rr(c, x - 2 * s, y - 6 * s, 4 * s, 6 * s, 1.6);
    c.fill();
    c.fillStyle = rnd() < 0.5 ? '#e85d4a' : '#e8a04a';
    c.beginPath();
    c.moveTo(x - 6 * s, y - 5 * s);
    c.quadraticCurveTo(x, y - 13 * s, x + 6 * s, y - 5 * s);
    c.quadraticCurveTo(x, y - 7.4 * s, x - 6 * s, y - 5 * s);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,250,235,0.9)';
    c.beginPath();
    c.arc(x - 1.5 * s, y - 8.6 * s, 1.1 * s, 0, Math.PI * 2);
    c.fill();
  },

  _stone(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x - s, y);
    c.lineTo(x - s * 0.65, y - s * 0.8);
    c.lineTo(x + s * 0.3, y - s);
    c.lineTo(x + s, y - s * 0.3);
    c.lineTo(x + s * 0.8, y);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.22)';
    c.beginPath();
    c.moveTo(x - s * 0.55, y - s * 0.72);
    c.lineTo(x + s * 0.22, y - s * 0.9);
    c.lineTo(x + s * 0.05, y - s * 0.45);
    c.closePath();
    c.fill();
  },

  _rope(c, r, theme, rnd) {
    // 麻花繩：主索 + 交錯紋 + 繩結
    c.strokeStyle = '#6e4426';
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(r.x, r.y1);
    c.lineTo(r.x, r.y2);
    c.stroke();
    c.strokeStyle = '#a0743f';
    c.lineWidth = 2;
    for (let y = r.y1 + 3; y < r.y2 - 3; y += 7) {
      c.beginPath();
      c.moveTo(r.x - 2.4, y);
      c.quadraticCurveTo(r.x, y + 3.5, r.x + 2.4, y + 7);
      c.stroke();
    }
    for (let y = r.y1 + 16; y < r.y2 - 8; y += 46) {
      c.fillStyle = '#54331a';
      c.beginPath();
      c.ellipse(r.x, y, 4.6, 3.2, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255,220,170,0.35)';
      c.beginPath();
      c.ellipse(r.x - 1, y - 1, 1.8, 1.1, 0.5, 0, Math.PI * 2);
      c.fill();
    }
    // 森林：藤蔓葉
    if (theme === 'forest') {
      c.fillStyle = '#4a9e3c';
      for (let y = r.y1 + 26; y < r.y2 - 12; y += 38 + rnd() * 20) {
        const side = rnd() < 0.5 ? -1 : 1;
        c.beginPath();
        c.ellipse(r.x + side * 6, y, 6.5, 2.8, side * 0.55, 0, Math.PI * 2);
        c.fill();
      }
    }
  },
};
