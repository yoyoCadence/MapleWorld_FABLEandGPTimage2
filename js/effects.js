// 戰鬥與環境特效：發光斬擊、星形火花、升級光柱、消散粒子、公告緞帶
const Effects = {
  nums: [],     // 飄浮數字（世界座標）
  fx: [],       // 視覺特效（世界座標）
  banners: [],  // 公告（螢幕座標）
  _imageCache: {},

  reset() { this.nums = []; this.fx = []; },

  spawnDamage(x, y, val, color, big) {
    if (this.nums.length > 120) this.nums.shift();
    this.nums.push({
      x: x + Utils.rand(-12, 12), y, str: String(val),
      color: color || '#ffb300', big: !!big, t: 0, life: 0.95,
    });
  },

  spawnText(x, y, str, color) {
    if (this.nums.length > 120) this.nums.shift();
    this.nums.push({ x, y, str, color: color || '#fff', big: false, t: 0, life: 1.1 });
  },

  slash(x, y, dir, size) {
    this.fx.push({ type: 'slash', x, y, dir, size: size || 1, t: 0, life: 0.2 });
  },
  spark(x, y, color) {
    this.fx.push({ type: 'spark', x, y, color: color || '#ffe082', t: 0, life: 0.28 });
  },
  spin(x, y, r) {
    this.fx.push({ type: 'spin', x, y, r, t: 0, life: 0.38 });
  },
  ring(x, y, color) {
    this.fx.push({ type: 'ring', x, y, color: color || '#ffd54f', t: 0, life: 0.9 });
  },
  healFx(x, y) {
    this.fx.push({ type: 'heal', x, y, t: 0, life: 0.75 });
  },
  poof(x, y, color) {
    this.fx.push({ type: 'poof', x, y, color: color || '#ccc', t: 0, life: 0.5 });
  },

  announce(text, color) {
    this.banners.push({ text, color: color || '#ffe082', t: 0, life: 2.4 });
    if (this.banners.length > 3) this.banners.shift();
  },

  _loadImage(path) {
    if (typeof Image === 'undefined') return null;
    if (!this._imageCache[path]) {
      const img = new Image();
      img.decoding = 'async';
      img.src = path;
      this._imageCache[path] = img;
    }
    return this._imageCache[path];
  },

  _readyImage(img) {
    return img && img.complete && img.naturalWidth > 0;
  },

  update(dt) {
    for (const n of this.nums) n.t += dt;
    this.nums = this.nums.filter((n) => n.t < n.life);
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < f.life);
    for (const b of this.banners) b.t += dt;
    this.banners = this.banners.filter((b) => b.t < b.life);
  },

  // ── 世界座標層（在 camera transform 內呼叫）──
  drawWorld(ctx) {
    for (const f of this.fx) {
      const p = f.t / f.life;
      ctx.save();
      ctx.translate(f.x, f.y);

      if (f.type === 'slash') {
        const sheet = this._loadImage('assets/sprites/fx/slash/sheet-transparent.png');
        if (this._readyImage(sheet)) {
          ctx.scale(f.dir, 1);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = p < 0.82 ? 0.95 : (1 - p) / 0.18;
          const frame = Math.min(3, Math.floor(p * 4));
          const sw = sheet.naturalWidth / 4;
          const sh = sheet.naturalHeight;
          const size = 112 * f.size;
          ctx.rotate(-0.2 + p * 0.35);
          ctx.drawImage(sheet, frame * sw, 0, sw, sh, -size * 0.54, -size * 0.55, size, size);
        } else {
          // 動漫新月斬光：外光暈 + 白色月牙核心 + 速度線
          ctx.scale(f.dir, 1);
          ctx.rotate(-0.5 + p * 1.15);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 1 - p;
          const R = 42 * f.size;
          ctx.strokeStyle = 'rgba(110,195,255,0.6)';
          ctx.lineWidth = 11 * f.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, R * 0.9, -0.95, 0.58);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, R, -1.05, 0.65);
          ctx.arc(0, 0, R * 0.6, 0.65, -1.05, true);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 1.6;
          for (const rr of [R * 1.14, R * 1.26]) {
            ctx.beginPath();
            ctx.arc(0, 0, rr, -0.6 + p * 0.4, -0.2 + p * 0.4);
            ctx.stroke();
          }
        }
      } else if (f.type === 'spark') {
        // 星形火花：中心閃光 + 放射光芒 + 飛散光點
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1 - p;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 5.5 * (1 - p) + 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = f.color;
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + 0.4 + p * 0.5;
          ctx.lineWidth = 3.2 * (1 - p) + 0.6;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (5 + p * 12), Math.sin(a) * (5 + p * 12));
          ctx.lineTo(Math.cos(a) * (13 + p * 22), Math.sin(a) * (13 + p * 22));
          ctx.stroke();
        }
        ctx.fillStyle = f.color;
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 - 0.3 - p * 0.8;
          const r = 9 + p * 24;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.8 * (1 - p), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (f.type === 'spin') {
        // 迴旋斬：三重旋轉月牙 + 內圈光暈
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - p) * 0.95;
        const R = f.r * (0.45 + p * 0.62);
        for (let k = 0; k < 3; k++) {
          const a = p * 9 + k * 2.09;
          ctx.strokeStyle = k === 1 ? 'rgba(255,255,255,0.9)' : 'rgba(130,220,255,0.8)';
          ctx.lineWidth = 6 - k * 1.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, R - k * 4, a, a + 1.9);
          ctx.stroke();
        }
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, R * 0.6);
        g.addColorStop(0, 'rgba(180,235,255,0.5)');
        g.addColorStop(1, 'rgba(180,235,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'ring') {
        // 升級：金色光柱 + 擴散光環 + 上升星星
        ctx.globalCompositeOperation = 'lighter';
        const fade = 1 - p;
        const pg = ctx.createLinearGradient(0, -130, 0, 6);
        pg.addColorStop(0, 'rgba(255,225,140,0)');
        pg.addColorStop(0.55, `rgba(255,225,140,${0.5 * fade})`);
        pg.addColorStop(1, `rgba(255,240,190,${0.75 * fade})`);
        ctx.fillStyle = pg;
        ctx.fillRect(-26, -132, 52, 134);
        ctx.fillRect(-11, -132, 22, 134);
        ctx.strokeStyle = `rgba(255,215,110,${fade})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18 + p * 64, 7 + p * 24, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10 + p * 40, 4 + p * 15, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,235,160,${fade})`;
        for (let i = 0; i < 5; i++) {
          ctx.save();
          ctx.translate(Math.sin(i * 2.4 + p * 5) * 24, -p * 95 - i * 9);
          ctx.rotate(p * 4 + i);
          Art.star(ctx, 4.2 - i * 0.4);
          ctx.fill();
          ctx.restore();
        }
      } else if (f.type === 'heal') {
        // 治癒：上升的綠十字 + 柔光環
        ctx.globalAlpha = 1 - p;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(140,245,180,0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, -6, 16 + p * 22, 6 + p * 9, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#7df0a8';
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const px = Math.cos(i * 1.05 + 0.4) * 20;
          const py = -p * 58 + Math.sin(i * 1.9) * 9;
          const cs = 4.2 - (i % 3);
          Utils.rr(ctx, px - 1.6, py - cs, 3.2, cs * 2, 1.6);
          ctx.fill();
          Utils.rr(ctx, px - cs, py - 1.6, cs * 2, 3.2, 1.6);
          ctx.fill();
        }
        ctx.fillStyle = '#d2ffe0';
        ctx.save();
        ctx.translate(8, -p * 70 - 4);
        Art.sparkle(ctx, 4 * (1 - p) + 1);
        ctx.fill();
        ctx.restore();
      } else if (f.type === 'poof') {
        // 擊倒消散：柔軟煙團 + 飛散十字星 + 光圈
        ctx.globalAlpha = (1 - p) * 0.85;
        ctx.fillStyle = f.color;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const r = 7 + p * 28;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * r, Math.sin(a) * r - p * 16, 7.5 * (1 - p), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -4, 6 + p * 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + 0.78;
          ctx.save();
          ctx.translate(Math.cos(a) * (10 + p * 30), Math.sin(a) * (10 + p * 30) - p * 10);
          ctx.rotate(p * 5);
          Art.sparkle(ctx, 4 * (1 - p));
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
    }

    // ── 飄浮數字（彈跳縮放 + 雙層描邊）──
    for (const n of this.nums) {
      const p = n.t / n.life;
      ctx.save();
      ctx.globalAlpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
      const pop = p < 0.22 ? 1.65 - (p / 0.22) * 0.65 : 1;
      const size = n.big ? 25 : 17;
      const y = n.y - 28 - p * 44;
      ctx.translate(n.x, y);
      ctx.scale(pop, pop);
      ctx.font = `bold ${size}px Verdana, "Microsoft JhengHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(20,12,28,0.75)';
      ctx.strokeText(n.str, 0, 0);
      if (n.big) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.strokeText(n.str, 0, 0);
      }
      ctx.fillStyle = n.color;
      ctx.fillText(n.str, 0, 0);
      ctx.restore();
    }
  },

  // ── 螢幕座標層：公告緞帶 ──
  drawScreen(ctx) {
    let yOff = 0;
    for (const b of this.banners) {
      const p = b.t / b.life;
      const alpha = p < 0.12 ? p / 0.12 : (p > 0.8 ? (1 - p) / 0.2 : 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 20px "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(b.text).width;
      const w = tw + 86, h = 40;
      const x0 = CONFIG.CANVAS_W / 2 - w / 2;
      const y0 = 46 + yOff;
      // 緞帶本體（兩端內凹三角）
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + w, y0);
      ctx.lineTo(x0 + w - 13, y0 + h / 2);
      ctx.lineTo(x0 + w, y0 + h);
      ctx.lineTo(x0, y0 + h);
      ctx.lineTo(x0 + 13, y0 + h / 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(18,16,38,0.85)';
      ctx.fill();
      const bg = ctx.createLinearGradient(0, y0, 0, y0 + h);
      bg.addColorStop(0, 'rgba(240,200,110,0.95)');
      bg.addColorStop(1, 'rgba(150,110,40,0.95)');
      ctx.strokeStyle = bg;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      // 內側裝飾鑽石
      ctx.fillStyle = 'rgba(255,225,140,0.9)';
      for (const sx of [x0 + 26, x0 + w - 26]) {
        ctx.save();
        ctx.translate(sx, y0 + h / 2);
        Art.sparkle(ctx, 4.5);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = b.color;
      ctx.fillText(b.text, CONFIG.CANVAS_W / 2, y0 + 27);
      ctx.restore();
      yOff += 48;
    }
  },
};
