// 玩家：移動 / 跳躍 / 爬繩 / 戰鬥 / 背包裝備 / 升級
class Player {
  constructor(save, job) {
    this.x = 120;
    this.y = 560;
    this.vx = 0;
    this.vy = 0;
    this.kbVx = 0;
    this.facing = 1;
    this.onGround = false;
    this.plat = null;
    this.climbing = null;   // 抓住的繩索
    this.dropT = 0;         // 下跳穿越平台計時

    this.job = (save && save.job) || job || 'warrior';
    const jd = JobDB[this.job] || JobDB.warrior;
    this.level = 1;
    this.exp = 0;
    this.meso = 0;
    this.sp = 0;
    this.skills = {};
    this.skills[jd.skills[0]] = 1;   // 起始技能
    this.skillCds = {};
    this.buffs = {};                 // id -> { atk, def, speed, until }
    this.inventory = new Array(CONFIG.INV_SIZE).fill(null);
    this.equips = {};
    for (const slot of EQUIP_SLOTS) this.equips[slot] = null;
    this.equips.weapon = jd.startWeapon;

    this.invinc = 0;
    this.gcd = 0;
    this.attackAnim = 0;
    this.attackDur = 0.32;
    this.attackType = null;
    this.attackHitDone = true;
    this.animT = 0;
    this.outCombat = 10;
    this.dead = false;

    if (save) {
      this.applySave(save);
    } else {
      this.addItem('redPotion', 3);
      this.addItem('bluePotion', 2);
      this.hp = this.maxHp;
      this.mp = this.maxMp;
    }
  }

  // ── 屬性（基礎值 × 職業修正 + 裝備加成 × buff）──
  get jobDef() { return JobDB[this.job] || JobDB.warrior; }
  skillList() { return this.jobDef.skills; }

  equipBonus(field) {
    let s = 0;
    for (const slot of EQUIP_SLOTS) {
      const id = this.equips[slot];
      if (id && ItemDB[id] && ItemDB[id][field]) s += ItemDB[id][field];
    }
    return s;
  }
  buffBonus(field) {
    let s = 0;
    for (const k in this.buffs) if (this.buffs[k][field]) s += this.buffs[k][field];
    return s;
  }
  get atk() {
    const v = (10 + this.level * 2.4) * this.jobDef.statMods.atk + this.equipBonus('atk');
    return Math.round(v * (1 + this.buffBonus('atk')));
  }
  get def() {
    const v = (2 + this.level * 1.2) * this.jobDef.statMods.def + this.equipBonus('def');
    return Math.round(v * (1 + this.buffBonus('def')));
  }
  get maxHp() { return Math.round((50 + this.level * 22) * this.jobDef.statMods.hp + this.equipBonus('hp')); }
  get maxMp() { return Math.round((28 + this.level * 11) * this.jobDef.statMods.mp + this.equipBonus('mp')); }
  get speedMul() { return 1 + this.buffBonus('speed') + this.equipBonus('spd') / 100; }

  rect() {
    return { x: this.x - CONFIG.PLAYER_W / 2, y: this.y - CONFIG.PLAYER_H, w: CONFIG.PLAYER_W, h: CONFIG.PLAYER_H };
  }

  update(dt, game) {
    const map = game.map;
    this.invinc = Math.max(0, this.invinc - dt);
    this.gcd = Math.max(0, this.gcd - dt);
    this.dropT = Math.max(0, this.dropT - dt);
    this.outCombat += dt;
    for (const k in this.skillCds) this.skillCds[k] = Math.max(0, this.skillCds[k] - dt);
    for (const k in this.buffs) if (game.time >= this.buffs[k].until) delete this.buffs[k];

    // 緩慢回復
    if (this.outCombat > 4) this.hp = Math.min(this.maxHp, this.hp + (1 + this.level * 0.3) * dt);
    this.mp = Math.min(this.maxMp, this.mp + (2 + this.level * 0.25) * dt);

    // 攻擊動畫進行中：到揮擊點時結算傷害
    if (this.attackAnim > 0) {
      this.attackAnim -= dt;
      const elapsed = this.attackDur - this.attackAnim;
      if (!this.attackHitDone && elapsed >= 0.12) {
        this.attackHitDone = true;
        this.applyHit(game);
      }
    }

    const left = Input.down['ArrowLeft'];
    const right = Input.down['ArrowRight'];

    // ── 爬繩模式 ──
    if (this.climbing) {
      const r = this.climbing;
      this.vx = 0;
      this.vy = 0;
      if (Input.down['ArrowUp']) { this.y -= CONFIG.CLIMB_SPEED * dt; this.animT += dt; }
      if (Input.down['ArrowDown']) { this.y += CONFIG.CLIMB_SPEED * dt; this.animT += dt; }

      if (Input.pressed['Space']) {
        // 跳離繩索
        this.climbing = null;
        this.vy = -380;
        if (left && !right) { this.vx = -CONFIG.MOVE_SPEED; this.facing = -1; }
        if (right && !left) { this.vx = CONFIG.MOVE_SPEED; this.facing = 1; }
        Sound.play('jump');
      } else if (this.y <= r.y1) {
        // 爬到頂端 → 站上平台
        this.y = r.y1;
        this.climbing = null;
        this.onGround = true;
        this.plat = map.platforms.find((pl) => pl.y === r.y1 && this.x >= pl.x1 - 6 && this.x <= pl.x2 + 6) || this.plat;
      } else if (this.y >= r.y2) {
        this.y = r.y2;
        this.climbing = null;
        this.onGround = true;
        this.plat = map.platforms.find((pl) => pl.y === r.y2 && this.x >= pl.x1 - 6 && this.x <= pl.x2 + 6) || this.plat;
      }
      return;
    }

    // ── 一般移動 ──
    const canMove = !(this.attackAnim > 0 && this.onGround);
    const ms = CONFIG.MOVE_SPEED * this.speedMul;
    if (canMove && left && !right) { this.vx = -ms; this.facing = -1; }
    else if (canMove && right && !left) { this.vx = ms; this.facing = 1; }
    else this.vx = 0;

    // 跳躍 / ↓+跳 下跳穿越平台
    if (Input.pressed['Space'] && this.onGround) {
      if (Input.down['ArrowDown'] && this.plat && !this.plat.ground) {
        this.dropT = 0.22;
        this.onGround = false;
      } else {
        this.vy = CONFIG.JUMP_VY;
        this.onGround = false;
        Sound.play('jump');
      }
    }

    // ↑ 進入傳送門
    if (Input.pressed['ArrowUp']) {
      const portal = map.portals.find((po) => Math.abs(po.x - this.x) < 36 && Math.abs(po.y - this.y) < 30);
      if (portal) {
        game.transfer(portal.target, portal.targetPortal);
        return;
      }
    }

    // 抓繩索
    if ((Input.down['ArrowUp'] || Input.down['ArrowDown']) && this.attackAnim <= 0) {
      for (const r of map.ropes) {
        if (Math.abs(this.x - r.x) > 16) continue;
        if (Input.down['ArrowUp'] && this.y > r.y1 + 2 && this.y <= r.y2) {
          this.grabRope(r);
          break;
        }
        if (Input.down['ArrowDown'] && this.onGround && Math.abs(this.y - r.y1) < 2) {
          this.grabRope(r);
          this.y = r.y1 + 14;
          break;
        }
      }
      if (this.climbing) return;
    }

    // 攻擊 / 技能 / 藥水 / 撿取
    if (Input.pressed['KeyX']) this.tryBasic(game);
    for (const id of this.skillList()) {
      if (Input.pressed[SkillDB[id].code]) this.castSkill(id, game);
    }
    if (Input.pressed['Digit1']) this.quickPotion(['redPotion', 'orangePotion', 'elixir']);
    if (Input.pressed['Digit2']) this.quickPotion(['bluePotion', 'elixir']);
    if (Input.pressed['KeyZ']) this.pickup(game);

    // ── 物理 ──
    this.vy = Math.min(this.vy + CONFIG.GRAVITY * dt, CONFIG.MAX_FALL);
    const prevY = this.y;
    this.x += (this.vx + this.kbVx) * dt;
    this.kbVx *= Math.max(0, 1 - 8 * dt);
    if (Math.abs(this.kbVx) < 5) this.kbVx = 0;
    this.x = Utils.clamp(this.x, 16, map.w - 16);
    this.y += this.vy * dt;

    this.onGround = false;
    if (this.vy >= 0) {
      let best = null;
      for (const pl of map.platforms) {
        if (this.dropT > 0 && !pl.ground) continue;
        if (this.x < pl.x1 - 6 || this.x > pl.x2 + 6) continue;
        if (prevY <= pl.y + 0.01 && this.y >= pl.y) {
          if (!best || pl.y < best.y) best = pl;
        }
      }
      if (best) {
        this.y = best.y;
        this.vy = 0;
        this.onGround = true;
        this.plat = best;
      }
    }

    // 安全網：不小心掉出地圖
    if (this.y > map.h + 300) {
      this.x = map.spawn.x;
      this.y = map.spawn.y - 40;
      this.vy = 0;
    }

    this.animT += dt;
  }

  grabRope(r) {
    this.climbing = r;
    this.x = r.x;
    this.vx = 0;
    this.vy = 0;
    this.kbVx = 0;
    this.onGround = false;
    this.dropT = 0;
  }

  // ── 戰鬥 ──
  tryBasic(game) {
    if (this.gcd > 0 || this.attackAnim > 0 || this.climbing) return;
    const jd = this.jobDef;
    if (jd.basicType === 'projectile' && game) {
      const bp = jd.basicProjectile || {};
      this.attackDur = 0.3;
      this.attackAnim = 0.3;
      this.attackType = null;
      this.attackHitDone = true;
      this.gcd = 0.4;
      game.projectiles.push(new Projectile({
        from: 'player', x: this.x + this.facing * 22, y: this.y - 26, dir: this.facing,
        speed: bp.speed || 560, mult: 1.0, pierce: bp.pierce || 1, life: 1.0,
        style: bp.style, color: bp.color,
      }));
      Sound.play('attack');
    } else {
      this.attackDur = 0.32;
      this.attackAnim = 0.32;
      this.attackType = { kind: 'melee', mult: 1.0, targets: 1 };
      this.attackHitDone = false;
      this.gcd = 0.42;
      Sound.play('attack');
    }
  }

  applyBuff(id, d, lv, game) {
    const b = d.buff(lv);
    this.buffs[id] = {
      atk: b.atk || 0, def: b.def || 0, speed: b.speed || 0,
      until: (game ? game.time : 0) + b.dur,
    };
  }

  castSkill(id, game) {
    const d = SkillDB[id];
    const lv = this.skills[id] || 0;
    if (!lv) {
      Effects.spawnText(this.x, this.y - 70, '尚未學習', '#90a4ae');
      return;
    }
    if (this.climbing || this.gcd > 0 || this.attackAnim > 0 || (this.skillCds[id] || 0) > 0) return;
    const cost = d.mpCost(lv);
    if (this.mp < cost) {
      Effects.spawnText(this.x, this.y - 70, 'MP 不足', '#64b5f6');
      Sound.play('error');
      return;
    }
    this.mp -= cost;
    this.skillCds[id] = d.cd;
    this.gcd = 0.4;
    const mult = d.mult ? d.mult(lv) : 1;
    const pierce = typeof d.pierce === 'function' ? d.pierce(lv) : (d.pierce || 1);

    if (d.type === 'heal') {
      const amount = Math.round(this.maxHp * d.healPct(lv));
      this.hp = Math.min(this.maxHp, this.hp + amount);
      Effects.healFx(this.x, this.y);
      Effects.spawnDamage(this.x, this.y - 60, '+' + amount, '#69f0ae');
      Sound.play('heal');
    } else if (d.type === 'buff') {
      this.applyBuff(id, d, lv, game);
      Effects.ring(this.x, this.y - 20, '#ffd54f');
      Effects.announce(`✦ ${d.name} 發動！`, '#ffe082');
      Sound.play('skill');
    } else if (d.type === 'projectile') {
      const count = d.count || 1;
      for (let i = 0; i < count; i++) {
        const vy = count > 1 ? (i - (count - 1) / 2) * (d.spread || 0) : 0;
        game.projectiles.push(new Projectile({
          from: 'player', x: this.x + this.facing * 22, y: this.y - 26, dir: this.facing,
          speed: d.speed || 540, mult, pierce, life: d.life || 1.0,
          style: d.style, color: d.color, vy,
        }));
      }
      this.attackDur = 0.28;
      this.attackAnim = 0.28;
      this.attackType = null;
      this.attackHitDone = true;
      Sound.play('skill');
    } else if (d.type === 'aoe') {
      this.attackDur = 0.36;
      this.attackAnim = 0.36;
      this.attackType = { kind: 'aoe', mult, radius: d.radius };
      this.attackHitDone = false;
      Effects.spin(this.x, this.y - 26, d.radius);
      Sound.play('skill');
    } else {
      // melee
      this.attackDur = 0.32;
      this.attackAnim = 0.32;
      this.attackType = { kind: 'melee', mult, targets: d.targets || 1, big: d.big };
      this.attackHitDone = false;
      Sound.play('skill');
    }
  }

  applyHit(game) {
    const at = this.attackType;
    if (!at) return;
    if (at.kind === 'melee') {
      const x0 = this.facing > 0 ? this.x + 4 : this.x - 4 - 78;
      const box = { x: x0, y: this.y - 56, w: 78, h: 60 };
      Effects.slash(this.x + this.facing * 38, this.y - 28, this.facing, at.big ? 1.3 : 1);
      const hits = game.monstersInRect(box)
        .sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x))
        .slice(0, at.targets);
      for (const m of hits) game.playerStrike(m, at.mult);
    } else if (at.kind === 'aoe') {
      for (const m of game.monsters) {
        if (m.dying) continue;
        if (Utils.dist(this.x, this.y - 23, m.x, m.y - m.h / 2) <= at.radius + m.w / 2) {
          game.playerStrike(m, at.mult);
        }
      }
    }
  }

  takeDamage(raw, fromX, game) {
    if (this.invinc > 0 || this.dead) return;
    const dmg = Math.max(1, Math.round(raw * Utils.rand(0.9, 1.1) - this.def * 0.6));
    this.hp -= dmg;
    this.invinc = CONFIG.INVINCIBLE_TIME;
    this.outCombat = 0;
    Effects.spawnDamage(this.x, this.y - 64, dmg, '#ff5252', true);
    this.kbVx = (this.x < fromX ? -1 : 1) * 170;
    if (this.climbing) this.climbing = null;
    if (this.onGround) {
      this.vy = -260;
      this.onGround = false;
    }
    Sound.play('hurt');
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      game.onPlayerDeath();
    }
  }

  gainExp(xp) {
    Effects.spawnText(this.x, this.y - 84, `+${xp} EXP`, '#b388ff');
    this.exp += xp;
    while (this.level < CONFIG.MAX_LEVEL && this.exp >= expNeed(this.level)) {
      this.exp -= expNeed(this.level);
      this.level++;
      this.sp += 3;
      this.hp = this.maxHp;
      this.mp = this.maxMp;
      Effects.ring(this.x, this.y - 20, '#ffd54f');
      Effects.announce(`🎉 等級提升！Lv.${this.level}（獲得 3 SP）`, '#ffe082');
      Sound.play('levelup');
    }
    if (this.level >= CONFIG.MAX_LEVEL) this.exp = Math.min(this.exp, expNeed(this.level) - 1);
  }

  // ── 背包 / 裝備 ──
  addItem(id, qty) {
    qty = qty || 1;
    const d = ItemDB[id];
    if (!d) return false;
    if (d.type === 'use') {
      for (const s of this.inventory) {
        if (s && s.id === id && s.qty < d.maxStack) {
          const can = Math.min(qty, d.maxStack - s.qty);
          s.qty += can;
          qty -= can;
          if (qty <= 0) return true;
        }
      }
    }
    while (qty > 0) {
      const i = this.inventory.indexOf(null);
      if (i < 0) return false;
      const put = d.type === 'use' ? Math.min(qty, d.maxStack) : 1;
      this.inventory[i] = { id, qty: put };
      qty -= put;
    }
    return true;
  }

  useSlot(i, game) {
    const s = this.inventory[i];
    if (!s) return;
    const d = ItemDB[s.id];
    if (d.type === 'material') {
      Effects.spawnText(this.x, this.y - 70, '材料：製作用', '#90a4ae');
      return;
    }
    if (d.type === 'use') {
      if (d.heal) {
        this.hp = Math.min(this.maxHp, this.hp + Math.min(d.heal, this.maxHp));
        Effects.spawnDamage(this.x, this.y - 60, '+' + Math.min(d.heal, this.maxHp), '#69f0ae');
      }
      if (d.mpHeal) {
        this.mp = Math.min(this.maxMp, this.mp + Math.min(d.mpHeal, this.maxMp));
        Effects.spawnDamage(this.x, this.y - (d.heal ? 80 : 60), '+' + Math.min(d.mpHeal, this.maxMp), '#64b5f6');
      }
      if (d.warp && game && MapDB[d.warp]) { game.transfer(d.warp, 'back'); }
      Sound.play('potion');
      s.qty--;
      if (s.qty <= 0) this.inventory[i] = null;
    } else {
      if (d.slot === 'weapon' && d.class && d.class !== 'any' && d.class !== this.job) {
        Effects.announce(`${this.jobDef.name}無法裝備 ${d.name}`, '#ef9a9a');
        Sound.play('error');
        return;
      }
      if (this.level < (d.reqLv || 1)) {
        Effects.announce(`需要等級 ${d.reqLv} 才能裝備 ${d.name}`, '#ef9a9a');
        Sound.play('error');
        return;
      }
      const old = this.equips[d.slot];
      this.equips[d.slot] = s.id;
      this.inventory[i] = old ? { id: old, qty: 1 } : null;
      this.hp = Math.min(this.hp, this.maxHp);
      this.mp = Math.min(this.mp, this.maxMp);
      Sound.play('equip');
    }
  }

  unequip(slot) {
    const id = this.equips[slot];
    if (!id) return;
    const i = this.inventory.indexOf(null);
    if (i < 0) {
      Effects.announce('背包已滿', '#ef9a9a');
      Sound.play('error');
      return;
    }
    this.inventory[i] = { id, qty: 1 };
    this.equips[slot] = null;
    this.hp = Math.min(this.hp, this.maxHp);
    this.mp = Math.min(this.mp, this.maxMp);
    Sound.play('equip');
  }

  quickPotion(list) {
    for (const id of list) {
      const i = this.inventory.findIndex((s) => s && s.id === id);
      if (i >= 0) {
        this.useSlot(i);
        return;
      }
    }
    Effects.spawnText(this.x, this.y - 70, '沒有藥水了', '#ef9a9a');
    Sound.play('error');
  }

  pickup(game) {
    let best = null, bd = Infinity;
    for (const d of game.drops) {
      if (d.dead) continue;
      const dx = Math.abs(d.x - this.x);
      const dy = Math.abs(d.groundY - this.y);
      if (dx < CONFIG.PICKUP_RANGE && dy < 70) {
        const dist = dx + dy;
        if (dist < bd) { bd = dist; best = d; }
      }
    }
    if (!best) return;
    if (best.meso > 0) {
      this.meso += best.meso;
      Effects.spawnText(best.x, best.y - 30, `+${best.meso} 楓幣`, '#ffd54f');
      Sound.play('meso');
      best.dead = true;
    } else if (this.addItem(best.itemId, best.qty)) {
      Effects.spawnText(best.x, best.y - 30, `獲得 ${ItemDB[best.itemId].name}${best.qty > 1 ? ' x' + best.qty : ''}`, '#fff');
      Sound.play('pickup');
      best.dead = true;
    } else {
      Effects.spawnText(this.x, this.y - 70, '背包已滿', '#ef9a9a');
      Sound.play('error');
    }
  }

  skillUp(id) {
    const d = SkillDB[id];
    const lv = this.skills[id] || 0;
    if (this.sp <= 0 || lv >= d.maxLv || this.level < d.reqLv) return;
    this.skills[id] = lv + 1;
    this.sp--;
    Sound.play('equip');
  }

  // ── 存檔 ──
  serialize() {
    return {
      v: 2,
      job: this.job,
      level: this.level, exp: this.exp,
      hp: Math.round(this.hp), mp: Math.round(this.mp),
      meso: this.meso, sp: this.sp,
      skills: this.skills, inventory: this.inventory, equips: this.equips,
    };
  }

  applySave(s) {
    this.job = s.job || this.job || 'warrior';
    this.level = s.level || 1;
    this.exp = s.exp || 0;
    this.meso = s.meso || 0;
    this.sp = s.sp || 0;
    this.skills = s.skills || {};
    if (!Object.keys(this.skills).length) this.skills[this.jobDef.skills[0]] = 1;
    const inv = new Array(CONFIG.INV_SIZE).fill(null);
    (s.inventory || []).slice(0, CONFIG.INV_SIZE).forEach((v, i) => { inv[i] = v; });
    this.inventory = inv;
    const eq = {};
    for (const slot of EQUIP_SLOTS) eq[slot] = null;
    this.equips = Object.assign(eq, s.equips || {});
    this.hp = Math.min(s.hp || this.maxHp, this.maxHp);
    this.mp = Math.min(s.mp || this.maxMp, this.maxMp);
  }

  draw(ctx, t) {
    Sprites.drawPlayer(ctx, this, t);
  }
}
