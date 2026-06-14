// 地圖資料庫
// platforms: {x1, x2, y, ground?}  ground=true 表示主地面（不能下跳穿越）
// ropes:     {x, y1, y2}           y1 為頂端（需對齊某平台的 y）
// portals:   {id, x, y, target, targetPortal}
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
    portals: [
      { id: 'toForest', x: 2520, y: 560, target: 'forest', targetPortal: 'toMeadow' },
    ],
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
    portals: [
      { id: 'toMeadow', x: 90,   y: 600, target: 'meadow', targetPortal: 'toForest' },
      { id: 'toCave',   x: 2910, y: 600, target: 'cave',   targetPortal: 'toForest' },
    ],
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
    portals: [
      { id: 'toForest', x: 90,   y: 600, target: 'forest', targetPortal: 'toCave' },
      { id: 'toAltar',  x: 2710, y: 600, target: 'altar',  targetPortal: 'toCave' },
    ],
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
    portals: [
      { id: 'toCave', x: 90, y: 540, target: 'cave', targetPortal: 'toAltar' },
    ],
    spawners: [
      { type: 'boss', plat: 0, x1: 700, x2: 800, count: 1, respawn: 45 },
    ],
  },
};
