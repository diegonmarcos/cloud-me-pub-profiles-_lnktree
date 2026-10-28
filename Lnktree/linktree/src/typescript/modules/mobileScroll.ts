// Scroll-based carousel auto-selection (works on both mobile and desktop)
// Single source of truth for which carousel is active

import { selectCarousel, updateArrowStates, getSelectedCarousel } from './carousel';
import { querySelector } from '../utils/dom';
import type { CarouselType } from '../types';

// Store element references
let professionalRow: HTMLElement | null = null;
let personalRow: HTMLElement | null = null;
let projectsRow: HTMLElement | null = null;

/**
 * Throttle function to limit event frequency
 */
function throttle<T extends (...args: unknown[]) => void>(func: T, limit: number): T {
  let inThrottle = false;
  return function (this: unknown, ...args: unknown[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  } as T;
}

/**
 * Get the center Y position of an element relative to viewport
 */
function getElementCenterY(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  return rect.top + rect.height / 2;
}

/**
 * Select carousel based on which one is closest to viewport center
 */
function selectCarouselByScroll(): void {
  if (!professionalRow || !personalRow || !projectsRow) return;

  const viewportCenter = window.innerHeight / 2;

  const distances: [number, CarouselType][] = [
    [Math.abs(viewportCenter - getElementCenterY(professionalRow)), 'professional'],
    [Math.abs(viewportCenter - getElementCenterY(personalRow)), 'personal'],
    [Math.abs(viewportCenter - getElementCenterY(projectsRow)), 'projects'],
  ];

  // Select whichever is closest to viewport center
  distances.sort((a, b) => a[0] - b[0]);
  const closest = distances[0][1];

  if (getSelectedCarousel() !== closest) {
    selectCarousel(closest);
    updateArrowStates();
  }
}

/**
 * Initialize scroll-based auto-selection
 */
export function initMobileScrollSelection(): void {
  professionalRow = querySelector<HTMLElement>('.professional-profiles-section .carousel-row');
  personalRow = querySelector<HTMLElement>('.personal-profiles-section .carousel-row');
  projectsRow = querySelector<HTMLElement>('.projects-section .carousel-row');

  if (!professionalRow || !personalRow || !projectsRow) return;

  // Throttled scroll handler
  const throttledSelect = throttle(selectCarouselByScroll, 100);

  // Listen for scroll
  window.addEventListener('scroll', throttledSelect, { passive: true });

  // Initial selection after layout
  requestAnimationFrame(() => {
    requestAnimationFrame(selectCarouselByScroll);
  });

  // Re-select on resize
  window.addEventListener('resize', throttle(selectCarouselByScroll, 200), { passive: true });
}
