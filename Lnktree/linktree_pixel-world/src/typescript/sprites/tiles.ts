// ==========================================================================
// Tile Sprites - 16x16 floor and wall tiles
// ==========================================================================

import { COLORS as C } from '../config';
import type { SpriteData } from '../types';
import { TileType } from '../types';
import { getSprite } from './cache';
import { getTexture } from './pixi-texture-cache';
import type { Texture } from 'pixi.js';

// --- Grass tile (with subtle variation) ---
const GRASS_DATA: SpriteData = [
  [C.grass, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grass, C.grassLight, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grassDark, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassLight, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassLight, C.grass, C.grass],
  [C.grass, C.grass, C.grassLight, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassLight, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grassDark, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassDark, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassLight, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grassLight, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass],
  [C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grass],
];

// --- Path tile (dirt/sand) ---
const PATH_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    if ((x + y * 3) % 17 === 0) return C.pathDark;
    if ((x * 7 + y * 5) % 23 === 0) return C.pathDark;
    return C.path;
  })
);

// --- Wood floor ---
const WOOD_FLOOR_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    // Horizontal plank lines every 4 pixels
    if (y % 4 === 0) return C.woodDark;
    // Subtle grain
    if ((x * 3 + y * 7) % 19 === 0) return C.woodDark;
    return C.woodFloor;
  })
);

// --- Wall (brick-like) ---
const WALL_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    // Horizontal mortar lines
    if (y % 4 === 0) return C.wallDark;
    // Vertical mortar (offset every other row)
    const offset = (Math.floor(y / 4) % 2 === 0) ? 0 : 4;
    if ((x + offset) % 8 === 0) return C.wallDark;
    // Light accent
    if (y % 4 === 2 && (x + offset) % 8 === 4) return C.wallLight;
    return C.wall;
  })
);

// --- Wall top (top edge of wall) ---
const WALL_TOP_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, () => {
    if (y < 2) return C.wallLight;
    if (y < 4) return C.wall;
    return C.wallDark;
  })
);

// --- Water ---
const WATER_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    if ((x + y * 2) % 7 === 0) return C.waterLight;
    return C.water;
  })
);

// --- Stone ---
const STONE_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    if ((x * 5 + y * 3) % 11 === 0) return C.stoneDark;
    return C.stone;
  })
);

// --- Door tile ---
const DOOR_DATA: SpriteData = (() => {
  const d: SpriteData = Array.from({ length: 16 }, () => Array(16).fill(C.door));
  // Door frame
  for (let y = 0; y < 16; y++) {
    d[y][0] = C.doorFrame;
    d[y][1] = C.doorFrame;
    d[y][14] = C.doorFrame;
    d[y][15] = C.doorFrame;
  }
  for (let x = 0; x < 16; x++) {
    d[0][x] = C.doorFrame;
    d[1][x] = C.doorFrame;
  }
  // Doorknob
  d[9][11] = C.metalDark;
  d[9][12] = C.metal;
  d[10][11] = C.metal;
  d[10][12] = C.metalDark;
  return d;
})();

// --- Flower grass (grass with flowers) ---
const FLOWER_GRASS_DATA: SpriteData = GRASS_DATA.map((row, y) =>
  row.map((c, x) => {
    if (y === 3 && x === 4) return C.flowerRed;
    if (y === 7 && x === 10) return C.flowerYel;
    if (y === 11 && x === 2) return C.flowerBlu;
    if (y === 5 && x === 13) return C.flowerRed;
    if (y === 13 && x === 8) return C.flowerYel;
    return c;
  })
);

// --- Dark grass ---
const DARK_GRASS_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    if ((x + y * 3) % 17 === 0) return C.grass;
    return C.grassDark;
  })
);

// --- Carpet ---
const CARPET_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    // Border pattern
    if (x === 0 || x === 15 || y === 0 || y === 15) return C.carpetDark;
    if (x === 1 || x === 14 || y === 1 || y === 14) return C.carpetDark;
    // Diamond pattern in center
    const cx = Math.abs(x - 8);
    const cy = Math.abs(y - 8);
    if ((cx + cy) === 4) return C.carpetDark;
    return C.carpet;
  })
);

// --- Snow (winter grass equivalent) ---
const SNOW_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    if ((x + y * 3) % 17 === 0) return C.snowDark;
    if ((x * 7 + y * 5) % 23 === 0) return C.snowLight;
    return C.snow;
  })
);

// --- Snow Dark (winter dark grass equivalent) ---
const SNOW_DARK_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    if ((x + y * 3) % 17 === 0) return C.snow;
    return C.snowDark;
  })
);

// --- Snow Flowers (frost crystals on snow) ---
const SNOW_FLOWERS_DATA: SpriteData = SNOW_DATA.map((row, y) =>
  row.map((c, x) => {
    if (y === 3 && x === 4) return C.iceLight;
    if (y === 7 && x === 10) return '#ffffff';
    if (y === 11 && x === 2) return C.iceLight;
    if (y === 5 && x === 13) return '#ffffff';
    if (y === 13 && x === 8) return C.iceLight;
    return c;
  })
);

// --- Ice (frozen water) ---
const ICE_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    if ((x + y * 2) % 7 === 0) return C.iceLight;
    if ((x * 3 + y) % 11 === 0) return '#ffffff';
    return C.ice;
  })
);

// --- Frozen Path ---
const FROZEN_PATH_DATA: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    if ((x + y * 3) % 17 === 0) return C.frozenDark;
    if ((x * 7 + y * 5) % 23 === 0) return C.frozenDark;
    return C.frozenPath;
  })
);

// Tile data registry
const TILE_SPRITES: Record<TileType, SpriteData> = {
  [TileType.Empty]: Array.from({ length: 16 }, () => Array(16).fill(C.bgDark)),
  [TileType.Grass]: GRASS_DATA,
  [TileType.Path]: PATH_DATA,
  [TileType.WoodFloor]: WOOD_FLOOR_DATA,
  [TileType.Wall]: WALL_DATA,
  [TileType.WallTop]: WALL_TOP_DATA,
  [TileType.Water]: WATER_DATA,
  [TileType.Stone]: STONE_DATA,
  [TileType.Door]: DOOR_DATA,
  [TileType.Flowers]: FLOWER_GRASS_DATA,
  [TileType.DarkGrass]: DARK_GRASS_DATA,
  [TileType.Carpet]: CARPET_DATA,
  [TileType.Snow]: SNOW_DATA,
  [TileType.SnowDark]: SNOW_DARK_DATA,
  [TileType.SnowFlowers]: SNOW_FLOWERS_DATA,
  [TileType.Ice]: ICE_DATA,
  [TileType.FrozenPath]: FROZEN_PATH_DATA,
};

/** Get a cached canvas for a tile type. */
export function getTileSprite(type: TileType): HTMLCanvasElement {
  return getSprite(`tile_${type}`, 16, 16, TILE_SPRITES[type]);
}

/** Get a PixiJS Texture for a tile type. */
export function getTileTexture(type: TileType): Texture {
  return getTexture(`tile_${type}`, 16, 16, TILE_SPRITES[type]);
}
