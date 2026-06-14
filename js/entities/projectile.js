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
    this.hitSet = new Set();
    this.dead = false;
  }

  update(dt) {
    this.x += this.dir * this.speed * dt;
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
    } else {
      // 玩家能量波
      ctx.scale(this.dir, 1);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.5, 'rgba(110,200,255,0.85)');
      g.addColorStop(1, 'rgba(60,120,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,230,255,0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-6, 0, 13, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-13, 0, 15, Math.PI * 0.65, Math.PI * 1.35);
      ctx.stroke();
    }
    ctx.restore();
  }
}
