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
  selJob: 0,
  curSlot: 0,         // 目前使用中的存檔欄位
  pendingSlot: 0,     // slotSelect 選到的空欄位 → 建立新角色後存入
  selSlot: 0,         // slotSelect 畫面游標
  confirmDelSlot: -1, // 刪除存檔二次確認的目標欄位

  init() {
    this.migrateLegacy();
    let last = 0;
    try { last = parseInt(localStorage.getItem(CONFIG.SLOT_LAST) || '0', 10) || 0; } catch (e) {}
    this.curSlot = Math.min(Math.max(last, 0), CONFIG.SLOT_COUNT - 1);
    this.selSlot = this.curSlot;
    const save = this.loadSave();
    this.hasSave = !!save;
    this.player = new Player(save ? save.player : null);
    this.pet = new Pet('default');   // 一開始就給一隻寵物
    if (save && MapDB[save.mapId]) {
      this.loadMap(save.mapId, null, { x: save.x, y: save.y });
    } else {
      this.loadMap('meadow', null, null);
    }
    // 開發用：網址 #play 或 #play-forest 直接進入指定地圖（截圖/測試）
    // 可加場景旗標 #play-town;inv / ;shop / ;settings / ;bigmap / ;stat / ;craft
    const hash = (typeof location !== 'undefined' && location.hash) || '';
    if (hash === '#slots') { this.state = 'slotSelect'; }
    const mm = hash.match(/^#play(?:-(\w+))?(?:;(\w+))?$/);
    if (mm) {
      if (mm[1] && MapDB[mm[1]]) this.loadMap(mm[1], null, null);
      this.state = 'play';
      const sc = mm[2];
      if (sc === 'inv') { this.player.addItem('mapleSword'); this.player.addItem('dragonHelm'); this.player.addItem('windBoots'); UI.show.inv = true; }
      else if (sc === 'shop') { UI.openShop(); }
      else if (sc === 'settings') { UI.show.settings = true; }
      else if (sc === 'bigmap') { UI.mapExpanded = true; }
      else if (sc === 'stat') { UI.show.stat = true; }
      else if (sc === 'craft') { UI.show.craft = true; }
      else if (sc === 'sell') {
        this.player.addItem('redPotion', 20);
        UI.openShop(); UI.shopTab = 'sell';
        UI.sellSel = { slot: this.player.inventory.findIndex((s) => s && s.id === 'redPotion'), qty: 5 };
        UI.confirmSell = true;
      }
      else if (sc === 'sellmat') {
        this.player.addItem('slimeGel', 15);
        UI.openShop(); UI.shopTab = 'sell';
        UI.sellSel = { slot: this.player.inventory.findIndex((s) => s && s.id === 'slimeGel'), qty: 5 };
      }
      else if (sc === 'difftip') {
        this.player.addItem('mapleSword');   // 比目前木劍更強，tooltip 顯示 ▲ 差距
        UI.show.inv = true;
        if (typeof Input !== 'undefined') { Input.mouseX = 806; Input.mouseY = 152; }
      }
      else if (sc === 'skill') { this.player.level = 70; this.player.jobRank = 3; this.player.sp = 10; UI.show.skill = true; }
      else if (sc === 'elder') { this.player.level = 35; UI.show.dialogue = true; UI.dlgNpc = 'elder'; }
    }
    if (hash === '#name') { this.state = 'classSelect'; }
    // 動畫示範：#anim-walk / #anim-swing / #anim-cast（截圖驗證動畫流暢度用）
    const am = hash.match(/^#anim-(\w+)$/);
    if (am) {
      this.animDemo = am[1];
      if (am[1] === 'cast') { this.player = new Player(null, 'magician', '示範'); this.player.mp = 99999; }
      this.loadMap('meadow', null, null);
      this.player.x = 360; this.player.y = 560; this.player.invinc = 1e9;
      Camera.snap(this.player, this.map);
      this.state = 'play';
    }
    Camera.snap(this.player, this.map);
  },

  // ── 存檔（多角色欄位）──
  slotKey(i) { return CONFIG.SLOT_PREFIX + i; },

  // 把舊版單一存檔搬進欄位 0（只做一次）
  migrateLegacy() {
    try {
      if (localStorage.getItem(this.slotKey(0))) return;
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      if (raw) localStorage.setItem(this.slotKey(0), raw);
    } catch (e) {}
  },

  loadSlot(i) {
    try {
      const raw = localStorage.getItem(this.slotKey(i));
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || s.v !== 1 || !s.player) return null;
      return s;
    } catch (e) { return null; }
  },

  loadSave() { return this.loadSlot(this.curSlot); },   // 既有 API（測試/初始化用）

  // 欄位摘要（給 slotSelect 畫面顯示）
  slotMeta(i) {
    const s = this.loadSlot(i);
    if (!s) return null;
    const p = s.player || {};
    const jd = JobDB[p.job] || JobDB.warrior;
    const rank = p.jobRank || 1;
    return {
      job: p.job || 'warrior',
      name: p.name || (jd.name + '勇者'),
      rankName: (jd.ranks && jd.ranks[rank - 1]) || jd.name,
      level: p.level || 1,
      meso: p.meso || 0,
      mapName: (MapDB[s.mapId] || {}).name || '未知之地',
    };
  },

  save() {
    try {
      localStorage.setItem(this.slotKey(this.curSlot), JSON.stringify({
        v: 1,
        mapId: this.mapId,
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        player: this.player.serialize(),
      }));
      localStorage.setItem(CONFIG.SLOT_LAST, String(this.curSlot));
    } catch (e) { /* 隱私模式等情況忽略 */ }
  },

  clearSave() {
    try { localStorage.removeItem(this.slotKey(this.curSlot)); } catch (e) {}
  },
  deleteSlot(i) {
    try { localStorage.removeItem(this.slotKey(i)); } catch (e) {}
  },

  // 從 slotSelect 進入：有存檔→讀取續玩；空欄位→建立新角色
  selectSlot(i) {
    this.curSlot = i;
    const save = this.loadSlot(i);
    if (save) {
      this.player = new Player(save.player);
      this.hasSave = true;
      const mid = (save.mapId && MapDB[save.mapId]) ? save.mapId : 'meadow';
      this.loadMap(mid, null, save.mapId ? { x: save.x, y: save.y } : null);
      Camera.snap(this.player, this.map);
      try { localStorage.setItem(CONFIG.SLOT_LAST, String(i)); } catch (e) {}
      this.state = 'play';
      Effects.announce('歡迎回來，繼續你的冒險！', '#ffe082');
    } else {
      this.pendingSlot = i;
      this.selJob = 0;
      this.state = 'classSelect';
    }
  },

  // 設定頁：回到標題的存檔清單（自動先存檔）
  returnToTitle() {
    if (this.state === 'play') this.save();
    UI.closeAll();
    this.selSlot = this.curSlot;
    this.confirmDelSlot = -1;
    this.state = 'slotSelect';
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
    if (this.pet) this.pet.reset(p);

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
    this.player.onKill(m.type);
    Effects.poof(m.x, m.y - m.h / 2, '#ddd');
    Sound.play('mobdie');

    for (const dr of m.def.drops) {
      if (!Utils.chance(dr.p)) continue;
      if (dr.meso) {
        this.drops.push(new Drop(m.x, m.y - m.h / 2, m.plat.y, { meso: Utils.randInt(dr.meso[0], dr.meso[1]) }));
      } else {
        const roll = (ItemDB[dr.item] && ItemDB[dr.item].type === 'equip') ? rollEquip(dr.item) : null;
        this.drops.push(new Drop(m.x, m.y - m.h / 2, m.plat.y, { itemId: dr.item, qty: dr.qty || 1, roll }));
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
      if (Input.pressed['Enter'] || Input.pressed['Space'] || Input.clicked) {
        this.selSlot = this.curSlot;
        this.confirmDelSlot = -1;
        this.state = 'slotSelect';
      }
      return;
    }

    if (this.state === 'slotSelect') {
      for (const m of this.monsters) m.update(dt, this);
      Effects.update(dt);
      const n = CONFIG.SLOT_COUNT;
      if (Input.pressed['ArrowUp']) { this.selSlot = (this.selSlot + n - 1) % n; this.confirmDelSlot = -1; Sound.play('equip'); }
      if (Input.pressed['ArrowDown']) { this.selSlot = (this.selSlot + 1) % n; this.confirmDelSlot = -1; Sound.play('equip'); }
      if (Input.pressed['Escape']) { this.state = 'title'; return; }
      // 滑鼠：點欄位讀取 / 點垃圾桶刪除（二次確認）
      if (Input.clicked && UI.slotRects) {
        for (let i = 0; i < (UI.slotDelRects || []).length; i++) {
          if (UI.slotDelRects[i] && UI.inRect(UI.slotDelRects[i])) {
            if (this.confirmDelSlot === i) { this.deleteSlot(i); this.confirmDelSlot = -1; Sound.play('error'); }
            else { this.confirmDelSlot = i; Sound.play('equip'); }
            return;
          }
        }
        for (let i = 0; i < UI.slotRects.length; i++) {
          if (UI.inRect(UI.slotRects[i])) { this.selSlot = i; this.selectSlot(i); return; }
        }
      }
      if (Input.pressed['KeyD']) {
        if (this.confirmDelSlot === this.selSlot) { this.deleteSlot(this.selSlot); this.confirmDelSlot = -1; Sound.play('error'); }
        else if (this.slotMeta(this.selSlot)) { this.confirmDelSlot = this.selSlot; Sound.play('equip'); }
      }
      if (Input.pressed['Enter'] || Input.pressed['Space']) { this.selectSlot(this.selSlot); return; }
      return;
    }

    if (this.state === 'classSelect') {
      for (const m of this.monsters) m.update(dt, this);
      Effects.update(dt);
      if (Input.pressed['ArrowLeft']) { this.selJob = (this.selJob + JOB_ORDER.length - 1) % JOB_ORDER.length; Sound.play('equip'); }
      if (Input.pressed['ArrowRight']) { this.selJob = (this.selJob + 1) % JOB_ORDER.length; Sound.play('equip'); }
      if (Input.pressed['Escape']) { this.state = 'slotSelect'; return; }
      if (Input.pressed['Enter'] || Input.pressed['Space']) {
        // 進入命名畫面
        Input.textActive = true;
        Input.textValue = JobDB[JOB_ORDER[this.selJob]].name + '勇者';
        this.state = 'nameInput';
        Sound.play('equip');
      }
      return;
    }

    if (this.state === 'nameInput') {
      for (const m of this.monsters) m.update(dt, this);
      Effects.update(dt);
      if (Input.pressed['Escape']) { Input.textActive = false; this.state = 'classSelect'; return; }
      if (Input.pressed['Enter']) {
        const job = JOB_ORDER[this.selJob];
        const name = (Input.textValue || '').trim() || (JobDB[job].name + '勇者');
        Input.textActive = false;
        this.curSlot = this.pendingSlot;
        this.player = new Player(null, job, name);
        this.loadMap('meadow', null, null);
        Camera.snap(this.player, this.map);
        this.state = 'play';
        this.hasSave = true;
        this.save();
        Effects.announce(`${name} 踏上了冒險旅程！`, '#ffe082');
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
    // 設定 / 放大地圖開啟時暫停世界（避免在選單中被怪攻擊）
    if (UI.show.settings || UI.mapExpanded) { Effects.update(dt); return; }
    // 動畫示範模式：自動注入輸入並把角色固定在畫面中央
    if (this.animDemo) {
      if (this.animDemo === 'walk') Input.down['ArrowRight'] = true;
      else if (this.animDemo === 'swing') Input.pressed['KeyX'] = true;
      else if (this.animDemo === 'cast') { Input.pressed[SKILL_BAR_KEYS[0]] = true; p.mp = p.maxMp; }
      p.invinc = 1e9;
    }
    p.update(dt, this);
    if (this.animDemo) { p.x = 360; p.kbVx = 0; }
    if (this.state !== 'play') return;

    for (const m of this.monsters) m.update(dt, this);
    this.monsters = this.monsters.filter((m) => !m.dead);

    if (this.pet) this.pet.update(dt, this);

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
            const fxStyle = pj.style === 'fire' ? 'fire' : pj.style === 'ice' ? 'ice' : pj.style === 'star' ? 'shadow' : 'arcane';
            Effects.explosion(pj.x, pj.y, fxStyle, pj.style === 'fire' ? 1.08 : 0.9);
            pj.pierce--;
            if (pj.pierce <= 0) { pj.dead = true; break; }
          }
        }
      } else if (!p.dead && p.invinc <= 0 && this.state === 'play') {
        if (Utils.rectsOverlap(r.x, r.y, r.w, r.h, pr2.x, pr2.y, pr2.w, pr2.h)) {
          p.takeDamage(pj.dmg, pj.x, this);
          Effects.explosion(pj.x, pj.y, pj.kind === 'shock' ? 'fire' : 'arcane', 0.95);
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
    Sound.startBgm(this.map.theme);

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
    if (this.map.npcs) for (const n of this.map.npcs) Sprites.drawNpc(ctx, n, t);
    for (const d of this.drops) d.draw(ctx, t);
    for (const m of this.monsters) Sprites.drawMonster(ctx, m, t);
    for (const pj of this.projectiles) pj.draw(ctx, t);
    if (this.pet && this.state !== 'dead') this.pet.draw(ctx, t);
    if (this.state !== 'dead') this.player.draw(ctx, t);
    Effects.drawWorld(ctx);
    Camera.end(ctx);

    Renderer.drawForeground(ctx, this.map, Camera, t);
    UI.draw(ctx, this);
    Effects.drawScreen(ctx);
    if (this.state === 'title') UI.drawTitle(ctx, this);
    if (this.state === 'slotSelect') UI.drawSlotSelect(ctx, this);
    if (this.state === 'classSelect') UI.drawClassSelect(ctx, this);
    if (this.state === 'nameInput') UI.drawNameInput(ctx, this);
    if (this.state === 'dead') UI.drawDeath(ctx);
  },
};
