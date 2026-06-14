// 進入點：縮放畫布、初始化、主迴圈
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function fit() {
    const s = Math.min(
      window.innerWidth / CONFIG.CANVAS_W,
      window.innerHeight / CONFIG.CANVAS_H
    );
    canvas.style.width = Math.floor(CONFIG.CANVAS_W * s) + 'px';
    canvas.style.height = Math.floor(CONFIG.CANVAS_H * s) + 'px';
  }
  window.addEventListener('resize', fit);
  fit();

  Input.init(canvas);
  Game.init();

  // 關閉頁面前存檔（標題畫面除外，避免覆蓋）
  window.addEventListener('beforeunload', () => {
    if (Game.state !== 'title') Game.save();
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    Game.update(dt);
    Game.draw(ctx);
    Input.endFrame();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
