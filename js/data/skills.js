// 技能資料庫。lv 為目前技能等級（1~maxLv）
// type: melee 近戰 / aoe 範圍 / projectile 投射 / heal 治療 / buff 增益
// 各職業各取 4 招對應 C/V/B/A（見 classes.js 的 skills）
const SkillDB = {
  // ══════════════ 劍士（warrior）══════════════
  powerStrike: {
    name: '強力斬', key: 'C', code: 'KeyC', reqLv: 1, maxLv: 10, type: 'melee', cd: 0.5,
    mpCost: (lv) => 4 + lv,
    mult: (lv) => 1.5 + 0.15 * lv, big: true, targets: 1,
    desc: (lv) => `對單一敵人造成 ${Math.round((1.5 + 0.15 * lv) * 100)}% 傷害`,
  },
  spinSlash: {
    name: '迴旋斬', key: 'V', code: 'KeyV', reqLv: 5, maxLv: 10, type: 'aoe', cd: 1.0, radius: 125,
    mpCost: (lv) => 10 + 2 * lv,
    mult: (lv) => 1.1 + 0.1 * lv,
    desc: (lv) => `對周圍所有敵人造成 ${Math.round((1.1 + 0.1 * lv) * 100)}% 傷害`,
  },
  energyWave: {
    name: '能量波', key: 'B', code: 'KeyB', reqLv: 8, maxLv: 10, type: 'projectile', cd: 0.8,
    style: 'energy', color: '#6ec8ff', speed: 540, life: 1.0,
    mpCost: (lv) => 8 + 2 * lv,
    mult: (lv) => 1.3 + 0.12 * lv,
    pierce: (lv) => (lv >= 6 ? 3 : 1),
    desc: (lv) => `發射能量波，造成 ${Math.round((1.3 + 0.12 * lv) * 100)}% 傷害` + (lv >= 6 ? '（貫穿 3 隻）' : ''),
  },
  heal: {
    name: '治癒術', key: 'A', code: 'KeyA', reqLv: 10, maxLv: 10, type: 'heal', cd: 4.0,
    mpCost: () => 20,
    healPct: (lv) => 0.15 + 0.03 * lv,
    desc: (lv) => `恢復最大 HP 的 ${Math.round((0.15 + 0.03 * lv) * 100)}%`,
  },

  // ══════════════ 法師（magician）══════════════
  fireball: {
    name: '火球術', key: 'C', code: 'KeyC', reqLv: 1, maxLv: 20, type: 'projectile', cd: 0.5,
    style: 'fire', color: '#ff7a3a', speed: 480, life: 1.1,
    mpCost: (lv) => 6 + lv,
    mult: (lv) => 1.4 + 0.14 * lv, pierce: 1,
    desc: (lv) => `射出火球造成 ${Math.round((1.4 + 0.14 * lv) * 100)}% 魔法傷害`,
  },
  iceSpike: {
    name: '寒冰刺', key: 'V', code: 'KeyV', reqLv: 5, maxLv: 20, type: 'projectile', cd: 0.9,
    style: 'ice', color: '#7ad8ff', speed: 440, life: 1.2,
    mpCost: (lv) => 10 + 2 * lv,
    mult: (lv) => 1.2 + 0.12 * lv, pierce: (lv) => (lv >= 10 ? 3 : 2),
    desc: (lv) => `射出冰刺造成 ${Math.round((1.2 + 0.12 * lv) * 100)}% 傷害，貫穿 ${(lv >= 10 ? 3 : 2)} 隻`,
  },
  thunderBolt: {
    name: '雷電術', key: 'B', code: 'KeyB', reqLv: 8, maxLv: 20, type: 'aoe', cd: 1.1, radius: 150,
    color: '#ffe24a',
    mpCost: (lv) => 14 + 2 * lv,
    mult: (lv) => 1.5 + 0.13 * lv,
    desc: (lv) => `召喚落雷對周圍造成 ${Math.round((1.5 + 0.13 * lv) * 100)}% 傷害`,
  },
  healAura: {
    name: '治癒之光', key: 'A', code: 'KeyA', reqLv: 10, maxLv: 20, type: 'heal', cd: 4.0,
    mpCost: () => 22,
    healPct: (lv) => 0.18 + 0.025 * lv,
    desc: (lv) => `恢復最大 HP 的 ${Math.round((0.18 + 0.025 * lv) * 100)}%`,
  },

  // ══════════════ 弓箭手（archer）══════════════
  powerShot: {
    name: '強力射擊', key: 'C', code: 'KeyC', reqLv: 1, maxLv: 20, type: 'projectile', cd: 0.45,
    style: 'arrow', color: '#ffd27a', speed: 760, life: 1.0,
    mpCost: (lv) => 5 + lv,
    mult: (lv) => 1.6 + 0.16 * lv, pierce: 1,
    desc: (lv) => `強力一箭造成 ${Math.round((1.6 + 0.16 * lv) * 100)}% 傷害`,
  },
  arrowRain: {
    name: '箭雨', key: 'V', code: 'KeyV', reqLv: 5, maxLv: 20, type: 'aoe', cd: 1.1, radius: 160,
    color: '#cde87a',
    mpCost: (lv) => 12 + 2 * lv,
    mult: (lv) => 1.2 + 0.1 * lv,
    desc: (lv) => `降下箭雨對周圍造成 ${Math.round((1.2 + 0.1 * lv) * 100)}% 傷害`,
  },
  pierceArrow: {
    name: '貫穿箭', key: 'B', code: 'KeyB', reqLv: 8, maxLv: 20, type: 'projectile', cd: 0.9,
    style: 'arrow', color: '#aef0ff', speed: 820, life: 1.2,
    mpCost: (lv) => 12 + 2 * lv,
    mult: (lv) => 1.5 + 0.14 * lv, pierce: (lv) => (lv >= 6 ? 5 : 3),
    desc: (lv) => `穿透箭造成 ${Math.round((1.5 + 0.14 * lv) * 100)}% 傷害，貫穿 ${(lv >= 6 ? 5 : 3)} 隻`,
  },
  eagleEye: {
    name: '鷹眼', key: 'A', code: 'KeyA', reqLv: 10, maxLv: 20, type: 'buff', cd: 20,
    mpCost: () => 22,
    buff: (lv) => ({ atk: 0.15 + 0.02 * lv, dur: 18 + lv }),
    desc: (lv) => `${18 + lv}s 內攻擊力 +${Math.round((0.15 + 0.02 * lv) * 100)}%`,
  },

  // ══════════════ 盜賊（thief）══════════════
  luckySeven: {
    name: '幸運七', key: 'C', code: 'KeyC', reqLv: 1, maxLv: 20, type: 'projectile', cd: 0.5,
    style: 'star', color: '#fff07a', speed: 640, life: 0.9, count: 2, spread: 14,
    mpCost: (lv) => 5 + lv,
    mult: (lv) => 1.0 + 0.1 * lv, pierce: 1,
    desc: (lv) => `擲出兩枚飛鏢，每枚 ${Math.round((1.0 + 0.1 * lv) * 100)}% 傷害`,
  },
  doubleStab: {
    name: '雙刺', key: 'V', code: 'KeyV', reqLv: 5, maxLv: 20, type: 'melee', cd: 0.5,
    targets: 2, big: false,
    mpCost: (lv) => 8 + lv,
    mult: (lv) => 1.2 + 0.12 * lv,
    desc: (lv) => `連刺最多 2 名敵人，各 ${Math.round((1.2 + 0.12 * lv) * 100)}% 傷害`,
  },
  shadowFlurry: {
    name: '暗影亂舞', key: 'B', code: 'KeyB', reqLv: 8, maxLv: 20, type: 'aoe', cd: 1.0, radius: 130,
    color: '#b06ad8',
    mpCost: (lv) => 12 + 2 * lv,
    mult: (lv) => 1.3 + 0.12 * lv,
    desc: (lv) => `暗影旋風對周圍造成 ${Math.round((1.3 + 0.12 * lv) * 100)}% 傷害`,
  },
  hasteBuff: {
    name: '疾風步', key: 'A', code: 'KeyA', reqLv: 10, maxLv: 20, type: 'buff', cd: 18,
    mpCost: () => 20,
    buff: (lv) => ({ speed: 0.18 + 0.02 * lv, atk: 0.05 + 0.01 * lv, dur: 18 + lv }),
    desc: (lv) => `${18 + lv}s 內移速 +${Math.round((0.18 + 0.02 * lv) * 100)}%、攻擊 +${Math.round((0.05 + 0.01 * lv) * 100)}%`,
  },

  // ══════════════ 海盜（pirate）══════════════
  knucklePunch: {
    name: '爆裂拳', key: 'C', code: 'KeyC', reqLv: 1, maxLv: 20, type: 'melee', cd: 0.5,
    big: true, targets: 1,
    mpCost: (lv) => 4 + lv,
    mult: (lv) => 1.5 + 0.15 * lv,
    desc: (lv) => `重拳造成 ${Math.round((1.5 + 0.15 * lv) * 100)}% 傷害`,
  },
  whirlKick: {
    name: '迴旋踢', key: 'V', code: 'KeyV', reqLv: 5, maxLv: 20, type: 'aoe', cd: 1.0, radius: 120,
    color: '#ffae4a',
    mpCost: (lv) => 10 + 2 * lv,
    mult: (lv) => 1.1 + 0.1 * lv,
    desc: (lv) => `旋身掃踢對周圍造成 ${Math.round((1.1 + 0.1 * lv) * 100)}% 傷害`,
  },
  cannonBlast: {
    name: '加農砲', key: 'B', code: 'KeyB', reqLv: 8, maxLv: 20, type: 'projectile', cd: 0.8,
    style: 'bullet', color: '#ffd24a', speed: 560, life: 1.1,
    mpCost: (lv) => 10 + 2 * lv,
    mult: (lv) => 1.4 + 0.13 * lv, pierce: (lv) => (lv >= 6 ? 3 : 1),
    desc: (lv) => `轟出砲彈造成 ${Math.round((1.4 + 0.13 * lv) * 100)}% 傷害` + (lv >= 6 ? '（貫穿 3 隻）' : ''),
  },
  battleRage: {
    name: '戰意爆發', key: 'A', code: 'KeyA', reqLv: 10, maxLv: 20, type: 'buff', cd: 22,
    mpCost: () => 22,
    buff: (lv) => ({ atk: 0.12 + 0.015 * lv, def: 0.1 + 0.01 * lv, dur: 16 + lv }),
    desc: (lv) => `${16 + lv}s 內攻擊 +${Math.round((0.12 + 0.015 * lv) * 100)}%、防禦 +${Math.round((0.1 + 0.01 * lv) * 100)}%`,
  },

  // ══════════════ 二轉技能（rank2，Lv30 轉職後可學）══════════════
  // 劍士
  rage: {
    name: '狂戰怒吼', key: '?', rank: 2, reqLv: 30, maxLv: 20, type: 'buff', cd: 28,
    mpCost: () => 30,
    buff: (lv) => ({ atk: 0.15 + 0.012 * lv, def: 0.12 + 0.01 * lv, dur: 20 + lv }),
    desc: (lv) => `${20 + lv}s 內攻擊 +${Math.round((0.15 + 0.012 * lv) * 100)}%、防禦 +${Math.round((0.12 + 0.01 * lv) * 100)}%`,
  },
  groundSmash: {
    name: '大地裂斬', key: '?', rank: 2, reqLv: 35, maxLv: 20, type: 'aoe', cd: 1.4, radius: 165, color: '#e8a04a',
    mpCost: (lv) => 16 + 2 * lv,
    mult: (lv) => 1.6 + 0.12 * lv,
    desc: (lv) => `劈裂大地對周圍造成 ${Math.round((1.6 + 0.12 * lv) * 100)}% 傷害`,
  },
  // 法師
  frostNova: {
    name: '冰霜新星', key: '?', rank: 2, reqLv: 30, maxLv: 20, type: 'aoe', cd: 1.3, radius: 155, color: '#7ad8ff',
    mpCost: (lv) => 16 + 2 * lv,
    mult: (lv) => 1.5 + 0.12 * lv,
    desc: (lv) => `爆發寒霜對周圍造成 ${Math.round((1.5 + 0.12 * lv) * 100)}% 傷害`,
  },
  magicGuard: {
    name: '魔法護盾', key: '?', rank: 2, reqLv: 35, maxLv: 20, type: 'buff', cd: 26,
    mpCost: () => 28,
    buff: (lv) => ({ def: 0.2 + 0.015 * lv, dur: 22 + lv }),
    desc: (lv) => `${22 + lv}s 內防禦 +${Math.round((0.2 + 0.015 * lv) * 100)}%`,
  },
  // 弓箭手
  tripleShot: {
    name: '三連箭', key: '?', rank: 2, reqLv: 30, maxLv: 20, type: 'projectile', cd: 0.7,
    style: 'arrow', color: '#ffd27a', speed: 760, life: 1.0, count: 3, spread: 16,
    mpCost: (lv) => 12 + 2 * lv,
    mult: (lv) => 1.2 + 0.1 * lv, pierce: 1,
    desc: (lv) => `一次射出三箭，每箭 ${Math.round((1.2 + 0.1 * lv) * 100)}% 傷害`,
  },
  evasion: {
    name: '閃避步', key: '?', rank: 2, reqLv: 35, maxLv: 20, type: 'buff', cd: 22,
    mpCost: () => 24,
    buff: (lv) => ({ speed: 0.2 + 0.02 * lv, atk: 0.08 + 0.01 * lv, dur: 18 + lv }),
    desc: (lv) => `${18 + lv}s 內移速 +${Math.round((0.2 + 0.02 * lv) * 100)}%、攻擊 +${Math.round((0.08 + 0.01 * lv) * 100)}%`,
  },
  // 盜賊
  tripleThrow: {
    name: '三飛鏢', key: '?', rank: 2, reqLv: 30, maxLv: 20, type: 'projectile', cd: 0.7,
    style: 'star', color: '#fff07a', speed: 660, life: 0.9, count: 3, spread: 16,
    mpCost: (lv) => 12 + 2 * lv,
    mult: (lv) => 1.1 + 0.1 * lv, pierce: 1,
    desc: (lv) => `擲出三枚飛鏢，每枚 ${Math.round((1.1 + 0.1 * lv) * 100)}% 傷害`,
  },
  smokeBomb: {
    name: '煙幕彈', key: '?', rank: 2, reqLv: 35, maxLv: 20, type: 'buff', cd: 24,
    mpCost: () => 26,
    buff: (lv) => ({ speed: 0.16 + 0.015 * lv, def: 0.14 + 0.012 * lv, dur: 18 + lv }),
    desc: (lv) => `${18 + lv}s 內移速 +${Math.round((0.16 + 0.015 * lv) * 100)}%、防禦 +${Math.round((0.14 + 0.012 * lv) * 100)}%`,
  },
  // 海盜
  dragonStrike: {
    name: '火龍拳', key: '?', rank: 2, reqLv: 30, maxLv: 20, type: 'melee', cd: 0.7,
    targets: 2, big: true,
    mpCost: (lv) => 12 + 2 * lv,
    mult: (lv) => 1.5 + 0.13 * lv,
    desc: (lv) => `灌注龍力的重擊，最多 2 名敵人各 ${Math.round((1.5 + 0.13 * lv) * 100)}% 傷害`,
  },
  cannonBarrage: {
    name: '連環砲', key: '?', rank: 2, reqLv: 35, maxLv: 20, type: 'projectile', cd: 0.8,
    style: 'bullet', color: '#ffd24a', speed: 560, life: 1.1, count: 3, spread: 12,
    mpCost: (lv) => 14 + 2 * lv,
    mult: (lv) => 1.2 + 0.1 * lv, pierce: (lv) => (lv >= 8 ? 3 : 1),
    desc: (lv) => `連續轟出三發砲彈，每發 ${Math.round((1.2 + 0.1 * lv) * 100)}% 傷害`,
  },

  // ══════════════ 三轉技能（rank3，Lv70 轉職後可學）══════════════
  // 劍士
  crusherCombo: {
    name: '狂暴連斬', key: '?', rank: 3, reqLv: 70, maxLv: 30, type: 'melee', cd: 1.0,
    targets: 3, big: true,
    mpCost: (lv) => 24 + 2 * lv,
    mult: (lv) => 2.0 + 0.18 * lv,
    desc: (lv) => `連環斬擊最多 3 名敵人，各 ${Math.round((2.0 + 0.18 * lv) * 100)}% 傷害`,
  },
  heroWill: {
    name: '英雄之力', key: '?', rank: 3, reqLv: 80, maxLv: 30, type: 'buff', cd: 60,
    mpCost: () => 50,
    buff: (lv) => ({ atk: 0.3 + 0.02 * lv, def: 0.2 + 0.015 * lv, dur: 24 + lv }),
    desc: (lv) => `${24 + lv}s 內攻擊 +${Math.round((0.3 + 0.02 * lv) * 100)}%、防禦 +${Math.round((0.2 + 0.015 * lv) * 100)}%`,
  },
  // 法師
  meteor: {
    name: '隕石術', key: '?', rank: 3, reqLv: 70, maxLv: 30, type: 'aoe', cd: 2.6, radius: 205, color: '#ff7a3a',
    mpCost: (lv) => 30 + 3 * lv,
    mult: (lv) => 2.2 + 0.2 * lv,
    desc: (lv) => `召喚隕石對大範圍造成 ${Math.round((2.2 + 0.2 * lv) * 100)}% 傷害`,
  },
  arcaneBlast: {
    name: '奧術爆發', key: '?', rank: 3, reqLv: 80, maxLv: 30, type: 'projectile', cd: 0.9,
    style: 'arcane', color: '#b06ad8', speed: 560, life: 1.2,
    mpCost: (lv) => 26 + 2 * lv,
    mult: (lv) => 2.0 + 0.18 * lv, pierce: 4,
    desc: (lv) => `奧術光束造成 ${Math.round((2.0 + 0.18 * lv) * 100)}% 傷害，貫穿 4 隻`,
  },
  // 弓箭手
  meteorArrow: {
    name: '流星箭雨', key: '?', rank: 3, reqLv: 70, maxLv: 30, type: 'aoe', cd: 2.2, radius: 195, color: '#ffae4a',
    mpCost: (lv) => 28 + 3 * lv,
    mult: (lv) => 1.8 + 0.16 * lv,
    desc: (lv) => `降下流星箭雨對大範圍造成 ${Math.round((1.8 + 0.16 * lv) * 100)}% 傷害`,
  },
  phoenixStrike: {
    name: '鳳凰箭', key: '?', rank: 3, reqLv: 80, maxLv: 30, type: 'projectile', cd: 0.9,
    style: 'fire', color: '#ff7a3a', speed: 820, life: 1.3,
    mpCost: (lv) => 26 + 2 * lv,
    mult: (lv) => 2.2 + 0.2 * lv, pierce: 5,
    desc: (lv) => `鳳凰之箭造成 ${Math.round((2.2 + 0.2 * lv) * 100)}% 傷害，貫穿 5 隻`,
  },
  // 盜賊
  assassinate: {
    name: '暗殺', key: '?', rank: 3, reqLv: 70, maxLv: 30, type: 'melee', cd: 1.1,
    targets: 1, big: true,
    mpCost: (lv) => 24 + 2 * lv,
    mult: (lv) => 2.6 + 0.24 * lv,
    desc: (lv) => `致命一擊，對單一敵人造成 ${Math.round((2.6 + 0.24 * lv) * 100)}% 傷害`,
  },
  shadowStorm: {
    name: '暗影風暴', key: '?', rank: 3, reqLv: 80, maxLv: 30, type: 'aoe', cd: 1.8, radius: 175, color: '#b06ad8',
    mpCost: (lv) => 26 + 3 * lv,
    mult: (lv) => 2.0 + 0.18 * lv,
    desc: (lv) => `暗影風暴席捲全場造成 ${Math.round((2.0 + 0.18 * lv) * 100)}% 傷害`,
  },
  // 海盜
  octopus: {
    name: '章魚砲台', key: '?', rank: 3, reqLv: 70, maxLv: 30, type: 'aoe', cd: 1.8, radius: 165, color: '#ffd24a',
    mpCost: (lv) => 26 + 3 * lv,
    mult: (lv) => 1.8 + 0.16 * lv,
    desc: (lv) => `召喚砲台齊射對周圍造成 ${Math.round((1.8 + 0.16 * lv) * 100)}% 傷害`,
  },
  fistFury: {
    name: '爆裂連拳', key: '?', rank: 3, reqLv: 80, maxLv: 30, type: 'melee', cd: 1.0,
    targets: 1, big: true,
    mpCost: (lv) => 24 + 2 * lv,
    mult: (lv) => 2.5 + 0.2 * lv,
    desc: (lv) => `爆裂連拳對單一敵人造成 ${Math.round((2.5 + 0.2 * lv) * 100)}% 傷害`,
  },
};

// 向下相容：預設（劍士）技能順序。實際以 player.skillList()（依職業）為準。
const SKILL_ORDER = ['powerStrike', 'spinSlash', 'energyWave', 'heal'];
