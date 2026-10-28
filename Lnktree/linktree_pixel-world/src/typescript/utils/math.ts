// ==========================================================================
// Math Utilities
// ==========================================================================

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function tileDistance(tx1: number, ty1: number, tx2: number, ty2: number): number {
  return Math.abs(tx2 - tx1) + Math.abs(ty2 - ty1);
}
