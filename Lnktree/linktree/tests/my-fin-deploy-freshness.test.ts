// Deploy-freshness regression for the b_MyData/my-fin project.
//
// The first deploy of the Ledger -> My Financials rename shipped stale
// dist artefacts (title still "Ledger", script src still data-ledger.json.js,
// hitting 404 in production). The engine's mod_copy index.html step
// apparently skipped the copy on a timestamp check after `git mv`.
//
// These tests pin the post-build invariant so a stale dist can never reach
// production again unnoticed: dist/index.html MUST track src/index.html on
// the title + data-script wiring, and the wrapper file dist/ ships MUST
// match what the HTML references.

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FRONT_ROOT = resolve(__dirname, '..', '..', '..');
const SRC_DIR    = resolve(FRONT_ROOT, 'b_MyData', 'my-fin', 'src');
const DIST_DIR   = resolve(FRONT_ROOT, 'b_MyData', 'my-fin', 'dist');

function read(p: string): string { return readFileSync(p, 'utf8'); }

describe('b_MyData/my-fin — deploy artefacts in sync with source', () => {
  it('the project lives at b_MyData/my-fin (not the legacy c_Suite/ledger path)', () => {
    expect(existsSync(SRC_DIR), 'b_MyData/my-fin/src must exist').toBe(true);
    expect(existsSync(DIST_DIR), 'b_MyData/my-fin/dist must exist').toBe(true);
    expect(existsSync(resolve(FRONT_ROOT, 'c_Suite', 'ledger')), 'legacy c_Suite/ledger path must be gone').toBe(false);
  });

  it('build.json declares the new "My Financials" name (not the old "Ledger")', () => {
    const cfg = JSON.parse(read(resolve(FRONT_ROOT, 'b_MyData', 'my-fin', 'build.json'))) as { name: string };
    expect(cfg.name).toBe('My Financials');
  });

  it('src/index.html and dist/index.html agree on the title — catches stale-dist regressions', () => {
    const src  = read(resolve(SRC_DIR,  'index.html'));
    const dist = read(resolve(DIST_DIR, 'index.html'));
    const titleRe = /<title>([^<]+)<\/title>/;
    const srcTitle  = src.match(titleRe)?.[1];
    const distTitle = dist.match(titleRe)?.[1];
    expect(srcTitle, 'src/index.html must declare a <title>').toBeTruthy();
    expect(distTitle, 'dist/index.html must declare a <title> (was build skipped?)').toBeTruthy();
    expect(distTitle).toBe(srcTitle);
    expect(distTitle).toBe('My Financials — Personal Accounting');
  });

  it('dist/index.html references data-my-fin.json.js (the new wrapper) and never data-ledger.json.js', () => {
    const dist = read(resolve(DIST_DIR, 'index.html'));
    expect(dist).toContain('data-my-fin.json.js');
    expect(dist).toContain('PORTAL_DATA["my-fin"]');
    expect(dist).not.toContain('data-ledger.json.js');
    expect(dist).not.toContain('PORTAL_DATA["ledger"]');
  });

  it('dist ships the data wrapper that index.html references — and does NOT ship the legacy one', () => {
    expect(existsSync(resolve(DIST_DIR, 'data-my-fin.json.js')), 'dist/data-my-fin.json.js must exist').toBe(true);
    expect(existsSync(resolve(DIST_DIR, 'data-ledger.json.js')), 'dist/data-ledger.json.js must NOT exist').toBe(false);
  });

  it('the data wrapper exposes PORTAL_DATA["my-fin"] with the rebranded title (not "Ledger")', () => {
    const wrapper = read(resolve(DIST_DIR, 'data-my-fin.json.js'));
    expect(wrapper).toContain('PORTAL_DATA["my-fin"]');
    expect(wrapper).toContain('My Financials — Personal Accounting');
    expect(wrapper).not.toContain('Ledger — Personal Accounting');
  });

  it('the brand wordmark in shell.ts is "My Financials" (not "Ledger") — title hydrates from the wrapper, but the wordmark is hard-coded', () => {
    const shell = read(resolve(SRC_DIR, 'typescript', 'modules', 'shell.ts'));
    expect(shell).toContain('My Financials');
    // The brand initial in the brand-mark dot was "L" → must be "M" now.
    expect(shell).toMatch(/<div class="brand-mark"><span>M<\/span><\/div>/);
    expect(shell).not.toMatch(/brand-name__word">Ledger</);
  });

  it('dist contains ZERO raw .json files — all runtime data must be wrapped as data-<key>.json.js (CORS-safe, file://-friendly, SW-safe)', async () => {
    const { readdirSync, statSync } = await import('node:fs');
    function walk(dir: string): string[] {
      const out: string[] = [];
      for (const e of readdirSync(dir)) {
        const p = resolve(dir, e);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else out.push(p);
      }
      return out;
    }
    const rawJsons = walk(DIST_DIR).filter(p => p.endsWith('.json'));
    expect(rawJsons, `dist/ must not contain raw .json (found: ${rawJsons.join(', ')})`).toEqual([]);
  });

  it('dist ships every wrapper that index.html loads (data-mock, data-nav, data-my-fin)', () => {
    for (const key of ['my-fin', 'mock', 'nav']) {
      expect(existsSync(resolve(DIST_DIR, `data-${key}.json.js`)), `dist/data-${key}.json.js must exist`).toBe(true);
    }
  });

  it('src/index.html loads every PORTAL_DATA wrapper BEFORE script.js (so the loader can read them synchronously)', () => {
    const html = read(resolve(SRC_DIR, 'index.html'));
    const wrapperOrder = ['data-my-fin.json.js', 'data-mock.json.js', 'data-nav.json.js'];
    for (const w of wrapperOrder) {
      expect(html, `index.html must load ${w}`).toContain(`<script src="${w}">`);
    }
    const scriptJsIdx = html.indexOf('<script src="script.js"');
    expect(scriptJsIdx).toBeGreaterThan(0);
    for (const w of wrapperOrder) {
      const idx = html.indexOf(`<script src="${w}">`);
      expect(idx, `${w} must appear BEFORE <script src="script.js">`).toBeLessThan(scriptJsIdx);
    }
  });

  it('loader.ts uses globalThis.PORTAL_DATA — never fetch() — so SW caches and CORS cannot break the boot', () => {
    const loader = read(resolve(SRC_DIR, 'typescript', 'modules', 'loader.ts'));
    // Strip block comments + line comments so the assertion only sees executable code.
    const code = loader
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
    expect(code).toContain('PORTAL_DATA');
    expect(code, 'loader.ts must NOT call fetch() — that bypasses the json.js wrapper convention').not.toMatch(/\bfetch\s*\(/);
  });
});
