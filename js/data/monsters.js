// 怪物資料庫
// drops: { meso:[min,max], p } 或 { item:'id', p, qty? }
// draw: 程序化繪製重用的外形（缺 PNG 時的 fallback；省略則用 type，再 fallback 到 _m_generic）
// tint: ctx.filter 字串，為重用外形/素材做變色
// aggressive: 玩家靠近會主動追擊；minion: Boss 召喚的小怪類型
const MonsterDB = {
  // ════════════ 草原 / 森林（低階）════════════
  snail: {
    name: '小藍蝸', hp: 25, atk: 6, def: 0, xp: 8, speed: 22, w: 36, h: 28, move: 'walk',
    drops: [
      { meso: [5, 15], p: 0.75 },
      { item: 'redPotion', p: 0.25 },
      { item: 'strawShoes', p: 0.06 },
      { item: 'leafHat', p: 0.04 },
      { item: 'snailShell', p: 0.3 },
    ],
  },
  redSnail: {
    name: '紅蝸牛', hp: 44, atk: 9, def: 1, xp: 12, speed: 26, w: 38, h: 30, move: 'walk',
    draw: 'snail', tint: 'hue-rotate(-45deg) saturate(1.5)',
    drops: [
      { meso: [8, 18], p: 0.78 },
      { item: 'redPotion', p: 0.25 },
      { item: 'clothPants', p: 0.05 },
      { item: 'snailShell', p: 0.35 },
    ],
  },
  slime: {
    name: '綠泡泡', hp: 50, atk: 11, def: 1, xp: 13, speed: 50, w: 38, h: 32, move: 'hop',
    drops: [
      { meso: [8, 20], p: 0.75 },
      { item: 'redPotion', p: 0.25 },
      { item: 'bluePotion', p: 0.15 },
      { item: 'travelTop', p: 0.05 },
      { item: 'leafHat', p: 0.04 },
      { item: 'slimeGel', p: 0.3 },
    ],
  },
  spore: {
    name: '菇寶寶', hp: 78, atk: 14, def: 2, xp: 18, speed: 40, w: 34, h: 32, move: 'hop',
    draw: 'mushroom', tint: 'hue-rotate(70deg)',
    drops: [
      { meso: [10, 24], p: 0.78 },
      { item: 'bluePotion', p: 0.18 },
      { item: 'clothGloves', p: 0.05 },
      { item: 'mushSpore', p: 0.35 },
    ],
  },
  mushroom: {
    name: '跳跳菇', hp: 120, atk: 19, def: 3, xp: 26, speed: 62, w: 40, h: 38, move: 'hop',
    drops: [
      { meso: [15, 35], p: 0.8 },
      { item: 'redPotion', p: 0.2 },
      { item: 'bluePotion', p: 0.15 },
      { item: 'orangePotion', p: 0.08 },
      { item: 'ironSword', p: 0.03 },
      { item: 'leatherBoots', p: 0.04 },
      { item: 'mushSpore', p: 0.3 },
    ],
  },
  boar: {
    name: '野豬', hp: 160, atk: 24, def: 4, xp: 34, speed: 70, w: 56, h: 44, move: 'walk', aggressive: true,
    draw: 'golem', tint: 'hue-rotate(-20deg) saturate(1.4) brightness(0.95)', asset: 'mob_pig.png',
    drops: [
      { meso: [18, 40], p: 0.82 },
      { item: 'orangePotion', p: 0.12 },
      { item: 'leatherBoots', p: 0.05 },
      { item: 'travelCape', p: 0.04 },
      { item: 'hardLeather', p: 0.4 },
    ],
  },
  bat: {
    name: '魅影蝙蝠', hp: 96, atk: 20, def: 2, xp: 24, speed: 88, w: 40, h: 30, move: 'hop',
    drops: [
      { meso: [14, 30], p: 0.78 },
      { item: 'bluePotion', p: 0.2 },
      { item: 'jadeEarring', p: 0.04 },
      { item: 'darkEssence', p: 0.18 },
    ],
  },

  // ════════════ 水晶洞窟（中階）════════════
  purpleMush: {
    name: '紫晶菇', hp: 280, atk: 32, def: 6, xp: 58, speed: 55, w: 44, h: 42, move: 'hop',
    draw: 'purpleMush',
    drops: [
      { meso: [30, 60], p: 0.8 },
      { item: 'orangePotion', p: 0.18 },
      { item: 'bluePotion', p: 0.15 },
      { item: 'ironHelm', p: 0.04 },
      { item: 'ironArmor', p: 0.04 },
      { item: 'mapleSword', p: 0.02 },
      { item: 'crystalShard', p: 0.3 },
    ],
  },
  eye: {
    name: '邪惡之眼', hp: 360, atk: 38, def: 6, xp: 70, speed: 60, w: 44, h: 44, move: 'hop',
    drops: [
      { meso: [34, 66], p: 0.82 },
      { item: 'orangePotion', p: 0.2 },
      { item: 'wizardHat', p: 0.04 },
      { item: 'moonPendant', p: 0.04 },
      { item: 'crystalShard', p: 0.3 },
    ],
  },
  golem: {
    name: '石小弟', hp: 560, atk: 45, def: 12, xp: 95, speed: 35, w: 54, h: 58, move: 'walk', aggressive: true,
    drops: [
      { meso: [60, 120], p: 0.9 },
      { item: 'orangePotion', p: 0.25 },
      { item: 'elixir', p: 0.06 },
      { item: 'mapleSword', p: 0.04 },
      { item: 'ironArmor', p: 0.06 },
      { item: 'ironShield', p: 0.05 },
      { item: 'goldOre', p: 0.2 },
    ],
  },

  // ════════════ 雪原（高階）════════════
  iceSlime: {
    name: '冰泡泡', hp: 720, atk: 52, def: 14, xp: 140, speed: 52, w: 42, h: 36, move: 'hop',
    draw: 'slime', tint: 'hue-rotate(150deg) saturate(1.3)',
    drops: [
      { meso: [70, 140], p: 0.85 },
      { item: 'orangePotion', p: 0.25 },
      { item: 'windBoots', p: 0.04 },
      { item: 'iceShard', p: 0.4 },
    ],
  },
  penguin: {
    name: '冰原企鵝', hp: 640, atk: 48, def: 12, xp: 120, speed: 58, w: 40, h: 46, move: 'hop',
    draw: 'snail', tint: 'grayscale(0.4) brightness(1.2)',
    drops: [
      { meso: [66, 130], p: 0.84 },
      { item: 'whitePotion', p: 0.18 },
      { item: 'travelCape', p: 0.05 },
      { item: 'iceShard', p: 0.35 },
    ],
  },
  snowman: {
    name: '雪人怪', hp: 1150, atk: 62, def: 18, xp: 190, speed: 38, w: 56, h: 64, move: 'walk',
    draw: 'golem', tint: 'grayscale(0.6) brightness(1.6)',
    drops: [
      { meso: [120, 220], p: 0.9 },
      { item: 'whitePotion', p: 0.22 },
      { item: 'windBow', p: 0.03 },
      { item: 'windBoots', p: 0.04 },
      { item: 'iceShard', p: 0.45 },
    ],
  },
  yeti: {
    name: '雪原雪人', hp: 1900, atk: 84, def: 22, xp: 320, speed: 46, w: 64, h: 70, move: 'walk', aggressive: true,
    drops: [
      { meso: [180, 320], p: 0.92 },
      { item: 'whitePotion', p: 0.3 },
      { item: 'mapleCape', p: 0.04 },
      { item: 'rubyEarring', p: 0.04 },
      { item: 'iceShard', p: 0.5 },
      { item: 'goldOre', p: 0.25 },
    ],
  },

  // ════════════ 熔岩地帶（高階）════════════
  lavaSlime: {
    name: '熔岩史萊姆', hp: 1400, atk: 88, def: 20, xp: 260, speed: 56, w: 44, h: 38, move: 'hop',
    draw: 'slime', tint: 'hue-rotate(-90deg) saturate(1.6) brightness(1.1)',
    drops: [
      { meso: [140, 260], p: 0.88 },
      { item: 'whitePotion', p: 0.25 },
      { item: 'battleGloves', p: 0.04 },
      { item: 'fireOre', p: 0.45 },
    ],
  },
  fireGoblin: {
    name: '火焰哥布林', hp: 1600, atk: 96, def: 22, xp: 290, speed: 76, w: 48, h: 50, move: 'walk', aggressive: true,
    drops: [
      { meso: [160, 300], p: 0.9 },
      { item: 'whitePotion', p: 0.25 },
      { item: 'dragonSlayer', p: 0.02 },
      { item: 'fireOre', p: 0.5 },
    ],
  },
  magmaGolem: {
    name: '熔岩魔像', hp: 3200, atk: 124, def: 32, xp: 520, speed: 34, w: 60, h: 64, move: 'walk', aggressive: true,
    draw: 'golem', tint: 'hue-rotate(-30deg) saturate(2) brightness(1.05)',
    drops: [
      { meso: [320, 560], p: 0.95 },
      { item: 'powerElixir', p: 0.12 },
      { item: 'dragonShield', p: 0.03 },
      { item: 'dragonGloves', p: 0.03 },
      { item: 'fireOre', p: 0.6 },
      { item: 'dragonScale', p: 0.12 },
    ],
  },
  drake: {
    name: '炎之龍人', hp: 2800, atk: 132, def: 30, xp: 540, speed: 64, w: 64, h: 66, move: 'walk', aggressive: true,
    drops: [
      { meso: [300, 540], p: 0.94 },
      { item: 'powerElixir', p: 0.1 },
      { item: 'dragonRing', p: 0.03 },
      { item: 'dragonScale', p: 0.2 },
    ],
  },

  // ════════════ 古城（頂階）════════════
  zombie: {
    name: '腐化殭屍', hp: 2200, atk: 112, def: 26, xp: 380, speed: 36, w: 46, h: 52, move: 'walk',
    draw: 'mushroom', tint: 'hue-rotate(60deg) saturate(0.5) brightness(0.8)',
    drops: [
      { meso: [220, 380], p: 0.9 },
      { item: 'whitePotion', p: 0.25 },
      { item: 'boneFrag', p: 0.5 },
    ],
  },
  skeleton: {
    name: '骷髏戰士', hp: 2400, atk: 122, def: 30, xp: 420, speed: 52, w: 46, h: 56, move: 'walk',
    draw: 'golem', tint: 'grayscale(0.8) brightness(1.4)',
    drops: [
      { meso: [240, 420], p: 0.92 },
      { item: 'whitePotion', p: 0.25 },
      { item: 'darkBlade', p: 0.015 },
      { item: 'boneFrag', p: 0.55 },
    ],
  },
  mummy: {
    name: '詛咒木乃伊', hp: 2700, atk: 128, def: 32, xp: 460, speed: 40, w: 48, h: 58, move: 'walk', aggressive: true,
    drops: [
      { meso: [260, 460], p: 0.93 },
      { item: 'powerElixir', p: 0.12 },
      { item: 'dragonPendant', p: 0.03 },
      { item: 'darkEssence', p: 0.5 },
    ],
  },
  darkKnight: {
    name: '黑暗騎士', hp: 4600, atk: 168, def: 42, xp: 760, speed: 58, w: 60, h: 70, move: 'walk', aggressive: true,
    draw: 'golem', tint: 'hue-rotate(220deg) saturate(1.2) brightness(0.7)',
    drops: [
      { meso: [460, 820], p: 0.96 },
      { item: 'powerElixir', p: 0.18 },
      { item: 'voidStaff', p: 0.02 },
      { item: 'phoenixBow', p: 0.02 },
      { item: 'darkClaw', p: 0.02 },
      { item: 'darkEssence', p: 0.6 },
    ],
  },

  // ════════════ Boss ════════════
  boss: {
    name: '蘑菇王', hp: 6800, atk: 58, def: 10, xp: 2400, speed: 55, w: 110, h: 104, move: 'boss', boss: true, minion: 'mushroom',
    drops: [
      { meso: [600, 1200], p: 1 },
      { item: 'kingSword', p: 1 },
      { item: 'kingCrown', p: 0.5 },
      { item: 'elixir', p: 0.6, qty: 2 },
      { item: 'orangePotion', p: 0.8, qty: 3 },
      { item: 'mapleLeafMat', p: 1, qty: 3 },
    ],
  },
  yetiKing: {
    name: '雪人王', hp: 18000, atk: 116, def: 28, xp: 9000, speed: 60, w: 120, h: 116, move: 'boss', boss: true, minion: 'iceSlime',
    drops: [
      { meso: [2000, 4000], p: 1 },
      { item: 'mapleCape', p: 1 },
      { item: 'windBoots', p: 0.6 },
      { item: 'powerElixir', p: 1, qty: 3 },
      { item: 'iceShard', p: 1, qty: 10 },
      { item: 'goldOre', p: 1, qty: 5 },
    ],
  },
  flameDrake: {
    name: '炎魔', hp: 36000, atk: 156, def: 38, xp: 22000, speed: 64, w: 140, h: 124, move: 'boss', boss: true, minion: 'fireGoblin',
    drops: [
      { meso: [5000, 9000], p: 1 },
      { item: 'dragonSlayer', p: 0.7 },
      { item: 'dragonMail', p: 0.6 },
      { item: 'dragonHelm', p: 0.5 },
      { item: 'powerElixir', p: 1, qty: 5 },
      { item: 'dragonScale', p: 1, qty: 8 },
    ],
  },
  darkLord: {
    name: '黑暗領主', hp: 68000, atk: 214, def: 50, xp: 50000, speed: 66, w: 150, h: 132, move: 'boss', boss: true, minion: 'skeleton',
    drops: [
      { meso: [12000, 20000], p: 1 },
      { item: 'darkBlade', p: 0.6 },
      { item: 'voidStaff', p: 0.5 },
      { item: 'phoenixBow', p: 0.5 },
      { item: 'darkClaw', p: 0.5 },
      { item: 'krakenKnuckle', p: 0.5 },
      { item: 'powerElixir', p: 1, qty: 8 },
      { item: 'darkEssence', p: 1, qty: 15 },
    ],
  },
};
