// 怪物：巡邏 / 仇恨追擊 / Boss 三段攻擊模式
class Monster {
  constructor(type, x, plat, spawner) {
    this.type = type;
    this.def = MonsterDB[type];
    this.x = x;
    this.plat = plat;
    this.y = plat.y;
    this.w = this.def.w;
    this.h = this.def.h;
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.dir = Utils.chance(0.5) ? 1 : -1;
    this.hopT = Utils.rand(0, 5);
    this.flash = 0;
    this.hpBarT = 0;
    this.aggroT = 0;
    this.kbVx = 0;
    this.walkState = true;
    this.stateT = Utils.rand(0.8, 2.5);
    this.dying = false;
    this.deadT = 0;
    this.dead = false;
    this.spawner = spawner || null;
    this.isMinion = false;

    if (this.def.boss) {
      this.bState = 'walk';
      this.bTimer = 2.5;
      this.dashDir = 1;
      this.vy = 0;
    }
  }

  rect() {
    return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h };
  }

  // 回傳是否死亡
  hurt(dmg, fromX) {
    if (this.dying) return false;
    this.hp -= dmg;
    this.flash = 0.12;
    this.hpBarT = 4;
    this.aggroT = 5;
    const away = this.x < fromX ? -1 : 1;
    this.kbVx = away * (this.def.boss ? 25 : 150);
    if (this.hp <= 0) {
      this.dying = true;
      this.deadT = 0;
      return true;
    }
    return false;
  }

  update(dt, game) {
    if (this.dying) {
      this.deadT += dt;
      if (this.deadT >= 0.4) this.dead = true;
      return;
    }

    this.hopT += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.hpBarT > 0) this.hpBarT -= dt;
    if (this.aggroT > 0) this.aggroT -= dt;

    if (this.kbVx) {
      this.x += this.kbVx * dt;
      this.kbVx *= Math.max(0, 1 - 10 * dt);
      if (Math.abs(this.kbVx) < 5) this.kbVx = 0;
    }

    if (this.def.boss) {
      this.updateBoss(dt, game);
    } else {
      const p = game.player;
      const near = Math.abs(p.x - this.x) < 280 && Math.abs(p.y - this.y) < 90;
      let spd = this.def.speed;
      let moving;
      if (this.aggroT > 0 || (this.def.aggressive && near)) {
        this.dir = p.x > this.x ? 1 : -1;
        spd *= 1.5;
        moving = true;
      } else {
        this.stateT -= dt;
        if (this.stateT <= 0) {
          this.walkState = Utils.chance(0.7);
          if (Utils.chance(0.5)) this.dir *= -1;
          this.stateT = Utils.rand(0.8, 2.5);
        }
        moving = this.walkState;
      }
      if (moving) this.x += this.dir * spd * dt;
    }

    // 不會走出自己的平台
    const m = this.w / 2;
    if (this.x < this.plat.x1 + m) { this.x = this.plat.x1 + m; this.dir = 1; }
    if (this.x > this.plat.x2 - m) { this.x = this.plat.x2 - m; this.dir = -1; }
  }

  updateBoss(dt, game) {
    const p = game.player;
    this.bTimer -= dt;

    switch (this.bState) {
      case 'walk':
        this.dir = p.x > this.x ? 1 : -1;
        this.x += this.dir * this.def.speed * dt;
        if (this.bTimer <= 0) {
          const minions = game.monsters.filter((mm) => mm.isMinion && !mm.dying).length;
          const r = Math.random();
          if (r < 0.4) { this.bState = 'tellDash'; this.bTimer = 0.6; }
          else if (r < 0.7) { this.bState = 'tellSlam'; this.bTimer = 0.55; }
          else if (minions < 3) { this.bState = 'summon'; this.bTimer = 0.9; }
          else { this.bState = 'tellDash'; this.bTimer = 0.6; }
          Sound.play('boss');
        }
        break;

      case 'tellDash':
        if (this.bTimer <= 0) {
          this.bState = 'dash';
          this.bTimer = 0.75;
          this.dashDir = p.x > this.x ? 1 : -1;
          this.dir = this.dashDir;
        }
        break;

      case 'dash':
        this.x += this.dashDir * 430 * dt;
        if (this.bTimer <= 0) this.endAttack();
        break;

      case 'tellSlam':
        if (this.bTimer <= 0) {
          this.bState = 'slam';
          this.vy = -680;
        }
        break;

      case 'slam':
        this.vy += CONFIG.GRAVITY * dt;
        this.y += this.vy * dt;
        if (this.vy > 0 && this.y >= this.plat.y) {
          this.y = this.plat.y;
          Camera.shake(10, 0.4);
          Sound.play('boss');
          for (const d of [-1, 1]) {
            game.projectiles.push(new Projectile({
              from: 'boss', x: this.x + d * 70, y: this.y, dir: d,
              speed: 330, dmg: this.def.atk * 0.9, kind: 'shock', life: 2.2,
            }));
          }
          this.endAttack();
        }
        break;

      case 'summon':
        if (this.bTimer <= 0) {
          for (const off of [-90, 90]) {
            const mm = game.spawnMonster('mushroom',
              Utils.clamp(this.x + off, this.plat.x1 + 30, this.plat.x2 - 30), this.plat, null);
            mm.isMinion = true;
            mm.aggroT = 8;
          }
          Effects.announce('蘑菇王召喚了手下！', '#ff8a65');
          this.endAttack();
        }
        break;
    }
  }

  endAttack() {
    this.bState = 'walk';
    this.bTimer = Utils.rand(2.2, 4.2);
  }
}
