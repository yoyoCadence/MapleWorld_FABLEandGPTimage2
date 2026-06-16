// HUD 與所有遊戲視窗（奇幻 RPG 風格外觀；佈局與點擊判定座標不變）
const UI = {
  show: { inv: false, skill: false, stat: false, shop: false, craft: false, dialogue: false, settings: false },
  R: {},
  confirmReset: 0,
  invTab: 'all',
  shopTab: 'buy',
  craftTab: 'craft',  // 鐵匠視窗分頁：製作 / 強化
  enhSel: -1,         // 強化選中的背包格索引
  sellSel: null,    // 賣出數量選擇：{ slot, qty }
  confirmSell: false, // 賣出最終確認視窗
  buySel: null,     // 購買消耗品數量選擇：{ i, qty }
  confirmBuy: -1,   // 購買武器確認視窗（_curBuy 的索引；-1=無）
  buyScroll: 0,     // 購買清單捲動位移
  sellScroll: 0,    // 賣出清單捲動位移
  shopId: 'merchant', // 目前商店（決定販售清單）
  dlgNpc: null,     // 對話中的 NPC id
  winPos: {},       // 視窗拖曳後的位置覆寫：{ inv:{x,y}, shop:{x,y}, ... }
  drag: null,       // 視窗拖曳中：{ win, dx, dy }
  press: null,      // 按住可拖曳元件（道具/技能）等待判定拖曳或點擊
  dragGhost: null,  // 拖曳中的元件：{ kind:'skill'|'item', id, slot }
  mapExpanded: false, // 小地圖是否放大
  questCollapsed: false,
  assignQuick: -1,  // 正在指定快捷鍵的欄位（-1 = 無）
  slotRects: null,
  slotDelRects: null,
  INV_TABS: [['all', '全部'], ['use', '消耗'], ['equip', '裝備'], ['material', '材料']],
  SHOP_TABS: [['buy', '購買'], ['sell', '賣出'], ['expand', '背包格']],
  SHOP_NAMES: { merchant: '🛒 雜貨商人', potion: '🧪 藥水商店', equip: '⚔ 裝備商店', pet: '🐾 寵物商店' },
  // 各店家販售清單（id -> 售價）。裝備售價偏高、消耗品固定價。
  POTIONS: [
    ['redPotion', 30], ['orangePotion', 90], ['whitePotion', 300],
    ['bluePotion', 40], ['manaElixir', 200], ['elixir', 400],
    ['powerElixir', 1200], ['returnScroll', 150],
  ],
  // 各職業基礎武器（一般雜貨店也少量供應，價格依攻擊力）
  JOB_WEAPONS: {
    warrior:  [['woodSword', 80], ['ironSword', 360]],
    magician: [['beginnerWand', 80], ['mapleWand', 360]],
    archer:   [['beginnerBow', 80], ['hunterBow', 360]],
    thief:    [['beginnerDagger', 80], ['steelDagger', 360]],
    pirate:   [['beginnerKnuckle', 80], ['ironKnuckle', 360]],
  },
  // 裝備店：各職基礎/中階武器 + 基礎防具（售價用參考價）
  EQUIP_STOCK: [
    'woodSword', 'ironSword', 'beginnerWand', 'mapleWand', 'beginnerBow', 'hunterBow',
    'beginnerDagger', 'steelDagger', 'beginnerKnuckle', 'ironKnuckle',
    'leafHat', 'travelTop', 'clothPants', 'strawShoes', 'clothGloves', 'woodShield', 'travelCape',
    'ironHelm', 'ironArmor', 'ironGreaves', 'leatherBoots', 'battleGloves', 'ironShield', 'leatherBelt',
  ],
  PET_STOCK: [['petPig', 1500], ['petFox', 4000]],

  // 依目前店家（this.shopId）組出購買清單 [{id, price}]
  _buyList() {
    const p = (typeof Game !== 'undefined' && Game.player) ? Game.player : null;
    const job = p ? p.job : 'warrior';
    const toObj = (arr) => arr.map((w) => ({ id: w[0], price: w[1] }));
    if (this.shopId === 'potion') return toObj(this.POTIONS);
    if (this.shopId === 'pet') return toObj(this.PET_STOCK);
    if (this.shopId === 'equip') return this.EQUIP_STOCK.map((id) => ({ id, price: Math.round(this._valueOf(id) * 1.25) }));
    // 一般雜貨店：消耗品 + 該職業基礎武器
    return toObj(this.POTIONS).concat(toObj(this.JOB_WEAPONS[job] || []));
  },

  closeAll() {
    for (const k in this.show) this.show[k] = false;
    this.sellSel = null;
    this.confirmSell = false;
    this.drag = null;
    this.assignQuick = -1;
    this.mapExpanded = false;
  },

  inRect(r) {
    return r && Input.mouseX >= r.x && Input.mouseX <= r.x + r.w &&
           Input.mouseY >= r.y && Input.mouseY <= r.y + r.h;
  },

  openShop(shopId) {
    this.show.shop = true; this.shopTab = 'buy';
    this.shopId = shopId || 'merchant';
    this.sellSel = null; this.confirmSell = false; this.buySel = null; this.confirmBuy = -1;
    this.buyScroll = 0; this.sellScroll = 0;
    Sound.play('portal');
  },
  openNpc(n) {
    const def = (typeof NpcDB !== 'undefined' && NpcDB[n.id]) || { type: 'shop' };
    if (def.type === 'shop') this.openShop(def.shop || 'merchant');
    else if (def.type === 'craft') { this.show.craft = true; Sound.play('portal'); }
    else { this.show.dialogue = true; this.dlgNpc = n.id; Sound.play('portal'); }
  },
  _npcQuests(npcId) {
    const out = [];
    for (const qid of QUEST_ORDER) if (QuestDB[qid].giver === npcId) out.push(qid);
    return out;
  },
  _questStatus(qid, p) {
    const d = QuestDB[qid], st = p.quests[qid];
    if (st && st.s === 'done') return 'done';
    if (st && st.s === 'active') return p.canCompleteQuest(qid) ? 'complete' : 'active';
    const lvOk = p.level >= (d.reqLv || 1);
    const prevOk = !d.prev || (p.quests[d.prev] && p.quests[d.prev].s === 'done');
    return (lvOk && prevOk) ? 'available' : 'locked';
  },
  _cat(id) { const d = ItemDB[id]; return d ? d.type : 'use'; },
  _valueOf(id) {
    const d = ItemDB[id];
    if (!d) return 10;
    const pot = this.POTIONS.find((b) => b[0] === id);  // 固定價表（避免與 _buyList 互相遞迴）
    if (pot) return pot[1];
    if (d.type === 'use') return Math.max(10, Math.round(((d.heal || 0) + (d.mpHeal || 0)) / 6));
    if (d.type === 'material') return 25;
    if (d.type === 'pet') return 1500;
    return equipValue(id);
  },
  _sellOf(id) { return Math.max(1, Math.floor(this._valueOf(id) * 0.6)); },
  _expandCost(p) {
    const done = Math.round((p.invSize - CONFIG.INV_SIZE) / CONFIG.INV_EXPAND_STEP);
    return 800 * (done + 1);
  },

  _skillList() {
    return (typeof Game !== 'undefined' && Game.player) ? Game.player.skillList() : SKILL_ORDER;
  },

  // ── UI 皮膚素材（缺檔自動回退程序化繪製）──
  _uiImg(name) { return Sprites._loadImage(Sprites.ASSET_BASE + 'ui/' + name); },
  _uiReady(img) { return Sprites._readyImage(img); },
  _nineSlice(ctx, img, x, y, w, h, c) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const cx = Math.min(c, Math.floor(w / 2)), cy = Math.min(c, Math.floor(h / 2));
    const mw = iw - 2 * c, mh = ih - 2 * c;
    const dmw = w - 2 * cx, dmh = h - 2 * cy;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, c, c, x, y, cx, cy);
    ctx.drawImage(img, iw - c, 0, c, c, x + w - cx, y, cx, cy);
    ctx.drawImage(img, 0, ih - c, c, c, x, y + h - cy, cx, cy);
    ctx.drawImage(img, iw - c, ih - c, c, c, x + w - cx, y + h - cy, cx, cy);
    if (dmw > 0) {
      ctx.drawImage(img, c, 0, mw, c, x + cx, y, dmw, cy);
      ctx.drawImage(img, c, ih - c, mw, c, x + cx, y + h - cy, dmw, cy);
    }
    if (dmh > 0) {
      ctx.drawImage(img, 0, c, c, mh, x, y + cy, cx, dmh);
      ctx.drawImage(img, iw - c, c, c, mh, x + w - cx, y + cy, cx, dmh);
    }
    if (dmw > 0 && dmh > 0) ctx.drawImage(img, c, c, mw, mh, x + cx, y + cy, dmw, dmh);
  },

  // 套用拖曳後的位置覆寫；夾在畫面內避免標題列被拖出去抓不回來
  _win(name, x, y, w, h) {
    const o = this.winPos[name];
    let rx = o ? o.x : x, ry = o ? o.y : y;
    rx = Utils.clamp(rx, -w + 60, CONFIG.CANVAS_W - 60);
    ry = Utils.clamp(ry, 0, CONFIG.CANVAS_H - 34);
    return { x: rx, y: ry, w, h };
  },

  layout() {
    const R = {};
    if (this.show.inv) {
      const r = this._win('inv', 660, 64, 348, 432);
      R.inv = r;
      R.invClose = { x: r.x + r.w - 26, y: r.y + 7, w: 19, h: 19 };
      // 分頁
      R.invTabs = [];
      const tw = (r.w - 24) / this.INV_TABS.length;
      this.INV_TABS.forEach((tb, i) => {
        R.invTabs.push({ key: tb[0], label: tb[1], x: r.x + 12 + i * tw, y: r.y + 34, w: tw - 4, h: 22 });
      });
      // 6x6 格 + 視圖對應
      const p = (typeof Game !== 'undefined' && Game.player) ? Game.player : null;
      const invSize = p ? p.invSize : CONFIG.INV_SIZE;
      R.invSlots = [];
      R.invCells = [];
      for (let i = 0; i < 36; i++) {
        const col = i % 6, row = Math.floor(i / 6);
        R.invSlots.push({ x: r.x + 14 + col * 54, y: r.y + 64 + row * 54, w: 48, h: 48 });
      }
      if (this.invTab === 'all') {
        for (let i = 0; i < 36; i++) R.invCells.push(i < invSize ? i : -1); // -1 = 鎖定
      } else {
        if (p) {
          for (let i = 0; i < invSize; i++) {
            const it = p.inventory[i];
            if (it && this._cat(it.id) === this.invTab) R.invCells.push(i);
          }
        }
        while (R.invCells.length < 36) R.invCells.push(null); // null = 空白
      }
    }
    if (this.show.skill) {
      const list = this._skillList();
      const rowH = 56;
      const r = this._win('skill', 28, 56, 392, 56 + list.length * rowH + 10);
      R.skill = r;
      R.skillClose = { x: r.x + r.w - 26, y: r.y + 7, w: 19, h: 19 };
      R.skillRows = [];
      R.skillPlus = [];
      R.skillBadges = [];
      list.forEach((id, i) => {
        const ry = r.y + 40 + i * rowH;
        R.skillRows.push({ x: r.x + 10, y: ry, w: r.w - 20, h: rowH - 6 });
        R.skillBadges.push({ x: r.x + 16, y: ry + 6, w: 40, h: 40 });   // 可拖曳的技能徽章
        R.skillPlus.push({ x: r.x + r.w - 46, y: ry + 12, w: 26, h: 26 });
      });
    }
    if (this.show.stat) {
      const r = this._win('stat', 372, 44, 324, 486);
      R.stat = r;
      R.statClose = { x: r.x + r.w - 26, y: r.y + 7, w: 19, h: 19 };
      R.statEquips = [];
      const cols = 4, sz = 46, gapX = 10, gapY = 22, gridY = r.y + 250, startX = r.x + 18;
      EQUIP_SLOTS.forEach((slot, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        R.statEquips.push({ slot, x: startX + col * (sz + gapX), y: gridY + row * (sz + gapY), w: sz, h: sz });
      });
    }
    if (this.show.shop) {
      const r = this._win('shop', 312, 80, 400, 432);
      R.shop = r;
      R.shopClose = { x: r.x + r.w - 26, y: r.y + 7, w: 19, h: 19 };
      R.shopTabs = [];
      const tw = (r.w - 24) / this.SHOP_TABS.length;
      this.SHOP_TABS.forEach((tb, i) => {
        R.shopTabs.push({ key: tb[0], label: tb[1], x: r.x + 12 + i * tw, y: r.y + 34, w: tw - 4, h: 24 });
      });
      R.shopRows = [];
      const top = r.y + 72;
      const viewH = r.h - 116;                       // 清單可視高度（留底部楓幣列）
      R.shopView = { x: r.x + 8, y: top, w: r.w - 16, h: viewH };
      const p = (typeof Game !== 'undefined' && Game.player) ? Game.player : null;
      this._curBuy = this._buyList();
      if (this.shopTab === 'buy') {
        const rowH = 42;
        const contentH = this._curBuy.length * rowH;
        const maxScroll = Math.max(0, contentH - viewH);
        this.buyScroll = Utils.clamp(this.buyScroll, 0, maxScroll);
        const sbW = maxScroll > 0 ? 12 : 0;
        this._curBuy.forEach((b, i) => R.shopRows.push({ kind: 'buy', i, x: r.x + 12, y: top - this.buyScroll + i * rowH, w: r.w - 24 - sbW, h: rowH - 6 }));
        if (maxScroll > 0) R.shopScroll = { x: r.x + r.w - 16, y: top, w: 8, h: viewH, contentH, scroll: this.buyScroll, maxScroll };
        // 購買數量彈窗（消耗品）
        if (this.buySel) {
          const pop = { x: r.x + 36, y: r.y + 150, w: r.w - 72, h: 168 };
          R.buyPop = pop;
          const by = pop.y + 70, bw = 36, bh = 30, cx = pop.x + pop.w / 2;
          R.buyMinus10 = { x: cx - 118, y: by, w: bw, h: bh };
          R.buyMinus = { x: cx - 74, y: by, w: bw, h: bh };
          R.buyPlus = { x: cx + 38, y: by, w: bw, h: bh };
          R.buyPlus10 = { x: cx + 82, y: by, w: bw, h: bh };
          const ry = pop.y + pop.h - 40, bw3 = (pop.w - 40) / 3;
          R.buyAll = { x: pop.x + 12, y: ry, w: bw3, h: 30 };
          R.buyOk = { x: pop.x + 20 + bw3, y: ry, w: bw3, h: 30 };
          R.buyCancel = { x: pop.x + 28 + 2 * bw3, y: ry, w: bw3, h: 30 };
        }
        // 購買確認視窗（裝備 / 寵物）
        if (this.confirmBuy >= 0) {
          const cw = 290, ch = 150, cwx = r.x + (r.w - cw) / 2, cwy = r.y + (r.h - ch) / 2;
          R.buyConfirmWin = { x: cwx, y: cwy, w: cw, h: ch };
          const yw = (cw - 50) / 2;
          R.buyYes = { x: cwx + 20, y: cwy + ch - 44, w: yw, h: 32 };
          R.buyNo = { x: cwx + 30 + yw, y: cwy + ch - 44, w: yw, h: 32 };
        }
      } else if (this.shopTab === 'sell' && p) {
        const rowH = 58;
        let n = 0;
        const slots = [];
        for (let i = 0; i < p.invSize; i++) { if (p.inventory[i]) slots.push(i); }
        const rows = Math.ceil(slots.length / 6);
        const contentH = rows * rowH;
        const maxScroll = Math.max(0, contentH - viewH);
        this.sellScroll = Utils.clamp(this.sellScroll, 0, maxScroll);
        slots.forEach((i) => {
          const col = n % 6, row = Math.floor(n / 6);
          R.shopRows.push({ kind: 'sell', slot: i, x: r.x + 18 + col * 61, y: top - this.sellScroll + row * rowH, w: 50, h: 50 });
          n++;
        });
        if (maxScroll > 0) R.shopScroll = { x: r.x + r.w - 16, y: top, w: 8, h: viewH, contentH, scroll: this.sellScroll, maxScroll };
        // 數量選擇彈窗
        if (this.sellSel) {
          const pop = { x: r.x + 36, y: r.y + 150, w: r.w - 72, h: 168 };
          R.sellPop = pop;
          const by = pop.y + 70, bw = 36, bh = 30, cx = pop.x + pop.w / 2;
          R.sellMinus10 = { x: cx - 118, y: by, w: bw, h: bh };
          R.sellMinus = { x: cx - 74, y: by, w: bw, h: bh };
          R.sellPlus = { x: cx + 38, y: by, w: bw, h: bh };
          R.sellPlus10 = { x: cx + 82, y: by, w: bw, h: bh };
          const ry = pop.y + pop.h - 40, bw3 = (pop.w - 40) / 3;
          R.sellAll = { x: pop.x + 12, y: ry, w: bw3, h: 30 };
          R.sellConfirm = { x: pop.x + 20 + bw3, y: ry, w: bw3, h: 30 };
          R.sellCancel = { x: pop.x + 28 + 2 * bw3, y: ry, w: bw3, h: 30 };
          // 最終確認視窗
          if (this.confirmSell) {
            const cw = 280, ch = 132, cwx = r.x + (r.w - cw) / 2, cwy = r.y + (r.h - ch) / 2;
            R.sellConfirmWin = { x: cwx, y: cwy, w: cw, h: ch };
            const yw = (cw - 50) / 2;
            R.sellYes = { x: cwx + 20, y: cwy + ch - 44, w: yw, h: 32 };
            R.sellNo = { x: cwx + 30 + yw, y: cwy + ch - 44, w: yw, h: 32 };
          }
        }
      } else if (this.shopTab === 'expand') {
        R.shopExpandBtn = { x: r.x + 50, y: top + 132, w: r.w - 100, h: 42 };
      }
    }
    if (this.show.craft) {
      const r = this._win('craft', 300, 56, 424, 492);
      R.craft = r;
      R.craftClose = { x: r.x + r.w - 26, y: r.y + 7, w: 19, h: 19 };
      R.craftTabs = [];
      const ctw = (r.w - 24) / 2;
      [['craft', '🔨 製作'], ['enhance', '✨ 強化']].forEach((tb, i) => {
        R.craftTabs.push({ key: tb[0], label: tb[1], x: r.x + 12 + i * ctw, y: r.y + 34, w: ctw - 4, h: 24 });
      });
      if (this.craftTab === 'craft') {
        R.craftRows = [];
        CRAFT_ORDER.forEach((cid, i) => {
          const ry = r.y + 70 + i * 50;
          R.craftRows.push({ cid, x: r.x + 12, y: ry, w: r.w - 24, h: 46, btn: { x: r.x + r.w - 76, y: ry + 10, w: 60, h: 28 } });
        });
      } else {
        // 強化分頁：背包中所有裝備的格子 + 強化按鈕
        const p = (typeof Game !== 'undefined' && Game.player) ? Game.player : null;
        R.enhCells = [];
        if (p) {
          let n = 0;
          for (let i = 0; i < p.invSize; i++) {
            const it = p.inventory[i];
            if (it && ItemDB[it.id] && ItemDB[it.id].type === 'equip') {
              const col = n % 7, row = Math.floor(n / 7);
              R.enhCells.push({ idx: i, x: r.x + 16 + col * 56, y: r.y + 74 + row * 50, w: 46, h: 46 });
              n++;
            }
          }
        }
        R.enhBtn = { x: r.x + r.w / 2 - 78, y: r.y + r.h - 46, w: 156, h: 34 };
      }
    }
    if (this.show.dialogue && this.dlgNpc) {
      const r = this._win('dlg', 268, 70, 488, 396);
      R.dlg = r;
      R.dlgClose = { x: r.x + r.w - 26, y: r.y + 7, w: 19, h: 19 };
      R.dlgQuests = [];
      const top = r.y + 96;
      this._npcQuests(this.dlgNpc).forEach((qid, i) => {
        const ry = top + i * 66;
        R.dlgQuests.push({ qid, x: r.x + 14, y: ry, w: r.w - 28, h: 60, btn: { x: r.x + r.w - 96, y: ry + 17, w: 78, h: 28 } });
      });
      // 轉職按鈕（村長）
      const def = NpcDB[this.dlgNpc];
      if (def && def.advance) R.dlgAdvance = { x: r.x + r.w / 2 - 90, y: r.y + r.h - 44, w: 180, h: 32 };
    }
    // ── 設定視窗 ──
    if (this.show.settings) {
      const r = this._win('settings', 352, 86, 320, 470);
      R.settings = r;
      R.settingsClose = { x: r.x + r.w - 26, y: r.y + 7, w: 19, h: 19 };
      const bx = r.x + 24, bw = r.w - 48; let by = r.y + 52;
      R.setResume = { x: bx, y: by, w: bw, h: 38 }; by += 48;
      R.setSound = { x: bx, y: by, w: bw, h: 38 }; by += 48;
      R.setReload = { x: bx, y: by, w: bw, h: 38 }; by += 48;
      R.setTitle = { x: bx, y: by, w: bw, h: 38 }; by += 56;
      R.setDelete = { x: bx, y: by, w: bw, h: 38 };
    }
    // ── 小地圖（右上角）+ 放大視窗 ──
    R.miniMap = { x: CONFIG.CANVAS_W - 182, y: 44, w: 170, h: 110 };
    if (this.mapExpanded) {
      const w = 640, h = 400;
      R.bigMap = { x: (CONFIG.CANVAS_W - w) / 2, y: (CONFIG.CANVAS_H - h) / 2, w, h };
      R.bigMapClose = { x: R.bigMap.x + w - 26, y: R.bigMap.y + 7, w: 19, h: 19 };
    }
    // ── 技能快捷列（HUD 底部中央 6 格，可拖曳技能進來綁定按鍵）──
    R.skillBar = [];
    const ssz = 40, sgap = 5, scount = SKILL_BAR_KEYS.length;
    const sTotal = scount * ssz + (scount - 1) * sgap;
    const sX = Math.round((CONFIG.CANVAS_W - sTotal) / 2) + 64;
    const sY = CONFIG.CANVAS_H - 61;
    for (let i = 0; i < scount; i++) R.skillBar.push({ x: sX + i * (ssz + sgap), y: sY, w: ssz, h: ssz, k: i });
    // ── 消耗品快捷欄（HUD 底部右側 3 格）──
    R.quick = [];
    const qsz = 40, qy = CONFIG.CANVAS_H - 61;
    for (let i = 0; i < 3; i++) R.quick.push({ x: 1010 - (2 - i) * (qsz + 5) - qsz, y: qy, w: qsz, h: qsz, k: i });
    // ── 任務追蹤摺疊鈕 ──
    R.questToggle = { x: 12, y: 44, w: 210, h: 20 };
    this.R = R;
  },

  _anyWindow() {
    return this.show.inv || this.show.skill || this.show.stat || this.show.shop ||
           this.show.craft || this.show.dialogue || this.show.settings || this.mapExpanded ||
           this.sellSel || this.assignQuick >= 0;
  },

  // 點到視窗標題列即開始拖曳（避開關閉鈕）
  _tryStartDrag() {
    const R = this.R;
    const wins = [
      ['inv', R.inv, R.invClose], ['skill', R.skill, R.skillClose], ['stat', R.stat, R.statClose],
      ['shop', R.shop, R.shopClose], ['craft', R.craft, R.craftClose], ['dlg', R.dlg, R.dlgClose],
      ['settings', R.settings, R.settingsClose],
    ];
    for (const w of wins) {
      const r = w[1], close = w[2];
      if (!r) continue;
      if (close && this.inRect(close)) continue;
      if (Input.mouseX >= r.x && Input.mouseX <= r.x + r.w && Input.mouseY >= r.y && Input.mouseY <= r.y + 30) {
        this.drag = { win: w[0], dx: Input.mouseX - r.x, dy: Input.mouseY - r.y };
        return true;
      }
    }
    return false;
  },

  // 滑鼠按下處是否為可拖曳元件（技能徽章 / 背包道具）
  _draggableAt(game) {
    if (this.show.settings || this.mapExpanded) return null;
    const R = this.R, p = game.player;
    if (this.show.skill && R.skillBadges) {
      const list = this._skillList();
      for (let i = 0; i < R.skillBadges.length; i++) {
        if (this.inRect(R.skillBadges[i])) {
          const id = list[i];
          if (id && p.skillUnlocked(id)) return { x: Input.mouseX, y: Input.mouseY, ghost: { kind: 'skill', id }, click: { type: 'skill' } };
          return null;
        }
      }
    }
    if (this.show.inv && R.invSlots) {
      for (let i = 0; i < R.invSlots.length; i++) {
        if (!this.inRect(R.invSlots[i])) continue;
        const idx = R.invCells[i];
        if (idx == null || idx < 0) return null;
        const it = p.inventory[idx];
        if (!it) return null;
        return { x: Input.mouseX, y: Input.mouseY, ghost: { kind: 'item', id: it.id, slot: idx }, click: { type: 'invslot', idx } };
      }
    }
    return null;
  },

  // 純點擊（沒有拖曳）時對來源元件做的動作
  _pressClick(game, pr) {
    const p = game.player, c = pr.click;
    if (c.type === 'invslot') {
      const it = p.inventory[c.idx];
      if (!it) return;
      if (this.assignQuick >= 0) {
        if (ItemDB[it.id] && ItemDB[it.id].type === 'use') {
          p.setQuick(this.assignQuick, it.id);
          Effects.announce(`已將 ${ItemDB[it.id].name} 設為快捷鍵 ${this.assignQuick + 1}`, '#a5d6a7'); Sound.play('equip');
        } else { Effects.announce('只能指定消耗品', '#ef9a9a'); Sound.play('error'); }
        this.assignQuick = -1; return;
      }
      p.useSlot(c.idx, game);
    }
    // 技能點擊：不做事（拖曳到技能列才綁定）
  },

  // 放開拖曳：判定落點並綁定
  _dropGhost(game) {
    const p = game.player, g = this.dragGhost, R = this.R;
    if (g.kind === 'skill') {
      for (const s of R.skillBar) {
        if (this.inRect(s)) {
          p.setSkillBar(s.k, g.id); Sound.play('equip');
          Effects.announce(`${SKILL_BAR_LABELS[s.k]} 鍵 → ${SkillDB[g.id].name}`, '#a5d6a7');
          return;
        }
      }
    } else if (g.kind === 'item') {
      const d = ItemDB[g.id];
      if (d && d.type === 'use') {
        for (const q of R.quick) {
          if (this.inRect(q)) {
            p.setQuick(q.k, g.id); Sound.play('equip');
            Effects.announce(`已將 ${d.name} 設為快捷鍵 ${q.k + 1}`, '#a5d6a7');
            return;
          }
        }
      }
    }
  },

  update(game, dt) {
    if (this.confirmReset > 0) this.confirmReset -= dt;
    if (Input.pressed['KeyI']) this.show.inv = !this.show.inv;
    if (Input.pressed['KeyK']) this.show.skill = !this.show.skill;
    if (Input.pressed['KeyP']) this.show.stat = !this.show.stat;
    if (Input.pressed['KeyO']) this.show.settings = !this.show.settings;
    if (Input.pressed['KeyT']) this.questCollapsed = !this.questCollapsed;
    if (Input.pressed['Escape']) {
      if (this._anyWindow()) this.closeAll();
      else this.show.settings = true;
    }
    this.layout();

    // 右鍵清除快捷欄
    if (Input.rightClicked) {
      for (const q of this.R.quick) {
        if (this.inRect(q)) { game.player.setQuick(q.k, null); this.assignQuick = -1; Sound.play('error'); break; }
      }
    }

    // 滾輪捲動商店清單
    if (Input.wheel && this.show.shop && this.R.shopView && this.inRect(this.R.shopView)) {
      if (this.shopTab === 'buy') this.buyScroll += Input.wheel;
      else if (this.shopTab === 'sell') this.sellScroll += Input.wheel;
    }

    // ── 視窗拖曳 ──
    if (this.drag) {
      if (Input.mouseDown) this.winPos[this.drag.win] = { x: Input.mouseX - this.drag.dx, y: Input.mouseY - this.drag.dy };
      else this.drag = null;
      Input.clicked = false;
      return;
    }
    if (Input.clicked && this._tryStartDrag()) { Input.clicked = false; return; }

    // ── 元件拖曳：道具→消耗品快捷欄 / 技能→技能快捷列 ──
    if (this.dragGhost) {
      if (!Input.mouseDown) { this._dropGhost(game); this.dragGhost = null; this.press = null; }
      Input.clicked = false;
      return;
    }
    if (this.press) {
      if (Input.mouseDown) {
        if (Math.abs(Input.mouseX - this.press.x) + Math.abs(Input.mouseY - this.press.y) > 6) {
          this.dragGhost = Object.assign({}, this.press.ghost);
        }
        Input.clicked = false; return;
      }
      const pr = this.press; this.press = null; this._pressClick(game, pr); Input.clicked = false; return;
    }
    if (Input.clicked) {
      const src = this._draggableAt(game);
      if (src) { this.press = src; Input.clicked = false; return; }
    }

    if (!Input.clicked) return;

    const p = game.player;
    const R = this.R;

    // ── 設定視窗（modal）──
    if (this.show.settings) {
      Input.clicked = false;
      if (this.inRect(R.settingsClose) || this.inRect(R.setResume)) { this.show.settings = false; return; }
      if (this.inRect(R.setSound)) { Effects.announce(Sound.toggle() ? '🔊 音效：開' : '🔇 音效：關', '#90caf9'); return; }
      if (this.inRect(R.setReload)) { try { location.reload(); } catch (e) {} return; }
      if (this.inRect(R.setTitle)) { Game.returnToTitle(); return; }
      if (this.inRect(R.setDelete)) {
        if (this.confirmReset > 0) { this.confirmReset = 0; Game.clearSave(); try { location.reload(); } catch (e) {} }
        else { this.confirmReset = 3; Sound.play('error'); }
        return;
      }
      if (!this.inRect(R.settings)) this.show.settings = false; // 點視窗外關閉
      return;
    }

    // ── 放大地圖（modal）──
    if (this.mapExpanded) {
      Input.clicked = false;
      this.mapExpanded = false;
      return;
    }

    if (R.shop && this.inRect(R.shop)) {
      Input.clicked = false;
      if (this.inRect(R.shopClose)) { this.show.shop = false; this.sellSel = null; this.confirmSell = false; return; }
      // 賣出數量彈窗（modal：開啟時優先處理）
      if (this.shopTab === 'sell' && this.sellSel) {
        const it = p.inventory[this.sellSel.slot];
        if (!it) { this.sellSel = null; this.confirmSell = false; return; }
        const maxq = it.qty || 1;
        this.sellSel.qty = Utils.clamp(this.sellSel.qty, 1, maxq);
        // 最終確認視窗（再一層 modal）
        if (this.confirmSell) {
          if (this.inRect(R.sellYes)) {
            const n = Math.min(this.sellSel.qty, maxq);
            const v = this._sellOf(it.id) * n;
            p.meso += v;
            it.qty -= n;
            if (it.qty <= 0) p.inventory[this.sellSel.slot] = null;
            Effects.spawnText(p.x, p.y - 70, `+${v} 楓幣`, '#ffd54f');
            Sound.play('meso');
            this.sellSel = null; this.confirmSell = false;
          } else if (this.inRect(R.sellNo)) { this.confirmSell = false; Sound.play('error'); }
          return;
        }
        if (this.inRect(R.sellMinus10)) { this.sellSel.qty = Math.max(1, this.sellSel.qty - 10); return; }
        if (this.inRect(R.sellMinus)) { this.sellSel.qty = Math.max(1, this.sellSel.qty - 1); return; }
        if (this.inRect(R.sellPlus)) { this.sellSel.qty = Math.min(maxq, this.sellSel.qty + 1); return; }
        if (this.inRect(R.sellPlus10)) { this.sellSel.qty = Math.min(maxq, this.sellSel.qty + 10); return; }
        if (this.inRect(R.sellAll)) { this.sellSel.qty = maxq; return; }
        if (this.inRect(R.sellConfirm)) { this.confirmSell = true; Sound.play('equip'); return; } // 開啟確認視窗
        if (this.inRect(R.sellCancel)) { this.sellSel = null; Sound.play('error'); return; }
        return; // modal：吞掉其他點擊
      }
      // 購買數量彈窗（消耗品，modal）
      if (this.shopTab === 'buy' && this.buySel) {
        const b = this._curBuy[this.buySel.i];
        const maxAfford = b ? Math.max(1, Math.floor(p.meso / b.price)) : 1;
        const cap = (ItemDB[b.id] && ItemDB[b.id].maxStack) || 100;
        const maxq = Math.min(maxAfford, cap);
        this.buySel.qty = Utils.clamp(this.buySel.qty, 1, maxq);
        if (this.inRect(R.buyMinus10)) { this.buySel.qty = Math.max(1, this.buySel.qty - 10); return; }
        if (this.inRect(R.buyMinus)) { this.buySel.qty = Math.max(1, this.buySel.qty - 1); return; }
        if (this.inRect(R.buyPlus)) { this.buySel.qty = Math.min(maxq, this.buySel.qty + 1); return; }
        if (this.inRect(R.buyPlus10)) { this.buySel.qty = Math.min(maxq, this.buySel.qty + 10); return; }
        if (this.inRect(R.buyAll)) { this.buySel.qty = maxq; return; }
        if (this.inRect(R.buyOk)) {
          const n = Math.min(this.buySel.qty, maxq);
          const cost = b.price * n;
          if (p.meso < cost) { Effects.announce('楓幣不足', '#ef9a9a'); Sound.play('error'); }
          else if (!p.addItem(b.id, n)) { Effects.announce('背包空間不足', '#ef9a9a'); Sound.play('error'); }
          else { p.meso -= cost; Sound.play('meso'); Effects.announce(`購買 ${ItemDB[b.id].name} x${n}`, '#a5d6a7'); this.buySel = null; }
          return;
        }
        if (this.inRect(R.buyCancel)) { this.buySel = null; Sound.play('error'); return; }
        return;
      }
      // 購買確認視窗（裝備/寵物，modal）
      if (this.shopTab === 'buy' && this.confirmBuy >= 0) {
        const b = this._curBuy[this.confirmBuy];
        if (this.inRect(R.buyYes)) {
          if (!b) { this.confirmBuy = -1; return; }
          if (p.meso < b.price) { Effects.announce('楓幣不足', '#ef9a9a'); Sound.play('error'); }
          else if (!p.addItem(b.id, 1)) { Effects.announce('背包已滿', '#ef9a9a'); Sound.play('error'); }
          else { p.meso -= b.price; Sound.play('meso'); Effects.announce(`購買 ${ItemDB[b.id].name}`, '#a5d6a7'); }
          this.confirmBuy = -1;
          return;
        }
        if (this.inRect(R.buyNo)) { this.confirmBuy = -1; Sound.play('error'); return; }
        return;
      }
      for (const tb of R.shopTabs) { if (this.inRect(tb)) { this.shopTab = tb.key; this.sellSel = null; this.confirmSell = false; this.buySel = null; this.confirmBuy = -1; Sound.play('equip'); return; } }
      if (this.shopTab === 'buy') {
        const view = R.shopView;
        for (const row of R.shopRows) {
          if (row.y < view.y - 2 || row.y + row.h > view.y + view.h + 2) continue; // 捲出可視區不可點
          if (this.inRect(row)) {
            const b = this._curBuy[row.i];
            const d = ItemDB[b.id];
            if (d && (d.type === 'equip' || d.type === 'pet')) this.confirmBuy = row.i;  // 裝備/寵物 → 確認視窗
            else this.buySel = { i: row.i, qty: 1 };                                      // 消耗品 → 數量彈窗
            Sound.play('equip');
            return;
          }
        }
      } else if (this.shopTab === 'sell') {
        const view = R.shopView;
        for (const row of R.shopRows) {
          if (row.y < view.y - 2 || row.y + row.h > view.y + view.h + 2) continue;
          if (this.inRect(row) && p.inventory[row.slot]) {
            this.sellSel = { slot: row.slot, qty: 1 };  // 開啟數量選擇
            this.confirmSell = false;
            Sound.play('equip');
            return;
          }
        }
      } else if (R.shopExpandBtn && this.inRect(R.shopExpandBtn)) {
        const cost = this._expandCost(p);
        if (p.invSize >= CONFIG.INV_MAX) { Effects.announce('背包已達上限', '#ef9a9a'); Sound.play('error'); }
        else if (p.meso < cost) { Effects.announce('楓幣不足', '#ef9a9a'); Sound.play('error'); }
        else { p.expandInv(CONFIG.INV_EXPAND_STEP); p.meso -= cost; Sound.play('equip'); Effects.announce(`背包格數 +${CONFIG.INV_EXPAND_STEP}！`, '#a5d6a7'); }
      }
      return;
    }
    if (R.craft && this.inRect(R.craft)) {
      Input.clicked = false;
      if (this.inRect(R.craftClose)) { this.show.craft = false; return; }
      for (const tb of R.craftTabs) { if (this.inRect(tb)) { this.craftTab = tb.key; this.enhSel = -1; Sound.play('equip'); return; } }
      if (this.craftTab === 'craft') {
        for (const row of R.craftRows) {
          if (this.inRect(row.btn)) {
            const res = p.craft(row.cid);
            if (res === 'meso') { Effects.announce('楓幣不足', '#ef9a9a'); Sound.play('error'); }
            else if (res === 'mats') { Effects.announce('材料不足', '#ef9a9a'); Sound.play('error'); }
            else if (res === 'full') { Effects.announce('背包已滿', '#ef9a9a'); Sound.play('error'); }
            return;
          }
        }
      } else {
        // 強化分頁
        for (const c of R.enhCells) { if (this.inRect(c)) { this.enhSel = c.idx; Sound.play('equip'); return; } }
        if (R.enhBtn && this.inRect(R.enhBtn) && this.enhSel >= 0) {
          const res = p.enhance(this.enhSel);
          if (res === 'meso') { Effects.announce('楓幣不足', '#ef9a9a'); Sound.play('error'); }
          else if (res === 'mats') { Effects.announce('黃金礦石不足', '#ef9a9a'); Sound.play('error'); }
          else if (res === 'max') { Effects.announce('已達強化上限 +' + ENH_MAX, '#ffd54f'); Sound.play('error'); }
          return;
        }
      }
      return;
    }
    if (R.dlg && this.inRect(R.dlg)) {
      Input.clicked = false;
      if (this.inRect(R.dlgClose)) { this.show.dialogue = false; return; }
      if (R.dlgAdvance && this.inRect(R.dlgAdvance)) {
        if (p.canAdvance()) p.advance();
        else Effects.announce(p.jobRank >= 3 ? '已是最高轉職' : `尚未達到轉職等級（需 Lv.${p.jobRank === 1 ? 30 : 70}）`, '#ef9a9a');
        return;
      }
      for (const row of R.dlgQuests) {
        if (this.inRect(row.btn)) {
          const st = this._questStatus(row.qid, p);
          if (st === 'available') p.acceptQuest(row.qid);
          else if (st === 'complete') p.completeQuest(row.qid);
          return;
        }
      }
      return;
    }
    if (R.inv && this.inRect(R.inv)) {
      Input.clicked = false;
      if (this.inRect(R.invClose)) { this.show.inv = false; return; }
      for (const tb of R.invTabs) { if (this.inRect(tb)) { this.invTab = tb.key; Sound.play('equip'); return; } }
      R.invSlots.forEach((s, i) => {
        if (!this.inRect(s)) return;
        const idx = R.invCells[i];
        if (idx === -1) { Effects.announce('背包已滿，向商人擴充格子', '#ffd54f'); Sound.play('error'); return; }
        if (idx == null) return;
        const it = p.inventory[idx];
        // 指定快捷鍵模式：點消耗品 → 綁定
        if (this.assignQuick >= 0) {
          if (it && ItemDB[it.id] && ItemDB[it.id].type === 'use') {
            p.setQuick(this.assignQuick, it.id);
            Effects.announce(`已將 ${ItemDB[it.id].name} 設為快捷鍵 ${this.assignQuick + 1}`, '#a5d6a7');
            Sound.play('equip');
          } else { Effects.announce('只能指定消耗品', '#ef9a9a'); Sound.play('error'); }
          this.assignQuick = -1;
          return;
        }
        if (it) p.useSlot(idx, game);
      });
      return;
    }
    if (R.skill && this.inRect(R.skill)) {
      Input.clicked = false;
      if (this.inRect(R.skillClose)) { this.show.skill = false; return; }
      this._skillList().forEach((id, i) => { if (R.skillPlus[i] && this.inRect(R.skillPlus[i])) p.skillUp(id); });
      return;
    }
    if (R.stat && this.inRect(R.stat)) {
      Input.clicked = false;
      if (this.inRect(R.statClose)) { this.show.stat = false; return; }
      for (const e of R.statEquips) { if (this.inRect(e)) p.unequip(e.slot); }
      return;
    }

    // ── HUD 元件（未被視窗攔截）──
    if (!Input.clicked) return;
    if (this.inRect(R.miniMap)) { Input.clicked = false; this.mapExpanded = true; Sound.play('equip'); return; }
    if (this.inRect(R.questToggle) && (this.drawnQuestRows || 0) > 0) { Input.clicked = false; this.questCollapsed = !this.questCollapsed; return; }
    for (const q of R.quick) {
      if (this.inRect(q)) {
        Input.clicked = false;
        if (this.assignQuick === q.k) { this.assignQuick = -1; }
        else {
          this.assignQuick = q.k;
          this.show.inv = true;
          Effects.announce(`點背包中的消耗品來指定到快捷鍵 ${q.k + 1}`, '#ffd54f');
        }
        Sound.play('equip');
        return;
      }
    }
  },

  draw(ctx, game) {
    const p = game.player;
    this.layout();
    this.drawMapName(ctx, game);
    this.drawBossBar(ctx, game);
    this.drawQuestTracker(ctx, p);
    this.drawHUD(ctx, game);
    this.drawMinimap(ctx, game);
    if (this.show.inv) this.drawInv(ctx, p);
    if (this.show.skill) this.drawSkill(ctx, p);
    if (this.show.stat) this.drawStat(ctx, p);
    if (this.show.shop) this.drawShop(ctx, p);
    if (this.show.craft) this.drawCraft(ctx, p);
    if (this.show.dialogue) this.drawDialogue(ctx, p);
    if (this.show.settings) this.drawSettings(ctx, game);
    if (this.mapExpanded) this.drawBigMap(ctx, game);
    this.drawTooltip(ctx, p);
    this._drawDragGhost(ctx, p);
  },

  // ══════════════════ 奇幻風格元件 ══════════════════

  _gold(ctx, y0, y1) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#eccb7a');
    g.addColorStop(0.5, '#b8923e');
    g.addColorStop(1, '#8a6a24');
    return g;
  },

  // 鍍金奇幻面板（有 ui_panel.png 則用九宮格貼圖，否則程序化）
  panel(ctx, x, y, w, h, r) {
    const img = this._uiImg('ui_panel.png');
    if (this._uiReady(img)) { this._nineSlice(ctx, img, x, y, w, h, 16); return; }
    r = r || 10;
    const bg = ctx.createLinearGradient(0, y, 0, y + h);
    bg.addColorStop(0, 'rgba(26,30,56,0.94)');
    bg.addColorStop(1, 'rgba(14,15,32,0.94)');
    ctx.fillStyle = bg;
    Utils.rr(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.strokeStyle = this._gold(ctx, y, y + h);
    ctx.lineWidth = 2;
    Utils.rr(ctx, x, y, w, h, r);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    Utils.rr(ctx, x + 3, y + 3, w - 6, h - 6, r - 3);
    ctx.stroke();
    // 四角金色鑽飾
    ctx.fillStyle = '#d8b25e';
    for (const [cx, cy] of [[x + 7, y + 7], [x + w - 7, y + 7], [x + 7, y + h - 7], [x + w - 7, y + h - 7]]) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-2.6, -2.6, 5.2, 5.2);
      ctx.restore();
    }
  },

  chrome(ctx, r, title, closeRect) {
    this.panel(ctx, r.x, r.y, r.w, r.h);
    // 標題帶（有 ui_titlebar.png 則貼圖，否則程序化漸層）
    const tbar = this._uiImg('ui_titlebar.png');
    if (this._uiReady(tbar)) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tbar, r.x + 3, r.y + 3, r.w - 6, 27);
    } else {
      const tg = ctx.createLinearGradient(0, r.y + 2, 0, r.y + 30);
      tg.addColorStop(0, 'rgba(96,124,220,0.32)');
      tg.addColorStop(1, 'rgba(60,80,170,0.12)');
      ctx.fillStyle = tg;
      Utils.rr(ctx, r.x + 3, r.y + 3, r.w - 6, 27, 7);
      ctx.fill();
      ctx.strokeStyle = 'rgba(216,178,94,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x + 10, r.y + 30.5);
      ctx.lineTo(r.x + r.w - 10, r.y + 30.5);
      ctx.stroke();
    }
    ctx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffe9b0';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 3;
    ctx.fillText(title, r.x + 14, r.y + 22);
    ctx.shadowBlur = 0;
    // 關閉鈕（有 ui_btn_close.png 則貼圖，否則紅寶石）
    const cimg = this._uiImg('ui_btn_close.png');
    if (this._uiReady(cimg)) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(cimg, closeRect.x, closeRect.y, closeRect.w, closeRect.h);
    } else {
      const cg = ctx.createLinearGradient(0, closeRect.y, 0, closeRect.y + closeRect.h);
      cg.addColorStop(0, '#f07a5e');
      cg.addColorStop(1, '#a82a20');
      ctx.fillStyle = cg;
      Utils.rr(ctx, closeRect.x, closeRect.y, closeRect.w, closeRect.h, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,180,0.6)';
      ctx.lineWidth = 1.2;
      Utils.rr(ctx, closeRect.x, closeRect.y, closeRect.w, closeRect.h, 5);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('✕', closeRect.x + closeRect.w / 2, closeRect.y + 14);
    }
  },

  // 帶圖示的華麗能量條
  ornateBar(ctx, x, y, w, h, ratio, pal, label, icon) {
    ratio = Utils.clamp(ratio, 0, 1);
    // 框
    ctx.fillStyle = 'rgba(8,9,20,0.85)';
    Utils.rr(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(216,178,94,0.7)';
    ctx.lineWidth = 1.4;
    Utils.rr(ctx, x, y, w, h, h / 2);
    ctx.stroke();
    // 填充
    if (ratio > 0.005) {
      const fg = ctx.createLinearGradient(0, y, 0, y + h);
      fg.addColorStop(0, pal[0]);
      fg.addColorStop(0.45, pal[1]);
      fg.addColorStop(1, pal[2]);
      ctx.fillStyle = fg;
      Utils.rr(ctx, x + 1.5, y + 1.5, (w - 3) * ratio, h - 3, (h - 3) / 2);
      ctx.fill();
      // 玻璃光澤
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      Utils.rr(ctx, x + 3, y + 2, (w - 6) * ratio, (h - 4) * 0.42, (h - 4) * 0.21);
      ctx.fill();
      // 前緣亮點
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(x + 1.5 + (w - 3) * ratio - 2, y + h / 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    // 刻度
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    for (let q = 1; q < 4; q++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * q) / 4, y + 2);
      ctx.lineTo(x + (w * q) / 4, y + h - 2);
      ctx.stroke();
    }
    // 左端圖示徽章
    if (icon) {
      ctx.fillStyle = 'rgba(12,13,28,0.95)';
      ctx.beginPath();
      ctx.arc(x + 1, y + h / 2, h * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(216,178,94,0.8)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(x + 1, y + h / 2, h * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.translate(x + 1, y + h / 2);
      ctx.fillStyle = pal[0];
      if (icon === 'heart') { Art.heart(ctx, h * 0.36); ctx.fill(); }
      else if (icon === 'drop') { Art.drop(ctx, h * 0.4); ctx.fill(); }
      else { Art.star(ctx, h * 0.4); ctx.fill(); }
      ctx.restore();
    }
    // 標籤
    ctx.font = 'bold 10px Verdana';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(10,8,18,0.8)';
    ctx.strokeText(label, x + w / 2, y + h - 4);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x + w / 2, y + h - 4);
  },

  _slot(ctx, s, hover) {
    const img = this._uiImg('ui_slot.png');
    if (this._uiReady(img)) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, s.x, s.y, s.w, s.h);
      if (hover) {
        ctx.strokeStyle = 'rgba(255,222,130,0.95)';
        ctx.lineWidth = 1.8;
        Utils.rr(ctx, s.x + 1, s.y + 1, s.w - 2, s.h - 2, 7);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,222,130,0.10)';
        Utils.rr(ctx, s.x, s.y, s.w, s.h, 7);
        ctx.fill();
      }
      return;
    }
    const g = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
    g.addColorStop(0, 'rgba(10,11,24,0.9)');
    g.addColorStop(1, 'rgba(28,32,58,0.9)');
    ctx.fillStyle = g;
    Utils.rr(ctx, s.x, s.y, s.w, s.h, 7);
    ctx.fill();
    ctx.strokeStyle = hover ? 'rgba(255,222,130,0.95)' : 'rgba(120,130,180,0.35)';
    ctx.lineWidth = hover ? 1.8 : 1.2;
    Utils.rr(ctx, s.x, s.y, s.w, s.h, 7);
    ctx.stroke();
    if (hover) {
      ctx.fillStyle = 'rgba(255,222,130,0.08)';
      Utils.rr(ctx, s.x, s.y, s.w, s.h, 7);
      ctx.fill();
    }
  },

  // 裝備稀有度外框（優良以上才畫）
  _tierBorder(ctx, s, tier) {
    const col = (EQUIP_TIERS[tier] || EQUIP_TIERS[0]).color;
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    Utils.rr(ctx, s.x + 1.5, s.y + 1.5, s.w - 3, s.h - 3, 6);
    ctx.stroke();
    ctx.restore();
  },

  // ══════════════════ 視窗 ══════════════════

  // 分頁按鈕
  _tabBtn(ctx, t, active) {
    const g = ctx.createLinearGradient(0, t.y, 0, t.y + t.h);
    g.addColorStop(0, active ? 'rgba(96,124,220,0.55)' : 'rgba(255,255,255,0.05)');
    g.addColorStop(1, active ? 'rgba(56,76,160,0.35)' : 'rgba(255,255,255,0.02)');
    ctx.fillStyle = g;
    Utils.rr(ctx, t.x, t.y, t.w, t.h, 6);
    ctx.fill();
    ctx.strokeStyle = active ? 'rgba(232,196,110,0.9)' : 'rgba(120,130,180,0.3)';
    ctx.lineWidth = active ? 1.6 : 1;
    Utils.rr(ctx, t.x, t.y, t.w, t.h, 6);
    ctx.stroke();
    ctx.fillStyle = active ? '#ffeec2' : '#9aa6c0';
    ctx.font = 'bold 12px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.label, t.x + t.w / 2, t.y + t.h - 6);
  },

  drawInv(ctx, p) {
    const r = this.R.inv;
    this.chrome(ctx, r, '🎒 背包 [I]', this.R.invClose);
    for (const tb of this.R.invTabs) this._tabBtn(ctx, tb, this.invTab === tb.key);
    this.R.invSlots.forEach((s, i) => {
      const idx = this.R.invCells[i];
      if (idx === -1) {
        // 鎖定格（尚未擴充）
        ctx.globalAlpha = 0.4;
        this._slot(ctx, s, false);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(120,130,160,0.6)';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', s.x + s.w / 2, s.y + s.h / 2 + 6);
        return;
      }
      this._slot(ctx, s, this.inRect(s));
      const it = (idx != null) ? p.inventory[idx] : null;
      if (it) {
        if (it.roll && it.roll.tier > 0) this._tierBorder(ctx, s, it.roll.tier);
        Sprites.drawItemIcon(ctx, it.id, s.x + 24, s.y + 24, 40);
        if (it.roll && it.roll.enh) {
          ctx.font = 'bold 11px Verdana'; ctx.textAlign = 'left';
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
          ctx.strokeText('+' + it.roll.enh, s.x + 3, s.y + 13);
          ctx.fillStyle = '#ffe08a'; ctx.fillText('+' + it.roll.enh, s.x + 3, s.y + 13);
        }
        if (it.qty > 1) {
          ctx.font = 'bold 11px Verdana';
          ctx.textAlign = 'right';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.strokeText(it.qty, s.x + s.w - 4, s.y + s.h - 5);
          ctx.fillStyle = '#ffeec2';
          ctx.fillText(it.qty, s.x + s.w - 4, s.y + s.h - 5);
        }
      }
    });
    Sprites.drawItemIcon(ctx, 'meso', r.x + 22, r.y + r.h - 17, 20);
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd87a';
    ctx.fillText(Utils.fmt(p.meso), r.x + 36, r.y + r.h - 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a8c8';
    ctx.font = '11px "Microsoft JhengHei", sans-serif';
    ctx.fillText(`${p.invSize}/${CONFIG.INV_MAX} 格`, r.x + r.w - 14, r.y + r.h - 12);
  },

  _btn(ctx, b, label, enabled, accent) {
    const col = accent === 'green' ? ['#6cc25a', '#2e7d32'] : accent === 'red' ? ['#e8675a', '#a8281e']
      : accent === 'blue' ? ['#5a93e8', '#2a5ab0'] : ['#46506e', '#2a3048'];
    const hover = this.inRect(b);
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    g.addColorStop(0, enabled ? col[0] : 'rgba(255,255,255,0.06)');
    g.addColorStop(1, enabled ? col[1] : 'rgba(255,255,255,0.03)');
    ctx.fillStyle = g;
    Utils.rr(ctx, b.x, b.y, b.w, b.h, 6); ctx.fill();
    ctx.strokeStyle = hover && enabled ? 'rgba(255,235,170,0.9)' : 'rgba(120,130,180,0.3)';
    ctx.lineWidth = hover && enabled ? 1.6 : 1;
    Utils.rr(ctx, b.x, b.y, b.w, b.h, 6); ctx.stroke();
    ctx.fillStyle = enabled ? '#fff' : '#7a8398';
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 5);
  },

  _drawSellPopup(ctx, p) {
    const it = p.inventory[this.sellSel.slot];
    if (!it) { this.sellSel = null; return; }
    const d = ItemDB[it.id];
    const pop = this.R.sellPop;
    const maxq = it.qty || 1;
    const qty = Utils.clamp(this.sellSel.qty, 1, maxq);
    const sh = this.R.shop;
    ctx.fillStyle = 'rgba(6,8,18,0.6)';
    ctx.fillRect(sh.x + 3, sh.y + 60, sh.w - 6, sh.h - 64);
    this.panel(ctx, pop.x, pop.y, pop.w, pop.h, 10);
    Sprites.drawItemIcon(ctx, it.id, pop.x + 32, pop.y + 32, 34);
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffeec2';
    ctx.fillText(d ? d.name : it.id, pop.x + 56, pop.y + 28);
    ctx.font = '11px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#94a8c8';
    ctx.fillText(`單價 ${this._sellOf(it.id)} 楓幣　持有 ${maxq}`, pop.x + 56, pop.y + 46);
    this._btn(ctx, this.R.sellMinus10, '-10', qty > 1);
    this._btn(ctx, this.R.sellMinus, '-1', qty > 1);
    this._btn(ctx, this.R.sellPlus, '+1', qty < maxq);
    this._btn(ctx, this.R.sellPlus10, '+10', qty < maxq);
    const cx = pop.x + pop.w / 2;
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Verdana';
    ctx.fillStyle = '#fff';
    ctx.fillText(qty, cx, this.R.sellMinus.y + 22);
    ctx.font = '12px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffd87a';
    ctx.fillText(`總計 ${Utils.fmt(this._sellOf(it.id) * qty)} 楓幣`, cx, pop.y + pop.h - 50);
    this._btn(ctx, this.R.sellAll, '全部', true, 'blue');
    this._btn(ctx, this.R.sellConfirm, '賣出', true, 'green');
    this._btn(ctx, this.R.sellCancel, '取消', true, 'red');
    // 最終確認視窗
    if (this.confirmSell && this.R.sellConfirmWin) {
      const sh = this.R.shop;
      ctx.fillStyle = 'rgba(4,6,14,0.55)';
      ctx.fillRect(sh.x + 3, sh.y + 3, sh.w - 6, sh.h - 6);
      const w = this.R.sellConfirmWin;
      this.panel(ctx, w.x, w.y, w.w, w.h, 10);
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#ffeec2';
      ctx.fillText('確定賣出嗎？', w.x + w.w / 2, w.y + 36);
      ctx.font = '13px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#e8eef8';
      ctx.fillText(`${d ? d.name : it.id} x${qty}`, w.x + w.w / 2, w.y + 62);
      ctx.fillStyle = '#ffd87a';
      ctx.fillText(`可得 ${Utils.fmt(this._sellOf(it.id) * qty)} 楓幣`, w.x + w.w / 2, w.y + 84);
      this._btn(ctx, this.R.sellYes, '確定賣出', true, 'green');
      this._btn(ctx, this.R.sellNo, '取消', true, 'red');
    }
  },

  _drawBuyPopup(ctx, p) {
    const b = this._curBuy[this.buySel.i];
    if (!b) { this.buySel = null; return; }
    const d = ItemDB[b.id];
    const pop = this.R.buyPop;
    const maxq = Math.min(Math.max(1, Math.floor(p.meso / b.price)), (d && d.maxStack) || 100);
    const qty = Utils.clamp(this.buySel.qty, 1, maxq);
    const sh = this.R.shop;
    ctx.fillStyle = 'rgba(6,8,18,0.6)';
    ctx.fillRect(sh.x + 3, sh.y + 60, sh.w - 6, sh.h - 64);
    this.panel(ctx, pop.x, pop.y, pop.w, pop.h, 10);
    Sprites.drawItemIcon(ctx, b.id, pop.x + 32, pop.y + 32, 34);
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffeec2';
    ctx.fillText(d ? d.name : b.id, pop.x + 56, pop.y + 28);
    ctx.font = '11px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#94a8c8';
    ctx.fillText(`單價 ${Utils.fmt(b.price)} 楓幣　可買 ${maxq}`, pop.x + 56, pop.y + 46);
    this._btn(ctx, this.R.buyMinus10, '-10', qty > 1);
    this._btn(ctx, this.R.buyMinus, '-1', qty > 1);
    this._btn(ctx, this.R.buyPlus, '+1', qty < maxq);
    this._btn(ctx, this.R.buyPlus10, '+10', qty < maxq);
    const cx = pop.x + pop.w / 2;
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Verdana';
    ctx.fillStyle = '#fff';
    ctx.fillText(qty, cx, this.R.buyMinus.y + 22);
    ctx.font = '12px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffd87a';
    ctx.fillText(`總價 ${Utils.fmt(b.price * qty)} 楓幣`, cx, pop.y + pop.h - 50);
    this._btn(ctx, this.R.buyAll, '最多', true, 'blue');
    this._btn(ctx, this.R.buyOk, '購買', true, 'green');
    this._btn(ctx, this.R.buyCancel, '取消', true, 'red');
  },

  _drawBuyConfirm(ctx, p) {
    const b = this._curBuy[this.confirmBuy];
    if (!b) { this.confirmBuy = -1; return; }
    const d = ItemDB[b.id];
    const sh = this.R.shop;
    ctx.fillStyle = 'rgba(6,8,18,0.6)';
    ctx.fillRect(sh.x + 3, sh.y + 60, sh.w - 6, sh.h - 64);
    const w = this.R.buyConfirmWin;
    this.panel(ctx, w.x, w.y, w.w, w.h, 10);
    Sprites.drawItemIcon(ctx, b.id, w.x + 38, w.y + 40, 40);
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffeec2';
    ctx.fillText(d ? d.name : b.id, w.x + 66, w.y + 34);
    ctx.font = '11px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#a8bcd8';
    if (d && d.type === 'equip') {
      const parts = [];
      if (d.atk) parts.push('攻+' + d.atk);
      if (d.def) parts.push('防+' + d.def);
      if (d.hp) parts.push('HP+' + d.hp);
      if (d.mp) parts.push('MP+' + d.mp);
      ctx.fillText(parts.join('  ') + `　需求Lv.${d.reqLv || 1}`, w.x + 66, w.y + 52);
    } else if (d) {
      ctx.fillText(d.desc || '', w.x + 66, w.y + 52);
    }
    ctx.fillStyle = '#ffd87a';
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.fillText(`售價 ${Utils.fmt(b.price)} 楓幣　確定購買？`, w.x + 20, w.y + 86);
    this._btn(ctx, this.R.buyYes, '確定購買', p.meso >= b.price, 'green');
    this._btn(ctx, this.R.buyNo, '取消', true, 'red');
  },

  _scrollbar(ctx, sb) {
    if (!sb) return;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    Utils.rr(ctx, sb.x, sb.y, sb.w, sb.h, sb.w / 2); ctx.fill();
    const thumbH = Math.max(24, sb.h * (sb.h / sb.contentH));
    const ty = sb.y + (sb.h - thumbH) * (sb.scroll / sb.maxScroll);
    ctx.fillStyle = 'rgba(216,178,94,0.7)';
    Utils.rr(ctx, sb.x, ty, sb.w, thumbH, sb.w / 2); ctx.fill();
  },

  drawShop(ctx, p) {
    const r = this.R.shop;
    this.chrome(ctx, r, this.SHOP_NAMES[this.shopId] || '🛒 商店', this.R.shopClose);
    for (const tb of this.R.shopTabs) this._tabBtn(ctx, tb, this.shopTab === tb.key);
    const view = this.R.shopView;

    if (this.shopTab === 'buy') {
      ctx.save();
      ctx.beginPath(); ctx.rect(view.x, view.y, view.w, view.h); ctx.clip();
      for (const row of this.R.shopRows) {
        if (row.y + row.h < view.y || row.y > view.y + view.h) continue;
        const b = this._curBuy[row.i];
        const d = ItemDB[b.id];
        const hover = this.inRect(row);
        const afford = p.meso >= b.price;
        ctx.fillStyle = hover ? 'rgba(255,222,130,0.10)' : 'rgba(255,255,255,0.04)';
        Utils.rr(ctx, row.x, row.y, row.w, row.h, 7);
        ctx.fill();
        ctx.strokeStyle = hover ? 'rgba(255,222,130,0.7)' : 'rgba(120,130,180,0.25)';
        ctx.lineWidth = 1;
        Utils.rr(ctx, row.x, row.y, row.w, row.h, 7);
        ctx.stroke();
        Sprites.drawItemIcon(ctx, b.id, row.x + 24, row.y + 18, 30);
        ctx.textAlign = 'left';
        ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#ffeec2';
        ctx.fillText(d ? d.name : b.id, row.x + 46, row.y + 16);
        ctx.font = '10px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#a8bcd8';
        ctx.fillText(d && d.desc ? d.desc : (d && d.type === 'equip' ? EQUIP_SLOT_NAMES[d.slot] + '裝備' : ''), row.x + 46, row.y + 30);
        ctx.textAlign = 'right';
        ctx.font = 'bold 13px Verdana';
        ctx.fillStyle = afford ? '#ffd87a' : '#ef9a9a';
        ctx.fillText(`${Utils.fmt(b.price)} 楓幣`, row.x + row.w - 14, row.y + 23);
      }
      ctx.restore();
      this._scrollbar(ctx, this.R.shopScroll);
      if (this.buySel && this.R.buyPop) this._drawBuyPopup(ctx, p);
      if (this.confirmBuy >= 0 && this.R.buyConfirmWin) this._drawBuyConfirm(ctx, p);
    } else if (this.shopTab === 'sell') {
      if (!this.R.shopRows.length) {
        ctx.textAlign = 'center';
        ctx.font = '13px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#94a8c8';
        ctx.fillText('背包沒有可賣出的物品', r.x + r.w / 2, r.y + 150);
      }
      ctx.save();
      ctx.beginPath(); ctx.rect(view.x, view.y, view.w, view.h); ctx.clip();
      for (const row of this.R.shopRows) {
        if (row.y + row.h < view.y || row.y > view.y + view.h) continue;
        const it = p.inventory[row.slot];
        if (!it) continue;
        this._slot(ctx, row, this.inRect(row));
        if (it.roll && it.roll.tier > 0) this._tierBorder(ctx, row, it.roll.tier);
        Sprites.drawItemIcon(ctx, it.id, row.x + 25, row.y + 22, 38);
        if (it.qty > 1) {
          ctx.font = 'bold 10px Verdana';
          ctx.textAlign = 'right';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.strokeText(it.qty, row.x + row.w - 3, row.y + 16);
          ctx.fillStyle = '#ffeec2';
          ctx.fillText(it.qty, row.x + row.w - 3, row.y + 16);
        }
        ctx.font = '9px Verdana';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd87a';
        ctx.fillText(this._sellOf(it.id), row.x + row.w / 2, row.y + row.h - 3);
      }
      ctx.restore();
      this._scrollbar(ctx, this.R.shopScroll);
      ctx.textAlign = 'center';
      ctx.font = '10px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#8fa3bd';
      ctx.fillText('點擊物品選擇賣出數量（以 60% 價格賣出）', r.x + r.w / 2, r.y + r.h - 30);
      if (this.sellSel && this.R.sellPop) this._drawSellPopup(ctx, p);
    } else {
      // expand
      ctx.textAlign = 'center';
      ctx.font = '14px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#e8eef8';
      ctx.fillText(`目前背包格數：${p.invSize} / ${CONFIG.INV_MAX}`, r.x + r.w / 2, r.y + 110);
      const maxed = p.invSize >= CONFIG.INV_MAX;
      const cost = this._expandCost(p);
      const b = this.R.shopExpandBtn;
      const hover = this.inRect(b);
      const afford = p.meso >= cost && !maxed;
      const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
      g.addColorStop(0, maxed ? 'rgba(120,120,140,0.4)' : afford ? (hover ? '#7cd86a' : '#6cc25a') : 'rgba(170,60,52,0.5)');
      g.addColorStop(1, maxed ? 'rgba(80,80,100,0.4)' : afford ? '#2e7d32' : 'rgba(120,36,30,0.5)');
      ctx.fillStyle = g;
      Utils.rr(ctx, b.x, b.y, b.w, b.h, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,235,170,0.5)';
      ctx.lineWidth = 1.2;
      Utils.rr(ctx, b.x, b.y, b.w, b.h, 8);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
      ctx.fillText(maxed ? '已達上限' : `擴充 +${CONFIG.INV_EXPAND_STEP} 格（${Utils.fmt(cost)} 楓幣）`, b.x + b.w / 2, b.y + 27);
    }

    // 玩家持有楓幣
    Sprites.drawItemIcon(ctx, 'meso', r.x + 22, r.y + r.h - 17, 20);
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd87a';
    ctx.fillText(Utils.fmt(p.meso), r.x + 36, r.y + r.h - 12);
  },

  _wrap(ctx, text, x, y, maxw, lh) {
    let line = '', yy = y;
    for (const ch of String(text)) {
      if (ctx.measureText(line + ch).width > maxw) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
      else line += ch;
    }
    if (line) ctx.fillText(line, x, yy);
    return yy + lh;
  },

  _objText(qid, p, active) {
    const o = QuestDB[qid].objective;
    const prog = active ? p.questProgress(qid) : 0;
    if (o.type === 'kill') {
      const mob = MonsterDB[o.target];
      return `討伐 ${mob ? mob.name : o.target}　${prog}/${o.count}`;
    }
    const it = ItemDB[o.item];
    return `收集 ${it ? it.name : o.item}　${prog}/${o.count}`;
  },

  _rewardText(qid) {
    const r = QuestDB[qid].reward || {};
    const parts = [];
    if (r.meso) parts.push(`${Utils.fmt(r.meso)} 楓幣`);
    if (r.exp) parts.push(`${Utils.fmt(r.exp)} EXP`);
    for (const it of (r.items || [])) parts.push(`${ItemDB[it.id] ? ItemDB[it.id].name : it.id}${it.qty > 1 ? ' x' + it.qty : ''}`);
    return '獎勵：' + parts.join('、');
  },

  drawCraft(ctx, p) {
    const r = this.R.craft;
    this.chrome(ctx, r, '🔨 鐵匠 鋼爺', this.R.craftClose);
    for (const tb of this.R.craftTabs) this._tabBtn(ctx, tb, this.craftTab === tb.key);
    if (this.craftTab === 'enhance') { this._drawEnhance(ctx, p); return; }
    for (const row of this.R.craftRows) {
      const d = CraftDB[row.cid];
      const res = ItemDB[d.result.id];
      const afford = p.meso >= d.cost;
      const haveMats = d.mats.every((m) => p.invCount(m.id) >= m.qty);
      ctx.fillStyle = this.inRect(row) ? 'rgba(255,222,130,0.08)' : 'rgba(255,255,255,0.04)';
      Utils.rr(ctx, row.x, row.y, row.w, row.h, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(120,130,180,0.25)'; ctx.lineWidth = 1;
      Utils.rr(ctx, row.x, row.y, row.w, row.h, 7); ctx.stroke();
      Sprites.drawItemIcon(ctx, d.result.id, row.x + 22, row.y + 22, 30);
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#ffeec2';
      ctx.fillText(`${res ? res.name : d.result.id}${d.result.qty > 1 ? ' x' + d.result.qty : ''}`, row.x + 44, row.y + 16);
      ctx.font = '10px "Microsoft JhengHei", sans-serif';
      let mx = row.x + 44;
      for (const m of d.mats) {
        const mi = ItemDB[m.id], ok = p.invCount(m.id) >= m.qty;
        ctx.fillStyle = ok ? '#a5d6a7' : '#ef9a9a';
        const txt = `${mi ? mi.name : m.id} ${p.invCount(m.id)}/${m.qty}`;
        ctx.fillText(txt, mx, row.y + 35);
        mx += ctx.measureText(txt).width + 10;
      }
      ctx.textAlign = 'right';
      ctx.fillStyle = afford ? '#ffd87a' : '#ef9a9a';
      ctx.font = '10px Verdana';
      ctx.fillText(`${Utils.fmt(d.cost)} 楓幣`, row.btn.x - 8, row.y + 16);
      this._btn(ctx, row.btn, '製作', afford && haveMats, 'green');
    }
    Sprites.drawItemIcon(ctx, 'meso', r.x + 22, r.y + r.h - 17, 20);
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd87a';
    ctx.fillText(Utils.fmt(p.meso), r.x + 36, r.y + r.h - 12);
  },

  _drawEnhance(ctx, p) {
    const r = this.R.craft;
    ctx.textAlign = 'center';
    ctx.font = '11px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#8fa3bd';
    ctx.fillText('選擇背包中的裝備進行強化（提升數值，等級越高越難成功）', r.x + r.w / 2, r.y + 70);
    // 裝備格
    if (!this.R.enhCells.length) {
      ctx.fillStyle = '#94a8c8'; ctx.font = '13px "Microsoft JhengHei", sans-serif';
      ctx.fillText('背包沒有可強化的裝備（先卸下要強化的裝備）', r.x + r.w / 2, r.y + 150);
    }
    for (const c of this.R.enhCells) {
      const it = p.inventory[c.idx];
      if (!it) continue;
      const seld = this.enhSel === c.idx;
      this._slot(ctx, c, this.inRect(c) || seld);
      if (seld) { ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2; Utils.rr(ctx, c.x + 1, c.y + 1, c.w - 2, c.h - 2, 6); ctx.stroke(); }
      if (it.roll && it.roll.tier > 0) this._tierBorder(ctx, c, it.roll.tier);
      Sprites.drawItemIcon(ctx, it.id, c.x + c.w / 2, c.y + c.h / 2, c.w - 10);
      const enh = (it.roll && it.roll.enh) || 0;
      if (enh > 0) {
        ctx.font = 'bold 10px Verdana'; ctx.textAlign = 'left';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText('+' + enh, c.x + 2, c.y + 12);
        ctx.fillStyle = '#ffe08a'; ctx.fillText('+' + enh, c.x + 2, c.y + 12);
      }
    }
    // 詳情面板
    const py = r.y + 74 + Math.ceil(Math.max(1, this.R.enhCells.length) / 7) * 50 + 8;
    const sel = this.enhSel >= 0 ? p.inventory[this.enhSel] : null;
    if (sel && ItemDB[sel.id] && ItemDB[sel.id].type === 'equip') {
      const d = ItemDB[sel.id];
      const enh = (sel.roll && sel.roll.enh) || 0;
      const maxed = enh >= ENH_MAX;
      this.panel(ctx, r.x + 14, py, r.w - 28, r.y + r.h - 56 - py, 8);
      Sprites.drawItemIcon(ctx, sel.id, r.x + 42, py + 30, 36);
      ctx.textAlign = 'left';
      ctx.font = 'bold 15px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#ffeec2';
      ctx.fillText(`${d.name}${enh > 0 ? '  +' + enh : ''}`, r.x + 70, py + 24);
      // 數值：目前 → 強化後
      ctx.font = '11px "Microsoft JhengHei", sans-serif';
      let sy = py + 44;
      const nextRoll = Object.assign({}, sel.roll, { enh: enh + 1 });
      for (const f of ROLL_FIELDS) {
        const cur = statVal(sel.id, sel.roll, f);
        if (!cur && !(d[f])) continue;
        const nxt = statVal(sel.id, nextRoll, f);
        const label = { atk: '攻擊力', def: '防禦力', hp: '最大HP', mp: '最大MP', spd: '移速' }[f];
        ctx.fillStyle = '#a8bcd8';
        ctx.fillText(`${label}  ${cur}` + (maxed ? '' : `  →  ${nxt}  (+${nxt - cur})`), r.x + 70, sy);
        sy += 16;
      }
      // 費用 + 成功率
      const cost = enhanceCost(sel.id, enh);
      const rate = Math.round(enhanceRate(enh) * 100);
      ctx.fillStyle = '#ffd87a';
      ctx.fillText(maxed ? '已達強化上限 +' + ENH_MAX : `費用：${Utils.fmt(cost.meso)} 楓幣` + (cost.mat ? ` + 黃金礦石 x${cost.mat.qty}` : ''), r.x + 70, sy + 4);
      if (!maxed) {
        ctx.fillStyle = rate >= 90 ? '#a5d6a7' : rate >= 60 ? '#ffd87a' : '#ef9a9a';
        ctx.fillText(`成功率：${rate}%` + (enh >= 8 ? '（失敗會 -1 級）' : ''), r.x + 70, sy + 22);
      }
      const haveMat = !cost.mat || p.invCount(cost.mat.id) >= cost.mat.qty;
      this._btn(ctx, this.R.enhBtn, maxed ? '已滿級' : '強化', !maxed && p.meso >= cost.meso && haveMat, 'green');
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#7a8398'; ctx.font = '12px "Microsoft JhengHei", sans-serif';
      ctx.fillText('↑ 點選一件裝備', r.x + r.w / 2, py + 40);
    }
    Sprites.drawItemIcon(ctx, 'meso', r.x + 22, r.y + r.h - 17, 20);
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd87a';
    ctx.fillText(Utils.fmt(p.meso), r.x + 36, r.y + r.h - 12);
  },

  drawDialogue(ctx, p) {
    const r = this.R.dlg;
    const def = NpcDB[this.dlgNpc] || { name: 'NPC', story: '' };
    this.chrome(ctx, r, '💬 ' + def.name, this.R.dlgClose);
    ctx.textAlign = 'left';
    ctx.font = '13px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#e8eef8';
    this._wrap(ctx, def.story, r.x + 18, r.y + 50, r.w - 36, 18);
    for (const row of this.R.dlgQuests) {
      const d = QuestDB[row.qid];
      const st = this._questStatus(row.qid, p);
      const tone = st === 'done' ? 0.06 : st === 'locked' ? 0.03 : 0.09;
      ctx.fillStyle = `rgba(120,150,230,${tone})`;
      Utils.rr(ctx, row.x, row.y, row.w, row.h, 8); ctx.fill();
      ctx.strokeStyle = st === 'complete' ? 'rgba(160,230,140,0.7)' : st === 'available' ? 'rgba(232,196,110,0.6)' : 'rgba(120,130,180,0.25)';
      ctx.lineWidth = 1.2;
      Utils.rr(ctx, row.x, row.y, row.w, row.h, 8); ctx.stroke();
      // 任務名 + 等級
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = st === 'locked' ? '#8a8a99' : '#ffeec2';
      ctx.fillText(`${d.name}　Lv.${d.reqLv || 1}`, row.x + 12, row.y + 18);
      // 目標 + 進度
      ctx.font = '11px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#a8bcd8';
      ctx.fillText(this._objText(row.qid, p, st === 'active' || st === 'complete'), row.x + 12, row.y + 36);
      // 獎勵
      ctx.fillStyle = '#8fa3bd';
      ctx.fillText(this._rewardText(row.qid), row.x + 12, row.y + 52);
      // 狀態 / 按鈕
      if (st === 'available') this._btn(ctx, row.btn, '接受', true, 'green');
      else if (st === 'complete') this._btn(ctx, row.btn, '完成', true, 'blue');
      else {
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = st === 'done' ? '#a5d6a7' : st === 'active' ? '#ffd87a' : '#8a8a99';
        const lbl = st === 'done' ? '✓ 已完成' : st === 'active' ? '進行中' : '🔒 未達成';
        ctx.fillText(lbl, row.btn.x + row.btn.w / 2, row.btn.y + 19);
      }
    }
    // 轉職按鈕
    if (this.R.dlgAdvance) {
      const adv = p.canAdvance();
      const label = adv ? `✦ 轉職為 ${p.jobDef.ranks[adv - 1]}` : (p.jobRank >= 3 ? '已達最高轉職' : `轉職（需 Lv.${p.jobRank === 1 ? 30 : 70}）`);
      this._btn(ctx, this.R.dlgAdvance, label, !!adv, adv ? 'green' : 'default');
    }
  },

  drawQuestTracker(ctx, p) {
    const active = QUEST_ORDER.filter((q) => p.quests[q] && p.quests[q].s === 'active').slice(0, 4);
    this.drawnQuestRows = active.length;
    if (!active.length) return;
    const x = 12, w = 210;
    // 標題列（點擊或按 T 摺疊）
    this.panel(ctx, x, 44, w, 20, 6);
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText(`📜 任務 (${active.length})`, x + 10, 58);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9fb0cf';
    ctx.font = '10px "Microsoft JhengHei", sans-serif';
    ctx.fillText(this.questCollapsed ? '▸ 展開' : '▾ 收合', x + w - 8, 58);
    if (this.questCollapsed) return;
    let y = 68;
    for (const qid of active) {
      const d = QuestDB[qid];
      const done = p.canCompleteQuest(qid);
      const prog = p.questProgress(qid);
      const o = d.objective;
      const tgt = o.type === 'kill' ? (MonsterDB[o.target] ? MonsterDB[o.target].name : o.target) : (ItemDB[o.item] ? ItemDB[o.item].name : o.item);
      const h = 40;
      this.panel(ctx, x, y, w, h, 7);
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = done ? '#a5d6a7' : '#ffe9b0';
      ctx.fillText((done ? '✓ ' : '▸ ') + d.name, x + 10, y + 16);
      ctx.font = '11px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = done ? '#a5d6a7' : '#a8bcd8';
      ctx.fillText(`${tgt} ${prog}/${o.count}` + (done ? '（回村交付）' : ''), x + 10, y + 32);
      y += h + 4;
    }
  },

  drawSkill(ctx, p) {
    const r = this.R.skill;
    this.chrome(ctx, r, `✦ ${p.rankName}技能 [K]　SP：${p.sp}`, this.R.skillClose);
    ctx.textAlign = 'center';
    ctx.font = '10px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#8fa3bd';
    ctx.fillText('拖曳技能圖示到下方快捷列即可綁定按鍵', r.x + r.w / 2, r.y + 34);
    this._skillList().forEach((id, i) => {
      const d = SkillDB[id];
      if (!this.R.skillRows[i]) return;
      const lv = p.skills[id] || 0;
      const row = this.R.skillRows[i];
      const rankOk = p.jobRank >= (d.rank || 1);
      const unlocked = rankOk && p.level >= d.reqLv;
      const rg = ctx.createLinearGradient(0, row.y, 0, row.y + row.h);
      rg.addColorStop(0, lv > 0 ? 'rgba(86,118,222,0.22)' : 'rgba(255,255,255,0.045)');
      rg.addColorStop(1, lv > 0 ? 'rgba(56,76,160,0.12)' : 'rgba(255,255,255,0.02)');
      ctx.fillStyle = rg;
      Utils.rr(ctx, row.x, row.y, row.w, row.h, 9);
      ctx.fill();
      ctx.strokeStyle = lv > 0 ? 'rgba(140,165,255,0.4)' : 'rgba(120,130,180,0.22)';
      ctx.lineWidth = 1.2;
      Utils.rr(ctx, row.x, row.y, row.w, row.h, 9);
      ctx.stroke();
      // 技能圖示徽章（可拖曳）
      const bd = this.R.skillBadges[i];
      ctx.globalAlpha = unlocked ? 1 : 0.4;
      this._skillIcon(ctx, id, bd.x, bd.y, bd.w);
      ctx.globalAlpha = 1;
      // 已綁定到哪個快捷鍵
      const barSlot = p.skillBar.indexOf(id);
      if (barSlot >= 0) {
        ctx.fillStyle = 'rgba(255,213,79,0.9)';
        Utils.rr(ctx, bd.x - 2, bd.y - 2, 16, 14, 3); ctx.fill();
        ctx.fillStyle = '#2a2410'; ctx.font = 'bold 10px Verdana'; ctx.textAlign = 'center';
        ctx.fillText(SKILL_BAR_LABELS[barSlot], bd.x + 6, bd.y + 9);
      }
      // 文字
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = unlocked ? '#ffeec2' : '#8a8a99';
      ctx.fillText(`${d.name}　Lv.${lv}/${d.maxLv}`, row.x + 64, row.y + 20);
      ctx.font = '11px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = unlocked ? '#a8bcd8' : '#70707f';
      const lockMsg = !rankOk ? `🔒 需${d.rank === 2 ? '二轉 (Lv.30)' : '三轉 (Lv.70)'}` : `🔒 角色 Lv.${d.reqLv} 解鎖`;
      ctx.fillText(unlocked ? d.desc(Math.max(1, lv)) : lockMsg, row.x + 64, row.y + 38);
      if (lv > 0 && row.h >= 56) {
        ctx.fillStyle = '#8fd8a0';
        ctx.fillText(`MP ${d.mpCost(lv)}　冷卻 ${d.cd}s`, row.x + 64, row.y + 52);
      }
      // 加點按鈕（有 ui_btn_plus.png 則貼圖：第 0 格停用、第 1 格可用；否則程序化）
      const can = p.sp > 0 && lv < d.maxLv && unlocked;
      const b = this.R.skillPlus[i];
      const plusImg = this._uiImg('ui_btn_plus.png');
      if (this._uiReady(plusImg)) {
        const fw = plusImg.naturalWidth / 2;
        ctx.imageSmoothingEnabled = true;
        ctx.globalAlpha = can ? 1 : 0.45;
        ctx.drawImage(plusImg, (can ? 1 : 0) * fw, 0, fw, plusImg.naturalHeight, b.x, b.y, b.w, b.h);
        ctx.globalAlpha = 1;
      } else {
        const pg = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
        pg.addColorStop(0, can ? '#6cc25a' : 'rgba(255,255,255,0.08)');
        pg.addColorStop(1, can ? '#2e7d32' : 'rgba(255,255,255,0.04)');
        ctx.fillStyle = pg;
        Utils.rr(ctx, b.x, b.y, b.w, b.h, 7);
        ctx.fill();
        ctx.strokeStyle = can ? 'rgba(220,255,200,0.7)' : 'rgba(120,130,180,0.25)';
        ctx.lineWidth = 1.3;
        Utils.rr(ctx, b.x, b.y, b.w, b.h, 7);
        ctx.stroke();
        ctx.fillStyle = can ? '#fff' : '#777788';
        ctx.font = 'bold 18px Verdana';
        ctx.textAlign = 'center';
        ctx.fillText('+', b.x + b.w / 2, b.y + 19);
      }
    });
  },

  drawStat(ctx, p) {
    const r = this.R.stat;
    this.chrome(ctx, r, '👤 角色 [P]', this.R.statClose);
    const need = expNeed(p.level);
    const rows = [
      ['名稱', p.name || CONFIG.PLAYER_NAME],
      ['職業', `${p.rankName}（${p.jobRank} 轉）`],
      ['等級', `Lv.${p.level}`],
      ['經驗值', `${((p.exp / need) * 100).toFixed(1)}%`],
      ['攻擊力', p.atk],
      ['防禦力', p.def],
      ['HP', `${Math.ceil(p.hp)} / ${p.maxHp}`],
      ['MP', `${Math.ceil(p.mp)} / ${p.maxMp}`],
      ['SP', p.sp],
      ['楓幣', Utils.fmt(p.meso)],
    ];
    ctx.font = '12px "Microsoft JhengHei", sans-serif';
    rows.forEach((row, i) => {
      const y = r.y + 48 + i * 19;
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.035)';
        Utils.rr(ctx, r.x + 8, y - 13, r.w - 16, 18, 4);
        ctx.fill();
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a8c8';
      ctx.fillText(row[0], r.x + 14, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = i === 1 ? p.jobDef.color : '#ffeec2';
      ctx.fillText(String(row[1]), r.x + r.w - 14, y);
    });
    // 裝備分隔標題
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText('— 裝備 —', r.x + 16, r.y + 240);
    this.R.statEquips.forEach((e) => {
      this._slot(ctx, e, this.inRect(e));
      const id = p.equips[e.slot];
      const rl = p.equipRolls[e.slot];
      if (id && rl && rl.tier > 0) this._tierBorder(ctx, e, rl.tier);
      if (id) Sprites.drawItemIcon(ctx, id, e.x + 23, e.y + 23, 38);
      if (id && rl && rl.enh) {
        ctx.font = 'bold 10px Verdana'; ctx.textAlign = 'left';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText('+' + rl.enh, e.x + 2, e.y + 11);
        ctx.fillStyle = '#ffe08a'; ctx.fillText('+' + rl.enh, e.x + 2, e.y + 11);
      }
      ctx.font = '9px "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a8c8';
      ctx.fillText(EQUIP_SLOT_NAMES[e.slot], e.x + e.w / 2, e.y + e.h + 11);
    });
    ctx.textAlign = 'center';
    ctx.font = '11px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#8fa3bd';
    ctx.fillText('刪除存檔 / 切換角色請按 Esc 開啟設定', r.x + r.w / 2, r.y + r.h - 12);
  },

  _statLabel(field) {
    return { atk: '攻擊力', def: '防禦力', hp: '最大 HP', mp: '最大 MP', spd: '移動速度' }[field];
  },

  // d: ItemDB 定義；roll: 此實例的隨機數值；showDiff: 比較目前已裝備（背包中裝備用）
  itemLines(d, p, action, roll, showDiff) {
    const id = d.__id || d.id;
    const tier = roll ? (EQUIP_TIERS[roll.tier] || EQUIP_TIERS[0]) : null;
    const titleColor = tier ? tier.color : '#ffe082';
    const enhStr = roll && roll.enh ? ` +${roll.enh}` : '';
    const title = (d.name + enhStr) + (tier && roll.tier > 0 ? `　【${tier.name}】` : '');
    const lines = [{ t: title, c: titleColor }];
    if (d.type === 'use') {
      lines.push({ t: d.desc, c: '#b0bec5' });
    } else if (d.type === 'material') {
      lines.push({ t: '材料', c: '#90a4ae' });
      if (d.desc) lines.push({ t: d.desc, c: '#b0bec5' });
    } else {
      lines.push({ t: `${EQUIP_SLOT_NAMES[d.slot] || ''}裝備`, c: '#90a4ae' });
      if (d.class && d.class !== 'any') {
        const ok = d.class === p.job;
        lines.push({ t: `限定：${(JobDB[d.class] || {}).name || d.class}`, c: ok ? '#a5d6a7' : '#ef5350' });
      }
      // 與目前已裝備同欄位比較（穿上更好還是更差）
      const eqId = showDiff ? p.equips[d.slot] : null;
      const eqRoll = showDiff ? p.equipRolls[d.slot] : null;
      const palette = { atk: '#ffab91', def: '#90caf9', hp: '#69f0ae', mp: '#64b5f6', spd: '#80deea' };
      for (const f of ROLL_FIELDS) {
        const v = id ? statVal(id, roll, f) : (d[f] || 0);
        if (!v) continue;
        const suffix = f === 'spd' ? '%' : '';
        let t = `${this._statLabel(f)} +${v}${suffix}`;
        let c = palette[f];
        if (showDiff && eqId) {
          const cur = statVal(eqId, eqRoll, f);
          const diff = v - cur;
          if (diff > 0) { t += `　▲ +${diff}`; c = '#7ee08a'; }
          else if (diff < 0) { t += `　▼ ${diff}`; c = '#ef7a6a'; }
          else { t += '　＝'; c = '#aeb6c6'; }
        }
        lines.push({ t, c });
      }
      // 與已裝備比較時，若有對方獨有而本件沒有的數值，列出為減少
      if (showDiff && eqId) {
        for (const f of ROLL_FIELDS) {
          const v = id ? statVal(id, roll, f) : 0;
          const cur = statVal(eqId, eqRoll, f);
          if (!v && cur) lines.push({ t: `${this._statLabel(f)} ▼ -${cur}`, c: '#ef7a6a' });
        }
      }
      lines.push({ t: `需求等級 ${d.reqLv || 1}`, c: p.level >= (d.reqLv || 1) ? '#a5d6a7' : '#ef5350' });
      if (showDiff && eqId) lines.push({ t: `（目前已裝備：${ItemDB[eqId] ? ItemDB[eqId].name : eqId}）`, c: '#8fa3bd' });
      if (d.desc) lines.push({ t: d.desc, c: '#b0bec5' });
    }
    lines.push({ t: action, c: '#fff176' });
    return lines;
  },

  _itemDef(id) { const d = ItemDB[id]; return d ? Object.assign({ __id: id }, d) : null; },

  drawTooltip(ctx, p) {
    let lines = null;
    const R = this.R;
    // 商店賣出格優先
    if (R.shop && R.shopRows && this.shopTab === 'sell' && !this.sellSel) {
      for (const row of R.shopRows) {
        const it = p.inventory[row.slot];
        if (this.inRect(row) && it) {
          const d = this._itemDef(it.id);
          lines = this.itemLines(d, p, `點擊：賣出 ${this._sellOf(it.id)} 楓幣`, it.roll, d.type === 'equip');
        }
      }
    }
    if (!lines && R.invSlots && !this.show.shop) {
      R.invSlots.forEach((s, i) => {
        const idx = R.invCells ? R.invCells[i] : i;
        if (idx == null || idx < 0) return;
        const it = p.inventory[idx];
        if (this.inRect(s) && it) {
          const d = this._itemDef(it.id);
          const act = this.assignQuick >= 0 ? (d.type === 'use' ? `點擊：設為快捷鍵 ${this.assignQuick + 1}` : '不可指定')
            : d.type === 'use' ? '點擊：使用' : d.type === 'material' ? '材料' : '點擊：裝備';
          lines = this.itemLines(d, p, act, it.roll, d.type === 'equip');
        }
      });
    }
    if (!lines && R.statEquips) {
      for (const e of R.statEquips) {
        if (this.inRect(e) && p.equips[e.slot]) {
          lines = this.itemLines(this._itemDef(p.equips[e.slot]), p, '點擊：卸下', p.equipRolls[e.slot], false);
        }
      }
    }
    if (!lines) return;
    ctx.font = '12px "Microsoft JhengHei", sans-serif';
    const w = Math.max(...lines.map((l) => ctx.measureText(l.t).width)) + 26;
    const h = lines.length * 18 + 16;
    const x = Utils.clamp(Input.mouseX + 16, 4, CONFIG.CANVAS_W - w - 4);
    const y = Utils.clamp(Input.mouseY + 16, 4, CONFIG.CANVAS_H - h - 4);
    this.panel(ctx, x, y, w, h, 8);
    ctx.textAlign = 'left';
    ctx.font = '12px "Microsoft JhengHei", sans-serif';
    lines.forEach((l, i) => {
      ctx.fillStyle = l.c;
      ctx.fillText(l.t, x + 13, y + 21 + i * 18);
    });
  },

  // ══════════════════ HUD ══════════════════

  drawHUD(ctx, game) {
    const p = game.player;
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    const PH = 74;   // 底部面板高度
    // 底部面板
    const hg = ctx.createLinearGradient(0, H - PH, 0, H);
    hg.addColorStop(0, 'rgba(22,26,50,0.92)');
    hg.addColorStop(1, 'rgba(10,11,24,0.95)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, H - PH, W, PH);
    // 金色頂緣雙線
    ctx.fillStyle = 'rgba(216,178,94,0.85)';
    ctx.fillRect(0, H - PH, W, 1.6);
    ctx.fillStyle = 'rgba(216,178,94,0.28)';
    ctx.fillRect(0, H - PH + 3, W, 1);
    // 中央頂緣鑽飾
    ctx.fillStyle = '#d8b25e';
    ctx.save();
    ctx.translate(W / 2, H - PH + 1);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();

    // 等級徽章（金環雙圈 + 星星）
    const bx = 34, by = H - 40;
    const eg = ctx.createRadialGradient(bx - 5, by - 7, 2, bx, by, 20);
    eg.addColorStop(0, '#5a82d8');
    eg.addColorStop(1, '#22366e');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(bx, by, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this._gold(ctx, by - 20, by + 20);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(bx, by, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,235,170,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, 15.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(bx, by - 9.5);
    ctx.fillStyle = '#ffd87a';
    Art.star(ctx, 4);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Verdana';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${p.level}`, bx, by + 8);

    // 名牌：角色名 + 職業（轉職階）。不顯示金幣（金幣在背包/商店/角色視窗可見）
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffeec2';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 3;
    ctx.fillText(p.name || CONFIG.PLAYER_NAME, 60, H - 46);
    ctx.shadowBlur = 0;
    ctx.font = '12px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = p.jobDef.color;
    ctx.fillText(p.rankName, 60, H - 28);

    // HP / MP 華麗條
    this.ornateBar(ctx, 188, H - 62, 232, 15, p.hp / p.maxHp,
      ['#ff9a7a', '#e8472f', '#8e1e12'], `HP ${Math.ceil(p.hp)} / ${p.maxHp}`, 'heart');
    this.ornateBar(ctx, 188, H - 43, 232, 15, p.mp / p.maxMp,
      ['#7ec8f8', '#2a7fd4', '#143e7e'], `MP ${Math.ceil(p.mp)} / ${p.maxMp}`, 'drop');
    // SP 提示
    if (p.sp > 0) {
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#ffd87a';
      ctx.fillText(`SP ${p.sp}（按 K 加點）`, 188, H - 24);
    }

    // 技能快捷列（中央）+ 消耗品快捷欄（右側）
    this._drawSkillBar(ctx, p);
    this._drawQuickSlots(ctx, p);

    // EXP（最底：像血條的綠色長條 + 置中百分比）
    const need = expNeed(p.level);
    const ratio = Utils.clamp(p.exp / need, 0, 1);
    const eh = 13;
    ctx.fillStyle = '#0a1410';
    ctx.fillRect(0, H - eh, W, eh);
    if (ratio > 0.002) {
      const xg = ctx.createLinearGradient(0, H - eh, 0, H);
      xg.addColorStop(0, '#9be86a');
      xg.addColorStop(0.5, '#4caf50');
      xg.addColorStop(1, '#2e7d32');
      ctx.fillStyle = xg;
      ctx.fillRect(0, H - eh, W * ratio, eh);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(0, H - eh, W * ratio, eh * 0.4);
    }
    ctx.strokeStyle = 'rgba(216,178,94,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - eh + 0.5);
    ctx.lineTo(W, H - eh + 0.5);
    ctx.stroke();
    ctx.font = 'bold 10px Verdana';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(8,16,8,0.85)';
    const expLabel = `EXP ${Utils.fmt(Math.floor(p.exp))} / ${Utils.fmt(need)}　${(ratio * 100).toFixed(2)}%`;
    ctx.strokeText(expLabel, W / 2, H - 3);
    ctx.fillStyle = '#eaffea';
    ctx.fillText(expLabel, W / 2, H - 3);
  },

  // 消耗品快捷欄（HUD 底部右側 3 格，可自訂）
  _drawQuickSlots(ctx, p) {
    for (const q of this.R.quick) {
      const id = p.quickSlots[q.k];
      const assigning = this.assignQuick === q.k;
      this._slot(ctx, q, this.inRect(q) || assigning);
      if (assigning) {
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 2;
        Utils.rr(ctx, q.x + 1, q.y + 1, q.w - 2, q.h - 2, 6);
        ctx.stroke();
      }
      if (id) {
        Sprites.drawItemIcon(ctx, id, q.x + q.w / 2, q.y + q.h / 2, q.w - 12);
        const cnt = p.invCount(id);
        ctx.font = 'bold 9px Verdana';
        ctx.textAlign = 'right';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(cnt, q.x + q.w - 3, q.y + q.h - 3);
        ctx.fillStyle = cnt > 0 ? '#ffeec2' : '#ef9a9a';
        ctx.fillText(cnt, q.x + q.w - 3, q.y + q.h - 3);
      }
      // 快捷鍵編號
      ctx.font = 'bold 10px Verdana';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd87a';
      ctx.fillText(q.k + 1, q.x + 3, q.y + 11);
    }
  },

  // 技能圖示（有 assets/ui/skills/<id>.png 則用，否則程序化徽章）
  _skillIcon(ctx, id, x, y, sz) {
    const d = SkillDB[id];
    if (!d) return;
    const img = Sprites._loadImage(Sprites.ASSET_BASE + 'ui/skills/' + id + '.png');
    if (Sprites._readyImage(img)) { ctx.imageSmoothingEnabled = true; ctx.drawImage(img, x, y, sz, sz); return; }
    const col = { melee: '#e8704a', aoe: '#c79bff', projectile: '#5aa0ff', heal: '#69d98a', buff: '#ffce5a' }[d.type] || '#8a8aa0';
    const cx = x + sz / 2, cy = y + sz / 2;
    const g = ctx.createRadialGradient(cx - 3, cy - 4, 2, cx, cy, sz / 2);
    g.addColorStop(0, this._lift(col)); g.addColorStop(1, col);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, sz / 2 - 1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,235,170,0.7)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, sz / 2 - 1, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(sz * 0.5)}px "Microsoft JhengHei", sans-serif`;
    ctx.fillText(d.name[0], cx, cy + sz * 0.18);
  },

  // 技能快捷列（HUD 中央 6 格，按鍵標籤在上方）
  _drawSkillBar(ctx, p) {
    for (const s of this.R.skillBar) {
      this._slot(ctx, s, this.inRect(s));
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px Verdana';
      ctx.fillStyle = '#cdd8ee';
      ctx.fillText(SKILL_BAR_LABELS[s.k], s.x + s.w / 2, s.y - 3);
      const id = p.skillBar[s.k];
      if (id && SkillDB[id]) {
        const lv = p.skills[id] || 0;
        const usable = p.skillUnlocked(id) && lv > 0;
        ctx.globalAlpha = usable ? 1 : 0.4;
        this._skillIcon(ctx, id, s.x + 4, s.y + 4, s.w - 8);
        ctx.globalAlpha = 1;
        if (lv > 0) {
          ctx.font = 'bold 9px Verdana'; ctx.textAlign = 'right';
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.strokeText(lv, s.x + s.w - 3, s.y + s.h - 3);
          ctx.fillStyle = '#ffeec2'; ctx.fillText(lv, s.x + s.w - 3, s.y + s.h - 3);
        }
        const cd = p.skillCds[id] || 0;
        if (cd > 0 && SkillDB[id].cd) {
          const fr = Math.min(1, cd / SkillDB[id].cd);
          ctx.fillStyle = 'rgba(10,12,24,0.62)';
          ctx.fillRect(s.x + 2, s.y + s.h - 2 - (s.h - 4) * fr, s.w - 4, (s.h - 4) * fr);
        }
      }
    }
  },

  // 拖曳中的元件跟著游標
  _drawDragGhost(ctx, p) {
    const g = this.dragGhost;
    if (!g) return;
    ctx.globalAlpha = 0.85;
    if (g.kind === 'skill') this._skillIcon(ctx, g.id, Input.mouseX - 18, Input.mouseY - 18, 36);
    else if (g.kind === 'item') Sprites.drawItemIcon(ctx, g.id, Input.mouseX, Input.mouseY, 36);
    ctx.globalAlpha = 1;
  },

  drawBossBar(ctx, game) {
    const boss = game.monsters.find((m) => m.def.boss && !m.dying);
    if (!boss) return;
    const x = 262, y = 16, w = 500, h = 18;
    this.panel(ctx, x - 10, y - 8, w + 20, h + 16, 9);
    // 皇冠徽章
    ctx.save();
    ctx.translate(x + 12, y + h / 2 - 1);
    ctx.fillStyle = '#f0c43e';
    Art.crown(ctx, 8);
    ctx.fill();
    ctx.strokeStyle = '#7a5a14';
    ctx.lineWidth = 1;
    Art.crown(ctx, 8);
    ctx.stroke();
    ctx.restore();
    // 血條
    const bx = x + 28, bw = w - 36;
    ctx.fillStyle = 'rgba(8,9,20,0.9)';
    Utils.rr(ctx, bx, y, bw, h, h / 2);
    ctx.fill();
    const ratio = Math.max(0, boss.hp / boss.maxHp);
    if (ratio > 0.005) {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#ff7a5e');
      g.addColorStop(0.5, '#d8281e');
      g.addColorStop(1, '#7a120c');
      ctx.fillStyle = g;
      Utils.rr(ctx, bx + 1.5, y + 1.5, (bw - 3) * ratio, h - 3, (h - 3) / 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      Utils.rr(ctx, bx + 3, y + 2.5, (bw - 6) * ratio, (h - 5) * 0.4, 3);
      ctx.fill();
    }
    // 10% 刻度
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let q = 1; q < 10; q++) {
      ctx.beginPath();
      ctx.moveTo(bx + (bw * q) / 10, y + 2);
      ctx.lineTo(bx + (bw * q) / 10, y + h - 2);
      ctx.stroke();
    }
    ctx.font = 'bold 12px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(10,8,16,0.85)';
    const label = `${boss.def.name}　${Utils.fmt(Math.max(0, boss.hp))} / ${Utils.fmt(boss.maxHp)}`;
    ctx.strokeText(label, bx + bw / 2, y + 14);
    ctx.fillStyle = '#ffeede';
    ctx.fillText(label, bx + bw / 2, y + 14);
  },

  drawMapName(ctx, game) {
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'left';
    const text = game.map.name;
    const w = ctx.measureText(text).width + 40;
    this.panel(ctx, 10, 10, w, 27, 13);
    ctx.save();
    ctx.translate(24, 23.5);
    ctx.rotate(-0.3);
    ctx.fillStyle = '#e8743e';
    Art.leaf(ctx, 6);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.fillText(text, 36, 28);
  },

  // ══════════════════ 標題 / 死亡畫面 ══════════════════

  drawTitle(ctx, game) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    ctx.fillStyle = 'rgba(8,10,26,0.8)';
    ctx.fillRect(0, 0, W, H);
    // 飄落楓葉
    for (let i = 0; i < 9; i++) {
      const x = ((i * 233 + game.time * (18 + (i % 3) * 8)) % (W + 80)) - 40;
      const y = ((i * 157 + game.time * (30 + (i % 4) * 9)) % (H + 70)) - 35;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(game.time * 1.4 + i * 2);
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = ['#e07b35', '#c84838', '#e8a64e'][i % 3];
      Art.leaf(ctx, 6 + (i % 3) * 2);
      ctx.fill();
      ctx.restore();
    }
    // 標誌
    ctx.textAlign = 'center';
    ctx.font = 'bold 64px Verdana, sans-serif';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4a2c10';
    ctx.strokeText('MapleWorld', W / 2, 150);
    const lg = ctx.createLinearGradient(0, 96, 0, 156);
    lg.addColorStop(0, '#ffefae');
    lg.addColorStop(0.55, '#f8c648');
    lg.addColorStop(1, '#d8922a');
    ctx.fillStyle = lg;
    ctx.fillText('MapleWorld', W / 2, 150);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fff';
    ctx.fillText('MapleWorld', W / 2, 148);
    ctx.globalAlpha = 1;
    // 標誌旁的大楓葉
    for (const [lx, rot] of [[W / 2 - 270, -0.5], [W / 2 + 270, 0.5]]) {
      ctx.save();
      ctx.translate(lx, 128);
      ctx.rotate(rot + Math.sin(game.time * 1.2) * 0.08);
      ctx.fillStyle = '#e8553e';
      Art.leaf(ctx, 22);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,30,20,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    // 副標緞帶
    const sw = 250, sy = 178;
    ctx.beginPath();
    ctx.moveTo(W / 2 - sw / 2, sy);
    ctx.lineTo(W / 2 + sw / 2, sy);
    ctx.lineTo(W / 2 + sw / 2 - 11, sy + 17);
    ctx.lineTo(W / 2 + sw / 2, sy + 34);
    ctx.lineTo(W / 2 - sw / 2, sy + 34);
    ctx.lineTo(W / 2 - sw / 2 + 11, sy + 17);
    ctx.closePath();
    const rg = ctx.createLinearGradient(0, sy, 0, sy + 34);
    rg.addColorStop(0, '#f0c75e');
    rg.addColorStop(1, '#c08a28');
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,10,0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.font = 'bold 19px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#4a2c10';
    ctx.fillText('楓 之 世 界', W / 2, sy + 24);

    // 操作面板
    this.panel(ctx, W / 2 - 370, 246, 740, 152, 12);
    const lines = [
      '← →  移動　　Space  跳躍　　↑  爬繩索 / 進入傳送門 / 對話　　↓+Space  下跳',
      'X  普通攻擊　　A S D F G H  技能快捷（可自訂）　　Z  撿取　　1 2 3  消耗品',
      'I  背包　　K  技能　　P  角色　　T  任務　　M  音效　　Esc  設定',
      '五大職業、25 張地圖、20+ 種怪物、4 大 Boss——打造你的楓之冒險！',
    ];
    ctx.font = '14px "Microsoft JhengHei", sans-serif';
    lines.forEach((l, i) => {
      ctx.fillStyle = i === 3 ? '#ffd87a' : '#cfd8e8';
      ctx.fillText(l, W / 2, 284 + i * 32);
    });

    const blink = (Math.sin(game.time * 4) + 1) / 2;
    ctx.globalAlpha = 0.45 + blink * 0.55;
    ctx.font = 'bold 22px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#fff385';
    ctx.shadowColor = 'rgba(255,210,90,0.8)';
    ctx.shadowBlur = 12;
    ctx.fillText('— 按 Enter 進入存檔選擇 —', W / 2, 452);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.font = '13px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#94a8c8';
    ctx.fillText('可建立多名不同職業的角色，各自獨立進度　•　M 音效開關', W / 2, 482);
  },

  drawClassSelect(ctx, game) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    ctx.fillStyle = 'rgba(8,10,26,0.86)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText('選擇你的職業', W / 2, 84);
    ctx.shadowBlur = 0;

    const n = JOB_ORDER.length;
    const cw = 150, gap = 14, total = n * cw + (n - 1) * gap;
    const x0 = W / 2 - total / 2;
    const cy = 120, ch = 196;
    JOB_ORDER.forEach((jid, i) => {
      const jd = JobDB[jid];
      const x = x0 + i * (cw + gap);
      const sel = i === game.selJob;
      this.panel(ctx, x, cy, cw, ch, 12);
      if (sel) {
        ctx.strokeStyle = jd.color;
        ctx.lineWidth = 3;
        Utils.rr(ctx, x + 2, cy + 2, cw - 4, ch - 4, 11);
        ctx.stroke();
      }
      // 職業徽章
      const bx = x + cw / 2, by = cy + 52;
      const g = ctx.createRadialGradient(bx - 6, by - 8, 3, bx, by, 34);
      g.addColorStop(0, this._lift(jd.color));
      g.addColorStop(1, jd.color);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, sel ? 33 : 29, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,235,170,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, by, sel ? 33 : 29, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px "Microsoft JhengHei", sans-serif';
      ctx.fillText(jd.short, bx, by + 11);
      // 名稱
      ctx.font = 'bold 17px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = sel ? '#fff' : '#cfd8e8';
      ctx.fillText(jd.name, bx, cy + 110);
      ctx.font = '11px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#8fa3bd';
      ctx.fillText(jd.basicType === 'projectile' ? '遠程' : '近戰', bx, cy + 130);
      // 武器類型
      ctx.fillStyle = '#94a8c8';
      ctx.fillText((jd.weaponTypes || []).map((w) => WTYPE_NAMES[w] || w).join(' / '), bx, cy + 150);
    });

    // 選中職業詳述
    const jd = JobDB[JOB_ORDER[game.selJob]];
    const dy = cy + ch + 22;
    this.panel(ctx, W / 2 - 360, dy, 720, 132, 12);
    ctx.textAlign = 'center';
    ctx.font = '14px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#e8eef8';
    ctx.fillText(jd.desc, W / 2, dy + 30);
    const m = jd.statMods;
    ctx.font = '13px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffd87a';
    ctx.fillText(`HP ×${m.hp}　MP ×${m.mp}　攻擊 ×${m.atk}　防禦 ×${m.def}`, W / 2, dy + 58);
    ctx.fillStyle = '#a8bcd8';
    const sk = jd.skills.map((id) => SkillDB[id].name).join('、');
    ctx.fillText(`起始技能：${sk}`, W / 2, dy + 84);
    ctx.fillStyle = '#8fa3bd';
    ctx.fillText('起始武器：' + (ItemDB[jd.startWeapon] ? ItemDB[jd.startWeapon].name : ''), W / 2, dy + 108);

    const blink = (Math.sin(game.time * 4) + 1) / 2;
    ctx.globalAlpha = 0.5 + blink * 0.5;
    ctx.font = 'bold 18px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#fff385';
    ctx.fillText('← → 選擇　　Enter 確認　　Esc 返回', W / 2, dy + 158);
    ctx.globalAlpha = 1;
  },

  _lift(hex) {
    if (typeof hex !== 'string' || hex[0] !== '#') return '#cfcfe0';
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16) + 60), g = Math.min(255, ((n >> 8) & 255) + 60), b = Math.min(255, (n & 255) + 60);
    return `rgb(${r},${g},${b})`;
  },

  drawDeath(ctx) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, H);
    g.addColorStop(0, 'rgba(60,8,12,0.55)');
    g.addColorStop(1, 'rgba(24,2,6,0.82)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 46px "Microsoft JhengHei", sans-serif';
    ctx.shadowColor = 'rgba(255,60,40,0.7)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ff6a5a';
    ctx.fillText('你被擊敗了…', W / 2, 258);
    ctx.shadowBlur = 0;
    this.panel(ctx, W / 2 - 230, 286, 460, 44, 10);
    ctx.font = '15px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffeede';
    ctx.fillText('按 R 在本地圖入口復活（已損失 10% 經驗值）', W / 2, 314);
  },

  // ══════════════════ 小地圖 ══════════════════

  // 在 area 範圍內等比繪製地圖（平台/繩索/傳送門/NPC/玩家）
  _renderMap(ctx, game, area, big) {
    const map = game.map;
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.w, area.h);
    ctx.clip();
    ctx.fillStyle = 'rgba(10,14,28,0.85)';
    ctx.fillRect(area.x, area.y, area.w, area.h);
    const scale = Math.min(area.w / map.w, area.h / map.h);
    const ox = area.x + (area.w - map.w * scale) / 2;
    const oy = area.y + (area.h - map.h * scale) / 2;
    const X = (wx) => ox + wx * scale, Y = (wy) => oy + wy * scale;
    // 平台
    ctx.fillStyle = 'rgba(150,172,214,0.6)';
    for (const pl of map.platforms) {
      ctx.fillRect(X(pl.x1), Y(pl.y), Math.max(1, (pl.x2 - pl.x1) * scale), big ? 3 : 2);
    }
    // 繩索
    ctx.strokeStyle = 'rgba(210,180,120,0.5)';
    ctx.lineWidth = 1;
    for (const rp of (map.ropes || [])) {
      ctx.beginPath(); ctx.moveTo(X(rp.x), Y(rp.y1)); ctx.lineTo(X(rp.x), Y(rp.y2)); ctx.stroke();
    }
    // 傳送門（青色）
    for (const po of (map.portals || [])) {
      ctx.fillStyle = '#5ad8ff';
      ctx.beginPath();
      ctx.arc(X(po.x), Y(po.y) - (big ? 6 : 3), big ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
      if (big) { ctx.fillStyle = '#bdeeff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(po.id === 'fwd' ? '→' : '←', X(po.x), Y(po.y) - 16); }
    }
    // NPC（黃色）
    for (const n of (map.npcs || [])) {
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(X(n.x), Y(n.y) - (big ? 6 : 3), big ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
      if (big) {
        const nd = (typeof NpcDB !== 'undefined' && NpcDB[n.id]) || null;
        ctx.fillStyle = '#ffe9b0'; ctx.font = '10px "Microsoft JhengHei", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(nd ? nd.name.split(' ')[0] : n.id, X(n.x), Y(n.y) - 16);
      }
    }
    // 怪物（big 才畫，淡紅點）
    if (big) {
      ctx.fillStyle = 'rgba(255,120,110,0.8)';
      for (const mo of game.monsters) {
        if (mo.dying) continue;
        ctx.beginPath(); ctx.arc(X(mo.x), Y(mo.y) - 3, 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // 玩家（閃爍綠點 + 箭頭）
    const p = game.player;
    const blink = (Math.sin(game.time * 6) + 1) / 2;
    ctx.fillStyle = `rgba(120,255,140,${0.6 + blink * 0.4})`;
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y) - (big ? 7 : 4), big ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a2a0a'; ctx.lineWidth = 1; ctx.stroke();
    if (big) {
      ctx.fillStyle = '#caffd0'; ctx.font = 'bold 10px "Microsoft JhengHei", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('你', X(p.x), Y(p.y) - 18);
    }
    ctx.restore();
  },

  drawMinimap(ctx, game) {
    if (game.state !== 'play' && game.state !== 'dead') return;
    if (this.mapExpanded) return;
    const r = this.R.miniMap;
    this.panel(ctx, r.x, r.y, r.w, r.h, 6);
    ctx.textAlign = 'left';
    ctx.font = 'bold 10px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText('🗺 ' + game.map.name, r.x + 8, r.y + 14);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8fa3bd';
    ctx.fillText('點擊放大', r.x + r.w - 8, r.y + 14);
    this._renderMap(ctx, game, { x: r.x + 6, y: r.y + 20, w: r.w - 12, h: r.h - 28 }, false);
  },

  drawBigMap(ctx, game) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    ctx.fillStyle = 'rgba(6,8,18,0.72)';
    ctx.fillRect(0, 0, W, H);
    const r = this.R.bigMap;
    this.chrome(ctx, r, '🗺 ' + game.map.name, this.R.bigMapClose);
    this._renderMap(ctx, game, { x: r.x + 12, y: r.y + 38, w: r.w - 24, h: r.h - 78 }, true);
    // 圖例
    ctx.textAlign = 'left';
    ctx.font = '11px "Microsoft JhengHei", sans-serif';
    const ly = r.y + r.h - 26;
    const items = [['#78ff8c', '你'], ['#ffd54f', 'NPC'], ['#5ad8ff', '傳送門'], ['#ff7a6e', '怪物']];
    let lx = r.x + 18;
    for (const it of items) {
      ctx.fillStyle = it[0];
      ctx.beginPath(); ctx.arc(lx, ly - 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#cfd8e8';
      ctx.fillText(it[1], lx + 9, ly);
      lx += 26 + ctx.measureText(it[1]).width;
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8fa3bd';
    ctx.fillText('點擊任意處關閉', r.x + r.w - 16, ly);
  },

  // ══════════════════ 設定 ══════════════════

  drawSettings(ctx, game) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    ctx.fillStyle = 'rgba(6,8,18,0.5)';
    ctx.fillRect(0, 0, W, H);
    const r = this.R.settings;
    this.chrome(ctx, r, '⚙ 設定', this.R.settingsClose);
    this._btn(ctx, this.R.setResume, '▶ 繼續遊戲', true, 'green');
    this._btn(ctx, this.R.setSound, Sound.muted ? '🔇 音效：關（點擊開啟）' : '🔊 音效：開（點擊關閉）', true, 'blue');
    this._btn(ctx, this.R.setReload, '🔄 重新載入最新版', true, 'blue');
    this._btn(ctx, this.R.setTitle, '🏰 返回標題 / 切換角色', true, 'default');
    this._btn(ctx, this.R.setDelete, this.confirmReset > 0 ? '⚠ 再點一次確認刪除！' : '🗑 刪除此存檔重新開始', true, 'red');
    // 操作說明
    let ky = this.R.setDelete.y + 54;
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText('— 操作說明 —', r.x + 20, ky); ky += 18;
    ctx.font = '11px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#a8bcd8';
    const help = [
      '← →  移動　　Space  跳躍（↓+Space 下跳）',
      '↑  爬繩 / 傳送 / 與 NPC 對話',
      'X  普通攻擊　　A S D F G H  技能快捷',
      'Z  撿取（按住連撿）　　1 2 3  消耗品快捷',
      'I 背包　K 技能　P 角色　T 任務收合　M 音效',
      '拖曳：技能→技能列、消耗品→消耗欄綁定按鍵',
    ];
    for (const line of help) { ctx.fillText(line, r.x + 20, ky); ky += 17; }
    ctx.textAlign = 'center';
    ctx.font = '10px Verdana';
    ctx.fillStyle = '#7a8398';
    ctx.fillText('版本 ' + (typeof BUILD !== 'undefined' ? BUILD : '?') + '　（全程自動存檔）', r.x + r.w / 2, r.y + r.h - 8);
  },

  drawNameInput(ctx, game) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    ctx.fillStyle = 'rgba(8,10,26,0.9)';
    ctx.fillRect(0, 0, W, H);
    const jd = JobDB[JOB_ORDER[game.selJob]];
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText('為你的角色命名', W / 2, 180);
    ctx.font = '15px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = jd.color;
    ctx.fillText(`職業：${jd.name}`, W / 2, 214);
    // 輸入框
    const bw = 420, bh = 56, bx = W / 2 - bw / 2, by = 248;
    this.panel(ctx, bx, by, bw, bh, 10);
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffffff';
    const txt = (typeof Input !== 'undefined' ? Input.textValue : '') || '';
    ctx.fillText(txt, bx + 20, by + 37);
    // 游標閃爍
    if (Math.floor(game.time * 2) % 2 === 0) {
      const cw = ctx.measureText(txt).width;
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(bx + 22 + cw, by + 14, 2, 28);
    }
    ctx.textAlign = 'center';
    ctx.font = '13px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#a8bcd8';
    ctx.fillText('輸入名字（最多 12 字）　Enter 確認　Esc 返回', W / 2, by + bh + 34);
  },

  // ══════════════════ 存檔選擇（標題 → 選角色）══════════════════

  layoutSlots() {
    const W = CONFIG.CANVAS_W;
    const w = 540, h = 96, gap = 16, x = (W - w) / 2;
    let y = 150;
    this.slotRects = [];
    this.slotDelRects = [];
    for (let i = 0; i < CONFIG.SLOT_COUNT; i++) {
      this.slotRects.push({ x, y, w, h });
      this.slotDelRects.push({ x: x + w - 44, y: y + 14, w: 30, h: 30 });
      y += h + gap;
    }
  },

  drawSlotSelect(ctx, game) {
    const W = CONFIG.CANVAS_W, H = CONFIG.CANVAS_H;
    this.layoutSlots();
    ctx.fillStyle = 'rgba(8,10,26,0.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText('選擇存檔', W / 2, 96);
    ctx.shadowBlur = 0;
    ctx.font = '14px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#a8bcd8';
    ctx.fillText('不同欄位可養成不同職業、各自獨立進度（全程自動存檔）', W / 2, 126);

    for (let i = 0; i < CONFIG.SLOT_COUNT; i++) {
      const r = this.slotRects[i];
      const meta = game.slotMeta(i);
      const sel = i === game.selSlot;
      this.panel(ctx, r.x, r.y, r.w, r.h, 10);
      if (sel) {
        ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 3;
        Utils.rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 9); ctx.stroke();
      }
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#9fb0cf';
      ctx.fillText(`存檔 ${i + 1}`, r.x + 18, r.y + 26);
      if (meta) {
        const jd = JobDB[meta.job] || JobDB.warrior;
        // 職業徽章
        const bx = r.x + 56, by = r.y + 56;
        ctx.fillStyle = jd.color;
        ctx.beginPath(); ctx.arc(bx, by, 24, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,235,170,0.7)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bx, by, 24, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.font = 'bold 22px "Microsoft JhengHei", sans-serif';
        ctx.fillText(jd.short, bx, by + 8);
        ctx.textAlign = 'left';
        ctx.font = 'bold 17px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#ffeec2';
        ctx.fillText(`${meta.name}`, r.x + 96, r.y + 40);
        ctx.font = '13px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#cdd8ee';
        ctx.fillText(`${meta.rankName}　Lv.${meta.level}`, r.x + 96, r.y + 62);
        ctx.fillStyle = '#a8bcd8';
        ctx.fillText(`📍 ${meta.mapName}　💰 ${Utils.fmt(meta.meso)}`, r.x + 96, r.y + 82);
        // 刪除鈕
        const db = this.slotDelRects[i];
        const delConfirm = game.confirmDelSlot === i;
        this._btn(ctx, db, '🗑', true, delConfirm ? 'red' : 'default');
        if (delConfirm) {
          ctx.textAlign = 'right';
          ctx.font = 'bold 11px "Microsoft JhengHei", sans-serif';
          ctx.fillStyle = '#ff9a8a';
          ctx.fillText('再點一次刪除', db.x - 8, r.y + 32);
        }
      } else {
        ctx.textAlign = 'center';
        ctx.font = '16px "Microsoft JhengHei", sans-serif';
        ctx.fillStyle = '#7e8aa6';
        ctx.fillText('＋ 空欄位 — 建立新角色', r.x + r.w / 2, r.y + r.h / 2 + 6);
      }
    }
    const blink = (Math.sin(game.time * 4) + 1) / 2;
    ctx.globalAlpha = 0.5 + blink * 0.5;
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#fff385';
    ctx.fillText('↑↓ / 點擊 選擇　　Enter 進入　　D / 🗑 刪除　　Esc 返回', W / 2, H - 40);
    ctx.globalAlpha = 1;
  },
};
