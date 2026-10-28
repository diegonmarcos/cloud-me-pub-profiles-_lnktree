// ==========================================================================
// Character Sprite - 16x24 player character with walk animation
// ==========================================================================
// 9 frames: down(idle,walk1,walk2), up(idle,walk1,walk2), left(idle,walk1,walk2)
// Right = horizontally flipped Left

import { COLORS as C } from '../config';
import { Direction } from '../types';
import type { SpriteData } from '../types';
import { getSprite, getSpriteFlipped } from './cache';
import { getTexture, getTextureFlipped } from './pixi-texture-cache';
import type { Texture } from 'pixi.js';

const _ = C.transparent;

// ---- DOWN facing ----
const DOWN_IDLE: SpriteData = [
  // Row 0-3: Hair + head
  [_, _, _, _, _, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, _, _, _, _, _],
  [_, _, _, _, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, _, _, _, _],
  [_, _, _, _, C.hair, C.skin, C.skin, C.skin, C.skin, C.skin, C.skin, C.hair, _, _, _, _],
  [_, _, _, _, C.hair, C.skin, C.eyes, C.skin, C.skin, C.eyes, C.skin, C.hair, _, _, _, _],
  [_, _, _, _, _, C.skin, C.skin, C.skin, C.skin, C.skin, C.skin, _, _, _, _, _],
  [_, _, _, _, _, C.skin, C.skin, C.skin, C.skin, C.skin, C.skin, _, _, _, _, _],
  // Row 6-11: Shirt
  [_, _, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _],
  [_, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _],
  [_, _, _, C.skin, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.skin, _, _, _],
  [_, _, _, C.skin, C.shirt, C.shirt, C.shirtDark, C.shirt, C.shirtDark, C.shirt, C.shirt, C.shirt, C.skin, _, _, _],
  [_, _, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _],
  [_, _, _, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _, _],
  // Row 12-17: Pants
  [_, _, _, _, _, C.pants, C.pants, C.pants, C.pants, C.pants, C.pants, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, C.pantsDark, C.pants, C.pants, C.pants, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, _, C.pants, C.pants, C.pants, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, _, C.pants, C.pants, C.pants, _, _, _, _, _],
  // Row 18-19: Feet
  [_, _, _, _, _, C.pants, C.pants, _, C.pants, C.pants, C.pants, _, _, _, _, _],
  [_, _, _, _, C.shoes, C.shoes, C.shoes, _, C.shoes, C.shoes, C.shoes, C.shoes, _, _, _, _],
  // Row 20-23: Padding
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

const DOWN_WALK1: SpriteData = DOWN_IDLE.map((row, y) => {
  if (y >= 14 && y <= 17) {
    // Shift left leg forward
    const r = [...row];
    if (y === 14) { r[5] = _; r[6] = C.pants; r[7] = C.pants; }
    if (y === 15) { r[5] = _; r[6] = C.pants; r[9] = C.pants; }
    if (y === 16) { r[5] = C.pants; r[9] = _; r[10] = C.pants; }
    if (y === 17) { r[4] = C.shoes; r[5] = C.shoes; r[10] = C.shoes; r[11] = C.shoes; }
    return r;
  }
  return row;
});

const DOWN_WALK2: SpriteData = DOWN_IDLE.map((row, y) => {
  if (y >= 14 && y <= 17) {
    const r = [...row];
    if (y === 14) { r[9] = C.pants; r[10] = _; r[7] = C.pants; }
    if (y === 15) { r[10] = _; r[9] = C.pants; r[6] = C.pants; }
    if (y === 16) { r[10] = C.pants; r[5] = _; r[6] = C.pants; }
    if (y === 17) { r[4] = C.shoes; r[5] = C.shoes; r[10] = C.shoes; r[11] = C.shoes; }
    return r;
  }
  return row;
});

// ---- UP facing ----
const UP_IDLE: SpriteData = [
  [_, _, _, _, _, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, _, _, _, _, _],
  [_, _, _, _, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, _, _, _, _],
  [_, _, _, _, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, _, _, _, _],
  [_, _, _, _, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, _, _, _, _],
  [_, _, _, _, _, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, _, _, _, _, _],
  [_, _, _, _, _, C.skin, C.skin, C.skin, C.skin, C.skin, C.skin, _, _, _, _, _],
  [_, _, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _],
  [_, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _],
  [_, _, _, C.skin, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.skin, _, _, _],
  [_, _, _, C.skin, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.skin, _, _, _],
  [_, _, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _],
  [_, _, _, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, C.pants, C.pants, C.pants, C.pants, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, C.pantsDark, C.pants, C.pants, C.pants, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, _, C.pants, C.pants, C.pants, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, _, C.pants, C.pants, C.pants, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, _, C.pants, C.pants, C.pants, _, _, _, _, _],
  [_, _, _, _, C.shoes, C.shoes, C.shoes, _, C.shoes, C.shoes, C.shoes, C.shoes, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

const UP_WALK1: SpriteData = UP_IDLE.map((row, y) => {
  if (y >= 14 && y <= 17) {
    const r = [...row];
    if (y === 17) { r[4] = C.shoes; r[5] = C.shoes; r[10] = C.shoes; r[11] = C.shoes; }
    return r;
  }
  return row;
});

const UP_WALK2: SpriteData = UP_WALK1.map(r => [...r]);

// ---- LEFT facing ----
const LEFT_IDLE: SpriteData = [
  [_, _, _, _, _, C.hair, C.hair, C.hair, C.hair, C.hair, _, _, _, _, _, _],
  [_, _, _, _, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, C.hair, _, _, _, _, _],
  [_, _, _, C.hair, C.hair, C.skin, C.skin, C.skin, C.skin, C.hair, C.hair, _, _, _, _, _],
  [_, _, _, C.hair, C.eyes, C.skin, C.skin, C.skin, C.skin, C.skin, C.hair, _, _, _, _, _],
  [_, _, _, _, C.skin, C.skin, C.skin, C.skin, C.skin, C.skin, _, _, _, _, _, _],
  [_, _, _, _, _, C.skin, C.skin, C.skin, C.skin, _, _, _, _, _, _, _],
  [_, _, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _, _],
  [_, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _],
  [_, _, C.skin, C.skin, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _],
  [_, _, _, C.skin, C.shirt, C.shirtDark, C.shirt, C.shirt, C.shirtDark, C.shirt, C.shirt, _, _, _, _, _],
  [_, _, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _, _],
  [_, _, _, _, _, C.shirt, C.shirt, C.shirt, C.shirt, C.shirt, _, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, C.pants, C.pants, C.pants, _, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, C.pants, C.pants, C.pants, _, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, _, C.pants, C.pants, _, _, _, _, _, _],
  [_, _, _, _, _, C.pants, C.pants, _, C.pants, C.pants, _, _, _, _, _, _],
  [_, _, _, _, C.pants, C.pants, _, _, C.pants, C.pants, _, _, _, _, _, _],
  [_, _, _, _, C.shoes, C.shoes, _, _, C.shoes, C.shoes, C.shoes, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

const LEFT_WALK1: SpriteData = LEFT_IDLE.map((row, y) => {
  if (y >= 14 && y <= 17) {
    const r = [...row];
    if (y === 17) { r[3] = C.shoes; r[4] = C.shoes; r[10] = C.shoes; }
    return r;
  }
  return row;
});

const LEFT_WALK2: SpriteData = LEFT_WALK1.map(r => [...r]);

// Frame registry: [direction][frameIndex]
const FRAMES: SpriteData[][] = [
  [DOWN_IDLE, DOWN_WALK1, DOWN_WALK2],   // Direction.Down
  [UP_IDLE, UP_WALK1, UP_WALK2],         // Direction.Up
  [LEFT_IDLE, LEFT_WALK1, LEFT_WALK2],   // Direction.Left
  [LEFT_IDLE, LEFT_WALK1, LEFT_WALK2],   // Direction.Right (flipped)
];

/** Get the cached canvas for a character frame. */
export function getCharacterSprite(direction: Direction, frame: number): HTMLCanvasElement {
  const idx = Math.min(frame, 2);
  const dirIdx = direction === Direction.Right ? Direction.Left : direction;
  const data = FRAMES[dirIdx][idx];
  const key = `char_${dirIdx}_${idx}`;

  if (direction === Direction.Right) {
    return getSpriteFlipped(key, 16, 24, data);
  }
  return getSprite(key, 16, 24, data);
}

/** Get a PixiJS Texture for a character frame. */
export function getCharacterTexture(direction: Direction, frame: number): Texture {
  const idx = Math.min(frame, 2);
  const dirIdx = direction === Direction.Right ? Direction.Left : direction;
  const data = FRAMES[dirIdx][idx];
  const key = `char_${dirIdx}_${idx}`;

  if (direction === Direction.Right) {
    return getTextureFlipped(key, 16, 24, data);
  }
  return getTexture(key, 16, 24, data);
}
