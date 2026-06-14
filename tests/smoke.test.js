// 煙霧測試：用 Node 模擬瀏覽器環境，實際執行遊戲邏輯
// 執行：node tests/smoke.test.js
'use strict';
const fs = require('fs');
const path = require('path');

// ── 瀏覽器 API 替身 ──
const ctxStub = new Proxy({}, {
  get(target, prop) {
    if (prop === 'measureText') return () => ({ width: 40 });
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
      return () => ({ addColorStop: () => {} });
    }
    if (prop in target) return target[prop];
    return () => {};
  },
  set(target, prop, v) { target[prop] = v; return true; },
});

const canvasStub = {
  width: 1024, height: 600, style: {},
  getContext: () => ctxStub,
  addEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1024, height: 600 }),
};

const storage = {};
const stubs = `
const window = globalThis;
window.addEventListener = () => {};
window.innerWidth = 1280;
window.innerHeight = 800;
const document = {
  getElementById: () => __canvasStub,
  createElement: () => ({
    width: 0, height: 0,
    getContext: () => __canvasStub.getContext('2d'),
  }),
};
const localStorage = {
  getItem: (k) => (k in __storage ? __storage[k] : null),
  setItem: (k, v) => { __storage[k] = String(v); },
  removeItem: (k) => { delete __storage[k]; },
};
const __loadedImages = [];
class Image {
  constructor() {
    this.complete = true;
    this.naturalWidth = 320;
    this.naturalHeight = 240;
  }
  set src(value) {
    this._src = value;
    __loadedImages.push(value);
  }
  get src() { return this._src; }
}
const location = { reload: () => {} };
let __rafCb = null;
const requestAnimationFrame = (cb) => { __rafCb = cb; };
`;

// 依 index.html 的載入順序
const order = [
  'js/config.js', 'js/utils.js', 'js/input.js', 'js/sound.js',
  'js/data/items.js', 'js/data/skills.js', 'js/data/classes.js', 'js/data/monsters.js', 'js/data/maps.js', 'js/data/quests.js',
  'js/effects.js', 'js/sprites.js', 'js/camera.js',
  'js/entities/drops.js', 'js/entities/projectile.js', 'js/entities/monster.js', 'js/entities/pet.js', 'js/entities/player.js',
  'js/render.js', 'js/ui.js', 'js/game.js', 'js/main.js',
];
const root = path.join(__dirname, '..');
const gameCode = order.map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');

// ── 測試劇本（與遊戲程式同作用域）──
const testCode = `
let __pass = 0, __fail = 0;
function check(name, cond) {
  if (cond) { __pass++; }
  else { __fail++; console.error('  ✗ ' + name); }
}
function frames(n, keys) {
  for (let i = 0; i < n; i++) {
    if (keys) { for (const k of keys) Input.down[k] = true; }
    Game.update(1 / 60);
    Game.draw(ctxStub_);
    Input.endFrame();
    if (keys) { for (const k of keys) Input.down[k] = false; }
  }
}
function press(code) { Input.pressed[code] = true; Input.down[code] = true; }
const ctxStub_ = __canvasStub.getContext('2d');

// 1. 初始狀態
check('開場為標題畫面', Game.state === 'title');
check('地圖已載入', Game.map && Game.map.name === '楓葉草原');
check('怪物已生成', Game.monsters.length === 12);
frames(30);
check('背景 PNG 素材載入', __loadedImages.includes('assets/backgrounds/meadow-bg.png'));
check('怪物 PNG 素材載入', __loadedImages.includes('assets/sprites/mob_blue_snail.png'));
check('主角 PNG 素材載入', __loadedImages.includes('assets/sprites/player/hero-adventurer.png'));
Sprites.drawItemIcon(ctxStub_, 'woodSword', 0, 0, 32);
check('道具圖示 PNG 載入', __loadedImages.includes('assets/ui/items/woodSword.png'));
Sprites.drawItemIcon(ctxStub_, 'redPotion', 0, 0, 32);
check('新版藥水 icon 載入', __loadedImages.includes('assets/ui/items/redPotion.png'));
const oldClimb = Game.player.climbing;
Game.player.climbing = { x: Game.player.x };
Sprites.drawPlayer(ctxStub_, Game.player, 0.5);
Game.player.climbing = oldClimb;
check('攀爬角色 sheet 載入', __loadedImages.includes('assets/sprites/player/hero-warrior-climb-sheet.png'));
Sprites.drawPet(ctxStub_, Game.pet, 0.5);
check('寵物 PNG 載入', __loadedImages.includes('assets/sprites/pet/pet-default.png'));
Sprites.drawNpc(ctxStub_, Game.map.npcs[0], 0.5);
check('商人 NPC PNG 載入', __loadedImages.includes('assets/sprites/npc/npc-merchant.png'));
Effects.slash(Game.player.x, Game.player.y - 28, 1, 1);
Effects.drawWorld(ctxStub_);
check('斬擊 PNG 素材載入', __loadedImages.includes('assets/sprites/fx/slash/sheet-transparent.png'));

// 2. 開始遊戲（新遊戲 → 選職畫面 → 確認預設職業劍士）
Sprites.drawMonster(ctxStub_, Game.monsters[0], 0.5);
check('怪物 idle sheet 載入', __loadedImages.includes('assets/sprites/monsters/anim/mob_snail_idle.png'));
Sprites._drawWeaponAsset(ctxStub_, { equips: { weapon: 'woodSword' } }, 0.5, 0.5, 80, 84);
check('武器 swing sheet 載入', __loadedImages.includes('assets/sprites/weapons/anim/weapon_wood_sword_swing.png'));
Effects.spark(Game.player.x, Game.player.y - 28, '#ffe082');
Effects.drawWorld(ctxStub_);
check('命中特效 sheet 載入', __loadedImages.includes('assets/sprites/fx/impact/physical/sheet-transparent.png'));
Effects.explosion(Game.player.x, Game.player.y - 28, 'fire', 1);
Effects.drawWorld(ctxStub_);
check('技能爆炸 sheet 載入', __loadedImages.includes('assets/sprites/fx/explosion/fire/sheet-transparent.png'));
press('Enter');
frames(1);
check('進入選職畫面', Game.state === 'classSelect');
press('Enter');
frames(1);
check('選職後進入遊戲', Game.state === 'play');
check('預設職業為劍士', Game.player.job === 'warrior');
check('劍士技能列表正確', Game.player.skillList().join(',') === 'powerStrike,spinSlash,energyWave,heal');

// 3. 移動與跳躍（暫時無敵，避免漫遊小怪碰撞干擾跳躍判定）
Game.player.invinc = 100;
frames(20); // 先落地
check('玩家站在地面', Game.player.onGround);
const x0 = Game.player.x;
frames(30, ['ArrowRight']);
check('向右移動', Game.player.x > x0 + 50);
press('Space');
frames(2);
check('跳躍離地', !Game.player.onGround && Game.player.vy < 0);
frames(60);
check('跳躍後落地', Game.player.onGround);

// 4. 戰鬥：打死一隻怪
const mob = Game.monsters[0];
const xpBefore = Game.player.exp + Game.player.level * 100000;
let guard = 0;
while (!mob.dying && guard++ < 50) Game.playerStrike(mob, 1.0);
check('怪物被擊殺', mob.dying);
frames(30);
check('怪物屍體已移除', !Game.monsters.includes(mob));
check('獲得經驗值', Game.player.exp + Game.player.level * 100000 > xpBefore);

// 5. 撿掉落物（強制生一個在腳邊）
Game.drops.push(new Drop(Game.player.x, Game.player.y - 10, Game.player.y, { meso: 100 }));
frames(5);
const mesoBefore = Game.player.meso;
press('KeyZ');
frames(1);
check('撿到楓幣', Game.player.meso === mesoBefore + 100);
Input.down['KeyZ'] = false; // 模擬放開按鍵（按住 Z 連撿會持續觸發）

// 6. 升級與技能加點
Game.player.gainExp(expNeed(1) + expNeed(2) + expNeed(3) + expNeed(4) + 10);
check('升級成功', Game.player.level >= 5);
check('獲得 SP', Game.player.sp > 0);
const spBefore = Game.player.sp;
Game.player.skillUp('spinSlash');
check('技能加點成功', Game.player.skills.spinSlash === 1 && Game.player.sp === spBefore - 1);

// 7. 施放技能
Game.player.mp = Game.player.maxMp;
Game.player.gcd = 0; Game.player.attackAnim = 0;
const mpBefore = Game.player.mp;
Game.player.castSkill('spinSlash', Game);
check('迴旋斬消耗 MP', Game.player.mp < mpBefore);
frames(30);

// 8. 視窗 UI
press('KeyI');
frames(1);
check('背包視窗開啟', UI.show.inv);
Input.mouseX = 682; Input.mouseY = 110; Input.clicked = true;
frames(1);
check('點擊背包格不報錯', true);
press('Escape');
frames(1);
check('Esc 關閉視窗', !UI.show.inv);

// 9. 地圖傳送
Game.transfer('forest', 'toMeadow');
check('傳送到蘑菇森林', Game.mapId === 'forest' && Game.map.name === '蘑菇森林');
frames(60);

// 10. Boss 戰
Game.transfer('altar', 'toCave');
const boss = Game.monsters.find((m) => m.def.boss);
check('蘑菇王出現', !!boss);
Game.player.x = 400;
frames(600); // 跑 10 秒讓 Boss 出招（衝撞/跳壓/召喚）
check('Boss 有行動（已離開初始狀態或放過招）', boss.bState !== undefined);
guard = 0;
while (!boss.dying && guard++ < 3000) Game.playerStrike(boss, 5);
check('蘑菇王被擊敗', boss.dying);
frames(40);
check('Boss 掉落寶物', Game.drops.length > 0);

// 11. 死亡與復活
Game.player.invinc = 0;
Game.player.takeDamage(999999, Game.player.x + 10, Game);
check('玩家死亡進入 dead 狀態', Game.state === 'dead' && Game.player.dead);
frames(10);
press('KeyR');
frames(1);
check('按 R 復活', Game.state === 'play' && !Game.player.dead && Game.player.hp > 0);

// 12. 存檔 / 讀檔
Game.save();
const saved = Game.loadSave();
check('存檔成功', !!saved && saved.player.level === Game.player.level);
check('存檔含地圖資訊', saved.mapId === 'altar');

// 13. 長時間穩定性（先清場避免被殘留小怪擊殺）
Game.monsters.length = 0;
Game.player.hp = Game.player.maxHp;
frames(300, ['ArrowLeft']);
frames(300, ['ArrowRight']);
check('長時間執行穩定', Game.state === 'play');

// 14. 擴充內容健全性（資料一致性 + 全地圖/圖示繪製）
check('地圖數量 >= 20', Object.keys(MapDB).length >= 20);
let portalsOk = true;
for (const id in MapDB) for (const po of MapDB[id].portals) if (!MapDB[po.target]) portalsOk = false;
check('傳送門目標皆存在', portalsOk);
let spawnOk = true;
for (const id in MapDB) for (const sp of MapDB[id].spawners) if (!MonsterDB[sp.type]) spawnOk = false;
check('刷怪類型皆存在於 MonsterDB', spawnOk);
let dropOk = true;
for (const k in MonsterDB) for (const dr of (MonsterDB[k].drops || [])) if (dr.item && !ItemDB[dr.item]) dropOk = false;
check('怪物掉落物 id 皆存在', dropOk);
let jobOk = true;
for (const j in JobDB) {
  const jd = JobDB[j];
  if (!ItemDB[jd.startWeapon]) jobOk = false;
  for (const sid of jd.skills) if (!SkillDB[sid]) jobOk = false;
}
check('職業起始武器與技能皆存在', jobOk);
let classOk = true;
for (const j of JOB_ORDER) {
  const pl = new Player(null, j);
  if (pl.skillList().length !== 4) classOk = false;
  if (!(pl.maxHp > 0 && pl.maxMp > 0 && pl.atk > 0 && pl.def > 0)) classOk = false;
}
check('五職業皆可建立且屬性正常', classOk);
check('技能總數 >= 20', Object.keys(SkillDB).length >= 20);
check('裝備欄位 = 12', EQUIP_SLOTS.length === 12);

// 遠程職業普攻產生投射物
const __mage = new Player(null, 'magician');
const __g1 = { projectiles: [], time: 0 };
__mage.x = 200; __mage.y = 560; __mage.gcd = 0; __mage.attackAnim = 0;
__mage.tryBasic(__g1);
check('法師普攻發射投射物', __g1.projectiles.length === 1);

// buff 技能提升屬性
const __arch = new Player(null, 'archer');
__arch.level = 20; __arch.skills.eagleEye = 1; __arch.mp = __arch.maxMp;
__arch.gcd = 0; __arch.attackAnim = 0;
const __atk0 = __arch.atk;
__arch.castSkill('eagleEye', { projectiles: [], time: 0 });
check('鷹眼 buff 提升攻擊力', __arch.atk > __atk0);

// 全地圖載入 + 繪製不報錯（程序化主題/地形/怪物 fallback）
let loadDrawOk = true;
try {
  for (const id in MapDB) { Game.loadMap(id, null, null); Game.draw(ctxStub_); }
} catch (e) { loadDrawOk = false; console.error('  地圖繪製錯誤：', e); }
check('所有地圖載入並繪製不報錯', loadDrawOk);

// 全道具圖示繪製不報錯
let iconOk = true;
try { for (const id in ItemDB) Sprites.drawItemIcon(ctxStub_, id, 0, 0, 32); } catch (e) { iconOk = false; console.error(e); }
check('所有道具圖示繪製不報錯', iconOk);

// 選職畫面繪製不報錯
let csOk = true;
try { Game.state = 'classSelect'; Game.selJob = 3; Game.draw(ctxStub_); } catch (e) { csOk = false; console.error(e); }
check('選職畫面繪製不報錯', csOk);

// UI 皮膚與道具圖示素材已接線載入
check('UI 面板素材載入', __loadedImages.includes('assets/ui/ui_panel.png'));
check('UI 格子素材載入', __loadedImages.includes('assets/ui/ui_slot.png'));
check('UI 標題列素材載入', __loadedImages.includes('assets/ui/ui_titlebar.png'));
check('楓幣圖示素材載入', __loadedImages.includes('assets/ui/icon_meso.png'));

// 15. 新功能：按住 Z 連撿 / 寵物 / 背包擴充 / 商店
Game.state = 'play';
Game.loadMap('meadow', null, null);
const pp = Game.player;
pp.x = 400; pp.y = 560; pp.invinc = 100;
for (let i = 0; i < 3; i++) Game.drops.push(new Drop(pp.x + (i - 1) * 8, pp.y - 8, pp.y, { meso: 50 }));
const mb = pp.meso;
Input.down['KeyZ'] = true;
frames(30);
Input.down['KeyZ'] = false;
check('按住 Z 連續撿取多個掉落物', pp.meso >= mb + 100);

check('一開始就有寵物', !!Game.pet);
Game.monsters.length = 0;
const tmob = Game.spawnMonster('snail', pp.x + 40, Game.map.platforms[0], null);
Game.pet.x = pp.x; Game.pet.y = pp.y; Game.pet.atkCd = 0;
const tmhp = tmob.hp;
Game.pet.update(1 / 60, Game);
check('寵物自動攻擊造成傷害', tmob.hp < tmhp);

const sz0 = pp.invSize;
const added = pp.expandInv(CONFIG.INV_EXPAND_STEP);
check('背包可擴充格數', added > 0 && pp.invSize === sz0 + added);
pp.invSize = CONFIG.INV_MAX;
check('背包擴充不超過上限', pp.expandInv(CONFIG.INV_EXPAND_STEP) === 0);

UI.openShop();
check('商店可開啟', UI.show.shop === true);
let shopOk = true;
try { Game.draw(ctxStub_); } catch (e) { shopOk = false; console.error(e); }
check('商店繪製不報錯', shopOk);

// 賣出可選擇數量
pp.inventory[0] = { id: 'redPotion', qty: 20 };
UI.show.shop = true; UI.shopTab = 'sell'; UI.sellSel = { slot: 0, qty: 5 };
UI.layout();
let sellDrawOk = true;
try { Game.draw(ctxStub_); } catch (e) { sellDrawOk = false; console.error(e); }
check('賣出數量彈窗繪製不報錯', sellDrawOk);
const meso0 = pp.meso;
Input.mouseX = UI.R.sellConfirm.x + 2; Input.mouseY = UI.R.sellConfirm.y + 2; Input.clicked = true;
UI.update(Game, 1 / 60);
check('賣出指定數量(5)後剩 15', pp.inventory[0] && pp.inventory[0].qty === 15);
check('賣出獲得對應楓幣', pp.meso === meso0 + UI._sellOf('redPotion') * 5);
UI.show.shop = false; UI.sellSel = null;

// 16. 任務系統
Game.loadMap('town', null, null);
const pq = Game.player;
pq.level = 30; pq.quests = {};
pq.acceptQuest('q_snail');
check('接受任務', pq.quests.q_snail && pq.quests.q_snail.s === 'active');
for (let i = 0; i < 12; i++) pq.onKill('snail');
check('擊殺進度封頂', pq.questProgress('q_snail') === QuestDB.q_snail.objective.count);
check('擊殺任務可完成', pq.canCompleteQuest('q_snail'));
const qm0 = pq.meso;
pq.completeQuest('q_snail');
check('完成任務領楓幣', pq.quests.q_snail.s === 'done' && pq.meso > qm0);
pq.quests = {}; pq.acceptQuest('q_slime');
for (let i = 0; i < pq.invSize; i++) pq.inventory[i] = null;
pq.inventory[0] = { id: 'slimeGel', qty: 6 };
check('收集任務可完成', pq.canCompleteQuest('q_slime'));
pq.completeQuest('q_slime');
check('收集任務消耗素材', pq.invCount('slimeGel') === 0);

// 17. 製作系統
pq.meso = 99999; pq.quests = {};
for (let i = 0; i < pq.invSize; i++) pq.inventory[i] = null;
pq.inventory[0] = { id: 'snailShell', qty: 4 };
pq.inventory[1] = { id: 'goldOre', qty: 2 };
check('製作成功', pq.craft('c_iron') === 'ok' && pq.invCount('ironSword') >= 1);
check('製作消耗材料', pq.invCount('snailShell') === 0 && pq.invCount('goldOre') === 0);
check('材料不足擋下', pq.craft('c_helm') === 'mats');

// 18. NPC 視窗繪製
let npcDrawOk = true;
try {
  UI.show.craft = true; UI.layout(); Game.draw(ctxStub_); UI.show.craft = false;
  UI.show.dialogue = true; UI.dlgNpc = 'hunter'; UI.layout(); Game.draw(ctxStub_); UI.show.dialogue = false; UI.dlgNpc = null;
} catch (e) { npcDrawOk = false; console.error(e); }
check('製作/對話視窗繪製不報錯', npcDrawOk);
check('全部 NPC 數量正確', MapDB.town.npcs.length === 5);

console.log(\`\\n煙霧測試結果：\${__pass} 通過，\${__fail} 失敗\`);
if (__fail > 0) process.exit(1);
`;

const full = `
const __canvasStub = arguments[0];
const __storage = arguments[1];
${stubs}
${gameCode}
;${testCode}
`;

try {
  new Function(full).call(null, canvasStub, storage);
} catch (e) {
  console.error('煙霧測試執行錯誤：', e);
  process.exit(1);
}
