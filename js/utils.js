const Utils = {
  clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },
  lerp(a, b, t) { return a + (b - a) * t; },
  rand(a, b) { return a + Math.random() * (b - a); },
  randInt(a, b) { return Math.floor(this.rand(a, b + 1)); },
  chance(p) { return Math.random() < p; },

  rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  },

  dist(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // 千分位數字
  fmt(n) { return Math.floor(n).toLocaleString('en-US'); },

  // 圓角矩形路徑（含舊瀏覽器後備）
  rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  // 字串雜湊（地圖裝飾的固定亂數種子用）
  hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  },

  // 可重現的偽亂數產生器
  seeded(seed) {
    let s = (seed || 1) >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  },
};

// 共用的小型藝術路徑（楓葉、星星…），各渲染模組共享
const Art = {
  // 楓葉：五裂片 + 葉柄，原點 = 葉心，s = 半徑。畫完路徑由呼叫端 fill
  leaf(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);                          // 中央主裂片尖
    ctx.lineTo(s * 0.18, -s * 0.45);
    ctx.lineTo(s * 0.5, -s * 0.62);             // 右上裂片
    ctx.lineTo(s * 0.42, -s * 0.18);
    ctx.lineTo(s * 0.9, -s * 0.1);              // 右側裂片
    ctx.lineTo(s * 0.55, s * 0.18);
    ctx.lineTo(s * 0.65, s * 0.55);             // 右下裂片
    ctx.lineTo(s * 0.2, s * 0.42);
    ctx.lineTo(s * 0.1, s * 0.95);              // 葉柄
    ctx.lineTo(-s * 0.1, s * 0.95);
    ctx.lineTo(-s * 0.2, s * 0.42);
    ctx.lineTo(-s * 0.65, s * 0.55);            // 左下裂片
    ctx.lineTo(-s * 0.55, s * 0.18);
    ctx.lineTo(-s * 0.9, -s * 0.1);             // 左側裂片
    ctx.lineTo(-s * 0.42, -s * 0.18);
    ctx.lineTo(-s * 0.5, -s * 0.62);            // 左上裂片
    ctx.lineTo(-s * 0.18, -s * 0.45);
    ctx.closePath();
  },

  // 五角星
  star(ctx, s) {
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? s : s * 0.45;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  },

  // 四芒閃光（細長十字星）
  sparkle(ctx, s) {
    ctx.beginPath();
    const w = s * 0.22;
    ctx.moveTo(0, -s); ctx.lineTo(w, -w); ctx.lineTo(s, 0); ctx.lineTo(w, w);
    ctx.lineTo(0, s); ctx.lineTo(-w, w); ctx.lineTo(-s, 0); ctx.lineTo(-w, -w);
    ctx.closePath();
  },

  // 愛心
  heart(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.9);
    ctx.bezierCurveTo(-s * 1.2, 0, -s * 0.7, -s * 0.9, 0, -s * 0.25);
    ctx.bezierCurveTo(s * 0.7, -s * 0.9, s * 1.2, 0, 0, s * 0.9);
    ctx.closePath();
  },

  // 水滴
  drop(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.75, -s * 0.1, s * 0.7, s * 0.55, 0, s * 0.75);
    ctx.bezierCurveTo(-s * 0.7, s * 0.55, -s * 0.75, -s * 0.1, 0, -s);
    ctx.closePath();
  },

  // 皇冠
  crown(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.55);
    ctx.lineTo(-s, -s * 0.25);
    ctx.lineTo(-s * 0.5, s * 0.05);
    ctx.lineTo(0, -s * 0.6);
    ctx.lineTo(s * 0.5, s * 0.05);
    ctx.lineTo(s, -s * 0.25);
    ctx.lineTo(s, s * 0.55);
    ctx.closePath();
  },
};
