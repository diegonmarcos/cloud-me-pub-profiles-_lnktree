// ==========================================================================
// Minimap - Corner overlay showing zone layout + player position
// ==========================================================================

import { COLORS } from '../config';
import type { Zone, PlayerState } from '../types';
import { TileType } from '../types';

const PIXEL_SIZE = 4; // each tile = 4x4 px on the minimap

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let cachedZoneId = '';
let cachedBg: ImageData | null = null;

// Tile type → minimap color
const TILE_COLORS: Record<number, string> = {
  [TileType.Empty]:     '#111122',
  [TileType.Grass]:     COLORS.grass,
  [TileType.Path]:      COLORS.path,
  [TileType.WoodFloor]: COLORS.woodFloor,
  [TileType.Wall]:      COLORS.wall,
  [TileType.WallTop]:   COLORS.wallLight,
  [TileType.Water]:     COLORS.water,
  [TileType.Stone]:     COLORS.stone,
  [TileType.Door]:      COLORS.doorGlow,
  [TileType.Flowers]:   COLORS.grassLight,
  [TileType.DarkGrass]: COLORS.grassDark,
  [TileType.Carpet]:    COLORS.carpet,
  [TileType.Snow]:       COLORS.snow,
  [TileType.SnowDark]:   COLORS.snowDark,
  [TileType.SnowFlowers]:COLORS.snowLight,
  [TileType.Ice]:        COLORS.ice,
  [TileType.FrozenPath]: COLORS.frozenPath,
};

export function initMinimap(): void {
  canvas = document.getElementById('minimap') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
}

/** Rebuild the minimap background for a new zone. */
export function cacheMinimap(zone: Zone): void {
  if (cachedZoneId === zone.id) return;
  cachedZoneId = zone.id;

  const w = zone.width * PIXEL_SIZE;
  const h = zone.height * PIXEL_SIZE;
  canvas.width = w;
  canvas.height = h;
  ctx.imageSmoothingEnabled = false;

  // Draw tile colors
  for (let row = 0; row < zone.height; row++) {
    for (let col = 0; col < zone.width; col++) {
      const tile = zone.tiles[row][col];
      ctx.fillStyle = TILE_COLORS[tile] || '#111122';
      ctx.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    }
  }

  // Draw object markers
  for (const obj of zone.objects) {
    ctx.fillStyle = '#ffdd57';
    ctx.fillRect(
      obj.x * PIXEL_SIZE + 1,
      obj.y * PIXEL_SIZE + 1,
      PIXEL_SIZE - 2,
      PIXEL_SIZE - 2,
    );
  }

  // Cache the background
  cachedBg = ctx.getImageData(0, 0, w, h);
}

/** Render minimap with player blip. Called every frame. */
export function renderMinimap(player: PlayerState): void {
  if (!cachedBg) return;

  // Restore cached background
  ctx.putImageData(cachedBg, 0, 0);

  // Draw player dot (blinking)
  const blink = Math.sin(performance.now() / 250) > 0;
  if (blink) {
    const px = player.tileX * PIXEL_SIZE;
    const py = player.tileY * PIXEL_SIZE;
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(px, py, PIXEL_SIZE, PIXEL_SIZE);
  }
}

/** Invalidate cache so it rebuilds on next zone. */
export function invalidateMinimap(): void {
  cachedZoneId = '';
  cachedBg = null;
}
