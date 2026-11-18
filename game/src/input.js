// Input: two separate action queues so the UI layer can NEVER eat gameplay keys.
// UI actions (Enter, Escape, P, R, M) go to takeUiActions(). Gameplay actions
// (E enter/exit car, F punch, Space shoot, Shift sprint) go to takePlayerActions().
// Movement keys are read live via isDown(). The two queues are drained by
// different owners (main.js drains UI, player.js drains gameplay), so E/F always
// reach the player even while a menu is open.
const UI_KEYS = new Set(['Enter', 'Escape', 'KeyP', 'KeyR', 'KeyM']);
const PLAYER_KEYS = new Set(['KeyE', 'KeyF', 'Space', 'ShiftLeft', 'ShiftRight']);

export class Input {
  constructor() {
    this.down = new Set();
    this.uiQueue = [];
    this.playerQueue = [];
    this.onFirstGesture = null;
    this._gestured = false;
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (!this._gestured) { this._gestured = true; if (this.onFirstGesture) this.onFirstGesture(); }
      this.down.add(e.code);
      if (UI_KEYS.has(e.code)) this.uiQueue.push(e.code);
      if (PLAYER_KEYS.has(e.code)) this.playerQueue.push(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.down.delete(e.code); });
    window.addEventListener('blur', () => { this.down.clear(); });
  }
  isDown(code) { return this.down.has(code); }
  // Drain and return UI actions pressed since last call.
  takeUiActions() { const a = this.uiQueue; this.uiQueue = []; return a; }
  // Drain and return gameplay actions pressed since last call.
  takePlayerActions() { const a = this.playerQueue; this.playerQueue = []; return a; }
  // Movement vector from WASD / arrows, normalised.
  moveVector() {
    let x = 0, y = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;
    const len = Math.hypot(x, y);
    return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
  }
}
