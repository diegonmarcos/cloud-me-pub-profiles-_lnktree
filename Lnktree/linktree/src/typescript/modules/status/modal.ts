// Dev Tools panel — device/network diagnostics plus the on-page console.
//
// Diagnostics ("Status") and the Eruda console used to be two separate menu
// entries, and Eruda in particular opened a floating widget with no obvious
// way back to the page. They are one window now: the console is launched
// from a labelled row inside it, so the panel's close button is always the
// way out.

import type { DiagnosticData, Warning } from './types';
import { openPanel, closePanel } from '../panel';
import { openEruda, closeEruda, isErudaVisible } from '../eruda';
import {
  getNetworkDiagnostics,
  getCacheDiagnostics,
  getSystemInfo,
  getAssetInfo,
  getPerformanceMetrics,
  getGPUCPUMetrics,
  getServiceWorkerInfo,
  getStorageInfo,
  getFeatureSupport,
  getCodecSupport,
  getDisplayInfo,
  getWebVitals,
  synthesizeWarnings,
  formatBytes,
} from './diagnostics';

const REPO = 'diegonmarcos/diegonmarcos.github.io';
const REPO_URL = `https://github.com/${REPO}`;

/**
 * Render the warnings banner — severity-coloured advisories synthesised
 * from the gathered diagnostics. Empty warnings array → renders nothing.
 */
function renderWarnings(warnings: Warning[]): string {
  if (!warnings || warnings.length === 0) {
    return `<div class="diag-warnings diag-warnings--ok">
      <span class="diag-warnings__icon">✓</span>
      <span class="diag-warnings__title">No warnings detected.</span>
    </div>`;
  }
  return `<div class="diag-warnings">
    <div class="diag-warnings__header">
      <span class="diag-warnings__title">Warnings</span>
      <span class="diag-warnings__count">${warnings.length}</span>
    </div>
    ${warnings.map(w => `
      <div class="diag-warning diag-warning--${w.severity}">
        <span class="diag-warning__sev">${w.severity.toUpperCase()}</span>
        <div class="diag-warning__body">
          <div class="diag-warning__title">${w.title}</div>
          <div class="diag-warning__message">${w.message}</div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

/**
 * Render diagnostics HTML
 */
function renderDiagnostics(data: DiagnosticData): string {
  const totalSize = data.assets.reduce((sum, asset) => {
    const match = asset.size.match(/([0-9.]+)\s*(B|KB|MB|GB)/);
    if (!match) return sum;
    const value = parseFloat(match[1]);
    const unit = match[2];
    const multiplier = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 }[unit] || 1;
    return sum + value * multiplier;
  }, 0);

  return `
    <div class="diagnostics-container">
      <!-- Warnings banner — synthesized advisories, severity-coloured -->
      ${renderWarnings(data.warnings)}

      <!-- Action bar: launch the on-page console, or copy the snapshot -->
      <div class="diag-actions">
        <button type="button" class="diag-copy-btn" id="diag-eruda-toggle" data-state="idle">
          <span class="diag-eruda-label">${isErudaVisible() ? 'Close Console' : 'Open Console'}</span>
        </button>
        <button type="button" class="diag-copy-btn" id="diag-copy-json" data-state="idle">
          <span class="diag-copy-label">Copy All Data (JSON)</span>
        </button>
      </div>
      <p class="diag-hint">
        The console (Eruda) opens over the page. Reopen Dev Tools and press
        Close Console to dismiss it.
      </p>

      <!-- GPU/CPU Usage Section -->
      <div class="diag-section">
        <h3>GPU & CPU Usage</h3>
        <div class="gpu-cpu-grid">
          <div class="usage-card cpu-card">
            <div class="usage-header">CPU Usage</div>
            <div class="usage-percentage ${data.gpuCpu.cpuStatus.toLowerCase()}">${data.gpuCpu.cpuUsage}%</div>
            <div class="usage-status">Status: ${data.gpuCpu.cpuStatus}</div>
            <div class="usage-details">Cores: ${data.system.hardwareConcurrency}</div>
          </div>
          <div class="usage-card gpu-card">
            <div class="usage-header">GPU Usage</div>
            <div class="usage-percentage ${data.gpuCpu.gpuStatus.toLowerCase()}">${data.gpuCpu.gpuUsage}%</div>
            <div class="usage-status">Status: ${data.gpuCpu.gpuStatus}</div>
            <div class="usage-details">FPS: ${data.gpuCpu.fps} (${data.gpuCpu.frameTiming})</div>
          </div>
        </div>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Hardware Acceleration:</span><span class="diag-value ${data.gpuCpu.accelerationStatus === 'hardware' ? 'status-good' : data.gpuCpu.accelerationStatus === 'software' ? 'status-bad' : 'status-warn'}">${data.gpuCpu.accelerationStatus.toUpperCase()}</span></div>
          <div class="diag-item"><span class="diag-label">GPU Renderer:</span><span class="diag-value">${data.gpuCpu.gpuRenderer}</span></div>
          <div class="diag-item"><span class="diag-label">GPU Vendor:</span><span class="diag-value">${data.gpuCpu.gpuVendor}</span></div>
          <div class="diag-item"><span class="diag-label">WebGL:</span><span class="diag-value">${data.gpuCpu.webglVersion}</span></div>
          <div class="diag-item"><span class="diag-label">Max Texture Size:</span><span class="diag-value">${data.gpuCpu.webglMaxTextureSize}</span></div>
          <div class="diag-item"><span class="diag-label">Antialias:</span><span class="diag-value">${data.gpuCpu.webglAntialias}</span></div>
          <div class="diag-item"><span class="diag-label">WebGL Extensions:</span><span class="diag-value">${data.gpuCpu.webglExtensions}</span></div>
          <div class="diag-item"><span class="diag-label">WebGPU:</span><span class="diag-value ${data.gpuCpu.webgpuSupported ? 'status-good' : 'status-warn'}">${data.gpuCpu.webgpuSupported ? 'Supported' : 'Unsupported'}</span></div>
        </div>
      </div>

      <!-- Network Section -->
      <div class="diag-section">
        <h3>Network Information</h3>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Download Speed:</span><span class="diag-value">${data.network.downloadSpeed}</span></div>
          <div class="diag-item"><span class="diag-label">Latency:</span><span class="diag-value">${data.network.latency}</span></div>
          <div class="diag-item"><span class="diag-label">Jitter:</span><span class="diag-value">${data.network.jitter}</span></div>
          <div class="diag-item"><span class="diag-label">Connection Type:</span><span class="diag-value">${data.network.connectionType}</span></div>
          <div class="diag-item"><span class="diag-label">Effective Type:</span><span class="diag-value">${data.network.effectiveType}</span></div>
          <div class="diag-item"><span class="diag-label">Downlink:</span><span class="diag-value">${data.network.downlink}</span></div>
          <div class="diag-item"><span class="diag-label">RTT:</span><span class="diag-value">${data.network.rtt}</span></div>
          <div class="diag-item"><span class="diag-label">Client IP:</span><span class="diag-value">${data.network.clientIP}</span></div>
          <div class="diag-item"><span class="diag-label">Server:</span><span class="diag-value">${data.network.serverIP}</span></div>
          <div class="diag-item"><span class="diag-label">Protocol:</span><span class="diag-value">${data.network.protocol}</span></div>
        </div>
      </div>

      <!-- Cache Section -->
      <div class="diag-section">
        <h3>Cache Status</h3>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Status:</span><span class="diag-value ${data.cache.status === 'Valid' ? 'status-good' : 'status-warn'}">${data.cache.status}</span></div>
          <div class="diag-item"><span class="diag-label">Cache Age:</span><span class="diag-value">${data.cache.cacheAge}</span></div>
          <div class="diag-item"><span class="diag-label">Cached Files:</span><span class="diag-value">${data.cache.cachedFiles}</span></div>
          <div class="diag-item"><span class="diag-label">Total Size:</span><span class="diag-value">${formatBytes(totalSize)}</span></div>
          <div class="diag-item"><span class="diag-label">Last Update:</span><span class="diag-value">${data.cache.lastUpdate}</span></div>
          <div class="diag-item"><span class="diag-label">Valid Until:</span><span class="diag-value">${data.cache.validUntil}</span></div>
        </div>
      </div>

      <!-- System Section — extensive: identity, locale, display, hw, privacy, doc -->
      <div class="diag-section diag-section--wide">
        <h3>System Information</h3>
        <h4 class="diag-subhead">Identity</h4>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Browser:</span><span class="diag-value">${data.system.browser} ${data.system.browserVersion}</span></div>
          <div class="diag-item"><span class="diag-label">Engine:</span><span class="diag-value">${data.system.browserEngine}</span></div>
          <div class="diag-item"><span class="diag-label">OS:</span><span class="diag-value">${data.system.os} ${data.system.osVersion}</span></div>
          <div class="diag-item"><span class="diag-label">Platform:</span><span class="diag-value">${data.system.platform}</span></div>
          <div class="diag-item diag-item--wide"><span class="diag-label">User Agent:</span><span class="diag-value diag-value--monospace">${data.system.userAgent}</span></div>
        </div>
        <h4 class="diag-subhead">Locale &amp; Time</h4>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Language:</span><span class="diag-value">${data.system.language}</span></div>
          <div class="diag-item"><span class="diag-label">Languages:</span><span class="diag-value">${data.system.languages}</span></div>
          <div class="diag-item"><span class="diag-label">Locale:</span><span class="diag-value">${data.system.locale}</span></div>
          <div class="diag-item"><span class="diag-label">Timezone:</span><span class="diag-value">${data.system.timezone}</span></div>
          <div class="diag-item"><span class="diag-label">UTC Offset:</span><span class="diag-value">${data.system.timezoneOffset}</span></div>
          <div class="diag-item"><span class="diag-label">Now:</span><span class="diag-value">${data.system.currentTime}</span></div>
        </div>
        <h4 class="diag-subhead">Display</h4>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Screen:</span><span class="diag-value">${data.system.screenResolution}</span></div>
          <div class="diag-item"><span class="diag-label">Available:</span><span class="diag-value">${data.system.screenAvailable}</span></div>
          <div class="diag-item"><span class="diag-label">Color Depth:</span><span class="diag-value">${data.system.screenColorDepth}</span></div>
          <div class="diag-item"><span class="diag-label">Pixel Depth:</span><span class="diag-value">${data.system.screenPixelDepth}</span></div>
          <div class="diag-item"><span class="diag-label">DPR:</span><span class="diag-value">${data.system.devicePixelRatio}</span></div>
          <div class="diag-item"><span class="diag-label">Viewport:</span><span class="diag-value">${data.system.viewportSize}</span></div>
          <div class="diag-item"><span class="diag-label">Window:</span><span class="diag-value">${data.system.windowOuterSize}</span></div>
          <div class="diag-item"><span class="diag-label">Scroll:</span><span class="diag-value">${data.system.scrollPosition}</span></div>
          <div class="diag-item"><span class="diag-label">Orientation:</span><span class="diag-value">${data.system.orientation}</span></div>
        </div>
        <h4 class="diag-subhead">Hardware</h4>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Device Memory:</span><span class="diag-value">${data.system.deviceMemory}</span></div>
          <div class="diag-item"><span class="diag-label">CPU Cores:</span><span class="diag-value">${data.system.hardwareConcurrency}</span></div>
          <div class="diag-item"><span class="diag-label">Touch Points:</span><span class="diag-value">${data.system.maxTouchPoints}</span></div>
          <div class="diag-item"><span class="diag-label">Mobile:</span><span class="diag-value">${data.system.isMobile}</span></div>
        </div>
        <h4 class="diag-subhead">Privacy &amp; Security</h4>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Cookies:</span><span class="diag-value">${data.system.cookiesEnabled}</span></div>
          <div class="diag-item"><span class="diag-label">Do Not Track:</span><span class="diag-value">${data.system.doNotTrack}</span></div>
          <div class="diag-item"><span class="diag-label">Secure Context:</span><span class="diag-value ${data.system.isSecureContext === 'Yes' ? 'status-good' : 'status-bad'}">${data.system.isSecureContext}</span></div>
          <div class="diag-item"><span class="diag-label">Cross-Origin Isolated:</span><span class="diag-value">${data.system.crossOriginIsolated}</span></div>
        </div>
        <h4 class="diag-subhead">Document</h4>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Ready State:</span><span class="diag-value">${data.system.readyState}</span></div>
          <div class="diag-item"><span class="diag-label">Visibility:</span><span class="diag-value">${data.system.visibilityState}</span></div>
          <div class="diag-item"><span class="diag-label">Has Focus:</span><span class="diag-value">${data.system.hasFocus}</span></div>
          <div class="diag-item"><span class="diag-label">Encoding:</span><span class="diag-value">${data.system.pageEncoding}</span></div>
          <div class="diag-item diag-item--wide"><span class="diag-label">URL:</span><span class="diag-value diag-value--monospace">${data.system.pageURL}</span></div>
          <div class="diag-item diag-item--wide"><span class="diag-label">Referrer:</span><span class="diag-value diag-value--monospace">${data.system.pageReferrer}</span></div>
          <div class="diag-item diag-item--wide"><span class="diag-label">Title:</span><span class="diag-value">${data.system.pageTitle}</span></div>
        </div>
        <h4 class="diag-subhead">JS Heap (Chromium)</h4>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Used:</span><span class="diag-value">${data.system.jsHeapUsed}</span></div>
          <div class="diag-item"><span class="diag-label">Total:</span><span class="diag-value">${data.system.jsHeapTotal}</span></div>
          <div class="diag-item"><span class="diag-label">Limit:</span><span class="diag-value">${data.system.jsHeapLimit}</span></div>
        </div>
      </div>

      <!-- Service Worker -->
      <div class="diag-section">
        <h3>Service Worker</h3>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Supported:</span><span class="diag-value ${data.serviceWorker.supported ? 'status-good' : 'status-bad'}">${data.serviceWorker.supported ? 'Yes' : 'No'}</span></div>
          <div class="diag-item"><span class="diag-label">Registered:</span><span class="diag-value ${data.serviceWorker.registered ? 'status-good' : 'status-warn'}">${data.serviceWorker.registered ? 'Yes' : 'No'}</span></div>
          <div class="diag-item"><span class="diag-label">Active:</span><span class="diag-value ${data.serviceWorker.active ? 'status-good' : 'status-warn'}">${data.serviceWorker.active ? 'Yes' : 'No'}</span></div>
          <div class="diag-item"><span class="diag-label">Controlling:</span><span class="diag-value ${data.serviceWorker.controlling ? 'status-good' : 'status-warn'}">${data.serviceWorker.controlling ? 'Yes' : 'No'}</span></div>
          <div class="diag-item"><span class="diag-label">State:</span><span class="diag-value">${data.serviceWorker.state}</span></div>
          <div class="diag-item"><span class="diag-label">Cache Names:</span><span class="diag-value">${data.serviceWorker.cacheNames.length}</span></div>
          <div class="diag-item"><span class="diag-label">Total Entries:</span><span class="diag-value">${data.serviceWorker.cacheEntries}</span></div>
          <div class="diag-item"><span class="diag-label">Cached Bytes:</span><span class="diag-value">${data.serviceWorker.cacheTotalBytes}</span></div>
          <div class="diag-item diag-item--wide"><span class="diag-label">Scope:</span><span class="diag-value diag-value--monospace">${data.serviceWorker.scope}</span></div>
          <div class="diag-item diag-item--wide"><span class="diag-label">Script URL:</span><span class="diag-value diag-value--monospace">${data.serviceWorker.scriptURL}</span></div>
          <div class="diag-item diag-item--wide"><span class="diag-label">Caches:</span><span class="diag-value diag-value--monospace">${data.serviceWorker.cacheNames.join(', ') || '(none)'}</span></div>
        </div>
      </div>

      <!-- Storage -->
      <div class="diag-section">
        <h3>Storage</h3>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Quota Supported:</span><span class="diag-value">${data.storage.quotaSupported ? 'Yes' : 'No'}</span></div>
          <div class="diag-item"><span class="diag-label">Quota:</span><span class="diag-value">${data.storage.quota}</span></div>
          <div class="diag-item"><span class="diag-label">Usage:</span><span class="diag-value">${data.storage.usage}</span></div>
          <div class="diag-item"><span class="diag-label">Usage %:</span><span class="diag-value">${data.storage.usagePercent}</span></div>
          <div class="diag-item"><span class="diag-label">Persisted:</span><span class="diag-value">${data.storage.persisted}</span></div>
          <div class="diag-item"><span class="diag-label">localStorage Items:</span><span class="diag-value">${data.storage.localStorageItems}</span></div>
          <div class="diag-item"><span class="diag-label">localStorage Size:</span><span class="diag-value">${data.storage.localStorageBytes}</span></div>
          <div class="diag-item"><span class="diag-label">sessionStorage Items:</span><span class="diag-value">${data.storage.sessionStorageItems}</span></div>
          <div class="diag-item"><span class="diag-label">sessionStorage Size:</span><span class="diag-value">${data.storage.sessionStorageBytes}</span></div>
          <div class="diag-item"><span class="diag-label">Cookies:</span><span class="diag-value">${data.storage.cookieCount}</span></div>
          <div class="diag-item diag-item--wide"><span class="diag-label">IndexedDB:</span><span class="diag-value">${data.storage.indexedDBDatabases}</span></div>
        </div>
      </div>

      <!-- Display Capabilities -->
      <div class="diag-section">
        <h3>Display Capabilities</h3>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Color Gamut:</span><span class="diag-value">${data.display.colorGamut}</span></div>
          <div class="diag-item"><span class="diag-label">Dynamic Range:</span><span class="diag-value">${data.display.dynamicRange}</span></div>
          <div class="diag-item"><span class="diag-label">Color Scheme:</span><span class="diag-value">${data.display.prefersColorScheme}</span></div>
          <div class="diag-item"><span class="diag-label">Reduced Motion:</span><span class="diag-value">${data.display.prefersReducedMotion}</span></div>
          <div class="diag-item"><span class="diag-label">Reduced Transparency:</span><span class="diag-value">${data.display.prefersReducedTransparency}</span></div>
          <div class="diag-item"><span class="diag-label">Contrast:</span><span class="diag-value">${data.display.prefersContrast}</span></div>
          <div class="diag-item"><span class="diag-label">Forced Colors:</span><span class="diag-value">${data.display.forcedColors}</span></div>
          <div class="diag-item"><span class="diag-label">Hover:</span><span class="diag-value">${data.display.hover}</span></div>
          <div class="diag-item"><span class="diag-label">Pointer:</span><span class="diag-value">${data.display.pointer}</span></div>
          <div class="diag-item"><span class="diag-label">Any Pointer:</span><span class="diag-value">${data.display.anyPointer}</span></div>
        </div>
      </div>

      <!-- Web Vitals -->
      <div class="diag-section">
        <h3>Web Vitals</h3>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">LCP:</span><span class="diag-value">${data.vitals.lcp}</span></div>
          <div class="diag-item"><span class="diag-label">CLS:</span><span class="diag-value">${data.vitals.cls}</span></div>
          <div class="diag-item"><span class="diag-label">INP:</span><span class="diag-value">${data.vitals.inp}</span></div>
          <div class="diag-item"><span class="diag-label">TTFB:</span><span class="diag-value">${data.vitals.ttfb}</span></div>
          <div class="diag-item"><span class="diag-label">FCP:</span><span class="diag-value">${data.vitals.fcp}</span></div>
          <div class="diag-item"><span class="diag-label">Long Tasks:</span><span class="diag-value">${data.vitals.longTasks}</span></div>
          <div class="diag-item"><span class="diag-label">Long Tasks Time:</span><span class="diag-value">${data.vitals.longTasksTotalTime}</span></div>
        </div>
      </div>

      <!-- Codec Support -->
      <div class="diag-section diag-section--wide">
        <h3>Codec Support</h3>
        <h4 class="diag-subhead">Video</h4>
        <div class="diag-grid">
          ${data.codecs.video.map(c => `<div class="diag-item"><span class="diag-label">${c.name}:</span><span class="diag-value ${c.supported && c.supported !== 'no' ? 'status-good' : 'status-bad'}">${c.supported || 'no'}</span></div>`).join('')}
        </div>
        <h4 class="diag-subhead">Audio</h4>
        <div class="diag-grid">
          ${data.codecs.audio.map(c => `<div class="diag-item"><span class="diag-label">${c.name}:</span><span class="diag-value ${c.supported && c.supported !== 'no' ? 'status-good' : 'status-bad'}">${c.supported || 'no'}</span></div>`).join('')}
        </div>
        ${data.codecs.mediaSource.length > 0 ? `<h4 class="diag-subhead">MediaSource (MSE)</h4>
        <div class="diag-grid">
          ${data.codecs.mediaSource.map(c => `<div class="diag-item"><span class="diag-label">${c.name}:</span><span class="diag-value ${c.supported === 'yes' ? 'status-good' : 'status-bad'}">${c.supported}</span></div>`).join('')}
        </div>` : ''}
      </div>

      <!-- Feature Support -->
      <div class="diag-section diag-section--wide">
        <h3>Feature Support</h3>
        <div class="diag-grid">
          ${Object.entries(data.features).map(([k, v]) => `<div class="diag-item"><span class="diag-label">${k}:</span><span class="diag-value ${v ? 'status-good' : 'status-bad'}">${v ? '✓' : '✗'}</span></div>`).join('')}
        </div>
      </div>

      <!-- Performance Section -->
      <div class="diag-section">
        <h3>Performance Metrics</h3>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Page Load Time:</span><span class="diag-value">${data.performance.pageLoadTime}</span></div>
          <div class="diag-item"><span class="diag-label">DOM Content Loaded:</span><span class="diag-value">${data.performance.domContentLoaded}</span></div>
          <div class="diag-item"><span class="diag-label">First Paint:</span><span class="diag-value">${data.performance.firstPaint}</span></div>
          <div class="diag-item"><span class="diag-label">First Contentful Paint:</span><span class="diag-value">${data.performance.firstContentfulPaint}</span></div>
          <div class="diag-item"><span class="diag-label">Transfer Size:</span><span class="diag-value">${data.performance.transferSize}</span></div>
          <div class="diag-item"><span class="diag-label">Resources Loaded:</span><span class="diag-value">${data.performance.resourceCount}</span></div>
          <div class="diag-item"><span class="diag-label">Memory Usage:</span><span class="diag-value">${data.performance.memoryUsage}</span></div>
        </div>
      </div>

      <!-- Sources Section -->
      <div class="diag-section">
        <h3>Sources</h3>
        <div class="diag-sources">
          <a class="diag-source-link" href="${REPO_URL}/tree/main/a_Portals/linktree" target="_blank" rel="noopener">
            <img src="public/icons/brand-github.svg" alt="GitHub" width="16" height="16"> Repo
          </a>
          <a class="diag-source-link" href="https://github.com/orgs/diegonmarcos/packages" target="_blank" rel="noopener">
            <img src="public/icons/brand-github.svg" alt="GHCR" width="16" height="16"> GHCR
          </a>
          <a class="diag-source-link" href="${REPO_URL}/releases" target="_blank" rel="noopener">
            <img src="public/icons/brand-github.svg" alt="Releases" width="16" height="16"> Releases
          </a>
        </div>
      </div>

      <!-- Assets Section -->
      <div class="diag-section">
        <h3>Asset Information (${data.assets.length} files)</h3>
        <div class="assets-table">
          <div class="assets-table-header">
            <span>File</span>
            <span>Type</span>
            <span>Size</span>
            <span>Load Time</span>
            <span>Cached</span>
          </div>
          ${data.assets.map(asset => `
            <div class="assets-table-row">
              <span class="asset-name">${asset.url}</span>
              <span class="asset-type">${asset.type}</span>
              <span class="asset-size">${asset.size}</span>
              <span class="asset-loadtime">${asset.loadTime}</span>
              <span class="asset-cached ${asset.cached ? 'cached-yes' : 'cached-no'}">${asset.cached ? '\u2713' : '\u2717'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Gather every diagnostic. Each gatherer is fault-tolerant; partial
 * failures still produce a renderable snapshot with "Unknown"/"N/A"
 * fallbacks rather than an empty panel.
 */
async function gather(): Promise<DiagnosticData> {
  const [network, assets, gpuCpu, serviceWorker, storage] = await Promise.all([
    getNetworkDiagnostics(),
    getAssetInfo(),
    getGPUCPUMetrics(),
    getServiceWorkerInfo(),
    getStorageInfo(),
  ]);
  const partial = {
    network, assets, gpuCpu, serviceWorker, storage,
    cache:       getCacheDiagnostics(),
    system:      getSystemInfo(),
    performance: getPerformanceMetrics(),
    features:    getFeatureSupport(),
    codecs:      getCodecSupport(),
    display:     getDisplayInfo(),
    vitals:      getWebVitals(),
  };
  return { ...partial, warnings: synthesizeWarnings(partial) };
}

/**
 * Wire the "Copy All Data (JSON)" button — serialises the FULL captured
 * snapshot as pretty JSON to the clipboard, with a hidden-textarea fallback
 * for browsers without navigator.clipboard.
 */
function wireCopyButton(body: HTMLElement, data: DiagnosticData): void {
  const copyBtn = body.querySelector('#diag-copy-json') as HTMLButtonElement | null;
  if (!copyBtn) return;

  copyBtn.addEventListener('click', async () => {
    const payload = JSON.stringify(data, null, 2);
    const label = copyBtn.querySelector('.diag-copy-label') as HTMLSpanElement | null;
    const restore = (): void => {
      if (label) label.textContent = 'Copy All Data (JSON)';
      copyBtn.dataset.state = 'idle';
      copyBtn.disabled = false;
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const ta = document.createElement('textarea');
        ta.value = payload;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      if (label) label.textContent = `Copied ${payload.length.toLocaleString()} chars`;
      copyBtn.dataset.state = 'ok';
    } catch (err) {
      if (label) label.textContent = 'Copy failed (see console)';
      copyBtn.dataset.state = 'err';
      console.error('diag-copy-json failed:', err);
    }
    copyBtn.disabled = true;
    setTimeout(restore, 1800);
  });
}

/**
 * Wire the console launcher. Opening Eruda closes this panel, because the
 * console renders over the whole viewport and a panel underneath it is just
 * in the way.
 */
function wireErudaButton(body: HTMLElement): void {
  const btn = body.querySelector('#diag-eruda-toggle') as HTMLButtonElement | null;
  if (!btn) return;
  const label = btn.querySelector('.diag-eruda-label') as HTMLSpanElement | null;

  btn.addEventListener('click', async () => {
    if (isErudaVisible()) {
      closeEruda();
      if (label) label.textContent = 'Open Console';
      return;
    }
    btn.disabled = true;
    try {
      await openEruda();
      closePanel();
    } catch (err) {
      console.error('eruda failed to load:', err);
      if (label) label.textContent = 'Console unavailable (offline?)';
      btn.dataset.state = 'err';
    }
    btn.disabled = false;
  });
}

/**
 * Initialize the Dev Tools panel (diagnostics + console).
 */
export function initStatusModal(): void {
  document.getElementById('devtools-toggle')?.addEventListener('click', () => {
    let data: DiagnosticData | null = null;
    openPanel({
      title: 'Dev Tools',
      loadingLabel: 'Gathering diagnostics…',
      render: async () => {
        data = await gather();
        return renderDiagnostics(data);
      },
      onMount: (body) => {
        if (data) wireCopyButton(body, data);
        wireErudaButton(body);
      },
    });
  });
}
