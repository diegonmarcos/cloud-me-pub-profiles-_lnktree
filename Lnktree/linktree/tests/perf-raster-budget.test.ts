// Verify the raster-cost gating fix: invisible-by-default elements must
// NOT carry `backdrop-filter` on their base selector, and must NOT run
// the heavy `holographicShift` keyframe outside a `:hover` block. The
// data trail: trace evidence (Apr 28, ../../../Downloads/Trace-2026-04-28*.json.gz)
// showed worst-frame on desktop = 477ms vs mobile 188ms, dominated by
// RasterTask scaling with viewport pixel area. Killing the always-on
// raster surfaces (filter+animation on opacity:0 layers) is the targeted
// fix that should bring desktop worst-frame closer to the mobile number.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const distCss = (): string => {
  const p = resolve(__dirname, '..', 'dist', 'style.css');
  if (!existsSync(p)) {
    throw new Error('dist/style.css not found — run `bash build.sh build` first');
  }
  return readFileSync(p, 'utf8');
};

// Match a top-level CSS rule whose selector contains the given anchor as a
// COMPLETE token (so `.foo` matches `.foo {…}` but not `.foo-bar {…}`).
// CSS at this stage is sass-compiled but still readable (esbuild only
// minifies JS, not CSS in our pipeline).
const findBlock = (css: string, anchor: string): string | null => {
  // Look for a `selector { ... }` chunk where the selector matches anchor
  // exactly (followed by `{` or whitespace then `{`, or `,`).
  // Use a state-machine-style scan to handle nested-{ in declarations like
  // gradients (none, but defensive).
  const re = new RegExp(
    String.raw`(?:^|[\s,}])\s*(${anchor.replace(/[.[\]()*+?^$|\\]/g, '\\$&')})(?:\s|\{)`,
    'g',
  );
  const m = re.exec(css);
  if (!m) return null;
  // Walk forward from the `{` of this rule until matching `}`.
  let i = css.indexOf('{', m.index);
  if (i < 0) return null;
  let depth = 1;
  i += 1;
  const start = i;
  while (i < css.length && depth > 0) {
    const c = css[i];
    if (c === '{') depth += 1;
    else if (c === '}') depth -= 1;
    i += 1;
  }
  return css.slice(start, i - 1);
};

describe('perf raster budget — backdrop-filter gated on visibility', () => {
  it('.vm-toast base block has no backdrop-filter (only inside &.vm-toast-visible)', () => {
    const css = distCss();
    const baseBlock = findBlock(css, '.vm-toast');
    expect(baseBlock, '.vm-toast block must exist in compiled CSS').not.toBeNull();
    expect(baseBlock!).not.toContain('backdrop-filter');
    // The visible-state selector MUST carry the filter.
    expect(css).toMatch(/\.vm-toast\.vm-toast-visible[^{]*\{[^}]*backdrop-filter/);
  });

  it('.mindmap-overlay base block has no backdrop-filter (only inside &.active)', () => {
    const css = distCss();
    const baseBlock = findBlock(css, '.mindmap-overlay');
    expect(baseBlock, '.mindmap-overlay block must exist in compiled CSS').not.toBeNull();
    expect(baseBlock!).not.toContain('backdrop-filter');
    expect(css).toMatch(/\.mindmap-overlay\.active[^{]*\{[^}]*backdrop-filter/);
  });

  it('holographic-icon ::before pseudo does NOT animate or filter outside :hover', () => {
    const css = distCss();
    // After sass compile of mixin consumers (.social-icons a, .contact-icons a, .profile-icons a),
    // bare ::before blocks appear as `<sel>::before { ... }` (no `:hover` in the chain).
    // Hover-gated blocks appear as `<sel>:hover::before { ... }`.
    const bareBefore = css.match(/[^{}]*::before\s*\{[^}]*\}/g) ?? [];
    for (const block of bareBefore) {
      // Ignore the hover variants
      if (/:hover/.test(block)) continue;
      // Pseudo-elements that aren't on holographic icons can be ignored
      if (!/(?:social-icons|contact-icons|profile-icons|\.holographic-icon)/.test(block)) continue;
      expect(
        block,
        'bare holographic-icon ::before must NOT carry the holographicShift animation',
      ).not.toMatch(/animation:\s*[^;}]*holographicShift/);
      expect(
        block,
        'bare holographic-icon ::before must NOT carry backdrop-filter',
      ).not.toContain('backdrop-filter');
    }
  });

  it('total backdrop-filter declarations in compiled CSS within budget', () => {
    const css = distCss();
    const count = (css.match(/backdrop-filter\s*:/g) ?? []).length;
    // Baseline after the gating fix. Raise the budget intentionally only
    // when a new always-on filtered surface is genuinely required.
    expect(count, `compiled CSS has ${count} backdrop-filter declarations`).toBeLessThanOrEqual(60);
  });
});
