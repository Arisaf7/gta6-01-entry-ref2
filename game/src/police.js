// Police: wanted stars, cop pursuit, busting. Cops spawn at a distance from the
// player, chase, and bust on contact (on foot) or by ramming (driving).
import { CONFIG } from './config.js';
import { clamp, angleTo, normAngle, dist } from './random.js';

export class Police {
  constructor() {
    this.wanted = 0;
    this.cops = [];
    this._decay = 0;
    this._spawnTimer = 0;
  }
  addWanted(n) {
    this.wanted = clamp(this.wanted + n, 0, CONFIG.MAX_WANTED);
    this._decay = CONFIG.WANTED_DECAY_S;
  }
  clear() { this.wanted = 0; this.cops = []; this._decay = 0; }
  update(dt, world) {
    const p = world.player;
    if (this.wanted > 0) {
      this._decay -= dt;
      if (this._decay <= 0) { this.wanted = Math.max(0, this.wanted - 1); this._decay = CONFIG.WANTED_DECAY_S; }
    }
    const want = this.wanted > 0 ? Math.min(this.wanted, 4) : 0;
    this._spawnTimer -= dt;
    if (this.cops.length < want && this._spawnTimer <= 0) {
      this._spawnTimer = 1.2;
      const a = Math.random() * Math.PI * 2;
      const d = CONFIG.COP_SPAWN_DIST;
      this.cops.push({
        x: clamp(p.x + Math.cos(a) * d, 40, CONFIG.CITY_SIZE - 40),
        y: clamp(p.y + Math.sin(a) * d, 40, CONFIG.CITY_SIZE - 40),
        angle: 0, speed: 0, color: '#2a6fd8', w: 46, h: 22,
      });
    }
    while (this.cops.length > want) this.cops.pop();
    for (const c of this.cops) {
      const target = p.inCar ? p.car : p;
      const a = angleTo(c.x, c.y, target.x, target.y);
      c.angle += clamp(normAngle(a - c.angle), -3.2 * dt, 3.2 * dt);
      const sp = CONFIG.COP_SPEED + this.wanted * 22;
      c.speed = sp;
      c.x += Math.cos(c.angle) * sp * dt;
      c.y += Math.sin(c.angle) * sp * dt;
      // Ram: slow the player's car on contact.
      if (p.inCar && dist(c.x, c.y, p.car.x, p.car.y) < 52) {
        p.car.speed *= 0.86;
        world.addShake(3);
      }
    }
  }
  // Returns 'busted' when a cop touches the on-foot player.
  checkBust(world) {
    const p = world.player;
    if (p.inCar || this.wanted === 0) return false;
    for (const c of this.cops) {
      if (dist(c.x, c.y, p.x, p.y) < 34) return true;
    }
    return false;
  }
}
