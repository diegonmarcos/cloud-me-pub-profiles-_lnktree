// The ONE carousel of the site (#1293 follow-up). Every card section (Professional Profiles, Areas, Personal Profiles,
// xProjects) mounts the same Swiper with the same config through createCarousel(); there is no per-section swipe code.
//
// Markup contract (index.html), identical for every section:
//   <div class="carousel-row">
//     <div class="swiper" data-carousel="<id>"><div class="swiper-wrapper">….swiper-slide…</div>
//       <div class="swiper-button-prev"></div><div class="swiper-button-next"></div></div>
//     <div class="swiper-pagination"></div>
//   </div>
// Behaviour, identical for every section: touch swipe and mouse drag (one card per gesture, snap), arrows, dots,
// keyboard (left/right on the carousel in view, up/down moves the selection), horizontal trackpad swipe, resize-safe
// (Swiper observer), reduced motion (no 3D effect, instant transitions). The selected carousel is the one nearest the
// viewport centre (or the last one clicked); every carousel always accepts touch. Image stacks inside cards
// (.card-swiper) and the header picture (.profile-pic-swiper) use initTapSwipers(): tap cycles; a swipe is left to the
// carousel when the stack sits inside one, so one gesture never moves two things.

import Swiper from 'swiper';
import { EffectCreative, Navigation, Pagination, Keyboard } from 'swiper/modules';
import type { SwiperOptions } from 'swiper/types';

export const swiperConfig: SwiperOptions = {
  modules: [EffectCreative, Navigation, Pagination, Keyboard],
  effect: 'creative',
  grabCursor: true,
  centeredSlides: false,
  slidesPerView: 1,
  spaceBetween: 0,
  // rewind, not loop: Swiper's loop re-orders slides in the DOM while dragging (loopFix on every sliderMove with the
  // creative effect), which made one drag shuffle through several cards and then snap back. Rewind wraps last->first
  // on next/arrow without touching the DOM.
  loop: false,
  rewind: true,
  autoHeight: false,
  creativeEffect: {
    prev: { shadow: false, translate: ['-120%', 0, -500], rotate: [0, 0, -15], opacity: 0, scale: 0.8 },
    next: { shadow: false, translate: ['120%', 0, -500], rotate: [0, 0, 15], opacity: 0, scale: 0.8 },
  },
  keyboard: { enabled: true, onlyInViewport: true },
  touchRatio: 1,
  resistanceRatio: 0.85,
  touchStartPreventDefault: false,
  touchStartForcePreventDefault: false,
  touchMoveStopPropagation: false,
  simulateTouch: true,
  allowTouchMove: true,
  touchEventsTarget: 'container',
  threshold: 10,
  // longSwipes: a slow deliberate drag past 20% of the card moves one card (was off: any drag over 300 ms snapped back).
  longSwipes: true,
  longSwipesRatio: 0.2,
  longSwipesMs: 300,
  passiveListeners: true,
  speed: 900,
};

export const reducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// The options a carousel is mounted with: the shared config, its own arrows/dots, the reduced-motion override.
export function carouselOptions(parts: { prev: HTMLElement | null; next: HTMLElement | null; pagination: HTMLElement | null }, reduce = reducedMotion()): SwiperOptions {
  return {
    ...swiperConfig,
    ...(reduce ? { effect: 'slide' as const, speed: 0 } : {}),
    navigation: { prevEl: parts.prev, nextEl: parts.next },
    pagination: { el: parts.pagination, clickable: true },
  };
}

export interface Carousel {
  id: string;
  row: HTMLElement;
  host: HTMLElement;
  prev: HTMLElement | null;
  next: HTMLElement | null;
  pagination: HTMLElement | null;
  swiper: Swiper | null;
}

const carousels: Carousel[] = [];
let selected: string | null = null;
let torn = false;
let initialised = false;

export const listCarousels = (): readonly Carousel[] => carousels;
export const getCarousel = (id: string): Carousel | undefined => carousels.find((c) => c.id === id);
export const getSelectedCarousel = (): string | null => selected;

function mount(c: Carousel): void {
  c.swiper?.destroy(true, true);
  c.swiper = torn || !c.host.querySelector('.swiper-slide') ? null : new Swiper(c.host, carouselOptions(c));
}

// Registers and mounts the carousel on `host` (a .swiper[data-carousel]); re-mounts when already registered.
export function createCarousel(host: HTMLElement): Carousel {
  const id = host.dataset['carousel'] || `carousel-${carousels.length}`;
  const known = getCarousel(id);
  if (known) { mount(known); return known; }
  const row = host.closest<HTMLElement>('.carousel-row') ?? host;
  const c: Carousel = {
    id, row, host, swiper: null,
    prev: host.querySelector<HTMLElement>('.swiper-button-prev'),
    next: host.querySelector<HTMLElement>('.swiper-button-next'),
    pagination: row.querySelector<HTMLElement>('.swiper-pagination'),
  };
  carousels.push(c);
  row.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('a, button')) selectCarousel(c.id); });
  row.addEventListener('wheel', (e) => onWheel(e, c), { passive: false });
  // A mouse drag that starts on a link or image would otherwise become the browser's native drag-and-drop (ghost
  // image) and the card never moves; the carousel owns horizontal drags.
  host.addEventListener('dragstart', (e) => e.preventDefault());
  // Swiper positions cards with transforms inside an overflow:hidden host; the browser can still SCROLL that host (Tab
  // focus or scroll-into-view reaching a link on an off-screen card), leaving the active card half off-screen. Keep
  // the host unscrolled, and bring a focused card into view the carousel's way instead.
  host.addEventListener('scroll', () => { if (host.scrollLeft || host.scrollTop) { host.scrollLeft = 0; host.scrollTop = 0; } }, { passive: true });
  host.addEventListener('focusin', (e) => {
    const slide = (e.target as HTMLElement).closest<HTMLElement>('.swiper-slide');
    const i = slide && c.swiper ? c.swiper.slides.indexOf(slide) : -1;
    if (c.swiper && i >= 0 && i !== c.swiper.activeIndex) c.swiper.slideTo(i);
  });
  host.addEventListener('pointerdown', () => willChange(c, true), { passive: true });
  for (const ev of ['pointerup', 'pointercancel'] as const) host.addEventListener(ev, () => willChange(c, false), { passive: true });
  mount(c);
  if (!selected) selectCarousel(c.id);
  return c;
}

// Replace a carousel's slides (Areas switching project): the old Swiper is destroyed BEFORE `replace` swaps the
// slides (destroying it afterwards would leave its translate/creative transforms on the new set), then it is mounted
// on the new slides from card 0. Before initCarousels() has run only `replace` runs; initCarousels() mounts later.
export function refreshCarousel(id: string, replace: () => void): void {
  const c = getCarousel(id);
  c?.swiper?.destroy(true, true);
  if (c) c.swiper = null;
  replace();
  if (c) mount(c);
}

export function selectCarousel(id: string): void {
  if (!getCarousel(id)) return;
  selected = id;
  for (const c of carousels) c.row.classList.toggle('selected', c.id === id);
}

// Only the active slide gets a compositor layer, and only while a pointer is down.
function willChange(c: Carousel, on: boolean): void {
  if (on) { const a = c.host.querySelector<HTMLElement>('.swiper-slide-active'); if (a) a.style.willChange = 'transform'; }
  else c.host.querySelectorAll<HTMLElement>('.swiper-slide').forEach((s) => { s.style.willChange = ''; });
}

// Horizontal trackpad swipe: one card per gesture (debounced), on the carousel under the pointer.
let wheelLock = false;
function onWheel(e: WheelEvent, c: Carousel): void {
  if (!c.swiper || Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) <= 30) return;
  e.preventDefault();
  if (wheelLock) return;
  wheelLock = true;
  if (e.deltaX > 0) c.swiper.slidePrev(); else c.swiper.slideNext();
  setTimeout(() => { wheelLock = false; }, 300);
}

function selectByScroll(): void {
  const mid = innerHeight / 2;
  let best: Carousel | null = null;
  let d = Infinity;
  for (const c of carousels) {
    const r = c.row.getBoundingClientRect();
    const dist = Math.abs(mid - (r.top + r.height / 2));
    if (dist < d) { d = dist; best = c; }
  }
  if (best && best.id !== selected) selectCarousel(best.id);
}

function throttle(fn: () => void, ms: number): () => void {
  let t = 0;
  return () => { const now = Date.now(); if (now - t >= ms) { t = now; fn(); } };
}

function onKey(e: KeyboardEvent): void {
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const i = carousels.findIndex((c) => c.id === selected);
  if (i < 0) return;
  // Left/right: each Swiper's own Keyboard module (onlyInViewport). Up/down: move the selection.
  if (e.key === 'ArrowDown' && i < carousels.length - 1) selectCarousel(carousels[i + 1].id);
  else if (e.key === 'ArrowUp' && i > 0) selectCarousel(carousels[i - 1].id);
}

// cards-view-all-cards (zoomToggle): destroy every Swiper so plain CSS lays all cards out; rebuild on the way back.
export function teardownCarousels(): void {
  torn = true;
  for (const c of carousels) { c.swiper?.destroy(true, true); c.swiper = null; }
}
export function rebuildCarousels(): void {
  torn = false;
  for (const c of carousels) mount(c);
}

export function initCarousels(): void {
  if (initialised) return;
  initialised = true;
  document.querySelectorAll<HTMLElement>('.carousel-row > .swiper[data-carousel]').forEach((h) => { createCarousel(h); });
  document.addEventListener('keydown', onKey);
  addEventListener('scroll', throttle(selectByScroll, 100), { passive: true });
  addEventListener('resize', throttle(selectByScroll, 200), { passive: true });
  requestAnimationFrame(() => requestAnimationFrame(selectByScroll));
}

// Tap-to-cycle image stacks (card hero images, header profile picture). `.active` marks the shown image.
export function initTapSwipers(root: ParentNode = document): void {
  const stacks: [string, string][] = [['.card-swiper', '.card-slide'], ['.profile-pic-swiper', '.profile-pic-slide']];
  for (const [stackSel, slideSel] of stacks) root.querySelectorAll<HTMLElement>(stackSel).forEach((stack) => {
    const slides = stack.querySelectorAll<HTMLElement>(slideSel);
    if (slides.length < 2 || stack.dataset['tapSwiper']) return;
    stack.dataset['tapSwiper'] = '1';
    let current = Math.max(0, [...slides].findIndex((s) => s.classList.contains('active')));
    const show = (i: number) => { current = (i + slides.length) % slides.length; slides.forEach((s, k) => s.classList.toggle('active', k === current)); };
    stack.addEventListener('click', () => show(current + 1));
    if (stack.closest('.swiper')) return; // inside a carousel: the carousel owns horizontal swipes
    let x0 = 0;
    stack.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stack.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 30) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
  });
}
