// 全域遊戲常數
const CONFIG = {
  CANVAS_W: 1024,
  CANVAS_H: 600,

  GRAVITY: 2400,        // px/s^2
  MOVE_SPEED: 240,      // px/s
  JUMP_VY: -800,
  CLIMB_SPEED: 150,
  MAX_FALL: 1300,

  PLAYER_W: 30,
  PLAYER_H: 46,
  PLAYER_NAME: '楓葉勇士',

  INVINCIBLE_TIME: 1.0, // 受傷後無敵秒數
  PICKUP_RANGE: 55,
  INV_SIZE: 24,        // 初始背包格數
  INV_MAX: 36,         // 背包格上限（6x6，可向商人擴充）
  INV_EXPAND_STEP: 4,  // 每次擴充增加格數
  MAX_LEVEL: 100,

  SAVE_KEY: 'mapleworld_save_v2',      // 舊版單一存檔鍵（向下相容讀取）
  SLOT_PREFIX: 'mapleworld_slot_',     // 多角色存檔：mapleworld_slot_0 / _1 / _2
  SLOT_LAST: 'mapleworld_last_slot',   // 記住上次使用的存檔欄位
  SLOT_COUNT: 3,                       // 可用存檔欄位數（不同職業/進度）
};

// 版本號：每次更新都會變動。index.html 的 ?v= 與素材載入皆用它做快取破壞，
// 確保玩家一定載到最新版（GitHub Pages 等靜態主機常吃舊快取）。
const BUILD = '20260614c';

// 升到下一級所需經驗
function expNeed(level) {
  return Math.floor(22 * Math.pow(1.38, level - 1));
}
