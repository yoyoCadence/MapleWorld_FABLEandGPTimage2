// 遊戲主控制器：狀態機（title / play / dead）、地圖載入、戰鬥結算、存檔
const Game = {
  state: 'title',
  mapId: 'meadow',
  map: null,
  player: null,
  monsters: [],
  drops: [],
  projectiles: [],
  spawnerRts: [],
  time: 0,
  saveTimer: 0,
  hasSave: false,

  init() {
    const save = this.loadSave();
    this.hasSave = !!save;
    this.player = new Player(save ? save.player : null);
    if (save && MapDB[save.mapId]) {
      this.loadMap(save.mapId, null, { x: save.x, y: save.y });
    } else {
      this.loadMap('meadow', null, null);
    }
    // 開發用：網址 #play 或 #play-forest 直接進入指定地圖（截圖/測試）
    const hash = (typeof location !== 'undefined' && location.hash) || '';
    const mm = hash.match(/^#play(?:-(\w+))?$/);
    if (mm) {
      if (mm[1] && MapDB[mm[1]]) this.loadMap(mm[1], null, null);
      this.state = 'play';
    }
    Camera.snap(this.player, this.map);
  },

  // ── 存檔 ──
  loadSave() {
    try {
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || s.v !== 1 || !s.player) return null;
      return s;
    } catch (e) {
      return null;
    }
  },

  save() {
    try {
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify({
        v: 1,
        mapId: this.mapId,
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        player: this.player.serialize(),
      }));
    } catch (e) { /* 隱私模式等情況忽略 */ }
  },

  clearSave() {
    try { localStorage.removeItem(CONFIG.SAVE_KEY); } catch (e) {}
  },

  // ── 地圖 ──
  loadMap(id, portalId, pos) {
    this.mapId = id;
    this.map = MapDB[id];
    this.monsters = [];
    this.drops = [];
    this.projectiles = [];
    Effects.reset();

    this.spawnerRts = this.map.spawners.map((def) => ({ def, queue: [] }));
    for (const rt of this.spawnerRts) {
      for (let i = 0; i < rt.def.count; i++) this.spawnFromRt(rt);
    }

    const p = this.player;
    if (portalId) {
      const po = this.map.portals.find((q) => q.id === portalId);
      p.x = po ? po.x : this.map.spawn.x;
      p.y = po ? po.y : this.map.spawn.y;
    } else if (pos && typeof pos.x === 'number') {
      p.x = Utils.clamp(pos.x, 30, this.map.w - 30);
      p.y = Utils.clamp(pos.y, 40, this.map.h - 10);
    } else {
      p.x = this.map.spawn.x;
      p.y = this.map.spawn.y;
    }
    p.vx = 0; p.vy = 0; p.kbVx = 0;
    p.climbing = null;
    p.onGround = false;
    p.plat = null;

    Effects.announce(`🍁 ${this.map.name}`, '#ffe082');
    if (id === 'altar') Effects.announce('⚠ 這裡是蘑菇王的領域！', '#ff8a65');
  },

  spawnFromRt(rt) {
    const def = rt.def;
    const plat = this.map.platforms[def.plat];
    return this.spawnMonster(def.type, Utils.rand(def.x1, def.x2), plat, rt);
  },

  spawnMonster(type, x, plat, spawnerRt) {
    const m = new Monster(type, x, plat, spawnerRt || null);
    this.monsters.push(m);
    return m;
  },

  transfer(target, targetPortal) {
    Sound.play('portal');
    this.loadMap(target, targetPortal, null);
    Camera.snap(this.player, this.map);
    this.save();
  },

  // ── 戰鬥結算 ──
  monstersInRect(r) {
    return this.monsters.filter((m) => {
      if (m.dying) return false;
      const mr = m.rect();
      return Utils.rectsOverlap(r.x, r.y, r.w, r.h, mr.x, mr.y, mr.w, mr.h);
    });
  },

  playerStrike(m, mult) {
    const p = this.player;
    let base = p.atk * mult * Utils.rand(0.88, 1.12);
    const crit = Utils.chance(0.12);
    if (crit) base *= 1.5;
    const dmg = Math.max(1, Math.round(base - m.def.def * 1.2));
    Effects.spawnDamage(m.x, m.y - m.h, dmg, crit ? '#ff7043' : '#ffb300', crit);
    Effects.spark(m.x, m.y - m.h / 2);
    Sound.play(crit ? 'crit' : 'hit');
    if (m.hurt(dmg, p.x)) this.onMonsterDeath(m);
  },

  onMonsterDeath(m) {
    this.player.gainExp(m.def.xp);
    Effects.poof(m.x, m.y - m.h / 2, '#ddd');
    Sound.play('mobdie');

    for (const dr of m.def.drops) {
      if (!Utils.chance(dr.p)) continue;
      if (dr.meso) {
        this.drops.push(new Drop(m.x, m.y - m.h / 2, m.plat.y, { meso: Utils.randInt(dr.meso[0], dr.meso[1]) }));
      } else {
        this.drops.push(new Drop(m.x, m.y - m.h / 2, m.plat.y, { itemId: dr.item, qty: dr.qty || 1 }));
      }
    }

    if (m.spawner) m.spawner.queue.push(this.time + m.spawner.def.respawn + Utils.rand(0, 2));

    if (m.def.boss) {
      Effects.announce('🎉 擊敗了蘑菇王！傳說寶物掉落了！', '#ffd54f');
      Sound.play('victory');
      Camera.shake(8, 0.5);
      this.save();
    }
  },

  onPlayerDeath() {
    this.state = 'dead';
    const p = this.player;
    p.exp = Math.max(0, Math.round(p.exp - expNeed(p.level) * 0.1));
    Sound.play('die');
  },

  respawn() {
    const p = this.player;
    p.dead = false;
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    p.x = this.map.spawn.x;
    p.y = this.map.spawn.y;
    p.vx = 0; p.vy = 0; p.kbVx = 0;
    p.climbing = null;
    p.invinc = 2;
    this.state = 'play';
    Camera.snap(p, this.map);
    this.save();
  },

  // ── 主更新 ──
  update(dt) {
    this.time += dt;

    if (Input.pressed['KeyM']) {
      Effects.announce(Sound.toggle() ? '🔊 音效：開' : '🔇 音效：關', '#90caf9');
    }

    if (this.state === 'title') {
      for (const m of this.monsters) m.update(dt, this);
      Effects.update(dt);
      if (Input.pressed['Enter']) {
        this.state = 'play';
        Effects.announce('歡迎來到楓之世界！打怪升級，挑戰蘑菇王吧！', '#ffe082');
      } else if (Input.pressed['KeyN'] && this.hasSave) {
        this.clearSave();
        this.hasSave = false;
        this.player = new Player(null);
        this.loadMap('meadow', null, null);
        Camera.snap(this.player, this.map);
        this.state = 'play';
        Effects.announce('開始全新的冒險！', '#ffe082');
      }
      return;
    }

    if (this.state === 'dead') {
      for (const m of this.monsters) m.update(dt, this);
      Effects.update(dt);
      if (Input.pressed['KeyR']) this.respawn();
      return;
    }

    // ── play ──
    UI.update(this, dt);
    const p = this.player;
    p.update(dt, this);
    if (this.state !== 'play') return;

    for (const m of this.monsters) m.update(dt, this);
    this.monsters = this.monsters.filter((m) => !m.dead);

    // 接觸傷害
    if (!p.dead && p.invinc <= 0) {
      const pr = p.rect();
      for (const m of this.monsters) {
        if (m.dying) continue;
        const mr = m.rect();
        if (Utils.rectsOverlap(pr.x, pr.y, pr.w, pr.h, mr.x, mr.y, mr.w, mr.h)) {
          const mult = m.def.boss && m.bState === 'dash' ? 1.35 : 1;
          p.takeDamage(m.def.atk * mult, m.x, this);
          break;
        }
      }
    }

    // 投射物
    const pr2 = p.rect();
    for (const pj of this.projectiles) {
      pj.update(dt);
      if (pj.dead) continue;
      const r = pj.rect();
      if (pj.from === 'player') {
        for (const m of this.monsters) {
          if (m.dying || pj.hitSet.has(m)) continue;
          const mr = m.rect();
          if (Utils.rectsOverlap(r.x, r.y, r.w, r.h, mr.x, mr.y, mr.w, mr.h)) {
            pj.hitSet.add(m);
            this.playerStrike(m, pj.mult);
            pj.pierce--;
            if (pj.pierce <= 0) { pj.dead = true; break; }
          }
        }
      } else if (!p.dead && p.invinc <= 0 && this.state === 'play') {
        if (Utils.rectsOverlap(r.x, r.y, r.w, r.h, pr2.x, pr2.y, pr2.w, pr2.h)) {
          p.takeDamage(pj.dmg, pj.x, this);
          pj.dead = true;
        }
      }
      if (pj.x < -60 || pj.x > this.map.w + 60) pj.dead = true;
    }
    this.projectiles = this.projectiles.filter((q) => !q.dead);

    // 掉落物
    for (const d of this.drops) d.update(dt);
    this.drops = this.drops.filter((d) => !d.dead);

    // 怪物重生
    for (const rt of this.spawnerRts) {
      while (rt.queue.length && rt.queue[0] <= this.time) {
        rt.queue.shift();
        this.spawnFromRt(rt);
      }
    }

    Effects.update(dt);
    Camera.update(p, this.map, dt);

    // 自動存檔
    this.saveTimer += dt;
    if (this.saveTimer > 12) {
      this.saveTimer = 0;
      this.save();
    }
  },

  // ── 繪製 ──
  draw(ctx) {
    const t = this.time;
    Renderer.drawBackground(ctx, this.map, Camera, t);
    Camera.begin(ctx);
    Renderer.drawMapGeometry(ctx, this.map, t);
    for (const d of this.drops) d.draw(ctx, t);
    for (const m of this.monsters) Sprites.drawMonster(ctx, m, t);
    for (const pj of this.projectiles) pj.draw(ctx, t);
    if (this.state !== 'dead') this.player.draw(ctx, t);
    Effects.drawWorld(ctx);
    Camera.end(ctx);

    Renderer.drawForeground(ctx, this.map, Camera, t);
    UI.draw(ctx, this);
    Effects.drawScreen(ctx);
    if (this.state === 'title') UI.drawTitle(ctx, this);
    if (this.state === 'dead') UI.drawDeath(ctx);
  },
};
