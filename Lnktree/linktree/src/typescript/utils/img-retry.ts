// Retry failed <img> loads with backoff. An icon whose request failed once
// (e.g. a 429 from the edge's per-IP limiter, a network blip in a WebView)
// used to stay a broken "?" until a manual refresh. One capture-phase listener
// covers every <img>, including ones rendered later; images that had already
// failed before this ran are swept once at install.
const DELAYS_MS = [400, 1200, 3000];
const ATTR = 'data-img-retry';

function retry(img: HTMLImageElement): void {
  const n = Number(img.getAttribute(ATTR) || '0');
  if (n >= DELAYS_MS.length) {
    console.warn('[img-retry] giving up', img.currentSrc || img.src);
    return;
  }
  const src = img.getAttribute('src');
  if (!src || src.startsWith('data:')) return;
  img.setAttribute(ATTR, String(n + 1));
  setTimeout(() => {
    const u = new URL(src, document.baseURI);
    u.searchParams.set('r', String(n + 1));
    img.src = u.toString();
  }, DELAYS_MS[n]);
}

export function installImgRetry(): void {
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t instanceof HTMLImageElement) retry(t);
  }, true);
  document.querySelectorAll('img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) retry(img);
  });
}
