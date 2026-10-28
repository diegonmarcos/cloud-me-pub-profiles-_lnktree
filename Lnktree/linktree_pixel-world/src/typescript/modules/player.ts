// ==========================================================================
// Player - Grid-aligned movement with smooth interpolation
// ==========================================================================

import { TILE_SIZE, PLAYER_SPEED, ANIM_FRAME_DURATION } from '../config';
import { Direction, TileType } from '../types';
import type { PlayerState, Zone, DoorExit } from '../types';

let state: PlayerState;
let moveQueue: Direction | null = null;

const WALKABLE_TILES = new Set<TileType>([
  TileType.Grass,
  TileType.Path,
  TileType.WoodFloor,
  TileType.Door,
  TileType.Flowers,
  TileType.DarkGrass,
  TileType.Carpet,
  TileType.Stone,
  // Winter tiles
  TileType.Snow,
  TileType.SnowDark,
  TileType.SnowFlowers,
  TileType.Ice,
  TileType.FrozenPath,
]);

export function initPlayer(startX: number, startY: number): PlayerState {
  state = {
    x: startX * TILE_SIZE,
    y: startY * TILE_SIZE,
    tileX: startX,
    tileY: startY,
    targetX: startX * TILE_SIZE,
    targetY: startY * TILE_SIZE,
    direction: Direction.Down,
    isMoving: false,
    animFrame: 0,
    animTimer: 0,
  };
  return state;
}

export function getPlayerState(): PlayerState {
  return state;
}

/** Try to move in a direction. Returns the door exit if player steps on one. */
export function movePlayer(dir: Direction, zone: Zone): DoorExit | null {
  if (state.isMoving) {
    moveQueue = dir;
    return null;
  }

  state.direction = dir;

  let nx = state.tileX;
  let ny = state.tileY;

  switch (dir) {
    case Direction.Up:    ny--; break;
    case Direction.Down:  ny++; break;
    case Direction.Left:  nx--; break;
    case Direction.Right: nx++; break;
  }

  // Bounds check
  if (nx < 0 || ny < 0 || nx >= zone.width || ny >= zone.height) return null;

  // Tile collision check
  const tile = zone.tiles[ny][nx];
  if (!WALKABLE_TILES.has(tile)) return null;

  // Object collision check
  const hasObject = zone.objects.some(o => o.x === nx && o.y === ny);
  if (hasObject) return null;

  // Decoration collision check (trees, fountains, buildings block; animals don't)
  const BLOCKING_DECORATIONS = new Set([
    'tree', 'fountain', 'bush', 'lamp', 'snow-tree', 'snow-bush',
    'building-office', 'building-codelab', 'building-nexus',
    'building-house', 'building-techhub', 'building-cafe', 'building-arcade',
  ]);
  const hasBlockingDecor = zone.decorations.some(d => {
    if (!BLOCKING_DECORATIONS.has(d.type as string)) return false;
    // For multi-tile decorations (buildings: 3x3, portals: 2x2), check tile overlap
    const size = getDecorationTileSize(d.type as string);
    return nx >= d.x && nx < d.x + size.tw && ny >= d.y && ny < d.y + size.th;
  });
  if (hasBlockingDecor) return null;

  // Move to target tile
  state.tileX = nx;
  state.tileY = ny;
  state.targetX = nx * TILE_SIZE;
  state.targetY = ny * TILE_SIZE;
  state.isMoving = true;
  state.animTimer = 0;

  // Check for door
  const doorKey = `${nx},${ny}`;
  const doorExit = zone.doors.get(doorKey);
  return doorExit || null;
}

/** Update player position interpolation. Called every frame. */
export function updatePlayer(dt: number): void {
  if (!state.isMoving) return;

  // Interpolate position toward target
  const dx = state.targetX - state.x;
  const dy = state.targetY - state.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < PLAYER_SPEED) {
    // Arrived at target tile
    state.x = state.targetX;
    state.y = state.targetY;
    state.isMoving = false;
    state.animFrame = 0;
    return;
  }

  // Move toward target
  const vx = (dx / dist) * PLAYER_SPEED;
  const vy = (dy / dist) * PLAYER_SPEED;
  state.x += vx;
  state.y += vy;

  // Walk animation
  state.animTimer += dt;
  if (state.animTimer >= ANIM_FRAME_DURATION) {
    state.animTimer -= ANIM_FRAME_DURATION;
    state.animFrame = (state.animFrame + 1) % 4;
  }
}

/** Process queued move after arriving at tile. Returns door exit if any. */
export function processQueue(zone: Zone): DoorExit | null {
  if (state.isMoving || moveQueue === null) return null;
  const dir = moveQueue;
  moveQueue = null;
  return movePlayer(dir, zone);
}

/** Get the tile-grid size of a decoration type. */
function getDecorationTileSize(type: string): { tw: number; th: number } {
  if (type.startsWith('building-')) return { tw: 3, th: 3 };
  if (type === 'portal' || type === 'snow-portal') return { tw: 2, th: 2 };
  return { tw: 1, th: 1 };
}

/** Teleport player to a tile (no animation). */
export function teleportPlayer(tx: number, ty: number, dir: Direction = Direction.Down): void {
  state.tileX = tx;
  state.tileY = ty;
  state.x = tx * TILE_SIZE;
  state.y = ty * TILE_SIZE;
  state.targetX = state.x;
  state.targetY = state.y;
  state.direction = dir;
  state.isMoving = false;
  state.animFrame = 0;
  moveQueue = null;
}
