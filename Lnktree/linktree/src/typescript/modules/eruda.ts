// Lazy-loads Eruda mobile devtools on demand.
//
// Eruda draws its own floating widget outside our DOM, so it is driven from
// the Dev Tools panel rather than from a bare menu button — that way there
// is always a labelled control to turn it back off, instead of a console
// the visitor has no obvious way to dismiss.

declare const eruda: { init(): void; destroy(): void };

const CDN = 'https://cdn.jsdelivr.net/npm/eruda';

let loaded = false;
let visible = false;

export function isErudaVisible(): boolean {
  return visible;
}

export function openEruda(): Promise<void> {
  if (visible) return Promise.resolve();
  if (loaded) {
    eruda.init();
    visible = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CDN;
    script.onload = () => {
      eruda.init();
      loaded = true;
      visible = true;
      resolve();
    };
    script.onerror = () => reject(new Error('failed to load eruda'));
    document.head.appendChild(script);
  });
}

export function closeEruda(): void {
  if (!visible) return;
  eruda.destroy();
  // `destroy` tears the instance down but leaves the script in the page, so
  // re-opening only needs another `init()` — no second network round trip.
  visible = false;
}

export function toggleEruda(): Promise<void> {
  if (visible) {
    closeEruda();
    return Promise.resolve();
  }
  return openEruda();
}
