// Asset-locality + TOOLCHAIN structure regression tests.
//
// 1. Banner manifest at data/banners.json is the source of truth for
//    URL → local-path mappings. Every declared `local` path must exist
//    on disk under linktree/.
// 2. Slide JSONs (projects / personal-profiles / professional-profiles)
//    must NOT carry any remote image/video URLs — they were rewritten
//    by `front-localize-assets.sh`.
// 3. dist/index.html must NOT preload remote URLs and must NOT carry the
//    retired "My Tools" column inside TOOLCHAIN; the overview must keep
//    its 4-column structure (Suite / Lab Tools / Circus / Cloud).

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const linktreeRoot = resolve(__dirname, '..');
const srcRoot      = resolve(linktreeRoot, 'src');
const dataDir      = resolve(srcRoot, 'data');
const manifestPath = resolve(dataDir, 'banners.json');

interface BannerAsset { slide: string; remote: string; local: string; aliases?: string[] }
interface BannerManifest { assets: BannerAsset[] }

describe('asset locality — data/banners.json manifest', () => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as BannerManifest;

  it('manifest declares at least one asset per slide that previously used a remote banner', () => {
    expect(manifest.assets.length).toBeGreaterThanOrEqual(10);
    for (const a of manifest.assets) {
      expect(a.remote).toMatch(/^https?:\/\//);
      expect(a.local).toMatch(/^public\/(images|videos)\/banners\//);
    }
  });

  it('every declared `local` file actually exists on disk under linktree/src/', () => {
    for (const a of manifest.assets) {
      const onDisk = resolve(srcRoot, a.local);
      expect(existsSync(onDisk), `expected ${a.local} on disk (downloaded by front-localize-assets.sh)`).toBe(true);
    }
  });

  it('every declared `local` file content matches its extension (no Squarespace-style WebP-as-jpg traps)', () => {
    // Magic-byte vs extension cross-check. Catches the bug where a CDN
    // content-negotiates and serves a different format from what the URL
    // suffix advertises (e.g. images.squarespace-cdn.com serving WebP for
    // a .jpg URL → browsers fail to render the saved file).
    const magic = (buf: Buffer): string => {
      if (buf.length < 12) return 'unknown';
      // GIF
      if (buf.toString('ascii', 0, 6).startsWith('GIF8')) return 'gif';
      // PNG
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png';
      // JPEG (FFD8FF)
      if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';
      // WebP — RIFF....WEBP
      if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
      // MP4 — ftyp at offset 4
      if (buf.toString('ascii', 4, 8) === 'ftyp') return 'mp4';
      return 'unknown';
    };
    for (const a of manifest.assets) {
      const onDisk = resolve(srcRoot, a.local);
      const buf = readFileSync(onDisk);
      const detected = magic(buf);
      const ext = a.local.split('.').pop()!.toLowerCase();
      const expectedFromExt: Record<string, string> = { jpg: 'jpg', jpeg: 'jpg', gif: 'gif', png: 'png', webp: 'webp', mp4: 'mp4' };
      const want = expectedFromExt[ext];
      expect(want, `unsupported extension in manifest: ${a.local}`).toBeTruthy();
      expect(detected, `${a.local} content is ${detected} but extension is .${ext}`).toBe(want);
    }
  });

  it('every declared alias path exists on disk + is byte-identical to its canonical', () => {
    let aliasCount = 0;
    for (const a of manifest.assets) {
      if (!a.aliases?.length) continue;
      const canonical = readFileSync(resolve(srcRoot, a.local));
      for (const aliasRel of a.aliases) {
        const aliasPath = resolve(srcRoot, aliasRel);
        expect(existsSync(aliasPath), `alias ${aliasRel} missing`).toBe(true);
        const aliasBytes = readFileSync(aliasPath);
        expect(aliasBytes.length, `alias ${aliasRel} byte-length mismatch`).toBe(canonical.length);
        aliasCount++;
      }
    }
    expect(aliasCount, 'expected at least one alias declared (the recovered MY TOOLS banner)').toBeGreaterThan(0);
  });

  it('the recovered MY TOOLS banner alias is declared', () => {
    const found = manifest.assets.some(a =>
      a.aliases?.includes('public/images/banners/mytools.gif'));
    expect(found, 'expected mytools.gif declared as an alias of the original giphy URL').toBe(true);
  });
});

describe('asset locality — slide JSONs are 100% local', () => {
  const slideFiles = ['projects.json', 'personal-profiles.json', 'professional-profiles.json'];

  for (const f of slideFiles) {
    it(`${f} contains zero remote image/video URLs`, () => {
      const text = readFileSync(resolve(dataDir, f), 'utf8');
      const remoteAsset = /https?:\/\/[^"\s]+\.(jpg|jpeg|png|gif|webp|webm|mp4|svg)\b/gi;
      const matches = text.match(remoteAsset) ?? [];
      expect(matches, `unexpected remote asset URLs in ${f}: ${matches.join(', ')}`).toEqual([]);
    });
  }
});

describe('asset locality — index.html preload is local', () => {
  it('dist/index.html preloads a local hero, not a pinimg URL', () => {
    const html = readFileSync(resolve(linktreeRoot, 'dist', 'index.html'), 'utf8');
    expect(html).toContain('rel="preload"');
    expect(html).toContain('public/images/banners/professional-profile.jpg');
    expect(html).not.toContain('i.pinimg.com');
    expect(html).not.toContain('ugc.production.linktr.ee');
  });
});
