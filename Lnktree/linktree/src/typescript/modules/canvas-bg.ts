// WebGL2 shader background — tiny GPU-rendered gradient + value-noise
// field as an alternative to the 4 × ~30 MB MP4s. Off by default; opt
// in via `?bg=webgl` query param or `localStorage.setItem('bg','webgl')`.
// Falls back silently when WebGL2 is unavailable.

const VS = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// Cheap shader: smooth radial gradient + tiny value-noise breathing.
// Anything heavier than this isn't worth it on integrated GPUs.
const FS = `#version 300 es
precision mediump float;
uniform float u_t;
uniform vec2  u_res;
in  vec2 v_uv;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = v_uv;
  vec2 p = (uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
  float r = length(p);

  vec3 base = mix(vec3(0.02, 0.04, 0.08), vec3(0.0, 0.0, 0.0), smoothstep(0.0, 1.0, r));

  float n = noise(uv * 6.0 + vec2(u_t * 0.05, u_t * 0.03));
  base += vec3(0.04, 0.05, 0.07) * n;

  outColor = vec4(base, 1.0);
}`;

function isOptedIn(): boolean {
  try {
    if (new URLSearchParams(location.search).get('bg') === 'webgl') return true;
    if (localStorage.getItem('bg') === 'webgl') return true;
  } catch { /* private mode */ }
  return false;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function initCanvasBackground(): void {
  if (!isOptedIn()) return;
  if (document.body.classList.contains('lite-mode')) return;

  // Hide the video bg, insert the canvas in its place.
  const video = document.getElementById('background-video') as HTMLVideoElement | null;
  if (video) {
    video.pause();
    video.style.display = 'none';
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;display:block';
  document.body.prepend(canvas);

  const gl = canvas.getContext('webgl2');
  if (!gl) {
    canvas.remove();
    if (video) video.style.display = '';
    return;
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VS);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { canvas.remove(); return; }

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uT = gl.getUniformLocation(prog, 'u_t');
  const uRes = gl.getUniformLocation(prog, 'u_res');

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const start = performance.now();
  const frame = () => {
    if (document.body.classList.contains('lite-mode')) return;
    gl.uniform1f(uT, (performance.now() - start) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
