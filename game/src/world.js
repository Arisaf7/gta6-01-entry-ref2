// World: owns city, traffic, police, missions, player, shots, cash and time.
// resetRun() resets ONLY player/mission state — never the city, traffic or
// parked cars (re-rolling them on restart was a bug in the old build).
import { CONFIG } from './config.js';
import { makeRng } from './random.js';
import { City } from './city.js';
import { Traffic } from './traffic.js';
import { Police } from './police.js';
import { MissionManager } from './missions.js';
import { Player } from './player.js';
import { Shots } from './shots.js';
import { AudioSys } from './audio.js';

export class World {
  constructor(seed = 20261118) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.city = new City(this.rng);
    this.traffic = new Traffic(this.rng, this.city);
    this.police = new Police();
    this.missions = new MissionManager();
    this.player = new Player();
    this.shots = new Shots();
    this.audio = new AudioSys();
    this.cash = CONFIG.START_CASH;
    this.time = 0;
    this.shake = 0;
    this.flashText = '';
    this.flashTimer = 0;
    this.state = 'title'; // title | briefing | play | pause | gameover | win
    this.endReason = '';
    this.onStateChange = null;
  }
  addShake(n) { this.shake = Math.max(this.shake, n); }
  flash(text) { this.flashText = text; this.flashTimer = 3.2; }
  resetRun() {
    // Player + mission state only. City, traffic, parked cars stay as built.
    this.player.reset();
    this.missions.reset();
    this.police.clear();
    this.shots.clear();
    this.cash = CONFIG.START_CASH;
    this.time = 0;
    this.flashText = ''; this.flashTimer = 0;
    this.missions.startMission(this);
  }
  startGame() {
    this.resetRun();
    this.setState('briefing');
  }
  setState(s) { this.state = s; if (this.onStateChange) this.onStateChange(s); }
  gameOver(reason) {
    this.endReason = reason;
    this.audio.busted();
    this.setState('gameover');
  }
  winGame() { this.setState('win'); }
  update(dt) {
    if (this.state !== 'play') return;
    this.time += dt;
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.shake = Math.max(0, this.shake - dt * 14);
    this.traffic.update(dt, this);
    this.police.update(dt, this);
    this.missions.update(dt, this);
    this.shots.update(dt, this);
    if (this.police.checkBust(this)) { this.gameOver('busted'); return; }
    this.audio.update(dt, this.police.wanted);
  }
}
