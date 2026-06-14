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
};

// 向下相容：預設（劍士）技能順序。實際以 player.skillList()（依職業）為準。
const SKILL_ORDER = ['powerStrike', 'spinSlash', 'energyWave', 'heal'];
