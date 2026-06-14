// 跟隨玩家的鏡頭，支援畫面震動
const Camera = {
  x: 0, y: 0,
  shakeT: 0, shakeAmt: 0,

  snap(player, map) {
    this.x = Utils.clamp(player.x - CONFIG.CANVAS_W / 2, 0, Math.max(0, map.w - CONFIG.CANVAS_W));
    this.y = Utils.clamp(player.y - 340, 0, Math.max(0, map.h - CONFIG.CANVAS_H));
  },

  update(player, map, dt) {
    const tx = Utils.clamp(player.x - CONFIG.CANVAS_W / 2, 0, Math.max(0, map.w - CONFIG.CANVAS_W));
    const ty = Utils.clamp(player.y - 340, 0, Math.max(0, map.h - CONFIG.CANVAS_H));
    const k = Math.min(1, dt * 8);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    if (this.shakeT > 0) this.shakeT -= dt;
  },

  shake(amt, dur) {
    this.shakeAmt = amt;
    this.shakeT = dur;
  },

  begin(ctx) {
    ctx.save();
    let ox = 0, oy = 0;
    if (this.shakeT > 0) {
      ox = Utils.rand(-this.shakeAmt, this.shakeAmt);
      oy = Utils.rand(-this.shakeAmt, this.shakeAmt);
    }
    ctx.translate(-Math.round(this.x + ox), -Math.round(this.y + oy));
  },

  end(ctx) {
    ctx.restore();
  },
};
