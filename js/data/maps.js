// 地圖資料庫
// platforms: {x1, x2, y, ground?}  ground=true 表示主地面（不能下跳穿越）
// ropes:     {x, y1, y2}           y1 為頂端（需對齊某平台的 y）
// portals:   {id, x, y, target, targetPortal}（由下方 MAP_CHAIN 自動串接）
// spawners:  {type, plat, x1, x2, count, respawn}
const MapDB = {
  meadow: {
    name: '楓葉草原', theme: 'meadow', w: 2600, h: 700,
    spawn: { x: 120, y: 560 },
    platforms: [
      { x1: 0,    x2: 2600, y: 560, ground: true },
      { x1: 280,  x2: 620,  y: 445 },
      { x1: 720,  x2: 1040, y: 340 },
      { x1: 1140, x2: 1480, y: 445 },
      { x1: 1600, x2: 1930, y: 330 },
      { x1: 2040, x2: 2380, y: 445 },
    ],
    ropes: [
      { x: 880,  y1: 340, y2: 560 },
      { x: 1760, y1: 330, y2: 560 },
    ],
    portals: [],
    spawners: [
      { type: 'snail', plat: 0, x1: 250,  x2: 1150, count: 4, respawn: 6 },
      { type: 'snail', plat: 0, x1: 1300, x2: 2300, count: 3, respawn: 6 },
      { type: 'slime', plat: 1, x1: 300,  x2: 600,  count: 1, respawn: 8 },
      { type: 'slime', plat: 3, x1: 1160, x2: 1460, count: 2, respawn: 8 },
      { type: 'slime', plat: 5, x1: 2060, x2: 2360, count: 2, respawn: 8 },
    ],
  },

  forest: {
    name: '蘑菇森林', theme: 'forest', w: 3000, h: 700,
    spawn: { x: 150, y: 600 },
    platforms: [
      { x1: 0,    x2: 3000, y: 600, ground: true },
      { x1: 250,  x2: 640,  y: 480 },
      { x1: 760,  x2: 1150, y: 470 },
      { x1: 520,  x2: 900,  y: 350 },
      { x1: 1300, x2: 1700, y: 480 },
      { x1: 1500, x2: 1900, y: 360 },
      { x1: 2050, x2: 2450, y: 470 },
      { x1: 2250, x2: 2650, y: 350 },
    ],
    ropes: [
      { x: 430,  y1: 480, y2: 600 },
      { x: 580,  y1: 350, y2: 480 },
      { x: 950,  y1: 470, y2: 600 },
      { x: 1400, y1: 480, y2: 600 },
      { x: 1600, y1: 360, y2: 480 },
      { x: 2200, y1: 470, y2: 600 },
      { x: 2350, y1: 350, y2: 470 },
    ],
    portals: [],
    spawners: [
      { type: 'slime',    plat: 0, x1: 150,  x2: 700,  count: 2, respawn: 7 },
      { type: 'mushroom', plat: 0, x1: 800,  x2: 2800, count: 5, respawn: 8 },
      { type: 'mushroom', plat: 2, x1: 780,  x2: 1130, count: 1, respawn: 9 },
      { type: 'mushroom', plat: 4, x1: 1320, x2: 1680, count: 1, respawn: 9 },
      { type: 'mushroom', plat: 6, x1: 2070, x2: 2430, count: 1, respawn: 9 },
      { type: 'mushroom', plat: 3, x1: 540,  x2: 880,  count: 1, respawn: 10 },
      { type: 'mushroom', plat: 7, x1: 2270, x2: 2630, count: 1, respawn: 10 },
    ],
  },

  cave: {
    name: '水晶洞窟', theme: 'cave', w: 2800, h: 700,
    spawn: { x: 150, y: 600 },
    platforms: [
      { x1: 0,    x2: 2800, y: 600, ground: true },
      { x1: 200,  x2: 560,  y: 470 },
      { x1: 660,  x2: 1020, y: 380 },
      { x1: 1120, x2: 1500, y: 470 },
      { x1: 1580, x2: 1950, y: 370 },
      { x1: 2050, x2: 2420, y: 470 },
    ],
    ropes: [
      { x: 380,  y1: 470, y2: 600 },
      { x: 840,  y1: 380, y2: 600 },
      { x: 1300, y1: 470, y2: 600 },
      { x: 1760, y1: 370, y2: 600 },
      { x: 2230, y1: 470, y2: 600 },
    ],
    portals: [],
    spawners: [
      { type: 'purpleMush', plat: 0, x1: 200,  x2: 2600, count: 5, respawn: 9 },
      { type: 'purpleMush', plat: 2, x1: 680,  x2: 1000, count: 1, respawn: 10 },
      { type: 'purpleMush', plat: 4, x1: 1600, x2: 1930, count: 1, respawn: 10 },
      { type: 'golem',      plat: 0, x1: 500,  x2: 1100, count: 1, respawn: 14 },
      { type: 'golem',      plat: 0, x1: 1300, x2: 1900, count: 1, respawn: 14 },
      { type: 'golem',      plat: 0, x1: 2000, x2: 2500, count: 1, respawn: 14 },
    ],
  },

  altar: {
    name: '王者祭壇', theme: 'altar', w: 1500, h: 700,
    spawn: { x: 130, y: 540 },
    platforms: [
      { x1: 0,    x2: 1500, y: 540, ground: true },
      { x1: 180,  x2: 460,  y: 420 },
      { x1: 1040, x2: 1320, y: 420 },
    ],
    ropes: [],
    portals: [],
    spawners: [
      { type: 'boss', plat: 0, x1: 700, x2: 800, count: 1, respawn: 45 },
    ],
  },
};

// ── 程序化地圖產生器（地面 + 浮空平台 + 繩索 + 刷怪點）──
function genField(name, theme, w, monsters) {
  const h = 700, gy = 560;
  const rnd = Utils.seeded(Utils.hash(name));
  const platforms = [{ x1: 0, x2: w, y: gy, ground: true }];
  const ropes = [];
  let x = 300;
  while (x < w - 380) {
    const pw = 260 + Math.floor(rnd() * 180);
    const y = 360 + Math.floor(rnd() * 4) * 55; // 360 / 415 / 470 / 525
    platforms.push({ x1: x, x2: x + pw, y });
    ropes.push({ x: x + 36, y1: y, y2: gy });
    x += pw + 150 + Math.floor(rnd() * 170);
  }
  const spawners = [];
  monsters.forEach((mn) => {
    spawners.push({ type: mn.type, plat: 0, x1: 150, x2: w - 150, count: mn.count, respawn: mn.respawn || 8 });
  });
  for (let pi = 1; pi < platforms.length; pi++) {
    const mn = monsters[(pi - 1) % monsters.length];
    const pl = platforms[pi];
    spawners.push({ type: mn.type, plat: pi, x1: pl.x1 + 20, x2: pl.x2 - 20, count: 1, respawn: (mn.respawn || 8) + 2 });
  }
  return { name, theme, w, h, spawn: { x: 120, y: gy }, platforms, ropes, portals: [], spawners };
}

function genBoss(name, theme, w, bossType) {
  const h = 700, gy = 560;
  const platforms = [
    { x1: 0, x2: w, y: gy, ground: true },
    { x1: 180, x2: 480, y: 430 },
    { x1: w - 480, x2: w - 180, y: 430 },
  ];
  return {
    name, theme, w, h, spawn: { x: 120, y: gy }, platforms, ropes: [], portals: [],
    spawners: [{ type: bossType, plat: 0, x1: Math.round(w * 0.45), x2: Math.round(w * 0.55), count: 1, respawn: 60 }],
  };
}

function genTown(name, theme, w) {
  const h = 700, gy = 560;
  const platforms = [
    { x1: 0, x2: w, y: gy, ground: true },
    { x1: 300, x2: 640, y: 430 },
    { x1: 820, x2: 1140, y: 400 },
  ];
  const ropes = [{ x: 340, y1: 430, y2: gy }, { x: 860, y1: 400, y2: gy }];
  return { name, theme, w, h, spawn: { x: 120, y: gy }, platforms, ropes, portals: [], spawners: [] };
}

// ── 擴充地圖（≥20 張世界）──
Object.assign(MapDB, {
  town:        genTown('楓葉鎮', 'meadow', 1800),
  meadowHill:  genField('草原丘陵', 'meadow', 2600, [{ type: 'snail', count: 4 }, { type: 'redSnail', count: 3 }, { type: 'slime', count: 3 }]),
  snailHill:   genField('蝸牛山丘', 'meadow', 2800, [{ type: 'redSnail', count: 4 }, { type: 'slime', count: 3 }, { type: 'spore', count: 3 }]),
  deepForest:  genField('幽森深處', 'forest', 3000, [{ type: 'mushroom', count: 4 }, { type: 'spore', count: 3 }, { type: 'bat', count: 3 }, { type: 'boar', count: 2 }]),
  antTunnel:   genField('螞蟻隧道', 'cave', 2800, [{ type: 'bat', count: 4 }, { type: 'purpleMush', count: 3 }, { type: 'eye', count: 3 }]),
  crystalDepths: genField('水晶深淵', 'cave', 3000, [{ type: 'purpleMush', count: 3 }, { type: 'eye', count: 3 }, { type: 'golem', count: 3 }]),
  snowField:   genField('雪花平原', 'snow', 2800, [{ type: 'iceSlime', count: 4 }, { type: 'penguin', count: 4 }]),
  snowPeak:    genField('冰封山頂', 'snow', 3000, [{ type: 'penguin', count: 3 }, { type: 'snowman', count: 4 }]),
  iceCave:     genField('寒冰洞窟', 'snow', 2800, [{ type: 'iceSlime', count: 4 }, { type: 'snowman', count: 3 }]),
  frostValley: genField('霜凍幽谷', 'snow', 3000, [{ type: 'snowman', count: 4 }, { type: 'yeti', count: 3 }]),
  yetiLair:    genBoss('雪人巢穴', 'snow', 1700, 'yetiKing'),
  lavaPath:    genField('火焰之路', 'lava', 2800, [{ type: 'lavaSlime', count: 4 }, { type: 'fireGoblin', count: 3 }]),
  lavaBridge:  genField('熔岩之橋', 'lava', 3000, [{ type: 'fireGoblin', count: 4 }, { type: 'lavaSlime', count: 3 }]),
  lavaCore:    genField('熔岩核心', 'lava', 3000, [{ type: 'magmaGolem', count: 3 }, { type: 'drake', count: 3 }]),
  emberCave:   genField('餘燼洞窟', 'lava', 2800, [{ type: 'drake', count: 3 }, { type: 'magmaGolem', count: 3 }]),
  flameAltar:  genBoss('炎魔祭壇', 'lava', 1800, 'flameDrake'),
  castleGate:  genField('古城入口', 'castle', 2800, [{ type: 'zombie', count: 4 }, { type: 'skeleton', count: 3 }]),
  castleHall:  genField('古城大廳', 'castle', 3000, [{ type: 'skeleton', count: 4 }, { type: 'mummy', count: 3 }]),
  castleDungeon: genField('古城地牢', 'castle', 3000, [{ type: 'mummy', count: 4 }, { type: 'darkKnight', count: 2 }]),
  castleTower: genField('暗黑高塔', 'castle', 2800, [{ type: 'darkKnight', count: 3 }, { type: 'skeleton', count: 3 }]),
  throneRoom:  genBoss('王座之間', 'castle', 1900, 'darkLord'),
});

// ── 世界連線：依序串接前後傳送門（保證每張地圖皆可步行抵達）──
const MAP_CHAIN = [
  'meadow', 'forest', 'cave', 'altar', 'town',
  'meadowHill', 'snailHill', 'deepForest', 'antTunnel', 'crystalDepths',
  'snowField', 'snowPeak', 'iceCave', 'frostValley', 'yetiLair',
  'lavaPath', 'lavaBridge', 'lavaCore', 'emberCave', 'flameAltar',
  'castleGate', 'castleHall', 'castleDungeon', 'castleTower', 'throneRoom',
];
MAP_CHAIN.forEach((id, i) => {
  const m = MapDB[id];
  if (!m) return;
  const ground = m.platforms.find((p) => p.ground) || { y: 560 };
  const gy = ground.y;
  const portals = [];
  if (i > 0) portals.push({ id: 'back', x: 90, y: gy, target: MAP_CHAIN[i - 1], targetPortal: 'fwd' });
  if (i < MAP_CHAIN.length - 1) portals.push({ id: 'fwd', x: m.w - 90, y: gy, target: MAP_CHAIN[i + 1], targetPortal: 'back' });
  m.portals = portals;
});

// 每張地圖預設專屬背景檔名 <id>-bg.png；提供該檔即自動套用，否則回退主題共用背景
for (const id in MapDB) {
  if (!MapDB[id].bg) MapDB[id].bg = id + '-bg.png';
}

// 每張地圖放一位商人 NPC，站在「安全的浮空平台」上（怪物不會生在此平台），
// 旁邊附一條繩索方便上下。NPC 以 map.npcs 陣列表示。
for (const id in MapDB) {
  const m = MapDB[id];
  if (m.npcs) continue;
  const ground = m.platforms.find((p) => p.ground) || { y: 560 };
  const gy = ground.y;
  const nx = Math.min(320, m.w - 140);
  const py = gy - 96;
  m.platforms.push({ x1: nx - 90, x2: nx + 90, y: py });   // 商人專用安全平台
  if (!m.ropes) m.ropes = [];
  m.ropes.push({ x: nx - 66, y1: py, y2: gy });            // 上下平台的繩索
  m.npcs = [{ id: 'merchant', x: nx, y: py }];
}

// 楓葉鎮：安全城鎮，地面即安全，放置村莊 NPC（村長 / 獵人 / 草藥師 / 鐵匠）
if (MapDB.town) {
  const gy = (MapDB.town.platforms.find((p) => p.ground) || { y: 560 }).y;
  MapDB.town.npcs.push(
    { id: 'elder', x: 600, y: gy },
    { id: 'hunter', x: 820, y: gy },
    { id: 'herbalist', x: 1040, y: gy },
    { id: 'blacksmith', x: 1300, y: gy },
  );
}
