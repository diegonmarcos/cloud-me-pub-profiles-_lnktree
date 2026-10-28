// Build-output integration test — runs against the actual `dist/` files
// produced by `bash build.sh build`. Ensures the Phase A-G perf wiring
// survives the build pipeline (esbuild minification doesn't strip
// fetchpriority / preload / SW registration / manifest link).

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve(__dirname, '..', 'dist');
const dist = (rel: string): string =>
  existsSync(resolve(distDir, rel)) ? readFileSync(resolve(distDir, rel), 'utf8') : '';

describe('build output — Phase A-G wiring survives the build', () => {
  it('dist/style.css carries content-visibility + contain rules', () => {
    const css = dist('style.css');
    expect(css.length).toBeGreaterThan(0);
    expect(css).toContain('content-visibility');
    expect(css).toContain('contain-intrinsic-size');
    expect(css).toContain('isolation:isolate');
  });

  it('dist/index.html declares the hero preload + manifest link', () => {
    const html = dist('index.html');
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('rel="preload"');
    expect(html).toContain('fetchpriority="high"');
    expect(html).toContain('rel="manifest"');
  });

  it('dist/manifest.webmanifest declares the full PWA install spec — all icons exist on disk + dimensions match the declared sizes', () => {
    const m = dist('manifest.webmanifest');
    expect(m.length).toBeGreaterThan(0);
    interface Icon { src: string; sizes: string; type: string; purpose?: string }
    interface Manifest { start_url: string; display: string; icons: Icon[]; theme_color: string; background_color: string; categories?: string[] }
    const parsed = JSON.parse(m) as Manifest;

    expect(parsed.start_url).toBeTruthy();
    expect(parsed.display).toBe('standalone');
    expect(parsed.theme_color).toBeTruthy();
    expect(parsed.background_color).toBeTruthy();

    // Required icons: at least one any-purpose at 192x192, one at 512x512,
    // and one maskable. Otherwise Android adaptive icons will look wrong.
    const any192     = parsed.icons.find(i => i.sizes === '192x192' && (!i.purpose || i.purpose.includes('any')));
    const any512     = parsed.icons.find(i => i.sizes === '512x512' && (!i.purpose || i.purpose.includes('any')));
    const maskable   = parsed.icons.find(i => i.purpose && i.purpose.includes('maskable'));
    expect(any192,   'manifest must declare a 192x192 any-purpose icon').toBeTruthy();
    expect(any512,   'manifest must declare a 512x512 any-purpose icon').toBeTruthy();
    expect(maskable, 'manifest must declare a maskable icon for Android adaptive').toBeTruthy();

    // Each declared icon file must actually exist in dist (via public/ symlink)
    // AND its real PNG dimensions must match the declared `sizes` string.
    const distRoot = resolve(__dirname, '..', 'dist');
    const readPngSize = (path: string): { w: number; h: number } => {
      const buf = readFileSync(path);
      // PNG IHDR chunk: signature 8 bytes + 4 length + 4 type ("IHDR") + 4 width + 4 height
      expect(buf.toString('ascii', 1, 4)).toBe('PNG');
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    };
    for (const icon of parsed.icons) {
      const onDisk = resolve(distRoot, icon.src);
      expect(existsSync(onDisk), `icon ${icon.src} must exist in dist`).toBe(true);
      const [wantW, wantH] = icon.sizes.split('x').map(n => parseInt(n, 10));
      const { w, h } = readPngSize(onDisk);
      expect(w, `${icon.src} actual width must match declared sizes`).toBe(wantW);
      expect(h, `${icon.src} actual height must match declared sizes`).toBe(wantH);
    }
  });

  it('dist/script-service-worker.js exists and carries an injected BUILD_HASH-derived cache key', () => {
    const sw = dist('script-service-worker.js');
    expect(sw.length).toBeGreaterThan(0);
    // The cache name template is `static-${BUILD_HASH}` — after esbuild
    // `--define` substitution + minification, expect literal "static-"
    // followed by a 12-char hex hash from the engine.
    expect(sw).toMatch(/static-[0-9a-f]{12}/);
    expect(sw).toMatch(/runtime-[0-9a-f]{12}/);
    // The two cache names must use the SAME hash (single source of truth).
    const staticHash  = sw.match(/static-([0-9a-f]{12})/)?.[1];
    const runtimeHash = sw.match(/runtime-([0-9a-f]{12})/)?.[1];
    expect(staticHash).toBeTruthy();
    expect(staticHash).toBe(runtimeHash);
  });

  it('SW BUILD_HASH is content-derived: changing dist/script.js bytes would change the hash', () => {
    // Sanity — the hash must NOT be the literal string "BUILD_HASH"
    // (which would mean the --define substitution didn't run).
    const sw = dist('script-service-worker.js');
    expect(sw).not.toContain('BUILD_HASH');
    // Older hardcoded "linktree-v1" must be gone.
    expect(sw).not.toContain('linktree-v1');
  });

  it('dist/script.js registers the SW + auto-reloads on controllerchange (single-refresh UX)', () => {
    const js = dist('script.js');
    expect(js.length).toBeGreaterThan(0);
    expect(js).toContain('serviceWorker');
    expect(js).toContain('script-service-worker.js');
    // Without this listener the user has to refresh TWICE to see fresh
    // content after a new build (1st refresh: old SW serves from cache,
    // new SW activates in background; 2nd refresh: new SW serves).
    expect(js).toContain('controllerchange');
    // Manual escape-hatch must also be wired (`__resetSW()` in DevTools).
    expect(js).toContain('__resetSW');
  });

  it('dist/script.js contains the WebGL bg + tilt3d modules', () => {
    const js = dist('script.js');
    expect(js).toContain('initCanvasBackground'.slice(0, 4));
    expect(js).toContain('rotateY');
  });

  it('dist/script.js contains an idle-callback shim', () => {
    const js = dist('script.js');
    expect(js).toMatch(/requestIdleCallback/);
  });
});
