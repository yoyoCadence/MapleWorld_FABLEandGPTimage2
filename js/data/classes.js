// 職業資料庫（5 大職業）
// statMods: 對「等級基礎屬性」的乘數（不影響裝備加成）
// basicType: 'melee' 近戰揮砍 / 'projectile' 遠程普攻
// basicProjectile: 遠程普攻的投射物外觀（style 對應 projectile.js 的繪製）
// weaponTypes: 可裝備的武器類型（對應 ItemDB 武器的 wtype）
// startWeapon: 起始武器 id
// skills: 對應 C / V / B / A 四鍵的 4 個技能 id（須存在於 SkillDB）
const JobDB = {
  warrior: {
    name: '劍士', short: '劍', color: '#e8542f',
    desc: '近身肉搏，高血量與防禦，揮劍劈砍群敵。',
    statMods: { hp: 1.25, mp: 0.75, atk: 1.0, def: 1.2 },
    basicType: 'melee',
    weaponTypes: ['sword', 'axe', 'mace'],
    startWeapon: 'woodSword',
    skills: ['powerStrike', 'spinSlash', 'energyWave', 'heal'],
  },
  magician: {
    name: '法師', short: '法', color: '#7a5cff',
    desc: '操控元素的遠程術士，超高 MP 與魔法爆發，但身板脆弱。',
    statMods: { hp: 0.8, mp: 1.8, atk: 1.18, def: 0.85 },
    basicType: 'projectile',
    basicProjectile: { style: 'magic', color: '#b48cff', speed: 520, pierce: 1 },
    weaponTypes: ['wand', 'staff'],
    startWeapon: 'beginnerWand',
    skills: ['fireball', 'iceSpike', 'thunderBolt', 'healAura'],
  },
  archer: {
    name: '弓箭手', short: '弓', color: '#3fae5a',
    desc: '精準遠程射手，穩定輸出與貫穿，擅長放風箏。',
    statMods: { hp: 0.95, mp: 1.05, atk: 1.12, def: 0.95 },
    basicType: 'projectile',
    basicProjectile: { style: 'arrow', color: '#d8b46a', speed: 720, pierce: 1 },
    weaponTypes: ['bow', 'crossbow'],
    startWeapon: 'beginnerBow',
    skills: ['powerShot', 'arrowRain', 'pierceArrow', 'eagleEye'],
  },
  thief: {
    name: '盜賊', short: '盜', color: '#9b59b6',
    desc: '敏捷刺客，飛鏢與連刺爆發，速度極快。',
    statMods: { hp: 0.92, mp: 1.0, atk: 1.14, def: 0.95 },
    basicType: 'melee',
    weaponTypes: ['dagger', 'claw'],
    startWeapon: 'beginnerDagger',
    skills: ['luckySeven', 'doubleStab', 'shadowFlurry', 'hasteBuff'],
  },
  pirate: {
    name: '海盜', short: '海', color: '#e67e22',
    desc: '近戰拳手兼遠程砲手，攻守均衡、戰意爆發。',
    statMods: { hp: 1.12, mp: 0.9, atk: 1.1, def: 1.05 },
    basicType: 'melee',
    weaponTypes: ['knuckle', 'gun'],
    startWeapon: 'beginnerKnuckle',
    skills: ['knucklePunch', 'whirlKick', 'cannonBlast', 'battleRage'],
  },
};

const JOB_ORDER = ['warrior', 'magician', 'archer', 'thief', 'pirate'];
