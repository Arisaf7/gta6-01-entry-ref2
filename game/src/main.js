// SOLMARA — Streets of the Sun. Entry point: game loop + state machine.
// UI keys (Enter/Esc/P/R/M) are drained here via takeUiActions(); gameplay keys
// (E/F/Space) are drained ONLY by player.js via takePlayerActions() — the two
// queues never mix, so menus can never eat a gameplay key.
import { CONFIG } from './config.js';
import { World } from './world.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { loadSave, writeSave } from './save.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(location.search);
const seed = parseInt(params.get('seed') || '20261118', 10) || 20261118;

const world = new World(seed);
const input = new Input();
const renderer = new Renderer(canvas);

input.onFirstGesture = () => world.audio.init();

// Screenshot presets: ?shot=start|play|drive|mission&seed=N — deterministic
// staged states so screenshots show the real game, not a mock.
function applyShotPreset() {
  const shot = params.get('shot');
  if (!shot) return;
  world.setState('play');
  world.missions.startMission(world);
  if (shot === 'start') { world.setState('title'); return; }
  if (shot === 'play') {
    world.player.x = 675; world.player.y = 450; world.player.angle = 0;
    return;
  }
  if (shot === 'drive') {
    const car = world.traffic.cars.find((c) => !c.moving && !c.stolen);
    if (car) {
      car.stolen = true; car.moving = true;
      // Place the car on the east-west road at y=450 so the shot shows clean driving.
      car.x = 700; car.y = 450; car.speed = 260; car.angle = 0;
      world.player.inCar = true; world.player.car = car; world.player.x = car.x; world.player.y = car.y;
    }
    world.police.addWanted(2);
    world.missions.index = 3; world.missions.startMission(world);
    return;
  }
  if (shot === 'mission') {
    world.player.x = CONFIG.BANK.x - 260; world.player.y = CONFIG.BANK.y + 120;
    world.missions.index = 1; world.missions.startMission(world);
    world.flash('Mission 2: Bank Run — reach the Solmara Bank');
    return;
  }
}

// Restore a previous run's cash on the title screen (cosmetic; a new run resets).
const saved = loadSave();
if (saved && typeof saved.bestCash === 'number') world.cash = Math.max(world.cash, 0);

applyShotPreset();

let last = performance.now();
let lastMissionIndex = world.missions.index;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // UI actions only — gameplay keys stay queued for the player.
  for (const a of input.takeUiActions()) {
    if (a === 'Enter') {
      if (world.state === 'title') world.startGame();
      else if (world.state === 'briefing') world.setState('play');
      else if (world.state === 'gameover') { world.setState('title'); }
    }
    if (a === 'KeyP' || a === 'Escape') {
      if (world.state === 'play') world.setState('pause');
      else if (world.state === 'pause') world.setState('play');
    }
    if (a === 'KeyR') {
      if (world.state === 'gameover' || world.state === 'win' || world.state === 'pause') world.startGame();
    }
    if (a === 'KeyM') world.audio.toggleMute();
  }
  if (world.state === 'play') {
    world.player.update(dt, world, input);
    world.update(dt);
    if (world.missions.index !== lastMissionIndex) { lastMissionIndex = world.missions.index; writeSave(world); }
  } else {
    // Keep the world visually alive behind menus without advancing missions.
    input.takePlayerActions();
  }
  renderer.draw(world);
  if (statusEl) {
    const m = world.missions.current;
    statusEl.textContent = `SOLMARA ${world.state}. Cash $${world.cash}. Wanted ${world.police.wanted} stars. Player at ${Math.round(world.player.x)},${Math.round(world.player.y)}${world.player.inCar ? ' driving' : ' on foot'}. ${m ? 'Mission ' + m.id + ': ' + m.objective : 'All missions complete.'}`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Probe hook for automated play-tests (read-only state, no cheat beyond keys).
window.__solmara = {
  world,
  state: () => world.state,
  player: () => ({ x: world.player.x, y: world.player.y, inCar: world.player.inCar, health: world.player.health }),
  mission: () => world.missions.index,
  wanted: () => world.police.wanted,
  cash: () => world.cash,
};
