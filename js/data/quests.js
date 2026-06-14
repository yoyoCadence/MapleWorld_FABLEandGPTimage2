// NPC、任務、製作配方資料庫
// ── NPC ──
// type: 'shop' 商店 / 'craft' 製作 / 'quest' 對話與任務
const NpcDB = {
  merchant:  { name: '雜貨商人 阿金', type: 'shop',  sprite: 'npc-merchant',  color: '#c8a85a',
    story: '「來來來，藥水卷軸樣樣有，背包不夠大也能擴充喔！」' },
  blacksmith:{ name: '鐵匠 鋼爺',    type: 'craft', sprite: 'npc-blacksmith', color: '#8a5a3a',
    story: '「帶素材來，老夫幫你打造像樣的裝備。」' },
  elder:     { name: '村長 楓伯',    type: 'quest', sprite: 'npc-elder',     color: '#7a5cff',
    story: '「年輕人，楓之村需要你這樣的冒險者。」' },
  hunter:    { name: '獵人 阿傑',    type: 'quest', sprite: 'npc-hunter',    color: '#3fae5a',
    story: '「最近怪物變多了，幫我清一清吧，獵人之間好說話。」' },
  herbalist: { name: '草藥師 小柔',  type: 'quest', sprite: 'npc-herbalist', color: '#e87fae',
    story: '「我需要一些素材來調配藥劑，你願意幫忙採集嗎？」' },
};

// ── 任務 ──
// objective: { type:'kill', target:<monsterType>, count } 或 { type:'collect', item:<itemId>, count }
// reward: { meso, exp, items:[{id,qty}] }；prev: 需先完成的任務 id
const QuestDB = {
  q_snail: {
    giver: 'hunter', name: '蝸牛大掃除', reqLv: 1,
    story: '「楓葉草原的小藍蝸到處亂爬，先拿牠們練手吧。」',
    objective: { type: 'kill', target: 'snail', count: 8 },
    reward: { meso: 150, exp: 60, items: [{ id: 'redPotion', qty: 5 }] },
  },
  q_slime: {
    giver: 'herbalist', name: '黏呼呼的材料', reqLv: 2,
    story: '「綠泡泡身上的史萊姆膠是製藥好材料，幫我收集一些。」',
    objective: { type: 'collect', item: 'slimeGel', count: 6 },
    reward: { meso: 220, exp: 90, items: [{ id: 'bluePotion', qty: 5 }] },
  },
  q_mushroom: {
    giver: 'hunter', name: '蘑菇森林的騷動', reqLv: 5, prev: 'q_snail',
    story: '「蘑菇森林的跳跳菇太囂張了，去教訓牠們 12 隻。」',
    objective: { type: 'kill', target: 'mushroom', count: 12 },
    reward: { meso: 500, exp: 260, items: [{ id: 'orangePotion', qty: 5 }] },
  },
  q_crystal: {
    giver: 'herbalist', name: '閃耀的水晶', reqLv: 9, prev: 'q_slime',
    story: '「水晶洞窟的水晶碎片能煉出魔力藥劑，幫我採 6 個。」',
    objective: { type: 'collect', item: 'crystalShard', count: 6 },
    reward: { meso: 900, exp: 520, items: [{ id: 'wizardHat', qty: 1 }] },
  },
  q_golem: {
    giver: 'hunter', name: '石之試煉', reqLv: 12, prev: 'q_mushroom',
    story: '「石小弟硬得很，能打倒 6 隻，你就是真正的戰士了。」',
    objective: { type: 'kill', target: 'golem', count: 6 },
    reward: { meso: 1400, exp: 900, items: [{ id: 'ironShield', qty: 1 }] },
  },
  q_boss: {
    giver: 'elder', name: '蘑菇王的威脅', reqLv: 14, prev: 'q_golem',
    story: '「王者祭壇的蘑菇王正在壯大，唯有勇者能討伐牠。」',
    objective: { type: 'kill', target: 'boss', count: 1 },
    reward: { meso: 3000, exp: 2000, items: [{ id: 'mapleSword', qty: 1 }] },
  },
  q_ore: {
    giver: 'blacksmith', name: '熔岩的餽贈', reqLv: 22, prev: 'q_boss',
    story: '「打造龍鱗裝備得用火焰礦石，幫老夫弄 10 個來。」',
    objective: { type: 'collect', item: 'fireOre', count: 10 },
    reward: { meso: 2500, exp: 1600, items: [{ id: 'battleGloves', qty: 1 }] },
  },
  q_dragon: {
    giver: 'elder', name: '炎魔討伐', reqLv: 26, prev: 'q_ore',
    story: '「炎魔祭壇的炎魔將焚盡大地，這是楓之村最後的請求。」',
    objective: { type: 'kill', target: 'flameDrake', count: 1 },
    reward: { meso: 12000, exp: 15000, items: [{ id: 'dragonRing', qty: 1 }] },
  },
};

const QUEST_ORDER = ['q_snail', 'q_slime', 'q_mushroom', 'q_crystal', 'q_golem', 'q_boss', 'q_ore', 'q_dragon'];

// ── 製作配方（鐵匠）──
// mats: [{id,qty}]；cost: 楓幣；result: {id,qty}
const CraftDB = {
  c_orange:  { name: '橘藥水',   result: { id: 'orangePotion', qty: 3 }, cost: 60,   mats: [{ id: 'slimeGel', qty: 2 }, { id: 'mushSpore', qty: 2 }] },
  c_white:   { name: '白藥水',   result: { id: 'whitePotion', qty: 2 },  cost: 200,  mats: [{ id: 'crystalShard', qty: 2 }, { id: 'mushSpore', qty: 3 }] },
  c_mana:    { name: '魔力靈液', result: { id: 'manaElixir', qty: 2 },   cost: 200,  mats: [{ id: 'crystalShard', qty: 3 }] },
  c_iron:    { name: '鐵劍',     result: { id: 'ironSword', qty: 1 },    cost: 300,  mats: [{ id: 'snailShell', qty: 4 }, { id: 'goldOre', qty: 2 }] },
  c_boots:   { name: '疾風之靴', result: { id: 'windBoots', qty: 1 },    cost: 800,  mats: [{ id: 'iceShard', qty: 5 }, { id: 'hardLeather', qty: 3 }] },
  c_maple:   { name: '楓葉劍',   result: { id: 'mapleSword', qty: 1 },   cost: 1500, mats: [{ id: 'goldOre', qty: 5 }, { id: 'mapleLeafMat', qty: 3 }] },
  c_helm:    { name: '龍鱗頭盔', result: { id: 'dragonHelm', qty: 1 },   cost: 6000, mats: [{ id: 'dragonScale', qty: 8 }, { id: 'fireOre', qty: 6 }] },
  c_mail:    { name: '龍鱗鎧甲', result: { id: 'dragonMail', qty: 1 },   cost: 9000, mats: [{ id: 'dragonScale', qty: 12 }, { id: 'fireOre', qty: 8 }] },
};

const CRAFT_ORDER = ['c_orange', 'c_white', 'c_mana', 'c_iron', 'c_boots', 'c_maple', 'c_helm', 'c_mail'];
