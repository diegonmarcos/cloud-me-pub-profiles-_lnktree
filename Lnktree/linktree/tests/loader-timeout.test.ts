import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The bug: preloadAsset awaited <video>.onloadeddata with no timeout, so a
// stalled .mp4 (neither onloadeddata nor onerror fires) hung Promise.all and
// the loading screen never hid. Under jsdom a <video>/<img> src never fires
// load events — the perfect stand-in for a hung download. These assertions
// pin the fix so it can't regress.

const SRC = readFileSync(
  resolve(__dirname, '../src/typescript/modules/loader.ts'),
  'utf8',
);

describe('loader hang-proofing', () => {
  it('preloadAsset has a per-asset timeout that resolves (never rejects)', () => {
    expect(SRC).toMatch(/ASSET_TIMEOUT_MS\s*=\s*\d+/);
    // the timeout callback must resolve the promise
    expect(SRC).toMatch(/setTimeout\(done,\s*timeoutMs\)/);
    // no reject path left that could leave Promise.all unsettled on error
    expect(SRC).not.toMatch(/reject\(/);
  });

  it('videos are lazy: metadata preload, not the full stream, not gated', () => {
    expect(SRC).toMatch(/preload\s*=\s*'metadata'/);
    expect(SRC).not.toMatch(/preload\s*=\s*'auto'/);
    // heavy videos live in a lazy list, not the blocking gate
    expect(SRC).toMatch(/LAZY_VIDEOS/);
    expect(SRC).toMatch(/GATE_ASSETS/);
  });

  it('initLoader races warm-up against a hard deadline', () => {
    expect(SRC).toMatch(/LOADER_DEADLINE_MS\s*=\s*\d+/);
    expect(SRC).toMatch(/Promise\.race/);
  });

  // Behavioral proof: a Promise mirroring preloadAsset's timeout branch
  // settles on its own with no load event ever firing.
  it('a timeout-guarded preload settles without any load/error event', async () => {
    const ASSET_TIMEOUT_MS = 30;
    const preload = (timeoutMs = ASSET_TIMEOUT_MS): Promise<void> =>
      new Promise((res) => {
        const done = () => { clearTimeout(t); res(); };
        const t = setTimeout(done, timeoutMs);
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadeddata = done;
        v.onerror = done;
        v.src = 'never-loads.mp4'; // jsdom fires nothing → only the timeout can settle it
      });
    const start = Date.now();
    await expect(preload()).resolves.toBeUndefined();
    expect(Date.now() - start).toBeLessThan(500);
  });
});
