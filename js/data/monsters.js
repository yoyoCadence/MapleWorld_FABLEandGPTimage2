// 怪物資料庫
// drops: { meso:[min,max], p } 或 { item:'id', p, qty? }
const MonsterDB = {
  snail: {
    name: '小藍蝸', hp: 25, atk: 6, def: 0, xp: 8, speed: 22, w: 36, h: 28, move: 'walk',
    drops: [
      { meso: [5, 15], p: 0.75 },
      { item: 'redPotion', p: 0.25 },
      { item: 'strawShoes', p: 0.06 },
      { item: 'leafHat', p: 0.04 },
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
    ],
  },
  mushroom: {
    name: '跳跳菇', hp: 120, atk: 19, def: 3, xp: 26, speed: 62, w: 40, h: 38, move: 'hop',
    drops: [
      { meso: [15, 35], p: 0.8 },
      { item: 'redPotion', p: 0.2 },
      { item: 'bluePotion', p: 0.15 },
      { item: 'orangePotion', p: 0.08 },
      { item: 'ironSword', p: 0.04 },
      { item: 'leatherBoots', p: 0.04 },
    ],
  },
  purpleMush: {
    name: '紫晶菇', hp: 280, atk: 32, def: 6, xp: 58, speed: 55, w: 44, h: 42, move: 'hop',
    drops: [
      { meso: [30, 60], p: 0.8 },
      { item: 'orangePotion', p: 0.18 },
      { item: 'bluePotion', p: 0.15 },
      { item: 'ironHelm', p: 0.04 },
      { item: 'ironArmor', p: 0.04 },
      { item: 'mapleSword', p: 0.03 },
    ],
  },
  golem: {
    name: '石小弟', hp: 560, atk: 45, def: 12, xp: 95, speed: 35, w: 54, h: 58, move: 'walk', aggressive: true,
    drops: [
      { meso: [60, 120], p: 0.9 },
      { item: 'orangePotion', p: 0.25 },
      { item: 'elixir', p: 0.06 },
      { item: 'mapleSword', p: 0.05 },
      { item: 'ironArmor', p: 0.06 },
    ],
  },
  boss: {
    name: '蘑菇王', hp: 6800, atk: 58, def: 10, xp: 2400, speed: 55, w: 110, h: 104, move: 'boss', boss: true,
    drops: [
      { meso: [600, 1200], p: 1 },
      { item: 'kingSword', p: 1 },
      { item: 'kingCrown', p: 0.5 },
      { item: 'elixir', p: 0.6, qty: 2 },
      { item: 'orangePotion', p: 0.8, qty: 3 },
    ],
  },
};
