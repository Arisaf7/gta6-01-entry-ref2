// Shots: player bullets. Simple projectiles with a short life; they can knock
// out pedestrians and damage cop cars.
import { CONFIG } from './config.js';
import { dist } from './random.js';

export class Shots {
  constructor() { this.bullets = []; }
  clear() { this.bullets = []; }
  fire(x, y, angle, speed) {
    this.bullets.push({ x: x + Math.cos(angle) * 22, y: y + Math.sin(angle) * 22, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.9 });
  }
  update(dt, world) {
    for (const b of this.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      // Hit a pedestrian.
      for (const p of world.traffic.peds) {
        if (p.alive && dist(b.x, b.y, p.x, p.y) < 16) { p.alive = false; p.panic = 0; b.life = 0; world.police.addWanted(1); }
      }
      // Hit a cop car: slow it down.
      for (const c of world.police.cops) {
        if (dist(b.x, b.y, c.x, c.y) < 26) { b.life = 0; c.x -= b.vx * dt * 6; c.y -= b.vy * dt * 6; }
      }
      if (b.x < 0 || b.y < 0 || b.x > CONFIG.CITY_SIZE || b.y > CONFIG.CITY_SIZE) b.life = 0;
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
  }
}
