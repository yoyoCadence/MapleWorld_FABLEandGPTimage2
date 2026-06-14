// 鍵盤 / 滑鼠輸入。down = 持續按住，pressed = 這一幀剛按下
const Input = {
  down: {},
  pressed: {},
  mouseX: 0,
  mouseY: 0,
  clicked: false,      // 這一幀剛按下左鍵
  rightClicked: false, // 這一幀剛按下右鍵
  mouseDown: false,    // 左鍵是否持續按住（拖曳用）
  released: false,     // 這一幀剛放開左鍵

  _prevented: new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
    'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyA',
    'KeyI', 'KeyK', 'KeyP', 'KeyM', 'KeyR', 'KeyN', 'KeyO',
    'Digit1', 'Digit2', 'Digit3', 'Enter', 'Escape',
  ]),

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      if (this._prevented.has(e.code)) e.preventDefault();
      if (!e.repeat) this.pressed[e.code] = true;
      this.down[e.code] = true;
      Sound.ensure();
    });
    window.addEventListener('keyup', (e) => {
      this.down[e.code] = false;
    });
    window.addEventListener('blur', () => { this.down = {}; });

    const toCanvas = (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
    };
    canvas.addEventListener('mousemove', toCanvas);
    canvas.addEventListener('mousedown', (e) => {
      toCanvas(e);
      if (e.button === 2) { this.rightClicked = true; }
      else { this.clicked = true; this.mouseDown = true; }
      Sound.ensure();
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button !== 2) { this.mouseDown = false; this.released = true; }
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  endFrame() {
    this.pressed = {};
    this.clicked = false;
    this.rightClicked = false;
    this.released = false;
  },
};
