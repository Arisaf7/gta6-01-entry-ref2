// Player: Dario Reyes, on foot and driving. Gameplay keys come ONLY from
// input.takePlayerActions() — E enter/exit car, F punch, Space shoot — so the UI
// layer can never swallow them.
import { CONFIG } from './config.js';
import { clamp, dist, angleTo } from './random.js';

export class Player {
  constructor() {
    this.x = CONFIG.GARAGE.x + 40; this.y = CONFIG.GARAGE.y + 60;
    this.angle = -Math.PI / 2;
    this.health = CONFIG.PLAYER_HEALTH;
    this.inCar = false;
    this.car = null;
    this.punchCooldown = 0;
    this.shootCooldown = 0;
    this.walkAnim = 0;
  }
  reset() {
    this.x = CONFIG.GARAGE.x + 40; this.y = CONFIG.GARAGE.y + 60;
    this.angle = -Math.PI / 2; this.health = CONFIG.PLAYER_HEALTH;
    this.inCar = false; this.car = null;
    this.punchCooldown = 0; this.shootCooldown = 0;
  }
  update(dt, world, input) {
    this.punchCooldown = Math.max(0, this.punchCooldown - dt);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    // Drain gameplay actions (E / F / Space). UI actions are NOT touched here.
    for (const a of input.takePlayerActions()) {
      if (a === 'KeyE') this.toggleCar(world);
      if (a === 'KeyF') this.punch(world);
      if (a === 'Space') this.shoot(world);
    }
    const mv = input.moveVector();
    const sprint = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    if (this.inCar && this.car) this._drive(dt, mv, world);
    else this._walk(dt, mv, sprint, world);
  }
  _walk(dt, mv, sprint, world) {
    if (mv.x || mv.y) {
      const sp = CONFIG.WALK_SPEED * (sprint ? CONFIG.SPRINT_MULT : 1);
      this.x += mv.x * sp * dt;
      this.y += mv.y * sp * dt;
      this.angle = Math.atan2(mv.y, mv.x);
      this.walkAnim += dt * 10;
    }
    this.x = clamp(this.x, 20, CONFIG.CITY_SIZE - 20);
    this.y = clamp(this.y, 20, CONFIG.CITY_SIZE - 20);
    const fixed = world.city.collideCircle(this.x, this.y, 14);
    this.x = fixed.x; this.y = fixed.y;
  }
  _drive(dt, mv, world) {
    const c = this.car;
    const forward = mv.y < 0, back = mv.y > 0;
    if (forward) c.speed += CONFIG.CAR_ACCEL * dt;
    else if (back) c.speed -= CONFIG.CAR_ACCEL * 0.6 * dt;
    else c.speed *= Math.max(0, 1 - 1.4 * dt); // coast down
    c.speed = clamp(c.speed, -CONFIG.CAR_REVERSE, CONFIG.CAR_MAX_SPEED);
    const steer = mv.x;
    if (Math.abs(c.speed) > 8) {
      c.angle += steer * CONFIG.CAR_TURN * dt * Math.sign(c.speed) * Math.min(1, Math.abs(c.speed) / 160);
    }
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt;
    c.x = clamp(c.x, 30, CONFIG.CITY_SIZE - 30);
    c.y = clamp(c.y, 30, CONFIG.CITY_SIZE - 30);
    const fixed = world.city.collideCircle(c.x, c.y, 26);
    if (fixed.x !== c.x || fixed.y !== c.y) { c.speed *= 0.4; world.addShake(2); }
    c.x = fixed.x; c.y = fixed.y;
    this.x = c.x; this.y = c.y; this.angle = c.angle;
    // Running over peds is a crime.
    for (const p of world.traffic.peds) {
      if (p.alive && Math.abs(c.speed) > 120 && dist(c.x, c.y, p.x, p.y) < 34) {
        p.alive = false; world.police.addWanted(1); world.audio.punch();
      }
    }
    world.audio.setEngine(true, Math.abs(c.speed) / CONFIG.CAR_MAX_SPEED);
  }
  toggleCar(world) {
    if (this.inCar) {
      // Step out beside the car.
      const c = this.car;
      this.x = c.x + Math.cos(c.angle + Math.PI / 2) * 40;
      this.y = c.y + Math.sin(c.angle + Math.PI / 2) * 40;
      this.inCar = false; this.car = null;
      world.audio.setEngine(false, 0);
      return;
    }
    const car = world.traffic.nearestCar(this.x, this.y, 70);
    if (!car) { world.flash('No car nearby — walk up to a parked car and press E.'); return; }
    if (!car.stolen) {
      car.stolen = true;
      world.police.addWanted(1);
      world.audio.steal();
      world.flash('Car stolen! The cops noticed — 1 wanted star.');
    }
    car.moving = true; car.driver = true;
    this.inCar = true; this.car = car;
    this.x = car.x; this.y = car.y;
  }
  punch(world) {
    if (this.punchCooldown > 0 || this.inCar) return;
    this.punchCooldown = 0.45;
    world.audio.punch();
    const ped = world.traffic.nearestPed(this.x, this.y, 56);
    if (ped) {
      ped.alive = false;
      world.police.addWanted(1);
      world.flash('You knocked out a pedestrian! 1 wanted star.');
    }
  }
  shoot(world) {
    if (this.shootCooldown > 0 || this.inCar) return;
    this.shootCooldown = 0.32;
    world.audio.shoot();
    world.shots.fire(this.x, this.y, this.angle, 900);
    world.police.addWanted(1);
  }
  hurt(n, world) {
    this.health -= n;
    world.addShake(4);
    if (this.health <= 0) { this.health = 0; world.gameOver('wasted'); }
  }
}
