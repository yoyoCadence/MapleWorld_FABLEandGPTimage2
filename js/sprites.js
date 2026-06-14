// 角色 / 怪物 / 圖示：PNG 素材優先，程序化繪製作為 fallback
const Sprites = {
  OUT: 'rgba(56,36,44,0.9)',   // 動漫描邊色
  ASSET_BASE: 'assets/',
  PLAYER_ASSET: 'sprites/player/hero-adventurer.png',
  // 每職業專屬立繪（缺檔時自動沿用 hero-adventurer.png）
  PLAYER_ASSETS: {
    warrior: 'sprites/player/hero-adventurer.png',
    magician: 'sprites/player/hero-magician.png',
    archer: 'sprites/player/hero-archer.png',
    thief: 'sprites/player/hero-thief.png',
    pirate: 'sprites/player/hero-pirate.png',
  },
  MONSTER_ASSETS: {
    snail: 'mob_blue_snail.png',
    slime: 'mob_bubbling.png',
    mushroom: 'mob_zombie_mushroom.png',
    purpleMush: 'mob_zombie_mushroom.png',
    golem: 'mob_stump.png',
    boss: 'mob_darklord.png',
    // 重用既有 PNG 的新怪物（缺專屬素材時的暫代）
    boar: 'mob_pig.png',
    bat: 'mob_bat.png',
    eye: 'mob_eye.png',
    yeti: 'mob_yeti.png',
    fireGoblin: 'mob_goblin.png',
    drake: 'mob_drake.png',
    mummy: 'mob_mummy.png',
    yetiKing: 'mob_yeti.png',
    flameDrake: 'mob_drake.png',
    darkLord: 'mob_darklord.png',
  },
  WEAPON_ASSETS: {
    woodSword: 'weapon_wood_sword.png',
    ironSword: 'weapon_iron_sword.png',
    mapleSword: 'weapon_maple_sword.png',
    kingSword: 'weapon_king_sword.png',
  },
  _imageCache: {},

  // ══════════════════ 玩家：Q 版冒險者 ══════════════════
  // 原點 = 腳底中心。約 2.5 頭身：大頭、大眼、紅圍巾、藍色戰術上衣
  drawPlayer(ctx, p, t) {
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.invinc > 0 && Math.floor(p.invinc * 14) % 2 === 0) ctx.globalAlpha = 0.4;

    // 名牌
    this._nameplate(ctx, `${CONFIG.PLAYER_NAME} Lv.${p.level}`);

    // 腳下柔影
    if (!p.climbing) {
      ctx.fillStyle = 'rgba(22,30,22,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, -1, 14, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._drawPlayerAsset(ctx, p, t)) {
      ctx.restore();
      return;
    }

    ctx.scale(p.facing, 1);

    if (p.climbing) {
      this._heroClimb(ctx, p, t);
      ctx.restore();
      return;
    }

    const attacking = p.attackAnim > 0;
    const q = attacking ? 1 - p.attackAnim / p.attackDur : 0;
    const inAir = !p.onGround;
    const walking = Math.abs(p.vx) > 10 && p.onGround;
    const wPh = Math.sin(p.animT * 11);
    const hit = p.invinc > CONFIG.INVINCIBLE_TIME - 0.45;
    const bob = inAir ? 0 : walking ? Math.sin(p.animT * 22) * 1.6 : Math.sin(t * 2.4) * 1.1;
    const lean = attacking ? -0.06 + q * 0.12 : hit ? -0.14 : 0;

    // ── 圍巾尾（最底層，飄向身後）──
    const flow = inAir ? -10 : Math.sin(t * 3.2) * 3;
    ctx.fillStyle = '#d8503e';
    ctx.beginPath();
    ctx.moveTo(-3, -29 + bob);
    ctx.bezierCurveTo(-12, -27 + bob, -17, -24 + bob + flow * 0.4, -22, -19 + bob + flow);
    ctx.lineTo(-19, -15 + bob + flow);
    ctx.bezierCurveTo(-14, -20 + bob + flow * 0.4, -9, -23 + bob, -2, -24 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(120,30,24,0.45)';
    ctx.beginPath();
    ctx.moveTo(-8, -26 + bob);
    ctx.quadraticCurveTo(-15, -23 + bob + flow * 0.5, -20, -17.5 + bob + flow);
    ctx.lineTo(-19, -15.5 + bob + flow);
    ctx.quadraticCurveTo(-13, -21 + bob, -7, -24 + bob);
    ctx.closePath();
    ctx.fill();

    // ── 後手 ──
    const backRot = attacking ? -0.6 : inAir ? -2.0 : walking ? wPh * 0.5 : 0.18;
    this._heroArm(ctx, -6.5, -26.5 + bob, backRot, '#3a64b8', false, 0, null);

    // ── 腿與靴 ──
    let frontRot = 0, backLegRot = 0;
    if (walking) { frontRot = wPh * 0.55; backLegRot = -wPh * 0.55; }
    if (inAir) { frontRot = -0.55; backLegRot = 0.85; }
    this._heroLeg(ctx, -4.5, -13 + bob * 0.4, backLegRot);
    this._heroLeg(ctx, 4.5, -13 + bob * 0.4, frontRot);

    ctx.save();
    ctx.rotate(lean);

    // ── 上衣（束腰戰術服 + 波浪下襬）──
    ctx.fillStyle = this.OUT;
    this._tunicPath(ctx, bob, 1.1);
    ctx.fill();
    const tg = ctx.createLinearGradient(0, -31 + bob, 0, -11 + bob);
    tg.addColorStop(0, '#6498e8');
    tg.addColorStop(1, '#3a64b8');
    ctx.fillStyle = tg;
    this._tunicPath(ctx, bob, 0);
    ctx.fill();
    // 金色下襬滾邊
    ctx.strokeStyle = '#f0c75e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-9.6, -13.4 + bob);
    ctx.quadraticCurveTo(-5, -11 + bob, 0, -12.6 + bob);
    ctx.quadraticCurveTo(5, -11 + bob, 9.6, -13.4 + bob);
    ctx.stroke();
    // 皮帶 + 金釦
    ctx.fillStyle = '#4a2e16';
    ctx.fillRect(-9, -19 + bob, 18, 3.6);
    ctx.fillStyle = '#f0c75e';
    ctx.beginPath();
    ctx.arc(0.5, -17.2 + bob, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6018';
    ctx.beginPath();
    ctx.arc(0.5, -17.2 + bob, 1, 0, Math.PI * 2);
    ctx.fill();
    // 領口
    ctx.fillStyle = '#f2ead8';
    ctx.beginPath();
    ctx.moveTo(-4.2, -30 + bob);
    ctx.lineTo(4.2, -30 + bob);
    ctx.lineTo(0, -25.5 + bob);
    ctx.closePath();
    ctx.fill();

    // ── 圍巾頸圈 ──
    ctx.fillStyle = '#e85d4a';
    ctx.beginPath();
    ctx.ellipse(0, -29.5 + bob, 7.8, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,30,24,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, -28.6 + bob, 7, 2.2, 0, 0, Math.PI);
    ctx.fill();

    // ── 頭部 ──
    ctx.save();
    ctx.translate(0.5, -41.5 + bob);
    this._heroHead(ctx, t, { attacking, hit, inAir });
    ctx.restore();

    ctx.restore(); // lean

    // ── 前手 + 武器 ──
    const wDef = p.equips.weapon ? ItemDB[p.equips.weapon] : null;
    let ang = 0.5 + Math.sin(t * 2.4) * 0.05;
    if (walking) ang = 0.45 - wPh * 0.3;
    if (inAir) ang = -0.85;
    if (attacking) ang = -2.1 + q * 3.0;
    this._heroArm(ctx, 6.5, -26.5 + bob, ang, '#5b8fe0', true, q, wDef);

    ctx.restore();
  },

  _drawPlayerAsset(ctx, p, t) {
    const jobFile = this.PLAYER_ASSETS[p.job] || ('sprites/player/hero-' + p.job + '.png');
    let img = this._loadImage(this.ASSET_BASE + jobFile);
    if (!this._readyImage(img)) img = this._loadImage(this.ASSET_BASE + this.PLAYER_ASSET);
    if (!this._readyImage(img)) return false;

    const attacking = p.attackAnim > 0;
    const q = attacking ? 1 - p.attackAnim / p.attackDur : 0;
    const inAir = !p.onGround;
    const walking = Math.abs(p.vx) > 10 && p.onGround;
    const bob = p.climbing
      ? Math.sin(p.animT * 8) * 1.4
      : inAir
        ? -2
        : walking
          ? Math.sin(p.animT * 18) * 2.4
          : Math.sin(t * 2.3) * 1.2;
    const lean = attacking ? -0.11 + q * 0.22 : inAir ? -0.06 : walking ? Math.sin(p.animT * 9) * 0.035 : 0;
    const dh = p.climbing ? 76 : 84;
    const dw = dh * (img.naturalWidth / img.naturalHeight);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(0, bob);
    ctx.scale(-p.facing, 1);
    ctx.rotate(lean);
    if (p.climbing) ctx.rotate(Math.sin(p.animT * 7) * 0.035);
    ctx.drawImage(img, -dw * 0.48, -dh - 2, dw, dh);
    if (attacking && !p.climbing) this._drawWeaponAsset(ctx, p, q, t, dw, dh);
    ctx.restore();
    return true;
  },

  _drawWeaponAsset(ctx, p, q, t, heroW, heroH) {
    const id = p.equips.weapon || 'woodSword';
    const file = this.WEAPON_ASSETS[id];
    const img = file ? this._loadImage(this.ASSET_BASE + 'sprites/weapons/' + file) : null;
    if (!this._readyImage(img)) return false;
    const stem = file.replace(/\.png$/i, '');
    const sheet = this._loadImage(this.ASSET_BASE + 'sprites/weapons/anim/' + stem + '_swing.png');

    const pulse = 0.55 + Math.sin(t * 14) * 0.18;
    ctx.save();
    ctx.translate(-heroW * 0.29, -heroH * 0.48);
    if (this._readyImage(sheet)) {
      const cols = 6;
      const frame = Math.min(cols - 1, Math.floor(q * cols));
      const sw = sheet.naturalWidth / cols;
      const sh = sheet.naturalHeight;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.86;
      ctx.drawImage(sheet, frame * sw, 0, sw, sh, -46, -88, 92, 138);
    } else {
      ctx.rotate(-1.2 + q * 2.5);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(img, -12, -57, 24, 64);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = id === 'kingSword' ? 0.55 + pulse * 0.25 : 0.35;
      ctx.drawImage(img, -15, -61, 30, 72);
    }
    ctx.restore();
    return true;
  },

  _nameplate(ctx, tag) {
    ctx.font = '10px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(tag).width + 14;
    ctx.fillStyle = 'rgba(16,14,30,0.72)';
    Utils.rr(ctx, -tw / 2, 6, tw, 15, 7.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,199,94,0.55)';
    ctx.lineWidth = 1;
    Utils.rr(ctx, -tw / 2, 6, tw, 15, 7.5);
    ctx.stroke();
    ctx.fillStyle = '#ffeec2';
    ctx.fillText(tag, 0, 17);
  },

  _tunicPath(ctx, bob, grow) {
    const g = grow || 0;
    ctx.beginPath();
    ctx.moveTo(-7 - g, -30 + bob);
    ctx.bezierCurveTo(-9.5 - g, -24 + bob, -10.5 - g, -17 + bob, -9.6 - g, -13 + bob);
    ctx.quadraticCurveTo(-5, -10.4 + bob - g, 0, -12.2 + bob);
    ctx.quadraticCurveTo(5, -10.4 + bob - g, 9.6 + g, -13 + bob);
    ctx.bezierCurveTo(10.5 + g, -17 + bob, 9.5 + g, -24 + bob, 7 + g, -30 + bob);
    ctx.quadraticCurveTo(0, -32.2 + bob - g, -7 - g, -30 + bob);
    ctx.closePath();
  },

  _heroLeg(ctx, hx, hy, rot) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(rot);
    // 深色褲
    ctx.fillStyle = '#46396a';
    Utils.rr(ctx, -2.9, -1, 5.8, 8.6, 2.6);
    ctx.fill();
    ctx.strokeStyle = this.OUT;
    ctx.lineWidth = 1;
    Utils.rr(ctx, -2.9, -1, 5.8, 8.6, 2.6);
    ctx.stroke();
    // 皮靴（鞋尖朝前）
    ctx.fillStyle = '#7a4a26';
    ctx.beginPath();
    ctx.moveTo(-3.2, 6.4);
    ctx.lineTo(-3.2, 11.6);
    ctx.quadraticCurveTo(-2.8, 13.2, 0, 13.2);
    ctx.lineTo(4.6, 13.2);
    ctx.quadraticCurveTo(6, 13, 5.8, 11.6);
    ctx.quadraticCurveTo(5.4, 10.2, 3.2, 9.8);
    ctx.lineTo(3.2, 6.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.OUT;
    ctx.stroke();
    // 靴口
    ctx.fillStyle = '#9a6236';
    Utils.rr(ctx, -3.4, 5.8, 6.8, 2.2, 1);
    ctx.fill();
    ctx.restore();
  },

  _heroArm(ctx, sx, sy, rot, sleeveCol, front, q, wDef) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.fillStyle = sleeveCol;
    Utils.rr(ctx, -2.5, -1.5, 5, 9.5, 2.4);
    ctx.fill();
    ctx.strokeStyle = this.OUT;
    ctx.lineWidth = 1;
    Utils.rr(ctx, -2.5, -1.5, 5, 9.5, 2.4);
    ctx.stroke();
    // 手
    ctx.translate(0, 9.4);
    ctx.fillStyle = '#ffe2c4';
    ctx.beginPath();
    ctx.arc(0, 0, 2.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.OUT;
    ctx.stroke();

    if (front && wDef) this._sword(ctx, wDef, q);
    ctx.restore();
  },

  _sword(ctx, wDef, q) {
    const len = 30 + (wDef.atk || 0) * 0.22;
    // 護手（弧形金護手）
    ctx.strokeStyle = '#c89028';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 3.6, 4.6, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    // 劍刃（錐形 + 中脊線）
    if (wDef.color === '#f1c40f') {
      ctx.save();
      ctx.shadowColor = '#ffd86a';
      ctx.shadowBlur = 9;
    }
    const bg = ctx.createLinearGradient(0, 4, 0, 4 + len);
    bg.addColorStop(0, wDef.color);
    bg.addColorStop(0.75, wDef.color);
    bg.addColorStop(1, '#ffffff');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-2.9, 4.5);
    ctx.lineTo(-1.5, 4 + len);
    ctx.quadraticCurveTo(0, 9 + len, 1.5, 4 + len);
    ctx.lineTo(2.9, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,30,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (wDef.color === '#f1c40f') ctx.restore();
    // 中脊高光
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 2 + len);
    ctx.stroke();
    // 揮擊瞬間的刃光
    if (q > 0.3 && q < 0.65) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#fff';
      ctx.translate(0, 4 + len * 0.6);
      Art.sparkle(ctx, 5);
      ctx.fill();
      ctx.restore();
    }
  },

  _heroHead(ctx, t, mood) {
    // 後髮（腦後髮束）
    ctx.fillStyle = '#6a3c1c';
    ctx.beginPath();
    ctx.moveTo(-11.5, -3);
    ctx.quadraticCurveTo(-14.5, 4, -12.5, 9.5);
    ctx.quadraticCurveTo(-10.5, 7, -9.5, 9);
    ctx.quadraticCurveTo(-8.5, 5.5, -7, 7.5);
    ctx.quadraticCurveTo(-7.5, 2, -8, -2);
    ctx.closePath();
    ctx.fill();

    // 臉
    ctx.fillStyle = '#ffe2c4';
    ctx.beginPath();
    ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.OUT;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
    ctx.stroke();
    // 下巴柔影
    ctx.fillStyle = 'rgba(232,178,128,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 8.2, 6.4, 2.4, 0, 0, Math.PI);
    ctx.fill();

    // ── 表情 ──
    const blink = (t % 3.4) < 0.12;
    if (mood.hit) {
      // 受傷：>< 眼 + 咬牙
      ctx.strokeStyle = '#2c1a10';
      ctx.lineWidth = 1.8;
      for (const ex of [-2.4, 5.8]) {
        ctx.beginPath();
        ctx.moveTo(ex - 2.2, -1.2); ctx.lineTo(ex + 2.2, 2.2);
        ctx.moveTo(ex + 2.2, -1.2); ctx.lineTo(ex - 2.2, 2.2);
        ctx.stroke();
      }
      ctx.fillStyle = '#7a3030';
      Utils.rr(ctx, 1, 5.6, 5, 2.4, 1.2);
      ctx.fill();
    } else if (blink) {
      ctx.strokeStyle = '#2c1a10';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(5.8, 0.8, 2.8, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-2.4, 0.8, 2.3, 0.15, Math.PI - 0.15);
      ctx.stroke();
    } else {
      this._animeEye(ctx, 5.8, 0.7, 3.1, 1);
      this._animeEye(ctx, -2.4, 0.7, 2.6, 0.86);
    }
    // 眉
    if (!mood.hit) {
      ctx.strokeStyle = '#4a2c14';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (mood.attacking) {
        ctx.moveTo(2.6, -4.6); ctx.lineTo(8.6, -3.2);
        ctx.moveTo(0.2, -4.4); ctx.lineTo(-4.8, -3.4);
      } else {
        ctx.arc(5.8, -2.8, 3, Math.PI + 0.5, Math.PI * 2 - 0.5);
        ctx.moveTo(-0.2, -3.9);
        ctx.arc(-2.4, -2.9, 2.6, Math.PI + 0.5, Math.PI * 2 - 0.5);
      }
      ctx.stroke();
    }
    // 腮紅
    ctx.fillStyle = 'rgba(255,138,128,0.32)';
    ctx.beginPath();
    ctx.ellipse(8.4, 4, 2.4, 1.4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-4.6, 4, 2.1, 1.3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // 嘴
    if (!mood.hit) {
      if (mood.attacking) {
        ctx.fillStyle = '#7a3030';
        ctx.beginPath();
        ctx.ellipse(3.4, 6.4, 1.9, 2.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e89090';
        ctx.beginPath();
        ctx.ellipse(3.4, 7.4, 1.2, 1, 0, 0, Math.PI);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#9a5040';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(3.2, 5.6, 2.2, 0.25, Math.PI - 0.45);
        ctx.stroke();
      }
    }

    // ── 瀏海 + 側髮（蓋在臉上層）──
    ctx.fillStyle = '#8a5226';
    ctx.beginPath();
    ctx.moveTo(-11.8, 1.5);
    ctx.bezierCurveTo(-13.5, -8, -7, -14.5, 0, -14.2);
    ctx.bezierCurveTo(7.5, -14.5, 13.5, -8, 11.8, 1.5);
    // 右側髮尖
    ctx.quadraticCurveTo(12.8, 4.5, 11.6, 7.5);
    ctx.quadraticCurveTo(10.6, 3.5, 9.4, 0.5);
    // 瀏海鋸齒（由右至左 4 束）
    ctx.quadraticCurveTo(8.8, -4, 7.2, -5.5);
    ctx.quadraticCurveTo(6.8, -2.5, 4.6, 0.2);
    ctx.quadraticCurveTo(3.6, -4.5, 1.6, -6);
    ctx.quadraticCurveTo(0.8, -2.5, -1.4, -0.2);
    ctx.quadraticCurveTo(-2.4, -5, -4.4, -6);
    ctx.quadraticCurveTo(-5, -3, -6.8, -0.6);
    ctx.quadraticCurveTo(-7.6, -4, -9.4, -4.6);
    // 左側髮尖
    ctx.quadraticCurveTo(-10, 2.5, -12.2, 8);
    ctx.quadraticCurveTo(-12.6, 4, -11.8, 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(74,44,20,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // 髮絲高光帶
    ctx.strokeStyle = 'rgba(216,156,92,0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, -1.5, 9.6, Math.PI * 1.18, Math.PI * 1.66);
    ctx.stroke();
    // 呆毛
    ctx.strokeStyle = '#8a5226';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0.5, -14);
    ctx.quadraticCurveTo(3, -20.5, 7.5, -18.5);
    ctx.stroke();
    // 楓葉髮飾
    ctx.save();
    ctx.translate(8.6, -8.6);
    ctx.rotate(0.5);
    ctx.fillStyle = '#e8553e';
    Art.leaf(ctx, 4.2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,40,30,0.8)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  },

  _animeEye(ctx, x, y, r, s) {
    // 眼白
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    // 虹膜（上深下亮）
    ctx.fillStyle = '#3f7ad9';
    ctx.beginPath();
    ctx.arc(x + 0.3, y + 0.5, r * 0.78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#79b0f2';
    ctx.beginPath();
    ctx.arc(x + 0.3, y + 1.1, r * 0.5, 0, Math.PI);
    ctx.fill();
    // 瞳孔 + 雙高光
    ctx.fillStyle = '#1a2030';
    ctx.beginPath();
    ctx.arc(x + 0.3, y + 0.4, r * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.4, y + r * 0.55, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    // 上睫毛
    ctx.strokeStyle = '#2c1a10';
    ctx.lineWidth = 1.7 * s;
    ctx.beginPath();
    ctx.arc(x, y - 0.4, r * 1.06, Math.PI + 0.35, Math.PI * 2 - 0.25);
    ctx.stroke();
  },

  _heroClimb(ctx, p, t) {
    const ph = Math.sin(p.animT * 8);
    // 腿（交替踩）
    this._heroLeg(ctx, -4, -12 + ph * 1.5, 0.2);
    this._heroLeg(ctx, 4, -12 - ph * 1.5, -0.2);
    // 背面上衣
    ctx.fillStyle = '#4a78cc';
    this._tunicPath(ctx, 0, 0);
    ctx.fill();
    ctx.strokeStyle = this.OUT;
    ctx.lineWidth = 1;
    this._tunicPath(ctx, 0, 0);
    ctx.stroke();
    ctx.fillStyle = '#4a2e16';
    ctx.fillRect(-9, -19, 18, 3.4);
    // 雙手向上抓繩
    this._heroArm(ctx, -5, -28, Math.PI - 0.35 + ph * 0.18, '#3a64b8', false, 0, null);
    this._heroArm(ctx, 5, -28, Math.PI + 0.35 - ph * 0.18, '#5b8fe0', false, 0, null);
    // 圍巾垂side
    ctx.fillStyle = '#d8503e';
    ctx.beginPath();
    ctx.moveTo(2, -30);
    ctx.quadraticCurveTo(9 + Math.sin(t * 2.5) * 2, -22, 7, -14);
    ctx.lineTo(4.4, -15);
    ctx.quadraticCurveTo(5.5, -22, 0, -27);
    ctx.closePath();
    ctx.fill();
    // 後腦勺（全髮）
    ctx.save();
    ctx.translate(0.5, -41.5);
    ctx.fillStyle = '#8a5226';
    ctx.beginPath();
    ctx.arc(0, -1, 11.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(74,44,20,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // 後髮尾鋸齒
    ctx.fillStyle = '#8a5226';
    ctx.beginPath();
    ctx.moveTo(-10, 5);
    for (let i = 0; i < 5; i++) {
      ctx.quadraticCurveTo(-7 + i * 4, 13 + (i % 2) * 2, -5 + i * 4, 6.5);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(216,156,92,0.8)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -2, 9.4, Math.PI * 1.2, Math.PI * 1.7);
    ctx.stroke();
    ctx.strokeStyle = '#8a5226';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -12.5);
    ctx.quadraticCurveTo(3, -19, 7, -17);
    ctx.stroke();
    ctx.restore();
  },

  // ══════════════════ 怪物 ══════════════════

  drawMonster(ctx, m, t) {
    const d = m.def;
    ctx.save();
    ctx.translate(m.x, m.y);

    let hop = 0, sq = 1;
    if (!m.dying) {
      if (d.move === 'hop') {
        const s = Math.abs(Math.sin(m.hopT * 5.5));
        hop = s * 12;
        sq = 1 - (1 - s) * 0.12;
      } else if (d.move === 'walk') {
        hop = Math.abs(Math.sin(m.hopT * 7)) * 2;
      }
    }
    // 腳下柔影
    const shS = 1 - hop / 56;
    ctx.fillStyle = 'rgba(22,30,22,0.24)';
    ctx.beginPath();
    ctx.ellipse(0, -1, d.w * 0.42 * shS, 4.4 * shS, 0, 0, Math.PI * 2);
    ctx.fill();

    if (m.dying) {
      const p = m.deadT / 0.4;
      ctx.globalAlpha = 1 - p;
      ctx.scale(1 + p * 0.4, 1 - p * 0.6);
    }
    ctx.translate(0, -hop);
    ctx.scale((m.dir < 0 ? -1 : 1) * (2 - sq), sq);
    // d.tint 僅用於「程序化外形」的變色暫代；若有專屬 PNG 素材則不可再套色（會造成二次變色）
    const usingArt = this._readyImage(this._monsterAsset(m));
    const filters = [];
    if (d.tint && !usingArt) filters.push(d.tint);
    if (m.flash > 0) filters.push('brightness(2.1)');
    if (filters.length) ctx.filter = filters.join(' ');

    if (!this._drawMonsterAsset(ctx, m, t)) {
      const key = d.draw || (d.boss ? 'boss' : m.type);
      const fn = this['_m_' + key] || this._m_generic;
      fn.call(this, ctx, d.w, d.h, t, m);
    }

    ctx.filter = 'none';
    ctx.restore();

    // HP 條 + 名字
    if (m.hpBarT > 0 && !m.dying && !d.boss) {
      const bw = Math.max(46, d.w * 0.95);
      const bx = m.x - bw / 2, by = m.y - d.h - hop - 17;
      ctx.save();
      ctx.fillStyle = 'rgba(14,12,26,0.78)';
      Utils.rr(ctx, bx - 2, by - 2, bw + 4, 9, 4.5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(240,199,94,0.4)';
      ctx.lineWidth = 1;
      Utils.rr(ctx, bx - 2, by - 2, bw + 4, 9, 4.5);
      ctx.stroke();
      const ratio = Math.max(0, m.hp / m.maxHp);
      if (ratio > 0.01) {
        const g = ctx.createLinearGradient(0, by, 0, by + 5);
        g.addColorStop(0, '#ff8a6a');
        g.addColorStop(1, '#d83a2a');
        ctx.fillStyle = g;
        Utils.rr(ctx, bx, by, bw * ratio, 5, 2.5);
        ctx.fill();
      }
      ctx.font = '10px "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(10,10,20,0.8)';
      ctx.strokeText(d.name, m.x, by - 5);
      ctx.fillStyle = '#ffeec2';
      ctx.fillText(d.name, m.x, by - 5);
      ctx.restore();
    }
  },

  _loadImage(path) {
    if (typeof Image === 'undefined') return null;
    if (!this._imageCache[path]) {
      const img = new Image();
      img.decoding = 'async';
      img.src = path;
      this._imageCache[path] = img;
    }
    return this._imageCache[path];
  },

  _readyImage(img) {
    return img && img.complete && img.naturalWidth > 0;
  },

  _monsterAsset(m) {
    const file = (m.def && m.def.asset) || this.MONSTER_ASSETS[m.type];
    return file ? this._loadImage(this.ASSET_BASE + 'sprites/' + file) : null;
  },

  _monsterSheetAsset(m, state) {
    const file = (m.def && m.def.asset) || this.MONSTER_ASSETS[m.type] || '';
    const stem = file.replace(/\.png$/i, '');
    const candidates = ['mob_' + m.type, stem].filter(Boolean);
    for (const name of candidates) {
      const img = this._loadImage(this.ASSET_BASE + 'sprites/monsters/anim/' + name + '_' + state + '.png');
      if (this._readyImage(img)) return img;
    }
    return null;
  },

  _drawMonsterAsset(ctx, m, t) {
    const img = this._monsterAsset(m);
    if (!this._readyImage(img)) return false;

    const d = m.def;
    const heightScale = d.boss ? 1.45 : m.type === 'golem' ? 1.55 : 1.6;
    const dh = Math.round(d.h * heightScale);
    const sheet = this._monsterSheetAsset(m, m.flash > 0 ? 'hit' : 'idle');
    const src = sheet || img;
    const cols = sheet ? 4 : 1;
    const sw = src.naturalWidth / cols;
    const sh = src.naturalHeight;
    const frame = sheet
      ? (m.flash > 0 ? Math.min(3, Math.floor((1 - m.flash / 0.12) * 4)) : Math.floor((t * 5 + m.hopT * 2) % 4))
      : 0;
    const dw = Math.round(dh * sw / sh);
    const bob = d.move === 'hop'
      ? Math.sin(m.hopT * 9 + t * 0.5) * 1.5
      : d.move === 'walk'
        ? Math.sin(m.hopT * 7) * 0.8
        : 0;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(src, frame * sw, 0, sw, sh, -dw / 2, -dh + bob, dw, dh);
    ctx.restore();
    return true;
  },

  // 怪物通用大眼
  _mobEye(ctx, x, y, r, irisCol, lid) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(50,34,40,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = irisCol;
    ctx.beginPath();
    ctx.arc(x + r * 0.16, y + r * 0.18, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1626';
    ctx.beginPath();
    ctx.arc(x + r * 0.16, y + r * 0.14, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - r * 0.22, y - r * 0.32, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    if (lid > 0) {
      // 半閉眼瞼
      ctx.fillStyle = lid === 2 ? '#e8d8b8' : 'rgba(50,34,40,0.16)';
      ctx.beginPath();
      ctx.ellipse(x, y - r * (1.2 - 0.6), r + 0.6, r * 0.7, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(50,34,40,0.75)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x - r, y - r * 0.18);
      ctx.quadraticCurveTo(x, y - r * 0.42, x + r, y - r * 0.18);
      ctx.stroke();
    }
  },

  _cheek(ctx, x, y, r) {
    ctx.fillStyle = 'rgba(255,138,120,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  // 通用 Q 版怪物（缺專屬 PNG / 外形時的安全 fallback：圓身大眼 + 小腳）
  _m_generic(ctx, w, h, t, m) {
    const base = (m && m.def && m.def.color) || '#8a8fb0';
    // 小腳
    ctx.fillStyle = 'rgba(40,34,52,0.85)';
    for (const fx of [-w * 0.2, w * 0.2]) {
      ctx.beginPath();
      ctx.ellipse(fx, -2, w * 0.12, h * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 身體
    const g = ctx.createLinearGradient(0, -h, 0, 0);
    g.addColorStop(0, this._lighten(base, 40));
    g.addColorStop(1, base);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, -h * 0.1);
    ctx.bezierCurveTo(-w * 0.52, -h * 0.7, -w * 0.28, -h * 1.0, 0, -h * 1.0);
    ctx.bezierCurveTo(w * 0.28, -h * 1.0, w * 0.52, -h * 0.7, w * 0.46, -h * 0.1);
    ctx.quadraticCurveTo(0, -h * 0.02, -w * 0.46, -h * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,40,0.55)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // 頂部高光
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.16, -h * 0.78, w * 0.16, h * 0.07, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // 大眼 + 微笑 + 腮紅
    this._mobEye(ctx, -w * 0.14, -h * 0.55, 3.6, '#2c2436', 0);
    this._mobEye(ctx, w * 0.16, -h * 0.55, 3.6, '#2c2436', 0);
    ctx.strokeStyle = 'rgba(40,30,40,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w * 0.01, -h * 0.4, 3.2, 0.2, Math.PI - 0.2);
    ctx.stroke();
    this._cheek(ctx, -w * 0.26, -h * 0.44, 2.6);
    this._cheek(ctx, w * 0.28, -h * 0.44, 2.6);
  },

  _lighten(hex, amt) {
    if (typeof hex !== 'string' || hex[0] !== '#') return '#cfcfe0';
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16) + amt);
    const g = Math.min(255, ((n >> 8) & 255) + amt);
    const b = Math.min(255, (n & 255) + amt);
    return `rgb(${r},${g},${b})`;
  },

  _m_snail(ctx, w, h, t) {
    // 蝸牛身體（前端抬頭）
    ctx.fillStyle = '#f2e3c0';
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.bezierCurveTo(-w * 0.52, -h * 0.22, -w * 0.2, -h * 0.3, w * 0.05, -h * 0.26);
    ctx.bezierCurveTo(w * 0.3, -h * 0.55, w * 0.42, -h * 0.6, w * 0.46, -h * 0.42);
    ctx.bezierCurveTo(w * 0.52, -h * 0.18, w * 0.42, 0, w * 0.3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,110,70,0.8)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // 腹足紋
    ctx.strokeStyle = 'rgba(180,150,100,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-w * 0.36 + i * 9, -1.5);
      ctx.quadraticCurveTo(-w * 0.33 + i * 9, -4.5, -w * 0.3 + i * 9, -1.5);
      ctx.stroke();
    }
    // 殼：圓殼 + 雙圈螺旋 + 緣帶
    const sx = -w * 0.12, sy = -h * 0.52;
    ctx.fillStyle = '#5a93e8';
    ctx.beginPath();
    ctx.arc(sx, sy, h * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3c6cc0';
    ctx.beginPath();
    ctx.arc(sx, sy + h * 0.1, h * 0.4, 0.3, Math.PI - 0.3);
    ctx.fill();
    ctx.strokeStyle = '#2c4e94';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(sx, sy, h * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx + h * 0.04, sy, h * 0.27, 0.6, Math.PI * 2 + 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx + h * 0.1, sy + h * 0.02, h * 0.13, 1.5, Math.PI * 2 + 1.1);
    ctx.stroke();
    // 殼光澤
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(sx - h * 0.16, sy - h * 0.22, h * 0.12, h * 0.07, -0.6, 0, Math.PI * 2);
    ctx.fill();
    // 觸角 + 圓頭
    ctx.strokeStyle = '#d8c49a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (const [x0, y0, x1, y1] of [[w * 0.3, -h * 0.5, w * 0.34, -h * 0.86], [w * 0.4, -h * 0.46, w * 0.5, -h * 0.78]]) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2 - 2, (y0 + y1) / 2, x1, y1);
      ctx.stroke();
      ctx.fillStyle = '#8a6a4a';
      ctx.beginPath();
      ctx.arc(x1, y1, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(x1 - 0.8, y1 - 0.8, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    // 惺忪大眼 + 微笑 + 腮紅
    this._mobEye(ctx, w * 0.26, -h * 0.38, 3.4, '#6a4a2a', 1);
    this._mobEye(ctx, w * 0.4, -h * 0.35, 3.1, '#6a4a2a', 1);
    ctx.strokeStyle = 'rgba(120,80,50,0.8)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(w * 0.33, -h * 0.24, 2.6, 0.3, Math.PI - 0.5);
    ctx.stroke();
    this._cheek(ctx, w * 0.18, -h * 0.26, 2.6);
  },

  _m_slime(ctx, w, h, t) {
    // 果凍體（不對稱有機輪廓 + 側邊滴垂）
    const grad = ctx.createLinearGradient(0, -h, 0, 0);
    grad.addColorStop(0, '#8ae870');
    grad.addColorStop(0.7, '#56c248');
    grad.addColorStop(1, '#3a9e34');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-w * 0.48, 0);
    ctx.bezierCurveTo(-w * 0.56, -h * 0.42, -w * 0.34, -h * 0.95, 0.06 * w, -h * 0.98);
    ctx.bezierCurveTo(w * 0.3, -h, w * 0.46, -h * 0.72, w * 0.44, -h * 0.46);
    // 側邊滴垂瘤
    ctx.bezierCurveTo(w * 0.6, -h * 0.4, w * 0.58, -h * 0.18, w * 0.46, -h * 0.16);
    ctx.bezierCurveTo(w * 0.52, -h * 0.06, w * 0.5, 0, w * 0.42, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2e7d28';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // 內核
    ctx.fillStyle = 'rgba(34,110,30,0.35)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.04, -h * 0.32, w * 0.24, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // 氣泡
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(-w * 0.26, -h * 0.3, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.3, -h * 0.6, 1.7, 0, Math.PI * 2);
    ctx.fill();
    // 大面積光澤
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.17, -h * 0.74, w * 0.15, h * 0.08, -0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-w * 0.02, -h * 0.86, 2, 0, Math.PI * 2);
    ctx.fill();
    // 開朗的臉
    this._mobEye(ctx, w * 0.08, -h * 0.5, 3.6, '#2c5a20', 0);
    this._mobEye(ctx, w * 0.32, -h * 0.48, 3.3, '#2c5a20', 0);
    ctx.fillStyle = '#1e4418';
    ctx.beginPath();
    ctx.arc(w * 0.2, -h * 0.33, 3.2, 0.1, Math.PI - 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e87878';
    ctx.beginPath();
    ctx.ellipse(w * 0.2, -h * 0.27, 1.9, 1.1, 0, 0, Math.PI);
    ctx.fill();
    this._cheek(ctx, -w * 0.08, -h * 0.36, 2.8);
    this._cheek(ctx, w * 0.42, -h * 0.34, 2.4);
  },

  // 蘑菇身體骨架（跳跳菇 / 紫晶菇共用）
  _mushroomBody(ctx, w, h, pal) {
    // 小短腿
    ctx.fillStyle = '#8a5a33';
    for (const fx of [-w * 0.15, w * 0.13]) {
      ctx.beginPath();
      ctx.ellipse(fx, -2, 4.6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 菇柄（臉所在）
    const sg = ctx.createLinearGradient(0, -h * 0.6, 0, 0);
    sg.addColorStop(0, '#fdf2dc');
    sg.addColorStop(1, '#e0c8a0');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(-w * 0.24, -3);
    ctx.bezierCurveTo(-w * 0.28, -h * 0.3, -w * 0.24, -h * 0.52, -w * 0.2, -h * 0.58);
    ctx.lineTo(w * 0.2, -h * 0.58);
    ctx.bezierCurveTo(w * 0.24, -h * 0.52, w * 0.28, -h * 0.3, w * 0.24, -3);
    ctx.quadraticCurveTo(0, 2, -w * 0.24, -3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,100,60,0.65)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // 小手
    ctx.fillStyle = '#f2e0bc';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sx * w * 0.27, -h * 0.3, 3.2, 4.4, sx * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // 菇傘（飽滿圓頂 + 翹邊）
    ctx.fillStyle = pal.rim;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.55, w * 0.56, h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    const cg = ctx.createLinearGradient(0, -h * 1.05, 0, -h * 0.5);
    cg.addColorStop(0, pal.capLight);
    cg.addColorStop(1, pal.cap);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(-w * 0.58, -h * 0.56);
    ctx.bezierCurveTo(-w * 0.6, -h * 0.86, -w * 0.3, -h * 1.06, 0, -h * 1.06);
    ctx.bezierCurveTo(w * 0.3, -h * 1.06, w * 0.6, -h * 0.86, w * 0.58, -h * 0.56);
    ctx.quadraticCurveTo(w * 0.3, -h * 0.64, 0, -h * 0.63);
    ctx.quadraticCurveTo(-w * 0.3, -h * 0.64, -w * 0.58, -h * 0.56);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.capLine;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // 傘頂光澤
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.18, -h * 0.92, w * 0.17, h * 0.06, -0.35, 0, Math.PI * 2);
    ctx.fill();
  },

  _m_mushroom(ctx, w, h, t) {
    this._mushroomBody(ctx, w, h, {
      cap: '#f07a30', capLight: '#ffab5e', rim: '#c05a1e', capLine: 'rgba(150,70,20,0.8)',
    });
    // 奶油斑點
    ctx.fillStyle = '#fdf2dc';
    for (const [ox, oy, r] of [[-0.3, -0.88, 4.4], [0.06, -0.97, 5.4], [0.34, -0.82, 3.6]]) {
      ctx.beginPath();
      ctx.ellipse(w * ox, h * oy, r, r * 0.8, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 傘頂小葉子
    ctx.save();
    ctx.translate(w * 0.26, -h * 1.02);
    ctx.rotate(0.5);
    ctx.fillStyle = '#5cae45';
    ctx.beginPath();
    ctx.ellipse(3, 0, 5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 活潑的臉
    this._mobEye(ctx, -w * 0.09, -h * 0.42, 3.2, '#5a3a1a', 0);
    this._mobEye(ctx, w * 0.14, -h * 0.42, 3.2, '#5a3a1a', 0);
    ctx.strokeStyle = '#7a4a26';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(w * 0.025, -h * 0.3, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
    this._cheek(ctx, -w * 0.2, -h * 0.32, 2.6);
    this._cheek(ctx, w * 0.24, -h * 0.32, 2.6);
  },

  _m_purpleMush(ctx, w, h, t) {
    this._mushroomBody(ctx, w, h, {
      cap: '#9255d4', capLight: '#bd86ee', rim: '#6a3aa8', capLine: 'rgba(90,40,140,0.85)',
    });
    // 傘上水晶簇
    for (const [ox, hh, rot] of [[-w * 0.22, 11, -0.3], [w * 0.02, 15, 0.05], [w * 0.26, 9, 0.35]]) {
      ctx.save();
      ctx.translate(ox, -h * 0.88);
      ctx.rotate(rot);
      ctx.fillStyle = '#8fe8ff';
      ctx.beginPath();
      ctx.moveTo(-3.2, 0);
      ctx.lineTo(-1.8, -hh * 0.7);
      ctx.lineTo(0, -hh);
      ctx.lineTo(1.8, -hh * 0.7);
      ctx.lineTo(3.2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.moveTo(-1, 0);
      ctx.lineTo(0, -hh);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // 神秘半閉眼 + 浮游閃光
    this._mobEye(ctx, -w * 0.09, -h * 0.42, 3.2, '#8a4ae0', 1);
    this._mobEye(ctx, w * 0.14, -h * 0.42, 3.2, '#8a4ae0', 1);
    ctx.strokeStyle = '#7a4a8a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(w * 0.025, -h * 0.3, 2.4, 0.4, Math.PI - 0.4);
    ctx.stroke();
    const tw = Math.abs(Math.sin(t * 2.2));
    ctx.save();
    ctx.globalAlpha = 0.5 + tw * 0.5;
    ctx.fillStyle = '#d8b8ff';
    ctx.translate(w * 0.46, -h * 1.05);
    Art.sparkle(ctx, 3.4 + tw * 1.4);
    ctx.fill();
    ctx.restore();
  },

  _m_golem(ctx, w, h, t) {
    const rock = '#8b8ba0', rockDark = '#62627a', rockLine = 'rgba(40,40,58,0.8)';
    // 短腿
    ctx.fillStyle = rockDark;
    for (const fx of [-w * 0.22, w * 0.1]) {
      Utils.rr(ctx, fx, -h * 0.16, w * 0.18, h * 0.16, 5);
      ctx.fill();
    }
    // 巨石手臂（垂地拳頭）
    for (const sx of [-1, 1]) {
      ctx.fillStyle = sx < 0 ? rockDark : rock;
      ctx.beginPath();
      ctx.moveTo(sx * w * 0.3, -h * 0.62);
      ctx.quadraticCurveTo(sx * w * 0.56, -h * 0.58, sx * w * 0.52, -h * 0.3);
      ctx.quadraticCurveTo(sx * w * 0.5, -h * 0.1, sx * w * 0.38, -h * 0.1);
      ctx.quadraticCurveTo(sx * w * 0.28, -h * 0.12, sx * w * 0.3, -h * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rockLine;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // 指縫
      ctx.beginPath();
      ctx.moveTo(sx * w * 0.49, -h * 0.22);
      ctx.lineTo(sx * w * 0.41, -h * 0.21);
      ctx.stroke();
    }
    // 軀幹（不規則巨石）
    const bg = ctx.createLinearGradient(-w * 0.3, -h, w * 0.3, 0);
    bg.addColorStop(0, '#9c9cb4');
    bg.addColorStop(1, '#6e6e88');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-w * 0.36, -h * 0.12);
    ctx.lineTo(-w * 0.42, -h * 0.46);
    ctx.lineTo(-w * 0.3, -h * 0.72);
    ctx.lineTo(-w * 0.1, -h * 0.78);
    ctx.lineTo(w * 0.26, -h * 0.74);
    ctx.lineTo(w * 0.4, -h * 0.5);
    ctx.lineTo(w * 0.34, -h * 0.14);
    ctx.quadraticCurveTo(0, -h * 0.04, -w * 0.36, -h * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rockLine;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // 頭（眉岩 + 下沉）
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, -h * 0.74);
    ctx.lineTo(-w * 0.18, -h * 0.97);
    ctx.lineTo(w * 0.08, -h);
    ctx.lineTo(w * 0.22, -h * 0.9);
    ctx.lineTo(w * 0.24, -h * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rockLine;
    ctx.stroke();
    ctx.fillStyle = rockDark;
    ctx.fillRect(-w * 0.2, -h * 0.84, w * 0.44, h * 0.05);
    // 裂紋
    ctx.strokeStyle = 'rgba(40,40,58,0.65)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.18, -h * 0.6);
    ctx.lineTo(-w * 0.06, -h * 0.5);
    ctx.lineTo(-w * 0.14, -h * 0.36);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.2, -h * 0.66);
    ctx.lineTo(w * 0.28, -h * 0.52);
    ctx.stroke();
    // 胸口符文裂縫（微光）
    ctx.save();
    ctx.shadowColor = '#5ae8d8';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = 'rgba(110,235,220,0.8)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-w * 0.04, -h * 0.42);
    ctx.lineTo(w * 0.04, -h * 0.36);
    ctx.lineTo(-w * 0.02, -h * 0.28);
    ctx.stroke();
    ctx.restore();
    // 苔蘚 + 小花
    ctx.fillStyle = '#5cae45';
    for (const [mx, my, rx] of [[-w * 0.06, -h * 0.99, w * 0.17], [w * 0.3, -h * 0.7, w * 0.1]]) {
      ctx.beginPath();
      ctx.ellipse(mx, my, rx, rx * 0.45, 0.1, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8fd45e';
    ctx.beginPath();
    ctx.ellipse(-w * 0.12, -h * 1.0, w * 0.07, w * 0.03, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd6e8';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(w * 0.04 + Math.cos(a) * 2.4, -h * 1.02 + Math.sin(a) * 2.4, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(w * 0.04, -h * 1.02, 1.3, 0, Math.PI * 2);
    ctx.fill();
    // 發光符文眼
    const pulse = 0.7 + 0.3 * Math.sin(t * 3);
    ctx.save();
    ctx.shadowColor = '#4dd9ff';
    ctx.shadowBlur = 9 * pulse;
    ctx.fillStyle = `rgba(120,230,255,${0.75 + pulse * 0.25})`;
    Utils.rr(ctx, -w * 0.14, -h * 0.93, w * 0.1, 4.4, 2.2);
    ctx.fill();
    Utils.rr(ctx, w * 0.05, -h * 0.93, w * 0.1, 4.4, 2.2);
    ctx.fill();
    ctx.restore();
  },

  _m_boss(ctx, w, h, t, m) {
    const telling = m.bState === 'tellDash' || m.bState === 'tellSlam' || m.bState === 'summon';
    const flick = telling && Math.floor(t * 10) % 2 === 0;
    // 披風（身後）
    ctx.fillStyle = '#6a1620';
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -h * 0.52);
    ctx.bezierCurveTo(-w * 0.42, -h * 0.4, -w * 0.46, -h * 0.16, -w * 0.4, 0);
    for (let i = 0; i < 4; i++) ctx.lineTo(-w * 0.4 + i * w * 0.07 + w * 0.035, -h * 0.07 - (i % 2) * h * 0.04);
    ctx.lineTo(-w * 0.1, 0);
    ctx.lineTo(-w * 0.08, -h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,8,14,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 大腳
    ctx.fillStyle = '#caa87e';
    for (const fx of [-w * 0.18, w * 0.1]) {
      ctx.beginPath();
      ctx.ellipse(fx + w * 0.04, -3, w * 0.13, h * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,80,50,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // 菇柄軀幹
    const sg = ctx.createLinearGradient(0, -h * 0.55, 0, 0);
    sg.addColorStop(0, '#f7e8cc');
    sg.addColorStop(1, '#d8bc92');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(-w * 0.26, -4);
    ctx.bezierCurveTo(-w * 0.32, -h * 0.28, -w * 0.28, -h * 0.5, -w * 0.24, -h * 0.55);
    ctx.lineTo(w * 0.24, -h * 0.55);
    ctx.bezierCurveTo(w * 0.28, -h * 0.5, w * 0.32, -h * 0.28, w * 0.26, -4);
    ctx.quadraticCurveTo(0, 3, -w * 0.26, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,86,50,0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 憤怒臉：粗眉 + 紅瞳 + 鋸齒嘴
    for (const [ex, er] of [[-w * 0.07, 6.2], [w * 0.13, 6.2]]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(ex, -h * 0.36, er, er * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,40,40,0.8)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.save();
      if (telling) { ctx.shadowColor = '#ff5040'; ctx.shadowBlur = 10; }
      ctx.fillStyle = telling ? '#ff4030' : '#c02818';
      ctx.beginPath();
      ctx.arc(ex + 1, -h * 0.35, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#2c0c08';
      ctx.beginPath();
      ctx.arc(ex + 1, -h * 0.35, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex - 1.2, -h * 0.38, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#3a2418';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-w * 0.15, -h * 0.46);
    ctx.lineTo(-w * 0.01, -h * 0.425);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.21, -h * 0.46);
    ctx.lineTo(w * 0.07, -h * 0.425);
    ctx.stroke();
    // 鋸齒嘴 + 牙
    ctx.fillStyle = '#4a1410';
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, -h * 0.24);
    ctx.quadraticCurveTo(w * 0.03, -h * 0.18, w * 0.16, -h * 0.245);
    ctx.quadraticCurveTo(w * 0.1, -h * 0.13, w * 0.03, -h * 0.13);
    ctx.quadraticCurveTo(-w * 0.05, -h * 0.13, -w * 0.1, -h * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
      const tx = -w * 0.08 + i * w * 0.063;
      ctx.beginPath();
      ctx.moveTo(tx, -h * 0.235 + i % 2 * 2);
      ctx.lineTo(tx + w * 0.025, -h * 0.175);
      ctx.lineTo(tx + w * 0.05, -h * 0.235 + i % 2 * 2);
      ctx.closePath();
      ctx.fill();
    }
    // 巨大菇傘
    ctx.fillStyle = flick ? '#a82a20' : '#8a1f16';
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.54, w * 0.6, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    const cg = ctx.createLinearGradient(0, -h * 1.06, 0, -h * 0.5);
    cg.addColorStop(0, flick ? '#ff7a5e' : '#e85948');
    cg.addColorStop(1, flick ? '#d83a2e' : '#b02a20');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, -h * 0.55);
    ctx.bezierCurveTo(-w * 0.66, -h * 0.9, -w * 0.34, -h * 1.1, 0, -h * 1.1);
    ctx.bezierCurveTo(w * 0.34, -h * 1.1, w * 0.66, -h * 0.9, w * 0.62, -h * 0.55);
    ctx.quadraticCurveTo(w * 0.3, -h * 0.63, 0, -h * 0.62);
    ctx.quadraticCurveTo(-w * 0.3, -h * 0.63, -w * 0.62, -h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,18,12,0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // 斑點 + 戰痕
    ctx.fillStyle = '#f7e8cc';
    for (const [ox, oy, r] of [[-0.34, -0.9, 8], [0.0, -1.0, 10], [0.34, -0.84, 7]]) {
      ctx.beginPath();
      ctx.ellipse(w * ox, h * oy, r, r * 0.78, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,220,200,0.75)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.34, -h * 1.02);
    ctx.lineTo(w * 0.46, -h * 0.82);
    ctx.moveTo(w * 0.46, -h * 0.98);
    ctx.lineTo(w * 0.34, -h * 0.86);
    ctx.stroke();
    // 傘頂光澤
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.2, -h * 0.97, w * 0.18, h * 0.05, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // 黃金皇冠 + 寶石
    ctx.save();
    ctx.translate(0, -h * 1.06);
    ctx.fillStyle = '#f0c43e';
    Art.crown(ctx, w * 0.17);
    ctx.fill();
    ctx.strokeStyle = '#a87c14';
    ctx.lineWidth = 2;
    Art.crown(ctx, w * 0.17);
    ctx.stroke();
    ctx.fillStyle = '#fde98e';
    ctx.fillRect(-w * 0.17, w * 0.055, w * 0.34, 3);
    for (const [gx, col] of [[-w * 0.09, '#e84848'], [0, '#4888e8'], [w * 0.09, '#48c860']]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(gx, w * 0.075, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // 環繞孢子
    for (let i = 0; i < 3; i++) {
      const a = t * 1.4 + (i * Math.PI * 2) / 3;
      const px = Math.cos(a) * w * 0.72;
      const py = -h * 0.7 + Math.sin(a * 1.4) * h * 0.2;
      ctx.fillStyle = `rgba(255,150,120,${0.35 + 0.3 * Math.sin(t * 3 + i)})`;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ══════════════════ 道具圖示 ══════════════════

  drawItemIcon(ctx, id, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy);
    if (id === 'meso') {
      // 楓幣：浮雕楓葉金幣
      const g = ctx.createRadialGradient(-s * 0.1, -s * 0.1, s * 0.04, 0, 0, s * 0.34);
      g.addColorStop(0, '#ffe98e');
      g.addColorStop(1, '#e0a428');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9a6c14';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(154,108,20,0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.23, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(154,108,20,0.8)';
      Art.leaf(ctx, s * 0.14);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      ctx.ellipse(-s * 0.12, -s * 0.14, s * 0.07, s * 0.035, -0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    const d = ItemDB[id];
    if (!d) { ctx.restore(); return; }

    if (d.icon === 'potion') {
      // 圓底魔法瓶
      ctx.fillStyle = '#8a5a33';
      Utils.rr(ctx, -s * 0.07, -s * 0.45, s * 0.14, s * 0.12, 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(220,238,250,0.35)';
      ctx.beginPath();
      ctx.moveTo(-s * 0.07, -s * 0.34);
      ctx.lineTo(-s * 0.07, -s * 0.2);
      ctx.bezierCurveTo(-s * 0.3, -s * 0.12, -s * 0.3, s * 0.3, 0, s * 0.3);
      ctx.bezierCurveTo(s * 0.3, s * 0.3, s * 0.3, -s * 0.12, s * 0.07, -s * 0.2);
      ctx.lineTo(s * 0.07, -s * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // 藥水液體
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, s * 0.085, s * 0.215, 0, Math.PI * 2);
      ctx.clip();
      const lg = ctx.createLinearGradient(0, -s * 0.1, 0, s * 0.3);
      lg.addColorStop(0, d.color);
      lg.addColorStop(1, this._darken(d.color));
      ctx.fillStyle = lg;
      ctx.fillRect(-s * 0.25, -s * 0.06, s * 0.5, s * 0.4);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.05, s * 0.2, s * 0.045, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-s * 0.08, s * 0.1, s * 0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // 玻璃高光
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.ellipse(-s * 0.12, -s * 0.02, s * 0.035, s * 0.09, 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.icon === 'sword') {
      if (this._drawItemWeaponAsset(ctx, id, s)) {
        ctx.restore();
        return;
      }
      ctx.rotate(-Math.PI / 4);
      // 刃
      const bg = ctx.createLinearGradient(0, s * 0.1, 0, -s * 0.42);
      bg.addColorStop(0, d.color);
      bg.addColorStop(1, '#ffffff');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(-s * 0.07, s * 0.1);
      ctx.lineTo(-s * 0.045, -s * 0.34);
      ctx.quadraticCurveTo(0, -s * 0.46, s * 0.045, -s * 0.34);
      ctx.lineTo(s * 0.07, s * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,44,40,0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.38);
      ctx.lineTo(0, s * 0.06);
      ctx.stroke();
      // 弧形護手
      ctx.strokeStyle = '#c89028';
      ctx.lineWidth = s * 0.06;
      ctx.beginPath();
      ctx.arc(0, s * 0.115, s * 0.13, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      // 握把 + 寶石柄頭
      ctx.fillStyle = '#54331a';
      Utils.rr(ctx, -s * 0.035, s * 0.16, s * 0.07, s * 0.2, 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,210,150,0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.035, s * (0.19 + i * 0.055));
        ctx.lineTo(s * 0.035, s * (0.21 + i * 0.055));
        ctx.stroke();
      }
      ctx.fillStyle = '#e84848';
      ctx.beginPath();
      ctx.arc(0, s * 0.4, s * 0.045, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.icon === 'hat') {
      if (id === 'kingCrown') {
        ctx.fillStyle = '#f0c43e';
        Art.crown(ctx, s * 0.3);
        ctx.fill();
        ctx.strokeStyle = '#a87c14';
        ctx.lineWidth = 1.6;
        Art.crown(ctx, s * 0.3);
        ctx.stroke();
        for (const [gx, col] of [[-s * 0.15, '#e84848'], [0, '#4888e8'], [s * 0.15, '#48c860']]) {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(gx, s * 0.12, s * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (id === 'leafHat') {
        ctx.rotate(0.15);
        ctx.fillStyle = '#4fae3c';
        ctx.beginPath();
        ctx.moveTo(-s * 0.36, s * 0.1);
        ctx.bezierCurveTo(-s * 0.3, -s * 0.26, s * 0.1, -s * 0.34, s * 0.34, -s * 0.08);
        ctx.bezierCurveTo(s * 0.2, s * 0.12, -s * 0.1, s * 0.2, -s * 0.36, s * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2f7a28';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, s * 0.08);
        ctx.quadraticCurveTo(0, -s * 0.08, s * 0.3, -s * 0.06);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.36, s * 0.1);
        ctx.quadraticCurveTo(-s * 0.44, s * 0.02, -s * 0.4, -s * 0.06);
        ctx.stroke();
      } else {
        // 鐵盔
        const hg = ctx.createLinearGradient(-s * 0.3, 0, s * 0.3, 0);
        hg.addColorStop(0, '#cdd2da');
        hg.addColorStop(0.5, '#9aa2ae');
        hg.addColorStop(1, '#7a8290');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, s * 0.18);
        ctx.bezierCurveTo(-s * 0.34, -s * 0.26, s * 0.34, -s * 0.26, s * 0.3, s * 0.18);
        ctx.lineTo(s * 0.18, s * 0.18);
        ctx.lineTo(s * 0.14, s * 0.04);
        ctx.lineTo(-s * 0.14, s * 0.04);
        ctx.lineTo(-s * 0.18, s * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(60,66,80,0.85)';
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.fillStyle = '#5a626e';
        for (const rx of [-s * 0.18, 0, s * 0.18]) {
          ctx.beginPath();
          ctx.arc(rx, -s * 0.1, s * 0.025, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (d.icon === 'top') {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, -s * 0.28);
      ctx.lineTo(s * 0.18, -s * 0.28);
      ctx.lineTo(s * 0.34, -s * 0.14);
      ctx.lineTo(s * 0.26, s * 0.02);
      ctx.lineTo(s * 0.18, -s * 0.04);
      ctx.lineTo(s * 0.16, s * 0.3);
      ctx.lineTo(-s * 0.16, s * 0.3);
      ctx.lineTo(-s * 0.18, -s * 0.04);
      ctx.lineTo(-s * 0.26, s * 0.02);
      ctx.lineTo(-s * 0.34, -s * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,30,40,0.6)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // 領口 + 衣褶
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(-s * 0.08, -s * 0.28);
      ctx.lineTo(s * 0.08, -s * 0.28);
      ctx.lineTo(0, -s * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-s * 0.07, 0);
      ctx.quadraticCurveTo(-s * 0.04, s * 0.12, -s * 0.07, s * 0.26);
      ctx.moveTo(s * 0.07, 0);
      ctx.quadraticCurveTo(s * 0.04, s * 0.12, s * 0.07, s * 0.26);
      ctx.stroke();
    } else if (d.icon === 'shoes') {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(-s * 0.22, -s * 0.3);
      ctx.lineTo(-s * 0.04, -s * 0.3);
      ctx.lineTo(-s * 0.02, s * 0.06);
      ctx.quadraticCurveTo(s * 0.1, s * 0.02, s * 0.24, s * 0.12);
      ctx.quadraticCurveTo(s * 0.32, s * 0.18, s * 0.28, s * 0.28);
      ctx.lineTo(-s * 0.24, s * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(50,32,20,0.7)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // 鞋帶交叉
      ctx.strokeStyle = 'rgba(255,240,220,0.7)';
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, -s * (0.22 - i * 0.14));
        ctx.lineTo(-s * 0.06, -s * (0.1 - i * 0.14));
        ctx.moveTo(-s * 0.06, -s * (0.22 - i * 0.14));
        ctx.lineTo(-s * 0.2, -s * (0.1 - i * 0.14));
        ctx.stroke();
      }
      // 鞋底
      ctx.fillStyle = 'rgba(40,26,16,0.8)';
      Utils.rr(ctx, -s * 0.24, s * 0.24, s * 0.52, s * 0.07, 2);
      ctx.fill();
    } else {
      // 其餘類型（新武器類 / 飾品 / 材料 / 卷軸）的程序化暫代圖示
      this._genericItemIcon(ctx, d, s);
    }
    ctx.restore();
  },

  // 通用道具圖示（缺專屬素材時）：武器→斜置刃身；材料→寶石；防具/飾品→徽章
  _genericItemIcon(ctx, d, s) {
    const col = d.color || '#cfcfe0';
    if (d.slot === 'weapon') {
      ctx.rotate(-Math.PI / 4);
      const bg = ctx.createLinearGradient(0, s * 0.12, 0, -s * 0.4);
      bg.addColorStop(0, col);
      bg.addColorStop(1, '#ffffff');
      ctx.fillStyle = bg;
      // 依武器類型微調外形
      const wt = d.wtype;
      if (wt === 'wand' || wt === 'staff') {
        ctx.fillStyle = '#7a5230';
        Utils.rr(ctx, -s * 0.04, -s * 0.34, s * 0.08, s * 0.74, 2); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(0, -s * 0.36, s * 0.13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.arc(-s * 0.04, -s * 0.4, s * 0.04, 0, Math.PI * 2); ctx.fill();
      } else if (wt === 'bow' || wt === 'crossbow') {
        ctx.strokeStyle = col; ctx.lineWidth = s * 0.07;
        ctx.beginPath(); ctx.arc(0, 0, s * 0.34, -Math.PI * 0.6, Math.PI * 0.6); ctx.stroke();
        ctx.strokeStyle = 'rgba(240,240,240,0.8)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(s * 0.2, -s * 0.28); ctx.lineTo(s * 0.2, s * 0.28); ctx.stroke();
      } else if (wt === 'gun') {
        ctx.fillStyle = col;
        Utils.rr(ctx, -s * 0.34, -s * 0.06, s * 0.6, s * 0.14, 2); ctx.fill();
        Utils.rr(ctx, -s * 0.3, s * 0.06, s * 0.1, s * 0.2, 2); ctx.fill();
      } else if (wt === 'knuckle') {
        ctx.fillStyle = col;
        Utils.rr(ctx, -s * 0.28, -s * 0.12, s * 0.56, s * 0.24, 5); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (const kx of [-0.16, 0, 0.16]) { ctx.beginPath(); ctx.arc(s * kx, -s * 0.04, s * 0.05, 0, Math.PI * 2); ctx.fill(); }
      } else {
        // 劍 / 斧 / 鈍器 / 短劍 / 拳爪：錐形刃 + 護手 + 握把
        const len = wt === 'dagger' || wt === 'claw' ? 0.34 : 0.46;
        ctx.beginPath();
        ctx.moveTo(-s * 0.07, s * 0.1);
        ctx.lineTo(-s * 0.05, -s * (len - 0.08));
        ctx.quadraticCurveTo(0, -s * len, s * 0.05, -s * (len - 0.08));
        ctx.lineTo(s * 0.07, s * 0.1);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#c89028'; ctx.lineWidth = s * 0.06;
        ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.13, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
        ctx.fillStyle = '#54331a';
        Utils.rr(ctx, -s * 0.035, s * 0.16, s * 0.07, s * 0.2, 2); ctx.fill();
      }
      return;
    }
    if (d.icon === 'material') {
      // 寶石／礦石
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.34); ctx.lineTo(s * 0.3, -s * 0.06); ctx.lineTo(s * 0.18, s * 0.32);
      ctx.lineTo(-s * 0.18, s * 0.32); ctx.lineTo(-s * 0.3, -s * 0.06); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(20,20,30,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.moveTo(0, -s * 0.34); ctx.lineTo(-s * 0.18, s * 0.32); ctx.lineTo(-s * 0.04, s * 0.1); ctx.closePath(); ctx.fill();
      return;
    }
    if (d.icon === 'scroll') {
      ctx.fillStyle = '#f2e6c8';
      Utils.rr(ctx, -s * 0.26, -s * 0.3, s * 0.52, s * 0.6, 3); ctx.fill();
      ctx.fillStyle = col;
      Utils.rr(ctx, -s * 0.3, -s * 0.34, s * 0.6, s * 0.1, 3); ctx.fill();
      Utils.rr(ctx, -s * 0.3, s * 0.24, s * 0.6, s * 0.1, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,40,0.6)'; ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.16, s * 0.1 * i); ctx.lineTo(s * 0.16, s * 0.1 * i); ctx.stroke(); }
      return;
    }
    // 防具 / 飾品：圓角徽章 + 寶石
    const g = ctx.createLinearGradient(0, -s * 0.3, 0, s * 0.3);
    g.addColorStop(0, this._lighten(col, 40));
    g.addColorStop(1, col);
    ctx.fillStyle = g;
    Utils.rr(ctx, -s * 0.3, -s * 0.3, s * 0.6, s * 0.6, s * 0.16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,20,30,0.45)'; ctx.lineWidth = 1.2;
    Utils.rr(ctx, -s * 0.3, -s * 0.3, s * 0.6, s * 0.6, s * 0.16);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.arc(-s * 0.1, -s * 0.1, s * 0.07, 0, Math.PI * 2); ctx.fill();
  },

  _drawItemWeaponAsset(ctx, id, s) {
    const file = this.WEAPON_ASSETS[id];
    const img = file ? this._loadImage(this.ASSET_BASE + 'sprites/weapons/' + file) : null;
    if (!this._readyImage(img)) return false;

    ctx.save();
    ctx.rotate(-Math.PI / 4);
    const h = s * 0.95;
    const w = h * (img.naturalWidth / img.naturalHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, -w / 2, -h * 0.58, w, h);
    ctx.restore();
    return true;
  },

  _darken(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n >> 16) - 70);
    const g = Math.max(0, ((n >> 8) & 255) - 70);
    const b = Math.max(0, (n & 255) - 70);
    return `rgb(${r},${g},${b})`;
  },

  // ══════════════════ 傳送門 ══════════════════

  drawPortal(ctx, x, y, t, label) {
    ctx.save();
    // 地面光池
    ctx.globalCompositeOperation = 'lighter';
    const pool = ctx.createRadialGradient(x, y - 2, 2, x, y - 2, 40);
    pool.addColorStop(0, 'rgba(140,220,255,0.5)');
    pool.addColorStop(1, 'rgba(80,160,255,0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(x, y - 2, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.translate(x, y - 46);
    // 外圈光暈
    const aura = ctx.createRadialGradient(0, 0, 6, 0, 0, 52);
    aura.addColorStop(0, 'rgba(190,240,255,0.85)');
    aura.addColorStop(0.5, 'rgba(90,180,255,0.4)');
    aura.addColorStop(1, 'rgba(60,120,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 54, 0, 0, Math.PI * 2);
    ctx.fill();
    // 內芯
    const core = ctx.createRadialGradient(0, 0, 1, 0, 0, 26);
    core.addColorStop(0, 'rgba(255,255,255,0.95)');
    core.addColorStop(0.55, 'rgba(150,220,255,0.75)');
    core.addColorStop(1, 'rgba(110,190,255,0.05)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    // 雙旋渦弧
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2.4;
    for (const dir of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const p = i / 16;
        const a = dir * (t * 2 + p * 4.2);
        const r = 4 + p * 22;
        const px = Math.cos(a) * r * 0.7;
        const py = Math.sin(a) * r * 1.15;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    // 旋轉外環
    for (let i = 0; i < 2; i++) {
      ctx.strokeStyle = `rgba(170,235,255,${0.75 - i * 0.3})`;
      ctx.lineWidth = 2.6 - i;
      ctx.beginPath();
      ctx.ellipse(0, 0, 27 + i * 7, 41 + i * 8, 0, t * 2.4 + i * 2, t * 2.4 + i * 2 + 4.4);
      ctx.stroke();
    }
    // 軌道符文鑽石
    for (let i = 0; i < 4; i++) {
      const a = t * 1.5 + (i * Math.PI) / 2;
      const px = Math.cos(a) * 31;
      const py = Math.sin(a) * 45;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a);
      ctx.fillStyle = 'rgba(220,250,255,0.95)';
      Art.sparkle(ctx, 3.6);
      ctx.fill();
      ctx.restore();
    }
    // 閃爍十字星
    const tw = Math.abs(Math.sin(t * 2.8));
    ctx.save();
    ctx.globalAlpha = 0.4 + tw * 0.6;
    ctx.fillStyle = '#fff';
    ctx.translate(-12, -22);
    Art.sparkle(ctx, 3 + tw * 2.4);
    ctx.fill();
    ctx.restore();
    // 目的地名牌
    if (label) {
      ctx.font = '11px "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      const lw = ctx.measureText(label).width + 16;
      ctx.fillStyle = 'rgba(16,14,30,0.72)';
      Utils.rr(ctx, -lw / 2, -76, lw, 17, 8.5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,220,255,0.5)';
      ctx.lineWidth = 1;
      Utils.rr(ctx, -lw / 2, -76, lw, 17, 8.5);
      ctx.stroke();
      ctx.fillStyle = '#cfeeff';
      ctx.fillText(label, 0, -63.5);
    }
    ctx.restore();
  },
};

// 為所有武器自動指派預期檔名（weapon_<id>.png）；提供對應 PNG 即自動套用，否則用程序化暫代
if (typeof ItemDB !== 'undefined') {
  for (const id in ItemDB) {
    const d = ItemDB[id];
    if (d.slot === 'weapon' && !Sprites.WEAPON_ASSETS[id]) {
      Sprites.WEAPON_ASSETS[id] = 'weapon_' + id + '.png';
    }
  }
}
// 為所有怪物自動指派預期檔名（mob_<type>.png）；提供對應 PNG 即自動套用，否則用程序化/變色暫代
if (typeof MonsterDB !== 'undefined') {
  for (const type in MonsterDB) {
    if (!Sprites.MONSTER_ASSETS[type] && !MonsterDB[type].asset) {
      Sprites.MONSTER_ASSETS[type] = 'mob_' + type + '.png';
    }
  }
}
