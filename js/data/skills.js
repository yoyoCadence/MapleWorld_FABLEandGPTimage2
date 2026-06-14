// 技能資料庫。lv 為目前技能等級（1~maxLv）
const SkillDB = {
  powerStrike: {
    name: '強力斬', key: 'C', code: 'KeyC', reqLv: 1, maxLv: 10, type: 'melee', cd: 0.5,
    mpCost: (lv) => 4 + lv,
    mult: (lv) => 1.5 + 0.15 * lv,
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
};

const SKILL_ORDER = ['powerStrike', 'spinSlash', 'energyWave', 'heal'];
