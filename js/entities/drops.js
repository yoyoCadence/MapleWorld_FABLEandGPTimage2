// 地上的掉落物（楓幣或道具）
class Drop {
  constructor(x, y, groundY, data) {
    this.x = x + Utils.rand(-22, 22);
    this.y = y;
    this.groundY = groundY;
    this.vy = -280;
    this.meso = data.meso || 0;   // > 0 表示楓幣
    this.itemId = data.itemId || null;
    this.qty = data.qty || 1;
    this.roll = data.roll || null; // 裝備掉落時已決定的隨機數值
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    if (this.age > 40) this.dead = true;
    if (this.y < this.groundY || this.vy < 0) {
      this.vy += 1500 * dt;
      this.y += this.vy * dt;
      if (this.y >= this.groundY) { this.y = this.groundY; this.vy = 0; }
    }
  }

  draw(ctx, t) {
    const bob = this.y >= this.groundY - 0.5 ? Math.sin(t * 3 + this.x) * 3 : 0;
    const blink = this.age > 33 && Math.floor(this.age * 6) % 2 === 0;
    if (blink) return;
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,180,0.8)';
    ctx.shadowBlur = 10;
    Sprites.drawItemIcon(ctx, this.meso > 0 ? 'meso' : this.itemId, this.x, this.y - 14 + bob, 26);
    ctx.restore();
  }
}
