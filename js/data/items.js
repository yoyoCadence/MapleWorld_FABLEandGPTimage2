// 道具資料庫
// type: 'use' 消耗品 / 'equip' 裝備
// equip 欄位: slot(weapon/hat/top/shoes), atk, def, hp, mp, reqLv
const ItemDB = {
  // ── 消耗品 ──
  redPotion:    { name: '紅藥水',   type: 'use', icon: 'potion', color: '#e74c3c', heal: 60,  desc: '恢復 60 HP', maxStack: 30 },
  orangePotion: { name: '橘藥水',   type: 'use', icon: 'potion', color: '#e67e22', heal: 180, desc: '恢復 180 HP', maxStack: 30 },
  bluePotion:   { name: '藍藥水',   type: 'use', icon: 'potion', color: '#3498db', mpHeal: 80, desc: '恢復 80 MP', maxStack: 30 },
  elixir:       { name: '楓葉聖水', type: 'use', icon: 'potion', color: '#9b59b6', heal: 400, mpHeal: 200, desc: '恢復 400 HP、200 MP', maxStack: 30 },

  // ── 武器 ──
  woodSword:  { name: '木劍',     type: 'equip', slot: 'weapon', icon: 'sword', color: '#8a5a33', atk: 6,  reqLv: 1,  desc: '新手的第一把劍' },
  ironSword:  { name: '鐵劍',     type: 'equip', slot: 'weapon', icon: 'sword', color: '#aab2bd', atk: 14, reqLv: 5,  desc: '堅固耐用的鐵劍' },
  mapleSword: { name: '楓葉劍',   type: 'equip', slot: 'weapon', icon: 'sword', color: '#e8542f', atk: 26, reqLv: 10, desc: '注入楓葉之力的名劍' },
  kingSword:  { name: '王者之劍', type: 'equip', slot: 'weapon', icon: 'sword', color: '#f1c40f', atk: 42, reqLv: 14, desc: '蘑菇王守護的傳說之劍' },

  // ── 帽子 ──
  leafHat:   { name: '葉子帽',   type: 'equip', slot: 'hat', icon: 'hat', color: '#27ae60', def: 4,  hp: 30,  reqLv: 2,  desc: '一片大葉子做的帽子' },
  ironHelm:  { name: '鐵頭盔',   type: 'equip', slot: 'hat', icon: 'hat', color: '#95a5a6', def: 9,  hp: 80,  reqLv: 8,  desc: '可靠的鐵製頭盔' },
  kingCrown: { name: '王者皇冠', type: 'equip', slot: 'hat', icon: 'hat', color: '#f1c40f', def: 15, hp: 180, reqLv: 14, desc: '蘑菇王的黃金皇冠' },

  // ── 衣服 ──
  travelTop: { name: '旅人上衣', type: 'equip', slot: 'top', icon: 'top', color: '#2980b9', def: 5,  hp: 40,  reqLv: 2, desc: '輕便的旅行上衣' },
  ironArmor: { name: '鋼鐵盔甲', type: 'equip', slot: 'top', icon: 'top', color: '#7f8c8d', def: 13, hp: 110, reqLv: 9, desc: '沉重但安心的盔甲' },

  // ── 鞋子 ──
  strawShoes:   { name: '草織鞋',  type: 'equip', slot: 'shoes', icon: 'shoes', color: '#c8a85a', def: 2, hp: 20, reqLv: 1, desc: '柔軟的草編鞋' },
  leatherBoots: { name: '皮革靴',  type: 'equip', slot: 'shoes', icon: 'shoes', color: '#8e5a2b', def: 6, hp: 50, reqLv: 7, desc: '結實的皮革長靴' },
};

const EQUIP_SLOTS = ['weapon', 'hat', 'top', 'shoes'];
const EQUIP_SLOT_NAMES = { weapon: '武器', hat: '帽子', top: '衣服', shoes: '鞋子' };
