// City: 8x8 grid, pitch 450, road width 110. Builds blocks, buildings, the park,
// beach, docks and landmarks. Pure geometry + collision helpers.
import { CONFIG } from './config.js';
import { range, intRange, pick } from './random.js';

export class City {
  constructor(rng) {
    this.buildings = [];
    this.park = this.blockRect(CONFIG.PARK_GRID.gx, CONFIG.PARK_GRID.gy);
    const palette = [CONFIG.COLORS.building, CONFIG.COLORS.building2, CONFIG.COLORS.building3, '#8fae7a', '#a08ac0'];
    for (let gx = 0; gx < CONFIG.GRID; gx++) {
      for (let gy = 0; gy < CONFIG.GRID; gy++) {
        if (gx === CONFIG.PARK_GRID.gx && gy === CONFIG.PARK_GRID.gy) continue;
        const r = this.blockRect(gx, gy);
        // 1-3 buildings per block, inset from the road.
        const n = intRange(rng, 1, 3);
        for (let i = 0; i < n; i++) {
          const w = range(rng, 90, 180), h = range(rng, 90, 180);
          const x = range(rng, r.x + 14, r.x + r.w - w - 14);
          const y = range(rng, r.y + 14, r.y + r.h - h - 14);
          this.buildings.push({ x, y, w, h, color: pick(rng, palette), hgt: intRange(rng, 1, 4) });
        }
      }
    }
    // Beach strip along the south edge, docks along the east edge.
    this.beach = { x: 0, y: CONFIG.BEACH_Y, w: CONFIG.CITY_SIZE, h: CONFIG.CITY_SIZE - CONFIG.BEACH_Y };
    this.docks = { x: CONFIG.DOCKS_X, y: 0, w: CONFIG.CITY_SIZE - CONFIG.DOCKS_X, h: CONFIG.CITY_SIZE };
  }
  blockRect(gx, gy) {
    const half = CONFIG.ROAD / 2;
    return {
      x: gx * CONFIG.PITCH + half, y: gy * CONFIG.PITCH + half,
      w: CONFIG.BLOCK, h: CONFIG.BLOCK,
    };
  }
  // Road centre lines sit at multiples of PITCH (0, 450, 900, ...).
  isRoad(x, y) {
    const rx = ((x % CONFIG.PITCH) + CONFIG.PITCH) % CONFIG.PITCH;
    const ry = ((y % CONFIG.PITCH) + CONFIG.PITCH) % CONFIG.PITCH;
    return rx < CONFIG.ROAD / 2 || rx > CONFIG.PITCH - CONFIG.ROAD / 2 ||
           ry < CONFIG.ROAD / 2 || ry > CONFIG.PITCH - CONFIG.ROAD / 2;
  }
  // Snap a point onto the nearest road centre line (for traffic lanes).
  nearestRoadPoint(x, y) {
    const nx = Math.round(x / CONFIG.PITCH) * CONFIG.PITCH;
    const ny = Math.round(y / CONFIG.PITCH) * CONFIG.PITCH;
    return Math.abs(x - nx) < Math.abs(y - ny) ? { x: nx, y } : { x, y: ny };
  }
  buildingAt(x, y, pad = 0) {
    for (const b of this.buildings) {
      if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return b;
    }
    return null;
  }
  // Resolve a circular mover out of buildings; returns corrected position.
  collideCircle(x, y, r) {
    const b = this.buildingAt(x, y, r);
    if (!b) return { x, y };
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - cx, dy = y - cy;
    const d = Math.hypot(dx, dy) || 0.001;
    const push = r - d;
    if (push > 0) return { x: x + (dx / d) * push, y: y + (dy / d) * push };
    return { x, y };
  }
}
