// Loading Screen Module - Network diagnostics and asset preloading
import { startAsciiAnim, stopAsciiAnim } from './ascii-anim';

interface NetworkStats {
  downloadSpeed: number; // Mbps
  latency: number; // ms
  transferRate: number; // MB/s
}

interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Asset lists.
// Gate the loading screen ONLY on lightweight assets (static bg + icons).
// The heavy videos stream on their own via videoBackground.ts's <video>
// element and must never block first paint — waiting on a stalled .mp4 is
// exactly what used to hang the loader forever.
const GATE_ASSETS = [
  'public/images/background_static.jpg',
  'public/images/professional.png',
  'public/images/personal.png',
  'public/images/venture1.png',
  'public/images/venture2.png',
  'public/images/tools.png',
];
// Warmed lazily in the background, never awaited.
const LAZY_VIDEOS = [
  'public/videos/background.mp4',
  'public/videos/background2.mp4',
  'public/videos/background3.mp4',
  'public/videos/background4.mp4',
];
const CRITICAL_ASSETS = GATE_ASSETS; // cache-key back-compat

// ponytail: a slow asset must degrade to "move on", never hang the gate.
const ASSET_TIMEOUT_MS = 4000;   // per-asset cap → resolve and continue
const LOADER_DEADLINE_MS = 6000; // hard cap → page shows no matter what

const MINDMAP_URL = 'https://diegonmarcos.github.io/linktree_mindmap/';

const CACHE_KEY = 'linktree_assets_cache_v1';
const SPEED_TEST_SIZE = 500000; // 500KB for speed test
const SPEED_TEST_URL = 'public/images/background_static.jpg';

// DOM Elements
let loadingScreen: HTMLElement;
let progressBar: HTMLElement;
let progressText: HTMLElement;
let downloadSpeedEl: HTMLElement;
let latencyEl: HTMLElement;
let assetsLoadedEl: HTMLElement;
let cacheStatusEl: HTMLElement;
let transferRateEl: HTMLElement;
let loadingDetailsEl: HTMLElement;

/**
 * Check if running on file:// protocol
 */
function isFileProtocol(): boolean {
  return window.location.protocol === 'file:';
}

/**
 * Test network latency using ping (web only, fallback for local)
 */
async function testLatency(): Promise<number> {
  if (isFileProtocol()) {
    // Fallback for local file:// - simulate instant latency
    return 0;
  }

  const startTime = performance.now();
  try {
    await fetch(SPEED_TEST_URL + '?t=' + Date.now(), {
      method: 'HEAD',
      cache: 'no-store',
    });
    const endTime = performance.now();
    return Math.round(endTime - startTime);
  } catch {
    return 0;
  }
}

/**
 * Test download speed (web only, fallback for local)
 */
async function testDownloadSpeed(): Promise<number> {
  if (isFileProtocol()) {
    // Fallback for local file:// - simulate local disk speed
    return 0;
  }

  const startTime = performance.now();
  try {
    const response = await fetch(SPEED_TEST_URL + '?t=' + Date.now(), {
      cache: 'no-store',
    });
    const blob = await response.blob();
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // seconds
    const sizeInBits = blob.size * 8;
    const speedMbps = (sizeInBits / duration) / (1024 * 1024);
    return Math.round(speedMbps * 100) / 100;
  } catch {
    return 0;
  }
}

/**
 * Run network diagnostics
 */
async function runNetworkDiagnostics(): Promise<NetworkStats> {
  updateDetails('Running network diagnostics...');

  // Test latency
  updateDetails('Measuring latency...');
  const latency = await testLatency();
  latencyEl.textContent = `${latency}ms`;

  // Test download speed
  updateDetails('Testing download speed...');
  const downloadSpeed = await testDownloadSpeed();
  downloadSpeedEl.textContent = `${downloadSpeed} Mbps`;

  // Store for status screen
  localStorage.setItem('last_download_speed', `${downloadSpeed} Mbps`);

  // Calculate transfer rate
  const transferRate = Math.round((downloadSpeed / 8) * 100) / 100;
  transferRateEl.textContent = `${transferRate} MB/s`;

  return { downloadSpeed, latency, transferRate };
}

/**
 * Check if assets are cached
 */
function checkCacheStatus(): boolean {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const cacheData = JSON.parse(cached);
      const cacheAge = Date.now() - cacheData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge < maxAge) {
        cacheStatusEl.textContent = 'Cached';
        cacheStatusEl.style.color = '#10b981';
        return true;
      }
    }
  } catch (e) {
    console.warn('Cache check failed:', e);
  }

  cacheStatusEl.textContent = 'Not Cached';
  cacheStatusEl.style.color = '#f59e0b';
  return false;
}

/**
 * Preload a single asset
 */
function preloadAsset(url: string, timeoutMs = ASSET_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve) => {
    // Timeout, load, and error all resolve — the caller only needs to know
    // "stop waiting on this one". A hung download must not stall the gate.
    const done = () => { clearTimeout(t); resolve(); };
    const t = setTimeout(done, timeoutMs);
    const ext = url.split('.').pop()?.toLowerCase();

    if (ext === 'mp4' || ext === 'webm') {
      const video = document.createElement('video');
      video.preload = 'metadata'; // just the first frame/poster, not the full stream
      video.onloadeddata = done;
      video.onerror = done;
      video.src = url;
    } else {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = url;
    }
  });
}

/**
 * Preload mindmap by loading iframe (triggers browser download/cache)
 */
function preloadMindmap(): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    const timeout = setTimeout(() => {
      iframe.remove(); // idempotent: onload may fire twice (about:blank, then the page)
      resolve(); // Resolve even if timeout
    }, 10000); // 10s timeout for mindmap load

    iframe.onload = () => {
      clearTimeout(timeout);
      setTimeout(() => {
        iframe.remove(); // idempotent: onload may fire twice (about:blank, then the page)
        resolve();
      }, 1000); // Give it 1s extra to load resources
    };

    iframe.onerror = () => {
      clearTimeout(timeout);
      iframe.remove(); // idempotent: onload may fire twice (about:blank, then the page)
      resolve(); // Continue even if mindmap fails
    };

    document.body.appendChild(iframe);
    iframe.src = MINDMAP_URL;
  });
}

/**
 * Preload all assets
 */
async function preloadAssets(isCached: boolean): Promise<void> {
  const total = CRITICAL_ASSETS.length + 1; // +1 for mindmap
  let loaded = 0;

  assetsLoadedEl.textContent = `${loaded} / ${total}`;

  if (isCached) {
    // Simulate faster loading for cached assets
    updateDetails('Loading from cache...');
    for (let i = 0; i < total; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      loaded++;
      updateProgress({ loaded, total, percentage: Math.round((loaded / total) * 100) });
    }
    return;
  }

  updateDetails('Downloading assets...');

  // Preload regular assets
  const assetPromises = CRITICAL_ASSETS.map(async (url) => {
    try {
      await preloadAsset(url);
      loaded++;
      updateProgress({ loaded, total, percentage: Math.round((loaded / total) * 100) });
      updateDetails(`Loaded: ${url.split('/').pop()}`);
    } catch (error) {
      console.warn(`Asset load failed: ${url}`, error);
      loaded++; // Continue even if one fails
      updateProgress({ loaded, total, percentage: Math.round((loaded / total) * 100) });
    }
  });

  // Preload mindmap iframe (triggers browser cache)
  const mindmapPromise = preloadMindmap().then(() => {
    loaded++;
    updateProgress({ loaded, total, percentage: Math.round((loaded / total) * 100) });
    updateDetails('Loaded: mindmap');
  });

  await Promise.all([...assetPromises, mindmapPromise]);

  // Warm the heavy videos lazily — after the gate, never awaited, so a slow
  // CDN pull on the .mp4 can't delay the page. videoBackground.ts streams the
  // one it picks regardless; this just pre-warms the runtime SW cache.
  LAZY_VIDEOS.forEach((url) => { void preloadAsset(url, 20000); });

  // Mark as cached
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      assets: CRITICAL_ASSETS,
    }));
  } catch (e) {
    console.warn('Failed to set cache:', e);
  }
}

/**
 * Update progress bar
 */
function updateProgress(progress: LoadingProgress): void {
  progressBar.style.width = `${progress.percentage}%`;
  progressText.textContent = `${progress.percentage}%`;
  assetsLoadedEl.textContent = `${progress.loaded} / ${progress.total}`;
}

/**
 * Update loading details text
 */
function updateDetails(text: string): void {
  loadingDetailsEl.textContent = text;
}

/**
 * Hide loading screen
 */
function hideLoadingScreen(): void {
  updateDetails('Complete! Entering experience...');
  stopAsciiAnim();

  setTimeout(() => {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.classList.remove('active');
      loadingScreen.style.display = 'none';
    }, 500);
  }, 500);
}

/**
 * Initialize loading system
 */
export async function initLoader(): Promise<void> {
  // Get DOM elements
  loadingScreen = document.getElementById('loading-screen')!;
  progressBar = document.getElementById('progress-bar')!;
  progressText = document.getElementById('progress-text')!;
  downloadSpeedEl = document.getElementById('download-speed')!;
  latencyEl = document.getElementById('latency')!;
  assetsLoadedEl = document.getElementById('assets-loaded')!;
  cacheStatusEl = document.getElementById('cache-status')!;
  transferRateEl = document.getElementById('transfer-rate')!;
  loadingDetailsEl = document.getElementById('loading-details')!;

  if (!loadingScreen) {
    console.warn('Loading screen not found');
    return;
  }

  // Show loading screen
  loadingScreen.classList.add('active');
  startAsciiAnim();

  try {
    // Check cache first
    const isCached = checkCacheStatus();

    // Race the whole warm-up against a hard deadline so nothing —
    // diagnostics, mindmap iframe, a stalled asset — can ever keep the
    // loading screen up. Whichever wins, the page is shown.
    await Promise.race([
      (async () => {
        await runNetworkDiagnostics();
        await preloadAssets(isCached);
      })(),
      new Promise<void>((resolve) => setTimeout(resolve, LOADER_DEADLINE_MS)),
    ]);

    // Hide loading screen
    hideLoadingScreen();
  } catch (error) {
    console.error('Loading failed:', error);
    // Still hide loading screen on error
    hideLoadingScreen();
  }
}
