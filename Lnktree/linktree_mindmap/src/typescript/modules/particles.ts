// ==========================================================================
// Galaxy Module - WebGL2 GPU-Accelerated Starfield + Comets
// ==========================================================================

import { random } from '../utils/math';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

// Stars distribution - MORE STARS
const TINY_STARS = 600;      // Many tiny distant stars
const SMALL_STARS = 200;     // Small stars
const MEDIUM_STARS = 80;     // Medium bright stars
const LARGE_STARS = 25;      // Large glowing stars
const COMETS = 4;            // Shooting stars/comets

const TOTAL = TINY_STARS + SMALL_STARS + MEDIUM_STARS + LARGE_STARS + COMETS;

// Star properties by type - BIGGER sizes, BRIGHTER small stars
const STAR_TYPES = {
  tiny:   { size: [0.8, 1.5],  alpha: [0.2, 0.5],   twinkle: [2.0, 4.0], speed: 0.01 },
  small:  { size: [1.5, 2.5],  alpha: [0.5, 0.85],  twinkle: [1.0, 2.5], speed: 0.02 },
  medium: { size: [4.0, 7.0],  alpha: [0.6, 0.9],   twinkle: [0.5, 1.5], speed: 0.03 },
  large:  { size: [8.0, 14.0], alpha: [0.8, 1.0],   twinkle: [0.2, 0.6], speed: 0.04 },
  comet:  { size: [3.0, 5.0],  alpha: [0.9, 1.0],   twinkle: [0.0, 0.0], speed: 2.0 }
};

// -----------------------------------------------------------------------------
// WebGL State
// -----------------------------------------------------------------------------

let canvas: HTMLCanvasElement | null = null;
let gl: WebGL2RenderingContext | null = null;

// Star program
let starProgram: WebGLProgram | null = null;
let starVao: WebGLVertexArrayObject | null = null;
let starPosBuffer: WebGLBuffer | null = null;
let starDataBuffer: WebGLBuffer | null = null;
let starUTime: WebGLUniformLocation | null = null;
let starUResolution: WebGLUniformLocation | null = null;

// Comet program
let cometProgram: WebGLProgram | null = null;
let cometVao: WebGLVertexArrayObject | null = null;
let cometBuffer: WebGLBuffer | null = null;
let cometUTime: WebGLUniformLocation | null = null;
let cometUResolution: WebGLUniformLocation | null = null;

// Nebula program (background gradient clouds)
let nebulaProgram: WebGLProgram | null = null;
let nebulaVao: WebGLVertexArrayObject | null = null;
let nebulaBuffer: WebGLBuffer | null = null;
let nebulaUTime: WebGLUniformLocation | null = null;
let nebulaUResolution: WebGLUniformLocation | null = null;

// Data arrays
let starPositions: Float32Array;
let starData: Float32Array;
let starVelocities: Float32Array;
let cometData: Float32Array;

let time = 0;
const starCount = TINY_STARS + SMALL_STARS + MEDIUM_STARS + LARGE_STARS;

// -----------------------------------------------------------------------------
// Shaders
// -----------------------------------------------------------------------------

// === STAR SHADERS ===
const STAR_VERT = `#version 300 es
precision highp float;

in vec2 aPos;
in vec4 aData; // size, alpha, twinkleSpeed, type (0=tiny, 1=small, 2=medium, 3=large)

uniform float uTime;
uniform vec2 uResolution;

out float vAlpha;
out float vType;

void main() {
  float twinkle = 0.5 + 0.5 * sin(aData.z * uTime * 0.001 + aPos.x * 0.01);
  vAlpha = aData.y * (0.6 + 0.4 * twinkle);
  vType = aData.w;

  vec2 clip = (aPos / uResolution) * 2.0 - 1.0;
  clip.y = -clip.y;

  gl_Position = vec4(clip, 0.0, 1.0);

  // Size varies with twinkle for larger stars
  float sizeBoost = vType > 1.5 ? (0.8 + 0.4 * twinkle) : 1.0;
  gl_PointSize = aData.x * sizeBoost;
}
`;

const STAR_FRAG = `#version 300 es
precision highp float;

in float vAlpha;
in float vType;
out vec4 fragColor;

void main() {
  vec2 cxy = gl_PointCoord * 2.0 - 1.0;
  float dist = length(cxy);

  float a;
  vec3 col;

  if (vType > 2.5) {
    // LARGE stars: RED for debug, bright glow
    col = vec3(1.0, 0.3, 0.3);
    float core = 1.0 - smoothstep(0.0, 0.3, dist);
    float glow = 1.0 - smoothstep(0.0, 1.0, dist);
    a = core + glow * 0.6;
  } else if (vType > 1.5) {
    // MEDIUM stars: GREEN for debug
    col = vec3(0.3, 1.0, 0.3);
    float core = 1.0 - smoothstep(0.0, 0.4, dist);
    float glow = 1.0 - smoothstep(0.0, 1.0, dist);
    a = core * 0.9 + glow * 0.4;
  } else if (vType > 0.5) {
    // SMALL stars: BLUE for debug
    col = vec3(0.3, 0.5, 1.0);
    a = 1.0 - smoothstep(0.0, 0.8, dist);
    a = pow(a, 1.3);
  } else {
    // TINY stars: WHITE
    col = vec3(0.9, 0.9, 1.0);
    a = 1.0 - smoothstep(0.0, 1.0, dist);
    a = pow(a, 1.8);
  }

  fragColor = vec4(col, a * vAlpha);
}
`;

// === COMET SHADERS ===
const COMET_VERT = `#version 300 es
precision highp float;

in vec4 aComet; // x, y, angle, progress (0-1)

uniform float uTime;
uniform vec2 uResolution;

out float vProgress;
out float vBrightness;

void main() {
  vProgress = aComet.w;

  // Brightness peaks in middle of travel
  vBrightness = sin(vProgress * 3.14159);

  vec2 pos = aComet.xy;
  vec2 clip = (pos / uResolution) * 2.0 - 1.0;
  clip.y = -clip.y;

  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = mix(1.0, 4.0, vBrightness);
}
`;

const COMET_FRAG = `#version 300 es
precision highp float;

in float vProgress;
in float vBrightness;
out vec4 fragColor;

void main() {
  vec2 cxy = gl_PointCoord * 2.0 - 1.0;
  float r = length(cxy);

  float a = 1.0 - smoothstep(0.0, 1.0, r);
  a = pow(a, 1.2);

  // White-blue color
  vec3 col = vec3(0.95, 0.97, 1.0);

  fragColor = vec4(col, a * vBrightness * 0.9);
}
`;

// === NEBULA SHADERS ===
const NEBULA_VERT = `#version 300 es
precision highp float;

in vec2 aPos;
out vec2 vUv;

void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const NEBULA_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
out vec4 fragColor;

// Simple noise function
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;

  // Base dark gradient
  float vignette = 1.0 - length((uv - 0.5) * vec2(aspect, 1.0)) * 0.8;
  vec3 bgColor = mix(vec3(0.02, 0.02, 0.04), vec3(0.06, 0.06, 0.10), vignette);

  // Animated nebula clouds
  float t = uTime * 0.00005;

  // Blue nebula (top-left)
  vec2 p1 = (uv - vec2(0.2, 0.2)) * 2.0;
  float n1 = noise(p1 * 3.0 + t) * noise(p1 * 6.0 - t * 0.5);
  float d1 = 1.0 - length(p1) * 0.7;
  vec3 nebula1 = vec3(0.3, 0.5, 0.9) * n1 * d1 * 0.4;

  // Purple nebula (right)
  vec2 p2 = (uv - vec2(0.8, 0.5)) * 2.0;
  float n2 = noise(p2 * 2.5 + t * 0.7) * noise(p2 * 5.0 - t * 0.3);
  float d2 = 1.0 - length(p2) * 0.6;
  vec3 nebula2 = vec3(0.7, 0.4, 0.9) * n2 * d2 * 0.35;

  // Teal nebula (bottom-left)
  vec2 p3 = (uv - vec2(0.15, 0.8)) * 2.5;
  float n3 = noise(p3 * 2.0 + t * 0.5) * noise(p3 * 4.0 - t * 0.8);
  float d3 = 1.0 - length(p3) * 0.65;
  vec3 nebula3 = vec3(0.3, 0.8, 0.7) * n3 * d3 * 0.3;

  vec3 finalColor = bgColor + nebula1 + nebula2 + nebula3;

  fragColor = vec4(finalColor, 1.0);
}
`;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function compileShader(src: string, type: number): WebGLShader | null {
  if (!gl) return null;
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader error:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function createProgram(vs: string, fs: string): WebGLProgram | null {
  if (!gl) return null;
  const v = compileShader(vs, gl.VERTEX_SHADER);
  const f = compileShader(fs, gl.FRAGMENT_SHADER);
  if (!v || !f) return null;

  const p = gl.createProgram();
  if (!p) return null;

  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);

  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('Program error:', gl.getProgramInfoLog(p));
    return null;
  }

  gl.deleteShader(v);
  gl.deleteShader(f);
  return p;
}

// -----------------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------------

export function initParticles(canvasEl: HTMLCanvasElement): void {
  canvas = canvasEl;

  gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: false,
    antialias: true,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    console.warn('WebGL2 unavailable');
    return;
  }

  // === NEBULA SETUP ===
  nebulaProgram = createProgram(NEBULA_VERT, NEBULA_FRAG);
  if (nebulaProgram) {
    nebulaUTime = gl.getUniformLocation(nebulaProgram, 'uTime');
    nebulaUResolution = gl.getUniformLocation(nebulaProgram, 'uResolution');

    nebulaVao = gl.createVertexArray();
    gl.bindVertexArray(nebulaVao);

    nebulaBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nebulaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(nebulaProgram, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  // === STAR SETUP ===
  starProgram = createProgram(STAR_VERT, STAR_FRAG);
  if (starProgram) {
    starUTime = gl.getUniformLocation(starProgram, 'uTime');
    starUResolution = gl.getUniformLocation(starProgram, 'uResolution');

    starVao = gl.createVertexArray();
    gl.bindVertexArray(starVao);

    starPositions = new Float32Array(starCount * 2);
    starData = new Float32Array(starCount * 4);
    starVelocities = new Float32Array(starCount * 2);

    starPosBuffer = gl.createBuffer();
    starDataBuffer = gl.createBuffer();

    const aPosLoc = gl.getAttribLocation(starProgram, 'aPos');
    const aDataLoc = gl.getAttribLocation(starProgram, 'aData');

    gl.bindBuffer(gl.ARRAY_BUFFER, starPosBuffer);
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, starDataBuffer);
    gl.enableVertexAttribArray(aDataLoc);
    gl.vertexAttribPointer(aDataLoc, 4, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  // === COMET SETUP ===
  cometProgram = createProgram(COMET_VERT, COMET_FRAG);
  if (cometProgram) {
    cometUTime = gl.getUniformLocation(cometProgram, 'uTime');
    cometUResolution = gl.getUniformLocation(cometProgram, 'uResolution');

    cometVao = gl.createVertexArray();
    gl.bindVertexArray(cometVao);

    cometData = new Float32Array(COMETS * 4); // x, y, angle, progress

    cometBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cometBuffer);

    const aCometLoc = gl.getAttribLocation(cometProgram, 'aComet');
    gl.enableVertexAttribArray(aCometLoc);
    gl.vertexAttribPointer(aCometLoc, 4, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  // Blending
  gl.enable(gl.BLEND);

  // Initialize
  resize();
  createStars();
  createComets();
  uploadData();

  window.addEventListener('resize', resize);
}

function resize(): void {
  if (!canvas || !gl) return;

  const dpr = Math.min(window.devicePixelRatio, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  gl.viewport(0, 0, canvas.width, canvas.height);
}

function createStars(): void {
  if (!canvas) return;

  const w = canvas.width;
  const h = canvas.height;
  let idx = 0;

  // Helper to create stars of a type
  function addStars(count: number, type: typeof STAR_TYPES.tiny, typeId: number) {
    for (let i = 0; i < count; i++) {
      starPositions[idx * 2] = random(0, w);
      starPositions[idx * 2 + 1] = random(0, h);

      starVelocities[idx * 2] = random(-type.speed, type.speed);
      starVelocities[idx * 2 + 1] = random(-type.speed, type.speed);

      starData[idx * 4] = random(type.size[0], type.size[1]);     // size
      starData[idx * 4 + 1] = random(type.alpha[0], type.alpha[1]); // alpha
      starData[idx * 4 + 2] = random(type.twinkle[0], type.twinkle[1]); // twinkle
      starData[idx * 4 + 3] = typeId; // type

      idx++;
    }
  }

  addStars(TINY_STARS, STAR_TYPES.tiny, 0);
  addStars(SMALL_STARS, STAR_TYPES.small, 1);
  addStars(MEDIUM_STARS, STAR_TYPES.medium, 2);
  addStars(LARGE_STARS, STAR_TYPES.large, 3);

  // DEBUG: Check star distribution
  console.log('[STARS] Distribution:', {
    tiny: TINY_STARS,
    small: SMALL_STARS,
    medium: MEDIUM_STARS,
    large: LARGE_STARS,
    total: starCount
  });

  // DEBUG: Check actual data for each type
  const tinyIdx = 0;
  const smallIdx = TINY_STARS;
  const mediumIdx = TINY_STARS + SMALL_STARS;
  const largeIdx = TINY_STARS + SMALL_STARS + MEDIUM_STARS;

  console.log('[STARS] Tiny star [0]:', {
    pos: [starPositions[tinyIdx*2], starPositions[tinyIdx*2+1]],
    size: starData[tinyIdx*4],
    alpha: starData[tinyIdx*4+1],
    twinkle: starData[tinyIdx*4+2],
    type: starData[tinyIdx*4+3]
  });

  console.log('[STARS] Small star [' + smallIdx + ']:', {
    pos: [starPositions[smallIdx*2], starPositions[smallIdx*2+1]],
    size: starData[smallIdx*4],
    alpha: starData[smallIdx*4+1],
    twinkle: starData[smallIdx*4+2],
    type: starData[smallIdx*4+3]
  });

  console.log('[STARS] Medium star [' + mediumIdx + ']:', {
    pos: [starPositions[mediumIdx*2], starPositions[mediumIdx*2+1]],
    size: starData[mediumIdx*4],
    alpha: starData[mediumIdx*4+1],
    twinkle: starData[mediumIdx*4+2],
    type: starData[mediumIdx*4+3]
  });

  console.log('[STARS] Large star [' + largeIdx + ']:', {
    pos: [starPositions[largeIdx*2], starPositions[largeIdx*2+1]],
    size: starData[largeIdx*4],
    alpha: starData[largeIdx*4+1],
    twinkle: starData[largeIdx*4+2],
    type: starData[largeIdx*4+3]
  });
}

function createComets(): void {
  if (!canvas) return;

  const w = canvas.width;
  const h = canvas.height;

  for (let i = 0; i < COMETS; i++) {
    resetComet(i, w, h);
  }
}

function resetComet(i: number, w: number, h: number): void {
  const angle = random(-0.6, -0.3); // Diagonal down-right
  cometData[i * 4] = random(-100, w * 0.3); // start x (off-screen left)
  cometData[i * 4 + 1] = random(0, h * 0.5); // start y (upper half)
  cometData[i * 4 + 2] = angle;
  cometData[i * 4 + 3] = random(-2, -0.5); // negative progress = waiting
}

function uploadData(): void {
  if (!gl) return;

  if (starPosBuffer && starDataBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, starPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, starPositions, gl.DYNAMIC_DRAW);
    console.log('[STARS] Uploaded positions buffer, length:', starPositions.length);

    gl.bindBuffer(gl.ARRAY_BUFFER, starDataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, starData, gl.STATIC_DRAW);
    console.log('[STARS] Uploaded data buffer, length:', starData.length);
  }

  if (cometBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, cometBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cometData, gl.DYNAMIC_DRAW);
  }
}

// -----------------------------------------------------------------------------
// Update & Render
// -----------------------------------------------------------------------------

export function updateParticles(dt: number): void {
  if (!canvas || !gl) return;

  const w = canvas.width;
  const h = canvas.height;

  // Update stars
  for (let i = 0; i < starCount; i++) {
    const px = i * 2;
    const py = i * 2 + 1;

    starPositions[px] += starVelocities[px] * dt;
    starPositions[py] += starVelocities[py] * dt;

    // Wrap
    if (starPositions[px] < 0) starPositions[px] += w;
    if (starPositions[px] > w) starPositions[px] -= w;
    if (starPositions[py] < 0) starPositions[py] += h;
    if (starPositions[py] > h) starPositions[py] -= h;
  }

  // Update comets
  for (let i = 0; i < COMETS; i++) {
    const base = i * 4;
    cometData[base + 3] += dt * 0.0003; // progress

    if (cometData[base + 3] > 0 && cometData[base + 3] < 1) {
      // Active comet - update position
      const speed = dt * 1.5;
      const angle = cometData[base + 2];
      cometData[base] += Math.cos(angle) * speed;
      cometData[base + 1] -= Math.sin(angle) * speed;
    } else if (cometData[base + 3] >= 1) {
      // Reset comet
      resetComet(i, w, h);
    }
  }

  time += dt;

  // Upload updated positions
  if (starPosBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, starPosBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, starPositions);
  }

  if (cometBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, cometBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, cometData);
  }
}

export function renderParticles(): void {
  if (!canvas || !gl) return;

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 1. Draw nebula background
  if (nebulaProgram && nebulaVao) {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(nebulaProgram);
    gl.bindVertexArray(nebulaVao);
    gl.uniform1f(nebulaUTime, time);
    gl.uniform2f(nebulaUResolution, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // 2. Draw stars (additive blending)
  if (starProgram && starVao) {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(starProgram);
    gl.bindVertexArray(starVao);
    gl.uniform1f(starUTime, time);
    gl.uniform2f(starUResolution, canvas.width, canvas.height);
    gl.drawArrays(gl.POINTS, 0, starCount);
  }

  // 3. Draw comets (additive blending)
  if (cometProgram && cometVao) {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(cometProgram);
    gl.bindVertexArray(cometVao);
    gl.uniform1f(cometUTime, time);
    gl.uniform2f(cometUResolution, canvas.width, canvas.height);
    gl.drawArrays(gl.POINTS, 0, COMETS);
  }

  gl.bindVertexArray(null);
}

// -----------------------------------------------------------------------------
// Cleanup
// -----------------------------------------------------------------------------

export function destroyParticles(): void {
  window.removeEventListener('resize', resize);

  if (gl) {
    if (starProgram) gl.deleteProgram(starProgram);
    if (starVao) gl.deleteVertexArray(starVao);
    if (starPosBuffer) gl.deleteBuffer(starPosBuffer);
    if (starDataBuffer) gl.deleteBuffer(starDataBuffer);

    if (cometProgram) gl.deleteProgram(cometProgram);
    if (cometVao) gl.deleteVertexArray(cometVao);
    if (cometBuffer) gl.deleteBuffer(cometBuffer);

    if (nebulaProgram) gl.deleteProgram(nebulaProgram);
    if (nebulaVao) gl.deleteVertexArray(nebulaVao);
    if (nebulaBuffer) gl.deleteBuffer(nebulaBuffer);
  }

  canvas = null;
  gl = null;
}
