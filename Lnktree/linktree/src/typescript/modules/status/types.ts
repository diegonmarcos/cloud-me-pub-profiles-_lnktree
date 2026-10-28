// Status Diagnostics Types

export interface DiagnosticData {
  warnings: Warning[];
  network: NetworkDiagnostics;
  cache: CacheDiagnostics;
  system: SystemInfo;
  assets: AssetInfo[];
  performance: PerformanceMetrics;
  gpuCpu: GPUCPUMetrics;
  serviceWorker: ServiceWorkerInfo;
  storage: StorageInfo;
  features: FeatureSupport;
  codecs: CodecSupport;
  display: DisplayInfo;
  vitals: WebVitals;
}

export type WarningSeverity = 'critical' | 'high' | 'medium' | 'info';

export interface Warning {
  severity: WarningSeverity;
  title: string;
  message: string;
}

export interface NetworkDiagnostics {
  downloadSpeed: string;
  uploadSpeed: string;
  latency: string;
  jitter: string;
  connectionType: string;
  effectiveType: string;
  downlink: string;
  rtt: string;
  clientIP: string;
  serverIP: string;
  protocol: string;
}

export interface CacheDiagnostics {
  status: string;
  cacheAge: string;
  cachedFiles: number;
  totalCachedSize: string;
  lastUpdate: string;
  validUntil: string;
}

export interface SystemInfo {
  // Identity
  browser: string;
  browserVersion: string;
  browserEngine: string;
  os: string;
  osVersion: string;
  platform: string;
  userAgent: string;
  // Locale & time
  language: string;
  languages: string;
  timezone: string;
  timezoneOffset: string;
  locale: string;
  currentTime: string;
  // Display
  screenResolution: string;
  screenAvailable: string;
  screenColorDepth: string;
  screenPixelDepth: string;
  devicePixelRatio: string;
  viewportSize: string;
  windowOuterSize: string;
  scrollPosition: string;
  orientation: string;
  // Hardware
  deviceMemory: string;
  hardwareConcurrency: string;
  maxTouchPoints: string;
  isMobile: string;
  // Privacy & security
  cookiesEnabled: string;
  doNotTrack: string;
  isSecureContext: string;
  crossOriginIsolated: string;
  // Document state
  readyState: string;
  visibilityState: string;
  hasFocus: string;
  pageURL: string;
  pageReferrer: string;
  pageTitle: string;
  pageEncoding: string;
  // Memory (JS heap)
  jsHeapUsed: string;
  jsHeapTotal: string;
  jsHeapLimit: string;
}

export interface AssetInfo {
  url: string;
  type: string;
  size: string;
  cached: boolean;
  loadTime: string;
}

export interface PerformanceMetrics {
  pageLoadTime: string;
  domContentLoaded: string;
  firstPaint: string;
  firstContentfulPaint: string;
  transferSize: string;
  resourceCount: string;
  memoryUsage: string;
}

export interface GPUCPUMetrics {
  cpuUsage: number; // 0-100%
  gpuUsage: number; // 0-100%
  gpuRenderer: string;
  gpuVendor: string;
  cpuStatus: string; // "Low" | "Medium" | "High" | "Critical"
  gpuStatus: string; // "Low" | "Medium" | "High" | "Critical"
  fps: number;
  frameTiming: string;
  // Hardware acceleration detection (NEW). Software renderers like
  // SwiftShader / llvmpipe / Mesa software / Microsoft Basic Render
  // produce dramatically lower FPS on canvas-heavy pages — flag them.
  hardwareAccelerated: boolean;
  accelerationStatus: 'hardware' | 'software' | 'unknown';
  webglVersion: string;
  webglMaxTextureSize: string;
  webglAntialias: string;
  webglExtensions: number;
  webgpuSupported: boolean;
}

export interface ServiceWorkerInfo {
  supported: boolean;
  registered: boolean;
  active: boolean;
  controlling: boolean;
  scope: string;
  scriptURL: string;
  state: string;
  cacheNames: string[];
  cacheEntries: number;
  cacheTotalBytes: string;
}

export interface StorageInfo {
  quotaSupported: boolean;
  quota: string;
  usage: string;
  usagePercent: string;
  persisted: string;
  localStorageItems: number;
  localStorageBytes: string;
  sessionStorageItems: number;
  sessionStorageBytes: string;
  indexedDBDatabases: string;
  cookieCount: number;
}

export interface FeatureSupport {
  webAssembly: boolean;
  webGL: boolean;
  webGL2: boolean;
  webGPU: boolean;
  webRTC: boolean;
  webUSB: boolean;
  webHID: boolean;
  webMIDI: boolean;
  webBluetooth: boolean;
  webShare: boolean;
  webAuthn: boolean;
  webCrypto: boolean;
  serviceWorker: boolean;
  pushManager: boolean;
  notifications: boolean;
  geolocation: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
  mutationObserver: boolean;
  performanceObserver: boolean;
  abortController: boolean;
  broadcastChannel: boolean;
  offscreenCanvas: boolean;
  audioContext: boolean;
  speechSynthesis: boolean;
  speechRecognition: boolean;
  paymentRequest: boolean;
  fileSystemAccess: boolean;
  clipboard: boolean;
  pictureInPicture: boolean;
  fullscreen: boolean;
  vibration: boolean;
  wakeLock: boolean;
  storageAccess: boolean;
}

export interface CodecCheck {
  name: string;
  type: string;
  supported: string; // 'probably' | 'maybe' | '' | 'not supported'
}

export interface CodecSupport {
  video: CodecCheck[];
  audio: CodecCheck[];
  mediaSource: CodecCheck[];
}

export interface DisplayInfo {
  colorGamut: string; // 'srgb' | 'p3' | 'rec2020' | 'unknown'
  dynamicRange: string; // 'standard' | 'high' | 'unknown'
  prefersColorScheme: string;
  prefersReducedMotion: string;
  prefersReducedTransparency: string;
  prefersContrast: string;
  forcedColors: string;
  hover: string;
  pointer: string;
  anyPointer: string;
  refreshRate: string;
}

export interface WebVitals {
  lcp: string; // Largest Contentful Paint
  cls: string; // Cumulative Layout Shift
  inp: string; // Interaction to Next Paint
  ttfb: string; // Time to First Byte
  fcp: string; // First Contentful Paint
  longTasks: number;
  longTasksTotalTime: string;
}
