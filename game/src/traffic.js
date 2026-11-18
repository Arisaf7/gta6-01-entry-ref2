// Traffic: civilian cars driving the road grid + pedestrians on sidewalks.
// Parked cars are stealable; they are placed once at world build and never
// re-rolled by a (re)start.
import { CONFIG } from './config.js';
import { range, intRange, pick, clamp } from './random.js';

const CAR_COLORS = ['#c94f4f', '#4f7ec9', '#e0b13a', '#7ac94f', '#c9c9c9', '#8a4fc9', '#e07a3a'];

export class Traffic {
  constructor(rng, city) {
    this.city = city;
    this.cars = [];
    this.peds = [];
    // Moving traffic: 26 cars on road lanes.
    for (let i = 0; i < 26; i++) {
      const x = range(rng, 100, CONFIG.CITY_SIZE - 100);
      const y = range(rng, 100, CONFIG.CITY_SIZE - 100);
      const p = city.nearestRoadPoint(x, y);
      const horizontal = Math.abs(x - p.x) < Math.abs(y - p.y);
      this.cars.push({
        x: p.x, y: p.y, angle: horizontal ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2),
        speed: range(rng, 90, 150), color: pick(rng, CAR_COLORS), moving: true,
        w: 46, h: 22, stolen: false, driver: true,
      });
    }
    // Parked stealable cars near the garage and around town.
    const spots = [
      { x: 300, y: 300 }, { x: 380, y: 250 }, { x: 1150, y: 440 }, { x: 1600, y: 910 },
      { x: 2050, y: 440 }, { x: 2500, y: 1360 }, { x: 2900, y: 440 }, { x: 910, y: 1800 },
      { x: 1810, y: 2250 }, { x: 2710, y: 2700 }, { x: 440, y: 2710 }, { x: 710, y: 2260 },
    ];
    for (const s of spots) {
      this.cars.push({
        x: s.x, y: s.y, angle: range(rng, 0, Math.PI * 2), speed: 0,
        color: pick(rng, CAR_COLORS), moving: false, w: 46, h: 22, stolen: false, driver: false,
      });
    }
    // Pedestrians: 30 walkers on sidewalks.
    for (let i = 0; i < 30; i++) {
      const gx = intRange(rng, 0, 7), gy = intRange(rng, 0, 7);
      const bx = gx * CONFIG.PITCH + 60, by = gy * CONFIG.PITCH + 60;
      this.peds.push({
        x: range(rng, bx, bx + CONFIG.BLOCK), y: range(rng, by, by + CONFIG.BLOCK),
        angle: range(rng, 0, Math.PI * 2), speed: range(rng, 28, 55),
        color: pick(rng, ['#f2e6c9', '#e8a0a0', '#a0c8e8', '#c8e8a0', '#e8d8a0']),
        alive: true, panic: 0,
      });
    }
  }
  update(dt, world) {
    const S = CONFIG.CITY_SIZE;
    for (const c of this.cars) {
      if (!c.moving) continue;
      c.x += Math.cos(c.angle) * c.speed * dt;
      c.y += Math.sin(c.angle) * c.speed * dt;
      // Bounce at city edges by turning around on the grid.
      if (c.x < 60 || c.x > S - 60 || c.y < 60 || c.y > S - 60) c.angle += Math.PI;
      // Slow down if a car is directly ahead.
      for (const o of this.cars) {
        if (o === c || !o.moving) continue;
        const dx = o.x - c.x, dy = o.y - c.y;
        const d = Math.hypot(dx, dy);
        if (d < 70 && Math.abs(Math.atan2(dy, dx) - c.angle) < 0.6) { c.speed = Math.max(40, c.speed - 60 * dt); }
      }
    }
    for (const p of this.peds) {
      if (!p.alive) continue;
      if (p.panic > 0) { p.panic -= dt; p.speed = 120; }
      else p.speed = 40;
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      if (p.x < 40 || p.x > S - 40 || p.y < 40 || p.y > S - 40 || Math.random() < dt * 0.2) {
        p.angle = range(Math.random, 0, Math.PI * 2);
      }
      p.x = clamp(p.x, 30, S - 30); p.y = clamp(p.y, 30, S - 30);
    }
  }
  nearestCar(x, y, maxDist) {
    let best = null, bd = maxDist;
    for (const c of this.cars) {
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }
  nearestPed(x, y, maxDist) {
    let best = null, bd = maxDist;
    for (const p of this.peds) {
      if (!p.alive) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
}
