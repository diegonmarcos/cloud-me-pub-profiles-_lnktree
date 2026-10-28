// Status Diagnostics - Data gathering functions

import type {
  NetworkDiagnostics,
  CacheDiagnostics,
  SystemInfo,
  AssetInfo,
  PerformanceMetrics,
  GPUCPUMetrics,
  ServiceWorkerInfo,
  StorageInfo,
  FeatureSupport,
  CodecSupport,
  DisplayInfo,
  WebVitals,
  Warning,
  WarningSeverity,
  DiagnosticData,
} from './types';

// Asset lists
export const DIAGNOSTIC_ASSETS = [
  'public/videos/background.mp4',
  'public/videos/background2.mp4',
  'public/videos/background3.mp4',
  'public/videos/background4.mp4',
  'public/images/background_static.jpg',
  'public/images/professional.png',
  'public/images/personal.png',
  'public/images/venture1.png',
  'public/images/venture2.png',
  'public/images/tools.png',
];

/**
 * Check if running on file:// protocol
 */
export function isFileProtocol(): boolean {
  return window.location.protocol === 'file:';
}

/**
 * Get client IP address (web only)
 */
export async function getClientIP(): Promise<string> {
  if (isFileProtocol()) {
    return 'localhost (file://)';
  }

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Unable to fetch';
  }
}

/**
 * Test latency with multiple pings (web only, fallback for local)
 */
export async function testLatencyDetailed(): Promise<{ avg: number; jitter: number }> {
  if (isFileProtocol()) {
    // Fallback for local file:// - no latency
    return { avg: 0, jitter: 0 };
  }

  const pings: number[] = [];
  const testUrl = 'public/images/background_static.jpg';

  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      await fetch(testUrl + '?t=' + Date.now() + '&ping=' + i, {
        method: 'HEAD',
        cache: 'no-store',
      });
      pings.push(performance.now() - start);
    } catch {
      pings.push(0);
    }
  }

  const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
  const variance = pings.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / pings.length;
  const jitter = Math.sqrt(variance);

  return { avg: Math.round(avg), jitter: Math.round(jitter) };
}

/**
 * Get network information
 */
export async function getNetworkDiagnostics(): Promise<NetworkDiagnostics> {
  const latency = await testLatencyDetailed();
  const clientIP = await getClientIP();

  // @ts-ignore - Network Information API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  return {
    downloadSpeed: localStorage.getItem('last_download_speed') || 'Unknown',
    uploadSpeed: 'N/A',
    latency: `${latency.avg}ms`,
    jitter: `${latency.jitter}ms`,
    connectionType: connection?.type || 'Unknown',
    effectiveType: connection?.effectiveType || 'Unknown',
    downlink: connection?.downlink ? `${connection.downlink} Mbps` : 'Unknown',
    rtt: connection?.rtt ? `${connection.rtt}ms` : 'Unknown',
    clientIP,
    serverIP: window.location.hostname,
    protocol: window.location.protocol.replace(':', ''),
  };
}

/**
 * Get cache diagnostics
 */
export function getCacheDiagnostics(): CacheDiagnostics {
  try {
    const cacheData = JSON.parse(localStorage.getItem('linktree_assets_cache_v1') || '{}');
    const timestamp = cacheData.timestamp || 0;
    const cacheAge = Date.now() - timestamp;
    const maxAge = 24 * 60 * 60 * 1000;
    const validUntil = new Date(timestamp + maxAge);

    return {
      status: cacheAge < maxAge && timestamp > 0 ? 'Valid' : 'Expired',
      cacheAge: `${Math.round(cacheAge / 1000 / 60)} minutes`,
      cachedFiles: cacheData.assets?.length || 0,
      totalCachedSize: 'Calculating...',
      lastUpdate: timestamp > 0 ? new Date(timestamp).toLocaleString() : 'Never',
      validUntil: timestamp > 0 ? validUntil.toLocaleString() : 'N/A',
    };
  } catch {
    return {
      status: 'Unknown',
      cacheAge: 'N/A',
      cachedFiles: 0,
      totalCachedSize: 'N/A',
      lastUpdate: 'N/A',
      validUntil: 'N/A',
    };
  }
}

/**
 * Get system information — extensive snapshot of identity, locale, display,
 * hardware, privacy, document state, and JS heap. Every field is wrapped
 * in a try/catch via safe() because feature support varies wildly across
 * browsers (e.g. NavigatorUAData is Chromium-only, performance.memory is
 * not in Firefox, navigator.connection is patchy).
 */
export function getSystemInfo(): SystemInfo {
  const nav = navigator as any;
  const safe = <T>(fn: () => T, fallback: T): T => { try { return fn(); } catch { return fallback; } };

  const memory = (performance as any).memory;
  const tzOffset = new Date().getTimezoneOffset();
  const tzOffsetStr = `UTC${tzOffset <= 0 ? '+' : '-'}${Math.abs(Math.floor(tzOffset / 60)).toString().padStart(2,'0')}:${Math.abs(tzOffset % 60).toString().padStart(2,'0')}`;
  const screenOrient = (screen as any).orientation;

  return {
    // Identity
    browser: getBrowserName(),
    browserVersion: getBrowserVersion(),
    browserEngine: getBrowserEngine(),
    os: getOS(),
    osVersion: getOSVersion(),
    platform: nav.platform || 'Unknown',
    userAgent: nav.userAgent || 'Unknown',
    // Locale & time
    language: nav.language || 'Unknown',
    languages: Array.isArray(nav.languages) ? nav.languages.join(', ') : 'Unknown',
    timezone: safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone, 'Unknown'),
    timezoneOffset: tzOffsetStr,
    locale: safe(() => Intl.DateTimeFormat().resolvedOptions().locale, 'Unknown'),
    currentTime: new Date().toISOString(),
    // Display
    screenResolution: `${screen.width}x${screen.height}`,
    screenAvailable: `${screen.availWidth}x${screen.availHeight}`,
    screenColorDepth: `${screen.colorDepth}-bit`,
    screenPixelDepth: `${screen.pixelDepth}-bit`,
    devicePixelRatio: `${window.devicePixelRatio || 1}x`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    windowOuterSize: `${window.outerWidth}x${window.outerHeight}`,
    scrollPosition: `${Math.round(window.scrollX)},${Math.round(window.scrollY)}`,
    orientation: screenOrient ? `${screenOrient.type} (${screenOrient.angle}°)` : 'Unknown',
    // Hardware
    deviceMemory: nav.deviceMemory ? `${nav.deviceMemory} GB` : 'Unknown',
    hardwareConcurrency: nav.hardwareConcurrency ? `${nav.hardwareConcurrency} cores` : 'Unknown',
    maxTouchPoints: typeof nav.maxTouchPoints === 'number' ? `${nav.maxTouchPoints}` : 'Unknown',
    isMobile: detectMobile() ? 'Yes' : 'No',
    // Privacy & security
    cookiesEnabled: nav.cookieEnabled ? 'Yes' : 'No',
    doNotTrack: nav.doNotTrack === '1' ? 'Yes' : 'No',
    isSecureContext: window.isSecureContext ? 'Yes' : 'No',
    crossOriginIsolated: (window as any).crossOriginIsolated ? 'Yes' : 'No',
    // Document state
    readyState: document.readyState,
    visibilityState: document.visibilityState,
    hasFocus: document.hasFocus() ? 'Yes' : 'No',
    pageURL: window.location.href,
    pageReferrer: document.referrer || '(none)',
    pageTitle: document.title,
    pageEncoding: document.characterSet,
    // Memory (JS heap — Chromium only)
    jsHeapUsed: memory ? formatBytes(memory.usedJSHeapSize) : 'Unsupported',
    jsHeapTotal: memory ? formatBytes(memory.totalJSHeapSize) : 'Unsupported',
    jsHeapLimit: memory ? formatBytes(memory.jsHeapSizeLimit) : 'Unsupported',
  };
}

/**
 * Browser engine inference from UA string.
 */
export function getBrowserEngine(): string {
  const ua = navigator.userAgent;
  if (/Gecko\/\d/.test(ua)) return 'Gecko';
  if (/AppleWebKit\/.+\bSafari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return 'WebKit';
  if (/Chrome|Chromium|Edg|OPR/.test(ua)) return 'Blink';
  return 'Unknown';
}

/**
 * Best-effort OS version extraction.
 */
export function getOSVersion(): string {
  const ua = navigator.userAgent;
  let m = ua.match(/Windows NT ([0-9.]+)/);    if (m) return m[1];
  m     = ua.match(/Mac OS X ([0-9_]+)/);      if (m) return m[1].replace(/_/g, '.');
  m     = ua.match(/Android ([0-9.]+)/);       if (m) return m[1];
  m     = ua.match(/(?:iPhone|iPad).+OS ([0-9_]+)/); if (m) return m[1].replace(/_/g, '.');
  m     = ua.match(/X11.+Linux ([^;)]+)/);     if (m) return m[1].trim();
  return 'Unknown';
}

/**
 * Mobile heuristic — UA-CH first, fall back to UA string regex.
 */
export function detectMobile(): boolean {
  const uaData = (navigator as any).userAgentData;
  if (uaData && typeof uaData.mobile === 'boolean') return uaData.mobile;
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get browser name
 */
export function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Edg') > -1) return 'Edge';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
  return 'Unknown';
}

/**
 * Get browser version
 */
export function getBrowserVersion(): string {
  const ua = navigator.userAgent;
  const match = ua.match(/(Firefox|Chrome|Safari|Edge|Opera|OPR)\/([0-9.]+)/);
  return match ? match[2] : 'Unknown';
}

/**
 * Get operating system
 */
export function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'macOS';
  if (ua.indexOf('X11') > -1) return 'UNIX';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iOS') > -1) return 'iOS';
  return 'Unknown';
}

/**
 * Get asset information (web optimized, fallback for local)
 */
export async function getAssetInfo(): Promise<AssetInfo[]> {
  const assets: AssetInfo[] = [];

  if (isFileProtocol()) {
    // Fallback for file:// - use performance API
    const perfEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    for (const url of DIAGNOSTIC_ASSETS) {
      const entry = perfEntries.find(e => e.name.includes(url));
      const type = url.split('.').pop()?.toUpperCase() || 'Unknown';

      if (entry) {
        assets.push({
          url: url.split('/').pop() || url,
          type,
          size: entry.transferSize ? formatBytes(entry.transferSize) : 'Local',
          cached: entry.transferSize === 0,
          loadTime: `${Math.round(entry.duration)}ms`,
        });
      } else {
        // Not yet loaded, mark as pending
        assets.push({
          url: url.split('/').pop() || url,
          type,
          size: 'Local',
          cached: false,
          loadTime: 'Pending',
        });
      }
    }
    return assets;
  }

  // Web version - use fetch
  for (const url of DIAGNOSTIC_ASSETS) {
    const startTime = performance.now();
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const loadTime = performance.now() - startTime;
      const size = response.headers.get('content-length');
      const type = url.split('.').pop()?.toUpperCase() || 'Unknown';

      assets.push({
        url: url.split('/').pop() || url,
        type,
        size: size ? formatBytes(parseInt(size)) : 'Unknown',
        cached: response.headers.get('x-cache') === 'HIT',
        loadTime: `${Math.round(loadTime)}ms`,
      });
    } catch {
      assets.push({
        url: url.split('/').pop() || url,
        type: 'Error',
        size: 'N/A',
        cached: false,
        loadTime: 'Failed',
      });
    }
  }

  return assets;
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const memory = (performance as any).memory;

  const paintEntries = performance.getEntriesByType('paint');
  const firstPaint = paintEntries.find((e) => e.name === 'first-paint');
  const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint');

  return {
    pageLoadTime: perf ? `${Math.round(perf.loadEventEnd - perf.fetchStart)}ms` : 'Unknown',
    domContentLoaded: perf ? `${Math.round(perf.domContentLoadedEventEnd - perf.fetchStart)}ms` : 'Unknown',
    firstPaint: firstPaint ? `${Math.round(firstPaint.startTime)}ms` : 'N/A',
    firstContentfulPaint: fcp ? `${Math.round(fcp.startTime)}ms` : 'N/A',
    transferSize: perf?.transferSize ? formatBytes(perf.transferSize) : 'Unknown',
    resourceCount: `${performance.getEntriesByType('resource').length}`,
    memoryUsage: memory ? formatBytes(memory.usedJSHeapSize) : 'Unknown',
  };
}

/**
 * Detect software vs hardware rendering by inspecting the WebGL renderer
 * string. Software fallbacks like SwiftShader (Chromium), llvmpipe (Mesa),
 * Mesa Software Rasterizer, Microsoft Basic Render Driver, and ANGLE
 * software/SwiftShader variants all produce ~5–10× lower FPS on canvas-
 * heavy pages — flag them prominently.
 */
function isSoftwareRenderer(renderer: string): boolean {
  if (!renderer) return false;
  const r = renderer.toLowerCase();
  return /swiftshader|llvmpipe|software|microsoft basic render|mesa offscreen|vmware|virtualbox/.test(r);
}

/**
 * Get GPU and CPU usage metrics, plus hardware-acceleration detection
 * and a snapshot of WebGL/WebGPU capabilities.
 */
export async function getGPUCPUMetrics(): Promise<GPUCPUMetrics> {
  let gpuRenderer = 'Unknown';
  let gpuVendor = 'Unknown';
  let gpuUsage = 0;
  let webglVersion = 'Unsupported';
  let webglMaxTextureSize = 'N/A';
  let webglAntialias = 'N/A';
  let webglExtensions = 0;

  try {
    const canvas = document.createElement('canvas');
    // Prefer WebGL2 for capability reporting.
    let gl: any = canvas.getContext('webgl2');
    if (gl) {
      webglVersion = 'WebGL 2.0';
    } else {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) webglVersion = 'WebGL 1.0';
    }

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
      }
      try { webglMaxTextureSize = `${gl.getParameter(gl.MAX_TEXTURE_SIZE)}px`; } catch {}
      try {
        const attrs = gl.getContextAttributes();
        webglAntialias = attrs && attrs.antialias ? 'Yes' : 'No';
      } catch {}
      try {
        const ext = gl.getSupportedExtensions();
        webglExtensions = Array.isArray(ext) ? ext.length : 0;
      } catch {}
    }
  } catch (e) {
    console.warn('Could not get GPU info:', e);
  }

  const webgpuSupported = !!(navigator as any).gpu;

  // Measure FPS over 1 second
  const fps = await measureFPS();

  // Estimate CPU usage from frame timing and long tasks
  let cpuUsage = 0;
  const longTasks = (performance as any).getEntriesByType?.('longtask') || [];
  if (longTasks.length > 0) {
    // If we have long tasks, CPU is busy
    const totalLongTaskTime = longTasks.reduce((sum: number, task: any) => sum + task.duration, 0);
    cpuUsage = Math.min((totalLongTaskTime / 10000) * 100, 100); // Normalize to percentage
  } else {
    // Estimate from FPS - if FPS is low, CPU or GPU is busy
    // If GPU is rendering well (>30fps), but still slow, it's CPU
    if (fps < 30) {
      cpuUsage = 60; // Likely CPU-bound
    } else if (fps < 50) {
      cpuUsage = 30;
    } else {
      cpuUsage = 10; // Healthy
    }
  }

  // Estimate GPU usage from frame timing
  // If we're getting 60fps, GPU is keeping up (low usage means efficient)
  // If we're getting <30fps and CPU is low, GPU is bottleneck
  if (fps >= 55) {
    gpuUsage = Math.max(gpuUsage, 40); // Efficiently rendering
  } else if (fps < 30 && cpuUsage < 40) {
    gpuUsage = 80; // GPU bottleneck
  } else {
    gpuUsage = Math.max(gpuUsage, 60); // Working hard
  }

  // Determine status
  const getCPUStatus = (usage: number): string => {
    if (usage < 25) return 'Low';
    if (usage < 50) return 'Medium';
    if (usage < 75) return 'High';
    return 'Critical';
  };

  const getGPUStatus = (usage: number): string => {
    if (usage < 30) return 'Low';
    if (usage < 60) return 'Medium';
    if (usage < 85) return 'High';
    return 'Critical';
  };

  const sw = isSoftwareRenderer(gpuRenderer);
  return {
    cpuUsage: Math.round(cpuUsage),
    gpuUsage: Math.round(gpuUsage),
    gpuRenderer,
    gpuVendor,
    cpuStatus: getCPUStatus(cpuUsage),
    gpuStatus: getGPUStatus(gpuUsage),
    fps: Math.round(fps),
    frameTiming: `${(1000 / fps).toFixed(2)}ms`,
    hardwareAccelerated: !sw && gpuRenderer !== 'Unknown',
    accelerationStatus: sw ? 'software' : (gpuRenderer === 'Unknown' ? 'unknown' : 'hardware'),
    webglVersion,
    webglMaxTextureSize,
    webglAntialias,
    webglExtensions,
    webgpuSupported,
  };
}

// ════════════════════════════════════════════════════════════════════
// Service Worker
// ════════════════════════════════════════════════════════════════════
export async function getServiceWorkerInfo(): Promise<ServiceWorkerInfo> {
  const supported = 'serviceWorker' in navigator;
  if (!supported) {
    return { supported: false, registered: false, active: false, controlling: false,
             scope: 'N/A', scriptURL: 'N/A', state: 'N/A',
             cacheNames: [], cacheEntries: 0, cacheTotalBytes: 'N/A' };
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const active = reg?.active;
    let cacheNames: string[] = [];
    let cacheEntries = 0;
    let cacheTotalBytes = 'Unknown';
    if ('caches' in self) {
      cacheNames = await caches.keys();
      let total = 0; let bytes = 0;
      for (const name of cacheNames) {
        const c = await caches.open(name);
        const keys = await c.keys();
        total += keys.length;
        // Best-effort byte count: HEAD-style content-length per cached request
        for (const req of keys.slice(0, 50)) {
          try {
            const resp = await c.match(req);
            const cl = resp?.headers.get('content-length');
            if (cl) bytes += parseInt(cl, 10) || 0;
          } catch {}
        }
      }
      cacheEntries = total;
      cacheTotalBytes = bytes > 0 ? formatBytes(bytes) : 'Unknown';
    }
    return {
      supported: true,
      registered: !!reg,
      active: !!active,
      controlling: !!navigator.serviceWorker.controller,
      scope: reg?.scope || 'N/A',
      scriptURL: active?.scriptURL || 'N/A',
      state: active?.state || 'none',
      cacheNames,
      cacheEntries,
      cacheTotalBytes,
    };
  } catch {
    return { supported: true, registered: false, active: false, controlling: false,
             scope: 'N/A', scriptURL: 'N/A', state: 'error',
             cacheNames: [], cacheEntries: 0, cacheTotalBytes: 'N/A' };
  }
}

// ════════════════════════════════════════════════════════════════════
// Storage
// ════════════════════════════════════════════════════════════════════
export async function getStorageInfo(): Promise<StorageInfo> {
  const out: StorageInfo = {
    quotaSupported: false, quota: 'N/A', usage: 'N/A', usagePercent: 'N/A',
    persisted: 'Unknown', localStorageItems: 0, localStorageBytes: '0 B',
    sessionStorageItems: 0, sessionStorageBytes: '0 B',
    indexedDBDatabases: 'N/A', cookieCount: 0,
  };
  // navigator.storage — quota/usage
  if (navigator.storage && typeof navigator.storage.estimate === 'function') {
    try {
      const est = await navigator.storage.estimate();
      out.quotaSupported = true;
      out.quota = est.quota ? formatBytes(est.quota) : 'Unknown';
      out.usage = est.usage ? formatBytes(est.usage) : '0 B';
      if (est.quota && est.usage) {
        out.usagePercent = `${((est.usage / est.quota) * 100).toFixed(2)}%`;
      }
    } catch {}
    if (typeof navigator.storage.persisted === 'function') {
      try { out.persisted = (await navigator.storage.persisted()) ? 'Yes' : 'No'; } catch {}
    }
  }
  // localStorage / sessionStorage size estimate
  try {
    let lsBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!; const v = localStorage.getItem(k) || '';
      lsBytes += (k.length + v.length) * 2; // UTF-16
    }
    out.localStorageItems = localStorage.length;
    out.localStorageBytes = formatBytes(lsBytes);
  } catch {}
  try {
    let ssBytes = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)!; const v = sessionStorage.getItem(k) || '';
      ssBytes += (k.length + v.length) * 2;
    }
    out.sessionStorageItems = sessionStorage.length;
    out.sessionStorageBytes = formatBytes(ssBytes);
  } catch {}
  // IndexedDB
  if ((indexedDB as any).databases) {
    try {
      const dbs = await (indexedDB as any).databases();
      out.indexedDBDatabases = `${dbs.length} (${dbs.map((d: any) => d.name).filter(Boolean).join(', ') || 'none'})`;
    } catch { out.indexedDBDatabases = 'Error'; }
  } else {
    out.indexedDBDatabases = 'Unsupported (Firefox/Safari)';
  }
  // Cookies (only this document's, not HttpOnly)
  out.cookieCount = (document.cookie || '').split(';').filter(c => c.trim().length > 0).length;
  return out;
}

// ════════════════════════════════════════════════════════════════════
// Feature support — boolean flags for every API the page may consume
// ════════════════════════════════════════════════════════════════════
export function getFeatureSupport(): FeatureSupport {
  const w = window as any;
  const n = navigator as any;
  return {
    webAssembly:        typeof w.WebAssembly !== 'undefined',
    webGL:              !!document.createElement('canvas').getContext('webgl'),
    webGL2:             !!document.createElement('canvas').getContext('webgl2'),
    webGPU:             !!n.gpu,
    webRTC:             typeof w.RTCPeerConnection !== 'undefined',
    webUSB:             !!n.usb,
    webHID:             !!n.hid,
    webMIDI:            typeof n.requestMIDIAccess === 'function',
    webBluetooth:       !!n.bluetooth,
    webShare:           typeof n.share === 'function',
    webAuthn:           !!(n.credentials && n.credentials.create),
    webCrypto:          !!(w.crypto && w.crypto.subtle),
    serviceWorker:      'serviceWorker' in n,
    pushManager:        typeof w.PushManager !== 'undefined',
    notifications:      typeof w.Notification !== 'undefined',
    geolocation:        !!n.geolocation,
    intersectionObserver: typeof w.IntersectionObserver !== 'undefined',
    resizeObserver:     typeof w.ResizeObserver !== 'undefined',
    mutationObserver:   typeof w.MutationObserver !== 'undefined',
    performanceObserver: typeof w.PerformanceObserver !== 'undefined',
    abortController:    typeof w.AbortController !== 'undefined',
    broadcastChannel:   typeof w.BroadcastChannel !== 'undefined',
    offscreenCanvas:    typeof w.OffscreenCanvas !== 'undefined',
    audioContext:       typeof (w.AudioContext || w.webkitAudioContext) !== 'undefined',
    speechSynthesis:    typeof w.speechSynthesis !== 'undefined',
    speechRecognition:  typeof (w.SpeechRecognition || w.webkitSpeechRecognition) !== 'undefined',
    paymentRequest:     typeof w.PaymentRequest !== 'undefined',
    fileSystemAccess:   typeof w.showOpenFilePicker === 'function',
    clipboard:          !!(n.clipboard && n.clipboard.writeText),
    pictureInPicture:   typeof (document as any).pictureInPictureEnabled !== 'undefined',
    fullscreen:         typeof document.documentElement.requestFullscreen === 'function',
    vibration:          typeof n.vibrate === 'function',
    wakeLock:           !!n.wakeLock,
    storageAccess:      typeof (document as any).requestStorageAccess === 'function',
  };
}

// ════════════════════════════════════════════════════════════════════
// Codec support — every common video/audio codec, plus MediaSource MSE
// ════════════════════════════════════════════════════════════════════
export function getCodecSupport(): CodecSupport {
  const v = document.createElement('video');
  const a = document.createElement('audio');
  const videoChecks: Array<[string, string]> = [
    ['H.264 (MP4)',         'video/mp4; codecs="avc1.42E01E"'],
    ['H.265/HEVC',          'video/mp4; codecs="hev1.1.6.L93.B0"'],
    ['VP8',                 'video/webm; codecs="vp8"'],
    ['VP9',                 'video/webm; codecs="vp9"'],
    ['AV1',                 'video/mp4; codecs="av01.0.05M.08"'],
    ['Theora',              'video/ogg; codecs="theora"'],
  ];
  const audioChecks: Array<[string, string]> = [
    ['AAC',                 'audio/mp4; codecs="mp4a.40.2"'],
    ['MP3',                 'audio/mpeg'],
    ['Opus',                'audio/webm; codecs="opus"'],
    ['Vorbis',              'audio/webm; codecs="vorbis"'],
    ['FLAC',                'audio/flac'],
    ['WAV',                 'audio/wav'],
  ];
  const mseSupported = typeof (window as any).MediaSource !== 'undefined';
  const mseChecks: Array<[string, string]> = mseSupported
    ? videoChecks.map(([n, t]) => [n, t])
    : [];
  return {
    video:       videoChecks.map(([name, type]) => ({ name, type, supported: v.canPlayType(type) || 'no' })),
    audio:       audioChecks.map(([name, type]) => ({ name, type, supported: a.canPlayType(type) || 'no' })),
    mediaSource: mseChecks.map(([name, type]) => ({ name, type,
      supported: mseSupported && (window as any).MediaSource.isTypeSupported(type) ? 'yes' : 'no' })),
  };
}

// ════════════════════════════════════════════════════════════════════
// Display capabilities — color gamut, HDR, motion preferences, pointer
// ════════════════════════════════════════════════════════════════════
export function getDisplayInfo(): DisplayInfo {
  const mm = (q: string): boolean => { try { return window.matchMedia(q).matches; } catch { return false; } };
  let colorGamut = 'srgb';
  if (mm('(color-gamut: rec2020)')) colorGamut = 'rec2020';
  else if (mm('(color-gamut: p3)')) colorGamut = 'p3';
  let dynamicRange = 'standard';
  if (mm('(dynamic-range: high)')) dynamicRange = 'high';

  let prefersColorScheme = 'no-preference';
  if (mm('(prefers-color-scheme: dark)'))  prefersColorScheme = 'dark';
  else if (mm('(prefers-color-scheme: light)')) prefersColorScheme = 'light';

  let prefersContrast = 'no-preference';
  if (mm('(prefers-contrast: more)')) prefersContrast = 'more';
  else if (mm('(prefers-contrast: less)')) prefersContrast = 'less';
  else if (mm('(prefers-contrast: custom)')) prefersContrast = 'custom';

  let hover = 'none';
  if (mm('(hover: hover)')) hover = 'hover';
  let pointer = 'none';
  if (mm('(pointer: coarse)')) pointer = 'coarse';
  else if (mm('(pointer: fine)')) pointer = 'fine';
  let anyPointer = 'none';
  if (mm('(any-pointer: coarse)')) anyPointer = 'coarse';
  if (mm('(any-pointer: fine)'))   anyPointer = anyPointer === 'coarse' ? 'fine + coarse' : 'fine';

  return {
    colorGamut,
    dynamicRange,
    prefersColorScheme,
    prefersReducedMotion:        mm('(prefers-reduced-motion: reduce)') ? 'reduce' : 'no-preference',
    prefersReducedTransparency:  mm('(prefers-reduced-transparency: reduce)') ? 'reduce' : 'no-preference',
    prefersContrast,
    forcedColors:                mm('(forced-colors: active)') ? 'active' : 'none',
    hover, pointer, anyPointer,
    refreshRate:                 'Unknown', // populated by measureRefreshRate if needed
  };
}

// ════════════════════════════════════════════════════════════════════
// Web Vitals — LCP, CLS, INP, TTFB, FCP via Performance APIs
// ════════════════════════════════════════════════════════════════════
export function getWebVitals(): WebVitals {
  const out: WebVitals = {
    lcp: 'N/A', cls: 'N/A', inp: 'N/A', ttfb: 'N/A', fcp: 'N/A',
    longTasks: 0, longTasksTotalTime: '0ms',
  };
  try {
    // FCP from paint timing
    const fcp = performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint');
    if (fcp) out.fcp = `${Math.round(fcp.startTime)}ms`;
    // TTFB from navigation timing
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) out.ttfb = `${Math.round(nav.responseStart - nav.requestStart)}ms`;
    // LCP from buffered LCP entries (if PerformanceObserver was used elsewhere we'd capture more)
    const lcps = performance.getEntriesByType('largest-contentful-paint') as any[];
    if (lcps.length > 0) out.lcp = `${Math.round(lcps[lcps.length - 1].startTime)}ms`;
    // CLS / INP — buffered layout-shift / event entries
    const ls = performance.getEntriesByType('layout-shift') as any[];
    if (ls.length > 0) {
      let cls = 0;
      ls.forEach(e => { if (!e.hadRecentInput) cls += e.value; });
      out.cls = cls.toFixed(4);
    }
    const events = performance.getEntriesByType('event') as any[];
    if (events.length > 0) {
      const max = events.reduce((m, e) => Math.max(m, e.duration || 0), 0);
      out.inp = `${Math.round(max)}ms`;
    }
    // Long tasks
    const lt = performance.getEntriesByType('longtask') as any[];
    out.longTasks = lt.length;
    out.longTasksTotalTime = `${Math.round(lt.reduce((s, t) => s + t.duration, 0))}ms`;
  } catch {}
  return out;
}

// ════════════════════════════════════════════════════════════════════
// Warnings synthesis — inspect the gathered data and produce an array
// of severity-tagged advisories. Rendered as a banner at the top of
// the diagnostics modal.
// ════════════════════════════════════════════════════════════════════
export function synthesizeWarnings(d: Omit<DiagnosticData, 'warnings'>): Warning[] {
  const w: Warning[] = [];
  const push = (severity: WarningSeverity, title: string, message: string) =>
    w.push({ severity, title, message });

  // GPU acceleration (the explicit ask).
  if (d.gpuCpu.accelerationStatus === 'software') {
    push('critical', 'No GPU hardware acceleration',
      `Browser is using a software renderer (${d.gpuCpu.gpuRenderer}). ` +
      `This typically means hardware acceleration is disabled in browser settings, ` +
      `the GPU driver is missing/blacklisted, or the OS is running in a VM without GPU passthrough. ` +
      `Effect: low FPS (${d.gpuCpu.fps}), high CPU, choppy animations.`);
  } else if (d.gpuCpu.accelerationStatus === 'unknown') {
    push('medium', 'Could not detect GPU',
      `WEBGL_debug_renderer_info extension blocked or WebGL unavailable. Renderer reported "${d.gpuCpu.gpuRenderer}".`);
  }

  // FPS / responsiveness
  if (d.gpuCpu.fps < 30) {
    push('high', `Low frame rate (${d.gpuCpu.fps} FPS)`,
      `Frame budget is ${d.gpuCpu.frameTiming} per frame (60 FPS target = 16.67ms). Animations and scrolling will feel sluggish.`);
  }

  // Service Worker
  if (d.serviceWorker.supported && !d.serviceWorker.registered) {
    push('high', 'Service Worker not registered',
      `The PWA service worker did not install. Offline support, asset caching, and the cache-bust pipeline are all inactive.`);
  } else if (d.serviceWorker.registered && !d.serviceWorker.controlling) {
    push('medium', 'Service Worker registered but not yet controlling',
      `First load after a deploy — the new SW is installed but only takes control after the next navigation.`);
  }

  // Storage pressure
  const usagePct = parseFloat(d.storage.usagePercent);
  if (!isNaN(usagePct) && usagePct > 80) {
    push('high', `Storage usage critical (${d.storage.usagePercent})`,
      `${d.storage.usage} of ${d.storage.quota} consumed. The browser may evict cache entries unexpectedly.`);
  } else if (!isNaN(usagePct) && usagePct > 50) {
    push('medium', `Storage usage elevated (${d.storage.usagePercent})`,
      `${d.storage.usage} of ${d.storage.quota} consumed.`);
  }

  // Memory pressure (Chromium only)
  const heapMatch = d.system.jsHeapUsed.match(/^([0-9.]+)/);
  const limitMatch = d.system.jsHeapLimit.match(/^([0-9.]+)/);
  if (heapMatch && limitMatch) {
    const used = parseFloat(heapMatch[1]);
    const lim  = parseFloat(limitMatch[1]);
    if (lim > 0 && used / lim > 0.8) {
      push('high', 'JS heap near limit',
        `Used ${d.system.jsHeapUsed} of ${d.system.jsHeapLimit}. OOM risk.`);
    }
  }

  // Security
  if (!window.isSecureContext) {
    push('high', 'Insecure context',
      `Page not served over HTTPS — secure-context APIs (Service Worker, Clipboard, WebCrypto.subtle, etc.) are unavailable.`);
  }

  // Asset payload
  const totalBytes = d.assets.reduce((s, a) => {
    const m = a.size.match(/([0-9.]+)\s*(B|KB|MB|GB)/);
    if (!m) return s;
    const mult = ({ B: 1, KB: 1024, MB: 1048576, GB: 1073741824 } as Record<string, number>)[m[2]] || 1;
    return s + parseFloat(m[1]) * mult;
  }, 0);
  if (totalBytes > 30 * 1024 * 1024) {
    push('medium', `Large asset payload (${formatBytes(totalBytes)})`,
      `${d.assets.length} assets reported, total ${formatBytes(totalBytes)}. Consider lazy-loading or video poster fallback.`);
  }

  // None cached?
  const cachedCount = d.assets.filter(a => a.cached).length;
  if (d.assets.length > 0 && cachedCount === 0) {
    push('medium', 'No assets reported as cached',
      `0 of ${d.assets.length} assets show cache hits. Either the SW precache list is missing these URLs, the panel reads cache state from response headers (x-cache: HIT) the server doesn't emit, or this is a fresh visit.`);
  }

  // Codecs
  const noH264 = !d.codecs.video.find(c => c.name === 'H.264 (MP4)' && c.supported && c.supported !== 'no');
  if (noH264) {
    push('high', 'H.264/MP4 not supported',
      `Browser cannot play .mp4 video. Background videos will not render.`);
  }

  // Reduced motion preference
  if (d.display.prefersReducedMotion === 'reduce') {
    push('info', 'User prefers reduced motion',
      `Page-wide animations should be disabled or simplified.`);
  }

  // Network (effective type)
  if (d.network.effectiveType === 'slow-2g' || d.network.effectiveType === '2g') {
    push('high', `Slow network (${d.network.effectiveType})`,
      `Disable autoplay video, reduce asset loads.`);
  }

  return w;
}

/**
 * Measure FPS over 1 second
 */
export function measureFPS(): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const startTime = performance.now();

    function countFrame() {
      frames++;
      const elapsed = performance.now() - startTime;

      if (elapsed < 1000) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = (frames / elapsed) * 1000;
        resolve(fps);
      }
    }

    requestAnimationFrame(countFrame);
  });
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
