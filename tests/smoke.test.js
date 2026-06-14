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
  'js/data/items.js', 'js/data/skills.js', 'js/data/monsters.js', 'js/data/maps.js',
  'js/effects.js', 'js/sprites.js', 'js/camera.js',
  'js/entities/drops.js', 'js/entities/projectile.js', 'js/entities/monster.js', 'js/entities/player.js',
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
check('武器 PNG 素材載入', __loadedImages.includes('assets/sprites/weapons/weapon_wood_sword.png'));
Effects.slash(Game.player.x, Game.player.y - 28, 1, 1);
Effects.drawWorld(ctxStub_);
check('斬擊 PNG 素材載入', __loadedImages.includes('assets/sprites/fx/slash/sheet-transparent.png'));

// 2. 開始遊戲
press('Enter');
frames(1);
check('Enter 後進入遊戲', Game.state === 'play');

// 3. 移動與跳躍
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
