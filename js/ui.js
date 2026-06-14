// HUD 與所有遊戲視窗（奇幻 RPG 風格外觀；佈局與點擊判定座標不變）
const UI = {
  show: { inv: false, skill: false, stat: false },
  R: {},
  confirmReset: 0,

  inRect(r) {
    return Input.mouseX >= r.x && Input.mouseX <= r.x + r.w &&
           Input.mouseY >= r.y && Input.mouseY <= r.y + r.h;
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

  layout() {
    const R = {};
    if (this.show.inv) {
      const r = { x: 670, y: 70, w: 342, h: 286 };
      R.inv = r;
      R.invClose = { x: r.x + r.w - 26, y: r.y + 7, w: 19, h: 19 };
      R.invSlots = [];
      for (let i = 0; i < CONFIG.INV_SIZE; i++) {
        const col = i % 6, row = Math.floor(i / 6);
        R.invSlots.push({ x: r.x + 12 + col * 54, y: r.y + 38 + row * 54, w: 48, h: 48 });
      }
    }
    if (this.show.skill) {
      const r = { x: 28, y: 70, w: 384, h: 346 };
      R.skill = r;
      R.skillClose = { x: r.x + r.w - 26, y: r.y + 7, w: 19, h: 19 };
      R.skillRows = [];
      R.skillPlus = [];
      this._skillList().forEach((id, i) => {
        const ry = r.y + 38 + i * 74;
        R.skillRows.push({ x: r.x + 10, y: ry, w: r.w - 20, h: 68 });
        R.skillPlus.push({ x: r.x + r.w - 46, y: ry + 21, w: 26, h: 26 });
      });
    }
    if (this.show.stat) {
      const r = { x: 372, y: 44, w: 324, h: 486 };
      R.stat = r;
      R.statClose = { x: r.x + r.w - 26, y: r.y + 7, w: 19, h: 19 };
      R.statEquips = [];
      const cols = 4, sz = 46, gapX = 10, gapY = 22, gridY = r.y + 250, startX = r.x + 18;
      EQUIP_SLOTS.forEach((slot, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        R.statEquips.push({ slot, x: startX + col * (sz + gapX), y: gridY + row * (sz + gapY), w: sz, h: sz });
      });
      R.resetBtn = { x: r.x + 16, y: r.y + r.h - 32, w: r.w - 32, h: 24 };
    }
    this.R = R;
  },

  update(game, dt) {
    if (this.confirmReset > 0) this.confirmReset -= dt;
    if (Input.pressed['KeyI']) this.show.inv = !this.show.inv;
    if (Input.pressed['KeyK']) this.show.skill = !this.show.skill;
    if (Input.pressed['KeyP']) this.show.stat = !this.show.stat;
    if (Input.pressed['Escape']) {
      this.show.inv = this.show.skill = this.show.stat = false;
    }
    this.layout();
    if (!Input.clicked) return;

    const p = game.player;
    const R = this.R;
    if (R.inv && this.inRect(R.inv)) {
      Input.clicked = false;
      if (this.inRect(R.invClose)) { this.show.inv = false; return; }
      R.invSlots.forEach((s, i) => { if (this.inRect(s)) p.useSlot(i, game); });
    } else if (R.skill && this.inRect(R.skill)) {
      Input.clicked = false;
      if (this.inRect(R.skillClose)) { this.show.skill = false; return; }
      this._skillList().forEach((id, i) => { if (R.skillPlus[i] && this.inRect(R.skillPlus[i])) p.skillUp(id); });
    } else if (R.stat && this.inRect(R.stat)) {
      Input.clicked = false;
      if (this.inRect(R.statClose)) { this.show.stat = false; return; }
      for (const e of R.statEquips) { if (this.inRect(e)) p.unequip(e.slot); }
      if (this.inRect(R.resetBtn)) {
        if (this.confirmReset > 0) {
          Game.clearSave();
          location.reload();
        } else {
          this.confirmReset = 3;
        }
      }
    }
  },

  draw(ctx, game) {
    const p = game.player;
    this.drawMapName(ctx, game);
    this.drawBossBar(ctx, game);
    this.drawHUD(ctx, game);
    this.layout();
    if (this.show.inv) this.drawInv(ctx, p);
    if (this.show.skill) this.drawSkill(ctx, p);
    if (this.show.stat) this.drawStat(ctx, p);
    this.drawTooltip(ctx, p);
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

  // ══════════════════ 視窗 ══════════════════

  drawInv(ctx, p) {
    const r = this.R.inv;
    this.chrome(ctx, r, '🎒 背包 [I]', this.R.invClose);
    this.R.invSlots.forEach((s, i) => {
      this._slot(ctx, s, this.inRect(s));
      const it = p.inventory[i];
      if (it) {
        Sprites.drawItemIcon(ctx, it.id, s.x + 24, s.y + 24, 40);
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
  },

  drawSkill(ctx, p) {
    const r = this.R.skill;
    this.chrome(ctx, r, `✦ ${p.jobDef.name}技能 [K]　SP：${p.sp}`, this.R.skillClose);
    this._skillList().forEach((id, i) => {
      const d = SkillDB[id];
      if (!this.R.skillRows[i]) return;
      const lv = p.skills[id] || 0;
      const row = this.R.skillRows[i];
      const unlocked = p.level >= d.reqLv;
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
      // 技能徽章（金環 + 漸層 + 快捷鍵字母）
      const mx = row.x + 26, my = row.y + 34;
      const ig = ctx.createRadialGradient(mx - 4, my - 6, 2, mx, my, 19);
      ig.addColorStop(0, unlocked ? '#7aa2ec' : '#5c5c6a');
      ig.addColorStop(1, unlocked ? '#2c4a9e' : '#3a3a46');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(mx, my, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = unlocked ? 'rgba(232,196,110,0.9)' : 'rgba(130,130,150,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = unlocked ? '#fff' : '#9a9aaa';
      ctx.font = 'bold 14px Verdana';
      ctx.textAlign = 'center';
      ctx.fillText(d.key, mx, my + 5);
      // 文字
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = unlocked ? '#ffeec2' : '#8a8a99';
      ctx.fillText(`${d.name}　Lv.${lv}/${d.maxLv}`, row.x + 52, row.y + 22);
      ctx.font = '11px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = unlocked ? '#a8bcd8' : '#70707f';
      ctx.fillText(unlocked ? d.desc(Math.max(1, lv)) : `🔒 角色 Lv.${d.reqLv} 解鎖`, row.x + 52, row.y + 42);
      if (lv > 0) {
        ctx.fillStyle = '#8fd8a0';
        ctx.fillText(`MP 消耗 ${d.mpCost(lv)}　冷卻 ${d.cd}s`, row.x + 52, row.y + 60);
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
      ['名稱', CONFIG.PLAYER_NAME],
      ['職業', p.jobDef.name],
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
      if (id) Sprites.drawItemIcon(ctx, id, e.x + 23, e.y + 23, 38);
      ctx.font = '9px "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a8c8';
      ctx.fillText(EQUIP_SLOT_NAMES[e.slot], e.x + e.w / 2, e.y + e.h + 11);
    });
    const b = this.R.resetBtn;
    const rg = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    rg.addColorStop(0, this.confirmReset > 0 ? '#e85d4a' : 'rgba(170,60,52,0.4)');
    rg.addColorStop(1, this.confirmReset > 0 ? '#a82a20' : 'rgba(120,36,30,0.4)');
    ctx.fillStyle = rg;
    Utils.rr(ctx, b.x, b.y, b.w, b.h, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,160,140,0.45)';
    ctx.lineWidth = 1.2;
    Utils.rr(ctx, b.x, b.y, b.w, b.h, 7);
    ctx.stroke();
    ctx.fillStyle = '#ffe4dc';
    ctx.font = '12px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.confirmReset > 0 ? '⚠ 再點一次確認刪除！' : '刪除存檔重新開始', b.x + b.w / 2, b.y + 16);
  },

  itemLines(d, p, action) {
    const lines = [{ t: d.name, c: '#ffe082' }];
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
      if (d.atk) lines.push({ t: `攻擊力 +${d.atk}`, c: '#ffab91' });
      if (d.def) lines.push({ t: `防禦力 +${d.def}`, c: '#90caf9' });
      if (d.hp) lines.push({ t: `最大 HP +${d.hp}`, c: '#69f0ae' });
      if (d.mp) lines.push({ t: `最大 MP +${d.mp}`, c: '#64b5f6' });
      if (d.spd) lines.push({ t: `移動速度 +${d.spd}%`, c: '#80deea' });
      lines.push({ t: `需求等級 ${d.reqLv || 1}`, c: p.level >= (d.reqLv || 1) ? '#a5d6a7' : '#ef5350' });
      if (d.desc) lines.push({ t: d.desc, c: '#b0bec5' });
    }
    lines.push({ t: action, c: '#fff176' });
    return lines;
  },

  drawTooltip(ctx, p) {
    let lines = null;
    const R = this.R;
    if (R.invSlots) {
      R.invSlots.forEach((s, i) => {
        const it = p.inventory[i];
        if (this.inRect(s) && it) {
          const d = ItemDB[it.id];
          lines = this.itemLines(d, p, d.type === 'use' ? '點擊：使用' : '點擊：裝備');
        }
      });
    }
    if (!lines && R.statEquips) {
      for (const e of R.statEquips) {
        if (this.inRect(e) && p.equips[e.slot]) {
          lines = this.itemLines(ItemDB[p.equips[e.slot]], p, '點擊：卸下');
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
    // 底部面板
    const hg = ctx.createLinearGradient(0, H - 58, 0, H);
    hg.addColorStop(0, 'rgba(22,26,50,0.92)');
    hg.addColorStop(1, 'rgba(10,11,24,0.95)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, H - 58, W, 58);
    // 金色頂緣雙線
    ctx.fillStyle = 'rgba(216,178,94,0.85)';
    ctx.fillRect(0, H - 58, W, 1.6);
    ctx.fillStyle = 'rgba(216,178,94,0.28)';
    ctx.fillRect(0, H - 55, W, 1);
    // 中央頂緣鑽飾
    ctx.fillStyle = '#d8b25e';
    ctx.save();
    ctx.translate(W / 2, H - 57);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();

    // 等級徽章（金環雙圈 + 星星）
    const bx = 34, by = H - 31;
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

    // 名牌
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#ffeec2';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 3;
    ctx.fillText(CONFIG.PLAYER_NAME, 64, H - 38);
    ctx.shadowBlur = 0;
    // 楓幣
    Sprites.drawItemIcon(ctx, 'meso', 72, H - 20, 17);
    ctx.font = 'bold 12px Verdana';
    ctx.fillStyle = '#ffd87a';
    ctx.textAlign = 'left';
    ctx.fillText(Utils.fmt(p.meso), 85, H - 16);

    // HP / MP 華麗條
    this.ornateBar(ctx, 240, H - 52, 250, 15, p.hp / p.maxHp,
      ['#ff9a7a', '#e8472f', '#8e1e12'], `HP ${Math.ceil(p.hp)} / ${p.maxHp}`, 'heart');
    this.ornateBar(ctx, 240, H - 33, 250, 15, p.mp / p.maxMp,
      ['#7ec8f8', '#2a7fd4', '#143e7e'], `MP ${Math.ceil(p.mp)} / ${p.maxMp}`, 'drop');

    // EXP（最底金條）
    const need = expNeed(p.level);
    const ratio = Utils.clamp(p.exp / need, 0, 1);
    ctx.fillStyle = '#0c0d1c';
    ctx.fillRect(0, H - 8, W, 8);
    if (ratio > 0.002) {
      const xg = ctx.createLinearGradient(0, H - 8, 0, H);
      xg.addColorStop(0, '#ffe9a0');
      xg.addColorStop(1, '#d89a2a');
      ctx.fillStyle = xg;
      ctx.fillRect(0, H - 8, W * ratio, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(0, H - 8, W * ratio, 2.6);
      // 前緣光點
      ctx.save();
      ctx.translate(W * ratio, H - 4);
      ctx.fillStyle = '#fff6d8';
      Art.sparkle(ctx, 5);
      ctx.fill();
      ctx.restore();
    }
    ctx.font = '10px Verdana';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText(`EXP ${((p.exp / need) * 100).toFixed(2)}%`, W - 6, H - 12);

    // 快捷鍵提示（依職業技能動態顯示）
    ctx.textAlign = 'left';
    ctx.font = '11px "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = '#8fa3bd';
    const skHint = p.skillList().map((id) => `${SkillDB[id].key} ${SkillDB[id].name}`).join('　');
    ctx.fillText(`X 攻擊　${skHint}　Space 跳躍`, 510, H - 44);
    ctx.fillStyle = p.sp > 0 ? '#ffd87a' : '#8fa3bd';
    ctx.fillText(`Z 撿取　1/2 藥水　I 背包　K 技能${p.sp > 0 ? `(SP:${p.sp}!)` : ''}　P 角色　M 音效`, 510, H - 26);
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
      '← →  移動　　Space  跳躍　　↑  爬繩索 / 進入傳送門　　↓+Space  下跳',
      'X  普通攻擊　　C / V / B / A  職業技能　　Z  撿取　　1 / 2  藥水',
      'I  背包　　K  技能加點　　P  角色資訊　　M  音效開關',
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
    ctx.fillText(game.hasSave ? '— 按 Enter 繼續冒險 —' : '— 按 Enter 選擇職業開始 —', W / 2, 452);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    if (game.hasSave) {
      ctx.font = '13px "Microsoft JhengHei", sans-serif';
      ctx.fillStyle = '#94a8c8';
      ctx.fillText('（偵測到存檔。想刪檔重練請按 N）', W / 2, 482);
    }
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
    const sk = jd.skills.map((id) => `${SkillDB[id].key}·${SkillDB[id].name}`).join('　');
    ctx.fillText(`技能：${sk}`, W / 2, dy + 84);
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
};
