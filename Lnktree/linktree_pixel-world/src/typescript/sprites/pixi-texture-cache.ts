// ==========================================================================
// PixiJS Texture Cache - Bridges offscreen canvas sprites → PIXI.Texture
// ==========================================================================

import { Texture } from 'pixi.js';
import type { SpriteData } from '../types';
import { getSprite, getSpriteFlipped } from './cache';

const textureCache = new Map<string, Texture>();

/** Convert an offscreen canvas to a PixiJS Texture with nearest-neighbor scaling. */
function canvasToTexture(canvas: HTMLCanvasElement): Texture {
  const texture = Texture.from({ resource: canvas, scaleMode: 'nearest' });
  return texture;
}

/** Get (or create+cache) a PixiJS Texture from sprite data. */
export function getTexture(key: string, width: number, height: number, data: SpriteData): Texture {
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = getSprite(key, width, height, data);
  const texture = canvasToTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/** Get (or create+cache) a horizontally flipped PixiJS Texture. */
export function getTextureFlipped(key: string, width: number, height: number, data: SpriteData): Texture {
  const flipKey = key + '_flip';
  const cached = textureCache.get(flipKey);
  if (cached) return cached;

  const canvas = getSpriteFlipped(key, width, height, data);
  const texture = canvasToTexture(canvas);
  textureCache.set(flipKey, texture);
  return texture;
}

/** Convert an arbitrary offscreen canvas to a cached Texture. */
export function getTextureFromCanvas(key: string, canvas: HTMLCanvasElement): Texture {
  const cached = textureCache.get(key);
  if (cached) return cached;

  const texture = canvasToTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/** Clear all cached textures. */
export function clearTextureCache(): void {
  for (const texture of textureCache.values()) {
    texture.destroy(true);
  }
  textureCache.clear();
}
