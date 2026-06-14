// 寵物：跟隨玩家、隨時間自動幫忙攻擊附近的怪物
class Pet {
  constructor(type) {
    this.type = type || 'default';
    this.x = 0;
    this.y = 0;
    this.facing = 1;
    this.animT = Utils.rand(0, 3);
    this.atkCd = Utils.rand(1.5, 3.5);
    this.attackAnim = 0;
  }

  reset(p) {
    this.x = p.x - 40;
    this.y = p.y;
    this.facing = p.facing;
  }

  update(dt, game) {
    const p = game.player;
    this.animT += dt;
    if (this.attackAnim > 0) this.attackAnim -= dt;

    // 跟隨：停在玩家身後一段距離，差距太大就瞬間拉近
    const behind = p.x - p.facing * 42;
    const dx = behind - this.x;
    if (Math.abs(dx) > 360) { this.x = behind; this.y = p.y; }
    else {
      this.x += dx * Math.min(1, dt * 5);
      this.y += (p.y - this.y) * Math.min(1, dt * 6);
    }
    this.facing = dx >= 0 ? 1 : -1;

    // 隨時間自動攻擊：找附近一隻怪打一下（小傷害）
    this.atkCd -= dt;
    if (this.atkCd <= 0) {
      let target = null, bd = Infinity;
      for (const m of game.monsters) {
        if (m.dying) continue;
        const d = Math.abs(m.x - this.x) + Math.abs(m.y - this.y);
        if (Math.abs(m.x - this.x) < 300 && Math.abs(m.y - this.y) < 140 && d < bd) { bd = d; target = m; }
      }
      if (target) {
        this.facing = target.x >= this.x ? 1 : -1;
        this.attackAnim = 0.3;
        const dmg = Math.max(1, Math.round(p.atk * 0.3));
        Effects.spawnDamage(target.x, target.y - target.h, dmg, '#b39ddb');
        Effects.spark(target.x, target.y - target.h / 2, '#d1b3ff');
        Sound.play('hit');
        if (target.hurt(dmg, this.x)) game.onMonsterDeath(target);
        this.atkCd = 2.8;
      } else {
        this.atkCd = 0.8;
      }
    }
  }

  draw(ctx, t) {
    Sprites.drawPet(ctx, this, t);
  }
}
