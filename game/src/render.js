// Render: canvas drawing — city, cars, people, police, HUD, minimap, and the
// title / briefing / pause / game-over / win screens.
import { CONFIG } from './config.js';

const C = CONFIG.COLORS;

export class Renderer {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = canvas.width; this.H = canvas.height;
  }
  draw(world) {
    const ctx = this.ctx;
    const p = world.player;
    const camX = p.x - this.W / 2 + (world.shake ? (Math.random() - 0.5) * world.shake : 0);
    const camY = p.y - this.H / 2 + (world.shake ? (Math.random() - 0.5) * world.shake : 0);
    ctx.save();
    ctx.fillStyle = C.grass; ctx.fillRect(0, 0, this.W, this.H);
    ctx.translate(-camX, -camY);
    this._drawGround(ctx, world, camX, camY);
    this._drawMissionTarget(ctx, world);
    this._drawCars(ctx, world);
    this._drawPeds(ctx, world);
    this._drawPlayer(ctx, world);
    this._drawBullets(ctx, world);
    ctx.restore();
    if (world.state === 'play' || world.state === 'pause') {
      this._drawHud(ctx, world);
      this._drawMinimap(ctx, world);
    }
    if (world.state === 'title') this._screen(ctx, 'SOLMARA', 'Streets of the Sun', 'Dario Reyes is back in town. Mama Rosa has work for him.\n\nWASD / Arrows — move & drive   E — steal / exit car\nF — punch   Space — shoot   Shift — sprint\nEnter — start   P / Esc — pause   M — mute\n\nPress Enter to begin.', '#ffd23f');
    if (world.state === 'briefing') {
      const m = world.missions.current;
      this._screen(ctx, 'MAMA ROSA', m ? `Mission ${m.id}: ${m.name}` : 'All missions done',
        m ? `${m.brief}\n\nObjective: ${m.objective}\nReward: $${CONFIG.MISSION_REWARD[world.missions.index] || 0}\n\nPress Enter to play.` : '', '#e8a33a');
    }
    if (world.state === 'pause') this._screen(ctx, 'PAUSED', '', 'Press P or Esc to resume.\nPress R to restart the run.', '#e8e8e8');
    if (world.state === 'gameover') this._screen(ctx, world.endReason === 'busted' ? 'BUSTED!' : 'WASTED', 'The Solmara police got you.', `Cash kept: $${world.cash}\nMissions done: ${world.missions.index} / 5\n\nPress R to try again, Enter for the title screen.`, '#e05a5a');
    if (world.state === 'win') this._screen(ctx, 'SOLMARA IS YOURS', 'All 5 missions complete.', `Dario did it. Final cash: $${world.cash}\n\nPress R to play again.`, '#7ac94f');
    if (world.flashTimer > 0 && world.state === 'play') {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      const w = ctx.measureText(world.flashText).width + 28;
      ctx.fillRect((this.W - w) / 2, this.H - 66, w, 34);
      ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(world.flashText, this.W / 2, this.H - 43);
    }
  }
  _drawGround(ctx, world, camX, camY) {
    const city = world.city;
    const x0 = Math.max(0, camX - 100), y0 = Math.max(0, camY - 100);
    const x1 = Math.min(CONFIG.CITY_SIZE, camX + this.W + 100), y1 = Math.min(CONFIG.CITY_SIZE, camY + this.H + 100);
    // Beach + docks water.
    ctx.fillStyle = C.sand; ctx.fillRect(0, CONFIG.BEACH_Y, CONFIG.CITY_SIZE, CONFIG.CITY_SIZE - CONFIG.BEACH_Y);
    ctx.fillStyle = C.water; ctx.fillRect(CONFIG.DOCKS_X, 0, CONFIG.CITY_SIZE - CONFIG.DOCKS_X, CONFIG.CITY_SIZE);
    ctx.fillStyle = '#5a4a33';
    for (let i = 0; i < 6; i++) ctx.fillRect(CONFIG.DOCKS_X + 8, 200 + i * 520, 90, 60);
    // Park.
    ctx.fillStyle = C.park; ctx.fillRect(city.park.x, city.park.y, city.park.w, city.park.h);
    ctx.fillStyle = '#2a7a3a';
    for (let i = 0; i < 8; i++) {
      const tx = city.park.x + 40 + (i % 4) * 80, ty = city.park.y + 50 + Math.floor(i / 4) * 180;
      ctx.beginPath(); ctx.arc(tx, ty, 22, 0, Math.PI * 2); ctx.fill();
    }
    // Roads: horizontal + vertical strips.
    ctx.fillStyle = C.road;
    for (let i = 0; i <= CONFIG.GRID; i++) {
      const c = i * CONFIG.PITCH;
      if (c >= y0 - 60 && c <= y1 + 60) ctx.fillRect(0, c - CONFIG.ROAD / 2, CONFIG.CITY_SIZE, CONFIG.ROAD);
      if (c >= x0 - 60 && c <= x1 + 60) ctx.fillRect(c - CONFIG.ROAD / 2, 0, CONFIG.ROAD, CONFIG.CITY_SIZE);
    }
    // Centre dashes.
    ctx.fillStyle = C.roadLine;
    for (let i = 0; i <= CONFIG.GRID; i++) {
      const c = i * CONFIG.PITCH;
      for (let d = 0; d < CONFIG.CITY_SIZE; d += 60) {
        if (c >= y0 - 60 && c <= y1 + 60) ctx.fillRect(d, c - 2, 28, 4);
        if (c >= x0 - 60 && c <= x1 + 60) ctx.fillRect(c - 2, d, 4, 28);
      }
    }
    // Buildings.
    for (const b of city.buildings) {
      if (b.x > x1 || b.y > y1 || b.x + b.w < x0 || b.y + b.h < y0) continue;
      ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(b.x, b.y, b.w, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let wy = b.y + 24; wy < b.y + b.h - 12; wy += 34)
        for (let wx = b.x + 16; wx < b.x + b.w - 12; wx += 30) ctx.fillRect(wx, wy, 14, 18);
    }
    // Landmarks.
    this._landmark(ctx, CONFIG.GARAGE.x, CONFIG.GARAGE.y, 130, C.garage, "ROSA'S GARAGE");
    this._landmark(ctx, CONFIG.BANK.x, CONFIG.BANK.y, 90, C.bank, 'SOLMARA BANK');
    this._landmark(ctx, CONFIG.HOTEL.x, CONFIG.HOTEL.y, 80, C.hotel, 'HOTEL MIRAMAR');
    ctx.fillStyle = '#e8e8e8'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('SOLMARA BEACH', 1800, 3300);
    ctx.fillStyle = '#bfe8ff'; ctx.fillText('DOCKS', 3420, 300);
  }
  _landmark(ctx, x, y, r, color, label) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#111'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 4);
  }
  _drawMissionTarget(ctx, world) {
    const m = world.missions.current;
    if (!m || world.state === 'title') return;
    const t = (m.target2 && world.missions.stage === 1) ? m.target2 : m.target;
    const pulse = 1 + Math.sin(world.time * 4) * 0.12;
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.35 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('▼ ' + t.label, t.x, t.y - t.r * 0.4);
  }
  _drawCars(ctx, world) {
    for (const c of world.traffic.cars) this._car(ctx, c.x, c.y, c.angle, c.color, c.w, c.h, c.stolen);
    for (const c of world.police.cops) this._car(ctx, c.x, c.y, c.angle, c.color, c.w, c.h, false, true);
  }
  _car(ctx, x, y, angle, color, w, h, stolen, cop = false) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);
    ctx.fillStyle = color; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#bfe0ff'; ctx.fillRect(-w * 0.18, -h / 2 + 3, w * 0.3, h - 6);
    ctx.fillStyle = '#ffe9a8'; ctx.fillRect(w / 2 - 4, -h / 2 + 2, 3, 5); ctx.fillRect(w / 2 - 4, h / 2 - 7, 3, 5);
    if (cop) { ctx.fillStyle = '#fff'; ctx.fillRect(-6, -h / 2 + 2, 12, 6); ctx.fillStyle = '#e05a5a'; ctx.fillRect(-6, -h / 2 + 2, 6, 6); }
    if (stolen) { ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('YOURS', 0, -h / 2 - 6); }
    ctx.restore();
  }
  _drawPeds(ctx, world) {
    for (const p of world.traffic.peds) {
      if (!p.alive) continue;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.angle) * 4, p.y + Math.sin(p.angle) * 4, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  _drawPlayer(ctx, world) {
    const p = world.player;
    if (p.inCar) return; // drawn as the car itself
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.player; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(p.angle) * 16, Math.sin(p.angle) * 16); ctx.stroke();
    ctx.restore();
  }
  _drawBullets(ctx, world) {
    ctx.fillStyle = '#ffe9a8';
    for (const b of world.shots.bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); }
  }
  _drawHud(ctx, world) {
    const p = world.player;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(10, 10, 250, 96);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`$${world.cash}`, 22, 36);
    ctx.font = '14px sans-serif';
    ctx.fillText(`Health ${Math.max(0, Math.round(p.health))}`, 22, 58);
    ctx.fillStyle = '#e05a5a'; ctx.fillRect(110, 46, 130, 12);
    ctx.fillStyle = '#7ac94f'; ctx.fillRect(110, 46, 130 * Math.max(0, p.health) / 100, 12);
    // Wanted stars, drawn as paths (no font glyph dependency).
    for (let i = 0; i < 5; i++) {
      const cx = 32 + i * 26, cy = 84;
      ctx.fillStyle = i < world.police.wanted ? '#ffd23f' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      for (let s = 0; s < 10; s++) {
        const r = s % 2 === 0 ? 11 : 4.5;
        const a = -Math.PI / 2 + (s * Math.PI) / 5;
        if (s === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
    }
    const m = world.missions.current;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const obj = m ? `Mission ${m.id}/5: ${m.objective}` : 'All missions complete!';
    ctx.fillRect(10, 114, ctx.measureText(obj).width + 24, 30);
    ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(obj, 22, 134);
    if (p.inCar) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(this.W - 190, this.H - 56, 180, 46);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(Math.abs(p.car.speed) * 0.36)} km/h`, this.W - 22, this.H - 26);
    }
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('E car   F punch   Space shoot   P pause   M mute', 12, this.H - 12);
  }
  _drawMinimap(ctx, world) {
    const S = 150, ox = this.W - S - 12, oy = 12;
    const k = S / CONFIG.CITY_SIZE;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(ox - 4, oy - 4, S + 8, S + 8);
    ctx.fillStyle = C.park; ctx.fillRect(ox + world.city.park.x * k, oy + world.city.park.y * k, world.city.park.w * k, world.city.park.h * k);
    ctx.fillStyle = C.water; ctx.fillRect(ox + CONFIG.DOCKS_X * k, oy, (CONFIG.CITY_SIZE - CONFIG.DOCKS_X) * k, S);
    ctx.fillStyle = C.sand; ctx.fillRect(ox, oy + CONFIG.BEACH_Y * k, S, (CONFIG.CITY_SIZE - CONFIG.BEACH_Y) * k);
    ctx.fillStyle = C.road;
    for (let i = 0; i <= CONFIG.GRID; i++) {
      ctx.fillRect(ox, oy + i * CONFIG.PITCH * k - 1, S, 2);
      ctx.fillRect(ox + i * CONFIG.PITCH * k - 1, oy, 2, S);
    }
    const m = world.missions.current;
    if (m) {
      const t = (m.target2 && world.missions.stage === 1) ? m.target2 : m.target;
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(ox + t.x * k, oy + t.y * k, 5, 0, Math.PI * 2); ctx.fill();
    }
    for (const c of world.police.cops) {
      ctx.fillStyle = '#6fa8ff'; ctx.fillRect(ox + c.x * k - 2, oy + c.y * k - 2, 4, 4);
    }
    const p = world.player;
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(ox + p.x * k, oy + p.y * k, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
  }
  _screen(ctx, title, sub, body, color) {
    ctx.fillStyle = 'rgba(8,18,26,0.82)'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = color; ctx.font = 'bold 64px sans-serif';
    ctx.fillText(title, this.W / 2, 210);
    if (sub) { ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(sub, this.W / 2, 258); }
    ctx.fillStyle = '#d8e0e8'; ctx.font = '17px sans-serif';
    const lines = body.split('\n');
    lines.forEach((l, i) => ctx.fillText(l, this.W / 2, 320 + i * 28));
  }
}
