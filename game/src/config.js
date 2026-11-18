// SOLMARA — Streets of the Sun. Configuration: city geometry, tuning, colours.
export const CONFIG = {
  CITY_SIZE: 3600,
  GRID: 8,
  PITCH: 450,
  ROAD: 110,
  BLOCK: 340,
  // Landmarks (world coordinates).
  GARAGE: { x: 225, y: 225, r: 130 },
  BANK: { x: 2025, y: 1125 },
  HOTEL: { x: 1575, y: 675 },
  DOCKS_X: 3205,
  BEACH_Y: 3150,
  PARK_GRID: { gx: 3, gy: 3 },
  // Player tuning.
  WALK_SPEED: 190,
  SPRINT_MULT: 1.55,
  CAR_ACCEL: 420,
  CAR_MAX_SPEED: 520,
  CAR_REVERSE: 170,
  CAR_TURN: 2.9,
  PLAYER_HEALTH: 100,
  // Economy.
  START_CASH: 120,
  MISSION_REWARD: [400, 650, 900, 1400, 2500],
  // Police.
  COP_SPEED: 300,
  COP_SPAWN_DIST: 520,
  WANTED_DECAY_S: 26,
  MAX_WANTED: 5,
  // Colours.
  COLORS: {
    grass: '#3f7d3a', road: '#2b2f36', roadLine: '#e8c33a', sidewalk: '#8a8f96',
    building: '#c98f5f', building2: '#7fa3c7', building3: '#b56a6a', park: '#2e6b2f',
    water: '#2a7fa8', sand: '#e0c98f', garage: '#e8a33a', bank: '#d8d8e0', hotel: '#e08a5a',
    player: '#ffd23f', cop: '#2a6fd8', traffic: '#c94f4f', ped: '#f2e6c9',
  },
  SAVE_KEY: 'solmara-save-v1',
};
