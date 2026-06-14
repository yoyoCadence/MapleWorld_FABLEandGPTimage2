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

  SAVE_KEY: 'mapleworld_save_v2',
};

// 升到下一級所需經驗
function expNeed(level) {
  return Math.floor(22 * Math.pow(1.38, level - 1));
}
