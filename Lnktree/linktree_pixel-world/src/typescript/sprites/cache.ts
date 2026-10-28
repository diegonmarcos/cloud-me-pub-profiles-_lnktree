// ==========================================================================
// Sprite Cache - Offscreen canvas caching for pixel sprites
// ==========================================================================

import type { SpriteData } from '../types';

const cache = new Map<string, HTMLCanvasElement>();

/** Render a pixel sprite to an offscreen canvas and cache it. */
export function getSprite(key: string, width: number, height: number, data: SpriteData): HTMLCanvasElement {
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < data.length; y++) {
    const row = data[y];
    for (let x = 0; x < row.length; x++) {
      const color = row[x];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  cache.set(key, canvas);
  return canvas;
}

/** Render a horizontally flipped sprite. */
export function getSpriteFlipped(key: string, width: number, height: number, data: SpriteData): HTMLCanvasElement {
  const flipKey = key + '_flip';
  const cached = cache.get(flipKey);
  if (cached) return cached;

  // Get the non-flipped version first
  const original = getSprite(key, width, height, data);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(original, 0, 0);

  cache.set(flipKey, canvas);
  return canvas;
}

/** Clear all cached sprites. */
export function clearSpriteCache(): void {
  cache.clear();
}
