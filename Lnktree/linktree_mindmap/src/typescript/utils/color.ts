// ==========================================================================
// Color Utilities - Linktree Mindmap
// ==========================================================================

// -----------------------------------------------------------------------------
// Parse & Format
// -----------------------------------------------------------------------------

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseHex(hex: string): RGBA {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Handle 3-char hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 1,
  };
}

export function toRgba(color: RGBA): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

export function toHex(color: RGBA): string {
  const r = color.r.toString(16).padStart(2, '0');
  const g = color.g.toString(16).padStart(2, '0');
  const b = color.b.toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// -----------------------------------------------------------------------------
// Color Manipulation
// -----------------------------------------------------------------------------

export function withAlpha(color: string, alpha: number): string {
  // If already rgba, replace alpha
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${alpha})`);
  }

  // If rgb, convert to rgba
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }

  // If hex, parse and convert
  const parsed = parseHex(color);
  parsed.a = alpha;
  return toRgba(parsed);
}

export function lighten(color: string, amount: number): string {
  const parsed = parseHex(color);
  parsed.r = Math.min(255, parsed.r + amount * 255);
  parsed.g = Math.min(255, parsed.g + amount * 255);
  parsed.b = Math.min(255, parsed.b + amount * 255);
  return toHex(parsed);
}

export function darken(color: string, amount: number): string {
  return lighten(color, -amount);
}

export function desaturate(color: string, amount: number): string {
  const parsed = parseHex(color);
  const gray = (parsed.r + parsed.g + parsed.b) / 3;
  parsed.r = parsed.r + (gray - parsed.r) * amount;
  parsed.g = parsed.g + (gray - parsed.g) * amount;
  parsed.b = parsed.b + (gray - parsed.b) * amount;
  return toHex(parsed);
}

// -----------------------------------------------------------------------------
// Color Blending
// -----------------------------------------------------------------------------

export function blendColors(color1: string, color2: string, t: number): string {
  const c1 = parseHex(color1);
  const c2 = parseHex(color2);

  return toHex({
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
    a: 1,
  });
}

// -----------------------------------------------------------------------------
// Gradients for Canvas
// -----------------------------------------------------------------------------

export function createRadialGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  color: string,
  opacity: number = 1
): CanvasGradient {
  const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
  gradient.addColorStop(0, withAlpha(color, 0.4 * opacity));
  gradient.addColorStop(0.5, withAlpha(color, 0.15 * opacity));
  gradient.addColorStop(1, 'transparent');
  return gradient;
}

export function createGlassGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity: number = 1
): CanvasGradient {
  // Offset light source slightly up
  const gradient = ctx.createRadialGradient(x, y - radius * 0.3, 0, x, y, radius);
  gradient.addColorStop(0, withAlpha('#ffffff', 0.18 * opacity));
  gradient.addColorStop(0.4, withAlpha(color, 0.12 * opacity));
  gradient.addColorStop(0.8, withAlpha(color, 0.2 * opacity));
  gradient.addColorStop(1, withAlpha(color, 0.25 * opacity));
  return gradient;
}
