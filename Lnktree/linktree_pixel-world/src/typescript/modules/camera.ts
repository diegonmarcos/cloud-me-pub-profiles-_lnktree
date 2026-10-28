// ==========================================================================
// Camera - PixiJS stage transforms (GPU composited)
// ==========================================================================

import type { Application } from 'pixi.js';
import { TILE_SIZE, CAMERA_SCALE, CAMERA_LERP, Y_COMPRESS_25D, Y_COMPRESS_LERP } from '../config';
import type { CameraState } from '../types';
import { lerp } from '../utils/math';

let pixiApp: Application | null = null;
let state: CameraState = { x: 0, y: 0, targetX: 0, targetY: 0, scale: CAMERA_SCALE };

// 2.5D state
let is25D = false;
let yCompressFactor = 1.0;
let yCompressTarget = 1.0;

export function initCamera(app: Application): void {
  pixiApp = app;
}

/** Toggle 2.5D perspective mode. */
export function toggle25D(): void {
  is25D = !is25D;
  yCompressTarget = is25D ? Y_COMPRESS_25D : 1.0;
}

/** Get the current Y-compression factor (1.0 = flat, 0.6 = 2.5D). */
export function get25DFactor(): number {
  return yCompressFactor;
}

/** Whether 2.5D mode is active. */
export function is25DMode(): boolean {
  return is25D;
}

/** Set the camera target to center on a pixel position. */
export function setCameraTarget(px: number, py: number): void {
  state.targetX = px;
  state.targetY = py;
}

/** Snap camera immediately (no lerp) to target. */
export function snapCamera(px: number, py: number): void {
  state.targetX = px;
  state.targetY = py;
  state.x = px;
  state.y = py;
  yCompressFactor = yCompressTarget;
  applyTransform();
}

/** Update camera position with smooth lerp. Called each frame. */
export function updateCamera(): void {
  state.x = lerp(state.x, state.targetX, CAMERA_LERP);
  state.y = lerp(state.y, state.targetY, CAMERA_LERP);
  yCompressFactor = lerp(yCompressFactor, yCompressTarget, Y_COMPRESS_LERP);
  applyTransform();
}

function applyTransform(): void {
  if (!pixiApp) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scaleX = state.scale;
  const scaleY = state.scale * yCompressFactor;
  pixiApp.stage.scale.set(scaleX, scaleY);
  pixiApp.stage.x = vw / 2 - state.x * scaleX;
  pixiApp.stage.y = vh / 2 - state.y * scaleY;
}

/** Resize handler: re-center on current position. */
export function resizeCamera(): void {
  applyTransform();
}

/** Convert screen coordinates to world tile coordinates. */
export function screenToTile(screenX: number, screenY: number): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scaleX = state.scale;
  const scaleY = state.scale * yCompressFactor;
  const worldX = (screenX - (vw / 2 - state.x * scaleX)) / scaleX;
  const worldY = (screenY - (vh / 2 - state.y * scaleY)) / scaleY;
  return {
    x: Math.floor(worldX / TILE_SIZE),
    y: Math.floor(worldY / TILE_SIZE),
  };
}
