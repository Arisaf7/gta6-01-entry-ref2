// Save: localStorage persistence for cash, mission progress and best run.
import { CONFIG } from './config.js';

export function loadSave() {
  try {
    const raw = localStorage.getItem(CONFIG.SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (typeof d !== 'object' || d === null) return null;
    return d;
  } catch (e) { return null; }
}

export function writeSave(world) {
  try {
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify({
      cash: world.cash,
      mission: world.missions.index,
      bestCash: Math.max(world.cash, (loadSave() || {}).bestCash || 0),
      savedAt: Date.now(),
    }));
  } catch (e) { /* storage unavailable (private mode) — game still plays */ }
}
