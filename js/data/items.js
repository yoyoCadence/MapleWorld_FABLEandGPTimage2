// 道具資料庫
// type: 'use' 消耗品 / 'equip' 裝備 / 'material' 材料（製作用，掉落收集）
// equip 欄位: slot, atk, def, hp, mp, spd(移速%), reqLv
//   武器額外: wtype（武器類型）、class（限定職業；'any' 不限）、icon（圖示樣式）
const ItemDB = {
  // ════════════ 消耗品 ════════════
  redPotion:    { name: '紅藥水',   type: 'use', icon: 'potion', color: '#e74c3c', heal: 60,  desc: '恢復 60 HP', maxStack: 50 },
  orangePotion: { name: '橘藥水',   type: 'use', icon: 'potion', color: '#e67e22', heal: 180, desc: '恢復 180 HP', maxStack: 50 },
  whitePotion:  { name: '白藥水',   type: 'use', icon: 'potion', color: '#ecf0f1', heal: 600, desc: '恢復 600 HP', maxStack: 50 },
  bluePotion:   { name: '藍藥水',   type: 'use', icon: 'potion', color: '#3498db', mpHeal: 80,  desc: '恢復 80 MP', maxStack: 50 },
  manaElixir:   { name: '魔力靈液', type: 'use', icon: 'potion', color: '#2980b9', mpHeal: 300, desc: '恢復 300 MP', maxStack: 50 },
  elixir:       { name: '楓葉聖水', type: 'use', icon: 'potion', color: '#9b59b6', heal: 400, mpHeal: 200, desc: '恢復 400 HP、200 MP', maxStack: 50 },
  powerElixir:  { name: '全恢復聖水', type: 'use', icon: 'potion', color: '#f1c40f', heal: 9999, mpHeal: 9999, desc: '完全恢復 HP / MP', maxStack: 30 },
  returnScroll: { name: '返鄉卷軸', type: 'use', icon: 'scroll', color: '#d8b25e', warp: 'town', desc: '瞬間返回楓葉鎮', maxStack: 20 },

  // ════════════ 武器：劍士（劍 / 斧 / 鈍器）════════════
  woodSword:    { name: '木劍',     type: 'equip', slot: 'weapon', wtype: 'sword', class: 'warrior', icon: 'sword', color: '#8a5a33', atk: 6,  reqLv: 1,  desc: '新手的第一把劍' },
  ironSword:    { name: '鐵劍',     type: 'equip', slot: 'weapon', wtype: 'sword', class: 'warrior', icon: 'sword', color: '#aab2bd', atk: 14, reqLv: 5,  desc: '堅固耐用的鐵劍' },
  battleAxe:    { name: '戰斧',     type: 'equip', slot: 'weapon', wtype: 'axe',   class: 'warrior', icon: 'axe',   color: '#9aa0a6', atk: 22, reqLv: 8,  desc: '沉重的雙手戰斧' },
  mapleSword:   { name: '楓葉劍',   type: 'equip', slot: 'weapon', wtype: 'sword', class: 'warrior', icon: 'sword', color: '#e8542f', atk: 26, reqLv: 10, desc: '注入楓葉之力的名劍' },
  warMace:      { name: '戰錘',     type: 'equip', slot: 'weapon', wtype: 'mace',  class: 'warrior', icon: 'mace',  color: '#b8923e', atk: 34, reqLv: 12, desc: '粉碎一切的戰錘' },
  kingSword:    { name: '王者之劍', type: 'equip', slot: 'weapon', wtype: 'sword', class: 'warrior', icon: 'sword', color: '#f1c40f', atk: 42, reqLv: 14, desc: '蘑菇王守護的傳說之劍' },
  dragonSlayer: { name: '屠龍斧',   type: 'equip', slot: 'weapon', wtype: 'axe',   class: 'warrior', icon: 'axe',   color: '#e74c3c', atk: 58, reqLv: 20, desc: '炎魔之力鍛造的巨斧' },
  darkBlade:    { name: '暗黑魔劍', type: 'equip', slot: 'weapon', wtype: 'sword', class: 'warrior', icon: 'sword', color: '#6c5ce7', atk: 80, mp: 40, reqLv: 30, desc: '黑暗領主的禁忌之劍' },

  // ════════════ 武器：法師（短杖 / 長杖）════════════
  beginnerWand: { name: '見習魔杖', type: 'equip', slot: 'weapon', wtype: 'wand',  class: 'magician', icon: 'wand',  color: '#a29bfe', atk: 5,  mp: 10,  reqLv: 1,  desc: '見習法師的木杖' },
  mapleWand:    { name: '楓葉魔杖', type: 'equip', slot: 'weapon', wtype: 'wand',  class: 'magician', icon: 'wand',  color: '#e8542f', atk: 12, mp: 30,  reqLv: 5,  desc: '蘊含楓葉魔力的杖' },
  crystalStaff: { name: '水晶法杖', type: 'equip', slot: 'weapon', wtype: 'staff', class: 'magician', icon: 'staff', color: '#74e0ff', atk: 22, mp: 50,  reqLv: 10, desc: '頂端鑲嵌魔力水晶' },
  flameStaff:   { name: '烈焰法杖', type: 'equip', slot: 'weapon', wtype: 'staff', class: 'magician', icon: 'staff', color: '#ff7a3a', atk: 34, mp: 70,  reqLv: 14, desc: '燃燒不息的火之杖' },
  arcaneStaff:  { name: '秘術法杖', type: 'equip', slot: 'weapon', wtype: 'staff', class: 'magician', icon: 'staff', color: '#b06ad8', atk: 50, mp: 120, reqLv: 20, desc: '凝聚奧術的高階法杖' },
  voidStaff:    { name: '虛空法杖', type: 'equip', slot: 'weapon', wtype: 'staff', class: 'magician', icon: 'staff', color: '#5c3aa8', atk: 72, mp: 180, reqLv: 30, desc: '操縱虛空的終極法杖' },

  // ════════════ 武器：弓箭手（弓 / 弩）════════════
  beginnerBow:  { name: '見習弓',   type: 'equip', slot: 'weapon', wtype: 'bow',      class: 'archer', icon: 'bow',      color: '#c8a85a', atk: 5,  reqLv: 1,  desc: '練習用的木弓' },
  hunterBow:    { name: '獵人弓',   type: 'equip', slot: 'weapon', wtype: 'bow',      class: 'archer', icon: 'bow',      color: '#8e5a2b', atk: 13, reqLv: 5,  desc: '獵人愛用的長弓' },
  mapleBow:     { name: '楓葉弓',   type: 'equip', slot: 'weapon', wtype: 'bow',      class: 'archer', icon: 'bow',      color: '#e8542f', atk: 24, reqLv: 10, desc: '射出楓葉之箭的名弓' },
  windBow:      { name: '疾風弓',   type: 'equip', slot: 'weapon', wtype: 'bow',      class: 'archer', icon: 'bow',      color: '#4fae8a', atk: 36, spd: 8, reqLv: 14, desc: '輕盈如風的快弓' },
  stormCrossbow:{ name: '風暴弩',   type: 'equip', slot: 'weapon', wtype: 'crossbow', class: 'archer', icon: 'crossbow', color: '#5a93e8', atk: 52, reqLv: 20, desc: '連射如暴雨的強弩' },
  phoenixBow:   { name: '不死鳥弓', type: 'equip', slot: 'weapon', wtype: 'bow',      class: 'archer', icon: 'bow',      color: '#ff7a3a', atk: 74, reqLv: 30, desc: '傳說不死鳥羽毛製成' },

  // ════════════ 武器：盜賊（短劍 / 拳爪）════════════
  beginnerDagger:{ name: '見習短劍', type: 'equip', slot: 'weapon', wtype: 'dagger', class: 'thief', icon: 'dagger', color: '#bdc3c7', atk: 5,  spd: 4, reqLv: 1,  desc: '輕巧的入門短劍' },
  steelDagger:   { name: '鋼之短劍', type: 'equip', slot: 'weapon', wtype: 'dagger', class: 'thief', icon: 'dagger', color: '#95a5a6', atk: 13, spd: 4, reqLv: 5,  desc: '鋒利的鋼製短劍' },
  mapleDagger:   { name: '楓葉短劍', type: 'equip', slot: 'weapon', wtype: 'dagger', class: 'thief', icon: 'dagger', color: '#e8542f', atk: 24, spd: 5, reqLv: 10, desc: '楓葉鍛造的迅捷短劍' },
  shadowClaw:    { name: '暗影拳爪', type: 'equip', slot: 'weapon', wtype: 'claw',   class: 'thief', icon: 'claw',   color: '#9b59b6', atk: 36, spd: 6, reqLv: 14, desc: '無聲奪命的拳爪' },
  venomDagger:   { name: '劇毒短劍', type: 'equip', slot: 'weapon', wtype: 'dagger', class: 'thief', icon: 'dagger', color: '#27ae60', atk: 52, spd: 6, reqLv: 20, desc: '淬毒的致命短劍' },
  darkClaw:      { name: '闇黑拳爪', type: 'equip', slot: 'weapon', wtype: 'claw',   class: 'thief', icon: 'claw',   color: '#6c5ce7', atk: 74, spd: 8, reqLv: 30, desc: '黑暗之力凝成的拳爪' },

  // ════════════ 武器：海盜（拳套 / 火槍）════════════
  beginnerKnuckle:{ name: '見習拳套', type: 'equip', slot: 'weapon', wtype: 'knuckle', class: 'pirate', icon: 'knuckle', color: '#c8a85a', atk: 5,  reqLv: 1,  desc: '皮革製的練習拳套' },
  ironKnuckle:    { name: '鐵拳套',   type: 'equip', slot: 'weapon', wtype: 'knuckle', class: 'pirate', icon: 'knuckle', color: '#95a5a6', atk: 14, reqLv: 5,  desc: '鑲鐵的硬派拳套' },
  mapleKnuckle:   { name: '楓葉拳套', type: 'equip', slot: 'weapon', wtype: 'knuckle', class: 'pirate', icon: 'knuckle', color: '#e8542f', atk: 24, reqLv: 10, desc: '注入楓力的拳套' },
  pirateGun:      { name: '海盜火槍', type: 'equip', slot: 'weapon', wtype: 'gun',     class: 'pirate', icon: 'gun',     color: '#7f8c8d', atk: 36, reqLv: 14, desc: '老練海盜的愛槍' },
  cannonGun:      { name: '加農火槍', type: 'equip', slot: 'weapon', wtype: 'gun',     class: 'pirate', icon: 'gun',     color: '#34495e', atk: 52, reqLv: 20, desc: '威力驚人的重型火槍' },
  krakenKnuckle:  { name: '海皇拳套', type: 'equip', slot: 'weapon', wtype: 'knuckle', class: 'pirate', icon: 'knuckle', color: '#16a085', atk: 74, reqLv: 30, desc: '海皇之力灌注的拳套' },

  // ════════════ 帽子 ════════════
  leafHat:    { name: '葉子帽',   type: 'equip', slot: 'hat', icon: 'hat', color: '#27ae60', def: 4,  hp: 30,  reqLv: 2,  desc: '一片大葉子做的帽子' },
  ironHelm:   { name: '鐵頭盔',   type: 'equip', slot: 'hat', icon: 'hat', color: '#95a5a6', def: 9,  hp: 80,  reqLv: 8,  desc: '可靠的鐵製頭盔' },
  wizardHat:  { name: '巫師帽',   type: 'equip', slot: 'hat', icon: 'hat', color: '#7a5cff', def: 7,  mp: 60,  reqLv: 8,  desc: '尖頂的魔法巫師帽' },
  kingCrown:  { name: '王者皇冠', type: 'equip', slot: 'hat', icon: 'hat', color: '#f1c40f', def: 15, hp: 180, reqLv: 14, desc: '蘑菇王的黃金皇冠' },
  dragonHelm: { name: '龍鱗頭盔', type: 'equip', slot: 'hat', icon: 'hat', color: '#e74c3c', def: 24, hp: 320, reqLv: 24, desc: '炎魔龍鱗鍛造的頭盔' },

  // ════════════ 上衣 ════════════
  travelTop:  { name: '旅人上衣', type: 'equip', slot: 'top', icon: 'top', color: '#2980b9', def: 5,  hp: 40,  reqLv: 2,  desc: '輕便的旅行上衣' },
  ironArmor:  { name: '鋼鐵盔甲', type: 'equip', slot: 'top', icon: 'top', color: '#7f8c8d', def: 13, hp: 110, reqLv: 9,  desc: '沉重但安心的盔甲' },
  mageRobe:   { name: '法師長袍', type: 'equip', slot: 'top', icon: 'top', color: '#7a5cff', def: 9,  mp: 90,  reqLv: 9,  desc: '繡有符文的法師袍' },
  dragonMail: { name: '龍鱗鎧甲', type: 'equip', slot: 'top', icon: 'top', color: '#e74c3c', def: 30, hp: 420, reqLv: 24, desc: '炎魔龍鱗製的鎧甲' },

  // ════════════ 下衣 ════════════
  clothPants: { name: '布褲',     type: 'equip', slot: 'bottom', icon: 'bottom', color: '#95a5a6', def: 4,  hp: 30,  reqLv: 2,  desc: '普通的布褲' },
  ironGreaves:{ name: '鐵護腿',   type: 'equip', slot: 'bottom', icon: 'bottom', color: '#7f8c8d', def: 11, hp: 90,  reqLv: 9,  desc: '堅固的鐵護腿' },
  dragonGreaves:{ name: '龍鱗護腿', type: 'equip', slot: 'bottom', icon: 'bottom', color: '#e74c3c', def: 22, hp: 280, reqLv: 24, desc: '炎魔龍鱗護腿' },

  // ════════════ 鞋子 ════════════
  strawShoes:   { name: '草織鞋',  type: 'equip', slot: 'shoes', icon: 'shoes', color: '#c8a85a', def: 2, hp: 20, reqLv: 1, desc: '柔軟的草編鞋' },
  leatherBoots: { name: '皮革靴',  type: 'equip', slot: 'shoes', icon: 'shoes', color: '#8e5a2b', def: 6, hp: 50, reqLv: 7, desc: '結實的皮革長靴' },
  windBoots:    { name: '疾風之靴', type: 'equip', slot: 'shoes', icon: 'shoes', color: '#4fae8a', def: 10, spd: 12, reqLv: 14, desc: '能加快步伐的輕靴' },
  dragonBoots:  { name: '龍鱗戰靴', type: 'equip', slot: 'shoes', icon: 'shoes', color: '#e74c3c', def: 18, hp: 160, reqLv: 24, desc: '炎魔龍鱗戰靴' },

  // ════════════ 手套 ════════════
  clothGloves:  { name: '布手套',   type: 'equip', slot: 'gloves', icon: 'gloves', color: '#bdc3c7', def: 2, atk: 2, reqLv: 3,  desc: '基本的布手套' },
  battleGloves: { name: '戰鬥手套', type: 'equip', slot: 'gloves', icon: 'gloves', color: '#7f8c8d', def: 6, atk: 5, reqLv: 12, desc: '提升握力的戰鬥手套' },
  dragonGloves: { name: '龍爪手套', type: 'equip', slot: 'gloves', icon: 'gloves', color: '#e74c3c', def: 12, atk: 12, reqLv: 24, desc: '龍爪鍛造的手套' },

  // ════════════ 披風 ════════════
  travelCape: { name: '旅人披風', type: 'equip', slot: 'cape', icon: 'cape', color: '#2980b9', def: 3, hp: 30, reqLv: 5,  desc: '抵禦風寒的披風' },
  mapleCape:  { name: '楓葉披風', type: 'equip', slot: 'cape', icon: 'cape', color: '#e8542f', def: 8, hp: 80, reqLv: 14, desc: '繡著楓葉的華麗披風' },
  dragonCape: { name: '炎龍披風', type: 'equip', slot: 'cape', icon: 'cape', color: '#e74c3c', def: 16, hp: 200, reqLv: 26, desc: '炎魔之翼化成的披風' },

  // ════════════ 盾牌 ════════════
  woodShield:  { name: '木盾',     type: 'equip', slot: 'shield', icon: 'shield', color: '#8a5a33', def: 6,  hp: 40,  reqLv: 4,  desc: '輕便的木製圓盾' },
  ironShield:  { name: '鐵盾',     type: 'equip', slot: 'shield', icon: 'shield', color: '#95a5a6', def: 14, hp: 120, reqLv: 12, desc: '厚重的鐵盾' },
  dragonShield:{ name: '龍鱗盾',   type: 'equip', slot: 'shield', icon: 'shield', color: '#e74c3c', def: 26, hp: 300, reqLv: 26, desc: '炎魔龍鱗盾' },

  // ════════════ 飾品（耳環 / 戒指 / 項鍊 / 腰帶）════════════
  jadeEarring:  { name: '翡翠耳環', type: 'equip', slot: 'earring', icon: 'earring', color: '#27ae60', def: 3, mp: 40, reqLv: 6,  desc: '清涼的翡翠耳環' },
  rubyEarring:  { name: '紅寶耳環', type: 'equip', slot: 'earring', icon: 'earring', color: '#e74c3c', def: 6, hp: 80, reqLv: 16, desc: '火紅的紅寶石耳環' },
  powerRing:    { name: '力量戒指', type: 'equip', slot: 'ring', icon: 'ring', color: '#f1c40f', atk: 4, reqLv: 6,  desc: '提升力量的戒指' },
  dragonRing:   { name: '巨龍戒指', type: 'equip', slot: 'ring', icon: 'ring', color: '#e74c3c', atk: 10, hp: 100, reqLv: 22, desc: '蘊含龍威的戒指' },
  moonPendant:  { name: '月光項鍊', type: 'equip', slot: 'pendant', icon: 'pendant', color: '#74e0ff', def: 4, mp: 60, reqLv: 8,  desc: '散發月光的項鍊' },
  dragonPendant:{ name: '龍魂項鍊', type: 'equip', slot: 'pendant', icon: 'pendant', color: '#e74c3c', atk: 8, def: 8, reqLv: 22, desc: '封印龍魂的項鍊' },
  leatherBelt:  { name: '皮腰帶',   type: 'equip', slot: 'belt', icon: 'belt', color: '#8e5a2b', def: 4, hp: 40, reqLv: 6,  desc: '結實的皮製腰帶' },
  dragonBelt:   { name: '龍皮腰帶', type: 'equip', slot: 'belt', icon: 'belt', color: '#e74c3c', def: 12, hp: 140, reqLv: 22, desc: '龍皮製的堅韌腰帶' },

  // ════════════ 材料（製作 / 收集，掉落取得）════════════
  // 詳細用途與配方由後續補充（見 assets/ASSET_REQUESTS.md 材料段）
  snailShell:   { name: '蝸牛殼',   type: 'material', icon: 'material', color: '#5a93e8', desc: '蝸牛的硬殼，常見素材', maxStack: 100 },
  slimeGel:     { name: '史萊姆膠', type: 'material', icon: 'material', color: '#56c248', desc: '黏呼呼的膠質', maxStack: 100 },
  mushSpore:    { name: '蘑菇孢子', type: 'material', icon: 'material', color: '#e8a04a', desc: '蘑菇散出的孢子', maxStack: 100 },
  hardLeather:  { name: '堅韌皮革', type: 'material', icon: 'material', color: '#8e5a2b', desc: '野獸的堅韌皮革', maxStack: 100 },
  crystalShard: { name: '水晶碎片', type: 'material', icon: 'material', color: '#b06ad8', desc: '閃爍的水晶碎片', maxStack: 100 },
  iceShard:     { name: '寒冰結晶', type: 'material', icon: 'material', color: '#74e0ff', desc: '永不融化的冰晶', maxStack: 100 },
  fireOre:      { name: '火焰礦石', type: 'material', icon: 'material', color: '#ff7a3a', desc: '蘊含火之力的礦石', maxStack: 100 },
  boneFrag:     { name: '骸骨碎片', type: 'material', icon: 'material', color: '#ecf0f1', desc: '不死生物的骸骨', maxStack: 100 },
  darkEssence:  { name: '黑暗精華', type: 'material', icon: 'material', color: '#6c5ce7', desc: '濃縮的黑暗能量', maxStack: 100 },
  dragonScale:  { name: '龍鱗',     type: 'material', icon: 'material', color: '#e74c3c', desc: '稀有的龍鱗，頂級素材', maxStack: 100 },
  goldOre:      { name: '黃金礦石', type: 'material', icon: 'material', color: '#f1c40f', desc: '閃亮的黃金原礦', maxStack: 100 },
  mapleLeafMat: { name: '楓之葉',   type: 'material', icon: 'material', color: '#e8542f', desc: '蘊含楓之力的葉片', maxStack: 100 },

  // ════════════ 寵物（在寵物商店購買，使用即更換隨行寵物）════════════
  petPig:  { name: '粉紅小豬', type: 'pet', petKind: 'pig', icon: 'pet', color: '#f6a5c0', desc: '使用後更換為粉紅小豬寵物', maxStack: 1 },
  petFox:  { name: '九尾小狐', type: 'pet', petKind: 'fox', icon: 'pet', color: '#ff9a4a', desc: '使用後更換為九尾小狐寵物', maxStack: 1 },
};

const EQUIP_SLOTS = ['weapon', 'hat', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'shield', 'earring', 'ring', 'pendant', 'belt'];
const EQUIP_SLOT_NAMES = {
  weapon: '武器', hat: '帽子', top: '上衣', bottom: '下衣', shoes: '鞋子', gloves: '手套',
  cape: '披風', shield: '盾牌', earring: '耳環', ring: '戒指', pendant: '項鍊', belt: '腰帶',
};
const WTYPE_NAMES = {
  sword: '劍', axe: '斧', mace: '鈍器', wand: '短杖', staff: '長杖', bow: '弓',
  crossbow: '弩', dagger: '短劍', claw: '拳爪', knuckle: '拳套', gun: '火槍',
};

// ════════════ 裝備隨機數值（每件同名裝備數值都不同，並有機率出現極品）════════════
// 稀有度（tier）：機率越低、加成倍率越高。掉落/製作/任務/購買的裝備皆會 roll 一次。
const EQUIP_TIERS = [
  { name: '普通', color: '#cfd8e8', min: 0.82, max: 1.04, p: 0.60 },
  { name: '優良', color: '#6fd3ff', min: 1.04, max: 1.20, p: 0.27 },
  { name: '稀有', color: '#c79bff', min: 1.20, max: 1.42, p: 0.11 },
  { name: '傳說', color: '#ffba5a', min: 1.42, max: 1.75, p: 0.02 },
];
const ROLL_FIELDS = ['atk', 'def', 'hp', 'mp', 'spd'];

// 為某件裝備產生一組隨機數值；非裝備回傳 null。
function rollEquip(id) {
  const d = ItemDB[id];
  if (!d || d.type !== 'equip') return null;
  let r = Math.random(), tier = 0, acc = 0;
  for (let i = 0; i < EQUIP_TIERS.length; i++) { acc += EQUIP_TIERS[i].p; if (r < acc) { tier = i; break; } }
  const T = EQUIP_TIERS[tier];
  const roll = { tier: tier };
  for (const f of ROLL_FIELDS) {
    if (d[f]) {
      const mul = T.min + Math.random() * (T.max - T.min);
      roll[f] = Math.max(1, Math.round(d[f] * mul));
    }
  }
  return roll;
}

// 取得「實際數值」：有 roll 用 roll，否則回退基礎值；再依強化等級 roll.enh 加成。
function statVal(id, roll, field) {
  let v = (roll && roll[field] != null) ? roll[field] : 0;
  if (v === 0) { const d = ItemDB[id]; v = (d && d[field]) || 0; }
  if (v && roll && roll.enh) v += Math.ceil(v * ENH_PER_LEVEL * roll.enh);  // 每級至少 +1
  return v;
}

// ════════════ 裝備強化（在鐵匠處升級裝備數值）════════════
const ENH_MAX = 12;            // 強化上限 +12
const ENH_PER_LEVEL = 0.07;    // 每 +1 提升該裝備各數值 7%

// 裝備參考價值（買價/賣價/強化費用的基準）
function equipValue(id) {
  const d = ItemDB[id];
  if (!d || d.type !== 'equip') return 40;
  return Math.round(((d.atk || 0) + (d.def || 0)) * 8 + (d.hp || 0) * 0.4 + (d.mp || 0) * 0.4 + (d.reqLv || 1) * 18 + 40);
}

// 強化成功率（等級越高越難）
function enhanceRate(enh) {
  if (enh <= 2) return 1.0;
  if (enh <= 5) return 0.9;
  if (enh <= 7) return 0.75;
  if (enh <= 9) return 0.55;
  return 0.4;
}

// 強化費用：楓幣（隨等級遞增）+ 黃金礦石（+3 起需要）
function enhanceCost(id, enh) {
  const v = equipValue(id);
  return {
    meso: Math.round(v * (0.6 + enh * 0.5)),
    mat: enh >= 3 ? { id: 'goldOre', qty: 1 + Math.floor((enh - 3) / 3) } : null,
  };
}
