// ==========================================================================
// Background - WebGL starfield shader (GPU-accelerated)
// ==========================================================================

const VERT_SRC = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAG_SRC = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 color = vec3(0.05, 0.05, 0.1);

    // Star field
    vec2 grid = floor(uv * 80.0);
    float star = hash(grid);
    if (star > 0.97) {
      float twinkle = 0.5 + 0.5 * sin(u_time * 2.0 + star * 100.0);
      float brightness = (star - 0.97) * 33.33 * twinkle;
      color += vec3(brightness * 0.8, brightness * 0.85, brightness);
    }

    // Subtle nebula glow
    float n1 = hash(floor(uv * 4.0));
    float n2 = hash(floor(uv * 6.0 + vec2(50.0)));
    color += vec3(n1 * 0.02, 0.0, n2 * 0.03);

    gl_FragColor = vec4(color, 1.0);
  }
`;

let gl: WebGLRenderingContext | null = null;
let program: WebGLProgram | null = null;
let uTime: WebGLUniformLocation | null = null;
let uResolution: WebGLUniformLocation | null = null;
let startTime = 0;
let animId = 0;

function createShader(glCtx: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = glCtx.createShader(type);
  if (!shader) return null;
  glCtx.shaderSource(shader, src);
  glCtx.compileShader(shader);
  if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
    glCtx.deleteShader(shader);
    return null;
  }
  return shader;
}

export function initBackground(canvas: HTMLCanvasElement): void {
  gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) return;

  const vert = createShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const frag = createShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vert || !frag) return;

  program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    program = null;
    return;
  }

  gl.useProgram(program);

  // Full-screen quad
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  uTime = gl.getUniformLocation(program, 'u_time');
  uResolution = gl.getUniformLocation(program, 'u_resolution');

  resizeBackground(canvas);
  startTime = performance.now();
}

export function resizeBackground(canvas: HTMLCanvasElement): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}

export function renderBackground(): void {
  if (!gl || !program) return;
  gl.useProgram(program);
  if (uTime) gl.uniform1f(uTime, (performance.now() - startTime) / 1000);
  if (uResolution) gl.uniform2f(uResolution, gl.canvas.width, gl.canvas.height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

export function startBackgroundLoop(): void {
  function tick(): void {
    renderBackground();
    animId = requestAnimationFrame(tick);
  }
  tick();
}

export function stopBackgroundLoop(): void {
  if (animId) cancelAnimationFrame(animId);
}
