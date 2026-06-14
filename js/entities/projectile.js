// 投射物：玩家能量波 / Boss 地面震波
class Projectile {
  constructor(opts) {
    this.from = opts.from;          // 'player' | 'boss'
    this.x = opts.x;
    this.y = opts.y;
    this.dir = opts.dir;
    this.speed = opts.speed;
    this.mult = opts.mult || 1;     // 玩家：傷害倍率
    this.dmg = opts.dmg || 0;       // Boss：固定傷害
    this.pierce = opts.pierce || 1;
    this.life = opts.life || 1.1;
    this.kind = opts.kind || 'wave';
    this.style = opts.style || 'energy';   // energy/fire/ice/arrow/star/bullet/magic
    this.color = opts.color || '#6ec8ff';
    this.vy = opts.vy || 0;                 // 給多重投射物做扇形散射
    this.spin = 0;
    this.hitSet = new Set();
    this.dead = false;
  }

  update(dt) {
    this.x += this.dir * this.speed * dt;
    this.y += this.vy * dt;
    this.spin += dt * 18;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  rect() {
    if (this.kind === 'shock') return { x: this.x - 18, y: this.y - 34, w: 36, h: 34 };
    return { x: this.x - 16, y: this.y - 12, w: 32, h: 24 };
  }

  draw(ctx, t) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // 每種投射物樣式可有專屬 PNG：assets/sprites/fx/proj/<style>.png（缺檔則用程序化）
    if (this.kind !== 'shock' && typeof Sprites !== 'undefined') {
      const img = Sprites._loadImage(Sprites.ASSET_BASE + 'sprites/fx/proj/' + this.style + '.png');
      if (Sprites._readyImage(img)) {
        ctx.scale(this.dir, 1);
        if (this.style === 'star') ctx.rotate(this.spin);
        const h = 34, w = h * (img.naturalWidth / img.naturalHeight);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
        return;
      }
    }
    if (this.kind === 'shock') {
      // Boss 的地面震波（火焰狀）
      const fl = Math.sin(t * 30 + this.x) * 3;
      ctx.fillStyle = 'rgba(255,120,40,0.85)';
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.quadraticCurveTo(-10, -22 - fl, 0, -30 - fl);
      ctx.quadraticCurveTo(10, -20 + fl, 16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,220,90,0.9)';
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.quadraticCurveTo(-4, -14, 0, -18 - fl);
      ctx.quadraticCurveTo(5, -12, 8, 0);
      ctx.closePath();
      ctx.fill();
    } else if (this.style === 'arrow') {
      // 箭矢：細長箭桿 + 箭頭 + 尾羽
      ctx.scale(this.dir, 1);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-16, 0); ctx.lineTo(12, 0); ctx.stroke();
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(18, 0); ctx.lineTo(8, -4); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, 0); ctx.lineTo(-22, -4); ctx.moveTo(-16, 0); ctx.lineTo(-22, 4); ctx.stroke();
    } else if (this.style === 'star') {
      // 飛鏢：旋轉四芒星
      ctx.rotate(this.spin);
      ctx.fillStyle = this.color;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(3, -3); ctx.lineTo(0, -12); ctx.lineTo(-3, -3); ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, Math.PI * 2); ctx.fill();
    } else {
      // 法術 / 火 / 冰 / 砲彈 / 能量波：發光球 + 拖尾
      const c = this.color;
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.45, this._rgba(c, 0.9));
      g.addColorStop(1, this._rgba(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this._rgba(c, 0.8);
      ctx.lineWidth = 2.4;
      for (const rr of [12, 15]) {
        ctx.beginPath();
        ctx.arc(-this.dir * 5, 0, rr, Math.PI * 0.62, Math.PI * 1.38);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }
}
