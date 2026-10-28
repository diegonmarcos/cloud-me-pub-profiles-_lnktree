// Verify Phase A perf wiring: every renderer-emitted <img> carries the
// expected loading/decoding/fetchpriority hints. Hero images stay eager
// (no `loading="lazy"`) — every other image is lazy + async-decoded.

import { describe, it, expect } from 'vitest';
import { renderSlide } from '../src/typescript/modules/portal-render';

describe('Phase A — image perf attributes', () => {
  it('every renderer-emitted .icon image is lazy + async-decoded', () => {
    const tree = renderSlide('lab-tools')!;
    const icons = tree.querySelectorAll<HTMLImageElement>('img.icon');
    expect(icons.length).toBeGreaterThan(0);
    for (const img of Array.from(icons)) {
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('decoding')).toBe('async');
    }
  });

  it('tools/repos featured-images are lazy + low fetchpriority (always below the fold)', () => {
    const tree = renderSlide('lab-tools')!;
    const featured = tree.querySelector<HTMLImageElement>('img.featured-image');
    expect(featured).not.toBeNull();
    expect(featured!.getAttribute('loading')).toBe('lazy');
    expect(featured!.getAttribute('fetchpriority')).toBe('low');
    expect(featured!.getAttribute('decoding')).toBe('async');
  });

  it('the active card_swiper image of the first DOM section is eager + high priority', () => {
    const tree = renderSlide('professional-profile')!;
    const active = tree.querySelector<HTMLImageElement>('.card-slide.active');
    expect(active).not.toBeNull();
    expect(active!.tagName).toBe('IMG');
    // Eager hero must NOT carry `loading="lazy"`.
    expect(active!.getAttribute('loading')).toBeNull();
    expect(active!.getAttribute('fetchpriority')).toBe('high');
    expect(active!.getAttribute('decoding')).toBe('async');
  });

  it('non-active card_swiper images stay lazy', () => {
    // personal-profile has two image slides (one active, one not).
    const tree = renderSlide('personal-profile')!;
    const nonActive = Array.from(tree.querySelectorAll<HTMLImageElement>('img.card-slide'))
      .filter(img => !img.classList.contains('active'));
    expect(nonActive.length).toBeGreaterThan(0);
    for (const img of nonActive) {
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('fetchpriority')).toBe('low');
    }
  });

  it('every rendered icon-anchor img inside profile-icons is lazy', () => {
    const tree = renderSlide('cloud')!;
    const profileIconImgs = tree.querySelectorAll<HTMLImageElement>('.profile-icons img');
    expect(profileIconImgs.length).toBeGreaterThan(0);
    for (const img of Array.from(profileIconImgs)) {
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('decoding')).toBe('async');
    }
  });
});
