// Missions: 5 story jobs from Mama Rosa. Each has a target point, objective text,
// and a reward. Completing one advances the story; the last one wins the game.
import { CONFIG } from './config.js';
import { dist } from './random.js';

export const MISSIONS = [
  {
    id: 1, name: 'First Wheels',
    giver: 'Mama Rosa',
    brief: 'Rosa needs wheels. Steal any parked car (walk up and press E) and bring it back to Rosa\'s Garage.',
    objective: 'Steal a car and return it to Rosa\'s Garage',
    target: { x: CONFIG.GARAGE.x, y: CONFIG.GARAGE.y, r: CONFIG.GARAGE.r, label: "Rosa's Garage" },
    needsCar: true,
  },
  {
    id: 2, name: 'Bank Run',
    giver: 'Mama Rosa',
    brief: 'A courier left a package at the Solmara Bank. Drive to the bank at (2025, 1125) and pick it up. Cops are watching — keep it clean.',
    objective: 'Reach the Solmara Bank and collect the package',
    target: { x: CONFIG.BANK.x, y: CONFIG.BANK.y, r: 110, label: 'Solmara Bank' },
    needsCar: false,
  },
  {
    id: 3, name: 'Hotel Pickup',
    giver: 'Mama Rosa',
    brief: 'A guest at the Hotel Miramar owes Rosa money. Collect the debt at the hotel, then bring it home to the garage.',
    objective: 'Collect the debt at Hotel Miramar, then return to the garage',
    target: { x: CONFIG.HOTEL.x, y: CONFIG.HOTEL.y, r: 110, label: 'Hotel Miramar' },
    target2: { x: CONFIG.GARAGE.x, y: CONFIG.GARAGE.y, r: CONFIG.GARAGE.r, label: "Rosa's Garage" },
    needsCar: false,
  },
  {
    id: 4, name: 'Dock Deal',
    giver: 'Mama Rosa',
    brief: 'The docks are hot tonight. Deliver the package to the east docks (x > 3205). Expect heat — two stars, minimum.',
    objective: 'Deliver the package to the docks (east edge)',
    target: { x: 3350, y: 1800, r: 160, label: 'Solmara Docks' },
    needsCar: false, wantedOnStart: 2,
  },
  {
    id: 5, name: 'Beach Getaway',
    giver: 'Mama Rosa',
    brief: 'Last job, Dario. Lose the heat and get to the beach (y > 3150) before sunrise. Solmara is yours after this.',
    objective: 'Reach the beach at the south edge and escape',
    target: { x: 1800, y: 3350, r: 200, label: 'Solmara Beach' },
    needsCar: false,
  },
];

export class MissionManager {
  constructor() { this.index = 0; this.stage = 0; this.done = false; }
  get current() { return this.index < MISSIONS.length ? MISSIONS[this.index] : null; }
  get finished() { return this.index >= MISSIONS.length; }
  reset() { this.index = 0; this.stage = 0; this.done = false; }
  startMission(world) {
    const m = this.current;
    if (!m) return;
    this.stage = 0;
    if (m.wantedOnStart) world.police.addWanted(m.wantedOnStart);
  }
  update(dt, world) {
    const m = this.current;
    if (!m || this.done) return;
    const p = world.player;
    const px = p.inCar ? p.car.x : p.x;
    const py = p.inCar ? p.car.y : p.y;
    if (m.id === 1) {
      if (p.inCar && dist(px, py, m.target.x, m.target.y) < m.target.r) this._complete(world);
      return;
    }
    const t = (m.target2 && this.stage === 1) ? m.target2 : m.target;
    if (dist(px, py, t.x, t.y) < t.r) {
      if (m.target2 && this.stage === 0) { this.stage = 1; world.audio.pickup(); world.flash('Debt collected! Now return to the garage.'); }
      else this._complete(world);
    }
  }
  _complete(world) {
    const m = this.current;
    const reward = CONFIG.MISSION_REWARD[this.index] || 500;
    world.cash += reward;
    world.audio.missionDone();
    world.flash(`Mission complete: ${m.name}  +$${reward}`);
    this.index++;
    this.stage = 0;
    if (this.finished) { this.done = true; world.winGame(); }
    else this.startMission(world);
  }
}
