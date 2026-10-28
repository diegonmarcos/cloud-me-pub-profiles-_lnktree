/// <reference lib="webworker" />
// Generic Service Worker template — copied verbatim into a project's
// `src/typescript/` directory by `front-sw-init.sh`. Projects with
// special routing (e.g. third-party-proxy stale-while-revalidate
// carve-outs) should fork this and add their handlers; projects with
// only static assets can use it as-is.
//
// Build-time constants are INJECTED by the `mod_esbuild_sw` step
// (see build.json + _engine.sh + front-sw-build.sh):
//
//   • BUILD_HASH         — 12-char content hash of the `hash_of` files.
//                          Any byte change → new hash → new SW bytes →
//                          browser re-installs → caches purge.
//   • BUILD_PRECACHE     — URLs to precache at install time.
//   • BUILD_ASSET_HASHES — per-asset 12-char SHA-256 prefix map. On cache
//                          miss, the SW hashes the response body and
//                          compares — if a CDN edge returned stale bytes,
//                          the SW retries with `?v=<hash>` to bust the
//                          edge cache. `{}` when verify=false.
//
// All three are esbuild --define constants. Zero hardcoded data.

declare const self: ServiceWorkerGlobalScope;
declare const BUILD_HASH: string;
declare const BUILD_PRECACHE: string[];
declare const BUILD_ASSET_HASHES: Record<string, string>;

const STATIC_CACHE  = `static-${BUILD_HASH}`;
const RUNTIME_CACHE = `runtime-${BUILD_HASH}`;
const PRECACHE: string[] = BUILD_PRECACHE;
const TAG = '[sw]';

// Always log lifecycle so the page console NEVER stays empty if the SW is
// active. Empty console on a SW-controlled page is the canonical "I have
// no idea what's running" debugging hell — we kill it by ensuring every
// install/activate/fetch-error event leaves a trail.
console.info(TAG, 'evaluated', { hash: BUILD_HASH, scope: self.registration?.scope });

self.addEventListener('install', (event) => {
  console.info(TAG, 'install', { hash: BUILD_HASH, precache: PRECACHE.length });
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((c) => precache(c, PRECACHE))
      .then(() => self.skipWaiting())
      .then(() => console.info(TAG, 'install complete · skipWaiting')),
  );
});

self.addEventListener('activate', (event) => {
  console.info(TAG, 'activate', { hash: BUILD_HASH });
  event.waitUntil(
    caches.keys().then((keys) => {
      const stale = keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE);
      console.info(TAG, 'activate · purging stale caches', { stale, keep: [STATIC_CACHE, RUNTIME_CACHE] });
      return Promise.all(stale.map((k) => caches.delete(k)));
    }).then(() => self.clients.claim())
      .then(() => console.info(TAG, 'activate complete · clients.claim')),
  );
});

// Manual escape hatch — page can postMessage({ type: 'sw-kill' }) to nuke
// this SW + caches in one shot. Mirrors window.__resetSW on the page.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'sw-kill') {
    console.warn(TAG, 'sw-kill received from client — unregistering');
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll({ includeUncontrolled: true }))
        .then((clients) => clients.forEach((c) => 'navigate' in c && (c as WindowClient).navigate(c.url))),
    );
  }
});

// Convert a request URL to the "./<file>" form used as the key in
// BUILD_ASSET_HASHES. The map is keyed by SW-scope-relative paths so it
// survives nested deploy paths (GitHub Pages, sub-directory hosting).
function scopeRelative(reqUrl: string): string {
  const scope = self.registration.scope;
  const noQuery = reqUrl.split('?')[0];
  if (noQuery.startsWith(scope)) return './' + noQuery.slice(scope.length);
  return './' + new URL(noQuery).pathname.replace(/^\//, '');
}

// First 12 hex chars of SHA-256(buf) — same truncation rule as the
// build-side `front-cache-hash.sh` engine.
async function sha256_12(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  let hex = '';
  const view = new Uint8Array(hash);
  for (let i = 0; i < 6; i++) hex += view[i].toString(16).padStart(2, '0');
  return hex;
}

// CDN-edge verification. Compare response bytes against the expected
// hash. If they differ, refetch with a `?v=<hash>` cache-buster — most
// CDNs key on the full URL, so this forces an origin pull. On any
// failure (network, crypto, missing key) fall back to the original
// response — never make caching strictly worse than the no-verify path.
async function verifyAsset(req: Request, res: Response): Promise<Response> {
  try {
    const expected = BUILD_ASSET_HASHES[scopeRelative(req.url)];
    if (!expected) return res;
    const got = await sha256_12(await res.clone().arrayBuffer());
    if (got === expected) return res;
    const bustUrl = new URL(req.url);
    bustUrl.searchParams.set('v', expected);
    const fresh = await fetch(bustUrl.toString(), { cache: 'reload' });
    if (!fresh.ok) return res;
    const freshHash = await sha256_12(await fresh.clone().arrayBuffer());
    return freshHash === expected ? fresh : res;
  } catch {
    return res;
  }
}

// Reject pathological responses before they enter the cache. Catches
// the failure modes that produced the historical "blank page on
// deploy" symptom:
//   • zero-byte body — truncated stream / partial fetch / aborted load.
//   • content-type that contradicts the request destination —
//     classic "SPA fallback poisoned the cache" where a script/style
//     request was served with text/html. The browser silently rejects
//     the load, no error fires, page sits blank.
async function isCacheable(req: Request, res: Response): Promise<boolean> {
  try {
    const buf = await res.clone().arrayBuffer();
    if (buf.byteLength === 0) return false;
  } catch { return false; }
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (req.destination === 'script' && ct && !/javascript|ecmascript/.test(ct)) return false;
  if (req.destination === 'style'  && ct && !/css/.test(ct))                   return false;
  return true;
}

// Retry with backoff. A 429 (the edge's per-IP limiter), a 5xx or a network
// error on one icon used to reach the <img> as-is: a broken "?" icon until a
// manual refresh (SuperApp Linktree, 2026-10-17). Honours Retry-After (capped).
// Never retries a 4xx other than 408/429: those are real answers.
const RETRY_DELAYS_MS = [300, 900, 2000];
function retryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
async function fetchRetry(req: Request | string, init?: RequestInit): Promise<Response> {
  let last: Response | undefined;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(req, init);
      if (!retryable(res.status) || attempt >= RETRY_DELAYS_MS.length) return res;
      last = res;
      const ra = Number(res.headers.get('retry-after'));
      const wait = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 5000) : RETRY_DELAYS_MS[attempt];
      console.warn(TAG, 'retrying', { url: typeof req === 'string' ? req : req.url, status: res.status, wait });
      await sleep(wait);
    } catch (e) {
      if (attempt >= RETRY_DELAYS_MS.length) {
        if (last) return last;
        throw e;
      }
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
}

// Only a real, complete 200 enters a cache. `ok` already excludes 429/5xx and
// opaque (status 0) responses; redirects and partial (206) bodies are out too.
async function storable(req: Request, res: Response): Promise<boolean> {
  return res.ok && res.status === 200 && res.type !== 'opaque' && await isCacheable(req, res);
}

// Precache a few at a time, each retried, instead of cache.addAll(): addAll
// fires every URL at once (a burst the edge limiter 429s) and one failure
// rejects the whole batch. A URL that still fails is simply left uncached.
async function precache(cache: Cache, urls: string[]): Promise<void> {
  const queue = [...urls];
  let failed = 0;
  const worker = async () => {
    for (let u = queue.shift(); u !== undefined; u = queue.shift()) {
      try {
        const req = new Request(u, { cache: 'reload' });
        const res = await fetchRetry(req);
        if (await storable(req, res)) await cache.put(req, res);
        else failed++;
      } catch { failed++; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, urls.length) }, worker));
  if (failed) console.warn(TAG, 'precache incomplete (continuing anyway)', { failed, total: urls.length });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Cache-first for same-origin assets only.
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedCopy = async () => (await cache.match(req)) ?? (await caches.match(req));

    // Navigations/HTML: network-first, revalidated past the HTTP cache, so a
    // stale index.html is never paired with new assets. The cache is the
    // fallback — also when the network answers with an error status.
    const isNav = req.mode === 'navigate' || req.destination === 'document';
    if (isNav) {
      try {
        const fresh = await fetchRetry(req, { cache: 'no-cache' });
        if (await storable(req, fresh)) {
          cache.put(req, fresh.clone()).catch(() => undefined);
          return fresh;
        }
        return (await cachedCopy()) ?? fresh;
      } catch {
        return (await cachedCopy()) ?? (await caches.match('./index.html')) ?? Response.error();
      }
    }

    const expected = BUILD_ASSET_HASHES[scopeRelative(req.url)];
    const hit = await cache.match(req);

    // Assets WITHOUT a build hash (icons, images, qrcode.*): stale-while-
    // revalidate. A cached copy is served at once and refreshed in the
    // background through the normal HTTP cache (an ETag revalidation is a
    // cheap 304). Used to be network-first with cache:'no-cache': every page
    // load re-requested every icon, and a 429 replaced a good cached icon.
    if (!expected) {
      if (hit) {
        event.waitUntil((async () => {
          try {
            const fresh = await fetch(req);
            if (await storable(req, fresh)) await cache.put(req, fresh.clone());
          } catch { /* offline — keep stale */ }
        })());
        return hit;
      }
      try {
        const res = await fetchRetry(req);
        if (await storable(req, res)) {
          cache.put(req, res.clone()).catch(() => undefined);
          return res;
        }
        if (!res.ok) console.warn(TAG, 'fetch non-OK after retries', { url: req.url, status: res.status });
        return (await caches.match(req)) ?? res;
      } catch (e) {
        console.error(TAG, 'fetch failed', { url: req.url, err: (e as Error)?.message });
        return (await caches.match(req)) ?? Response.error();
      }
    }

    // Assets WITH a build hash: cache-first, hash-verified. On mismatch evict
    // and fall through to network (poisoned entry recovery).
    if (hit) {
      try {
        const got = await sha256_12(await hit.clone().arrayBuffer());
        if (got === expected) return hit;
      } catch { /* fall through to network on hash failure */ }
      cache.delete(req).catch(() => undefined);
    }

    try {
      const res = await fetchRetry(req);
      if (!res.ok) {
        console.warn(TAG, 'fetch non-OK · passing through', { url: req.url, status: res.status });
        return (await caches.match(req)) ?? res;
      }
      const verified = await verifyAsset(req, res);
      if (await storable(req, verified)) {
        cache.put(req, verified.clone()).catch(() => undefined);
      }
      return verified;
    } catch (e) {
      console.error(TAG, 'fetch failed', { url: req.url, err: (e as Error)?.message });
      // Sub-resource: never the index.html shell (HTML parsed as JS/CSS
      // poisons the page) — only its own cached copy, if any.
      return (await caches.match(req)) ?? Response.error();
    }
  })());
});

export {};
