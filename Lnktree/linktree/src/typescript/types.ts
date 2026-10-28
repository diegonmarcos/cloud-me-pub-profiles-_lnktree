// Type declarations for Linktree

// Swiper.js types (external library)
declare class Swiper {
  constructor(selector: string, options: SwiperOptions);
  slidePrev(): void;
  slideNext(): void;
  allowTouchMove: boolean;
  enable(): void;
  disable(): void;
  slides: HTMLElement[];
  activeIndex: number;
  realIndex: number;
  wrapperEl: HTMLElement;
  el: HTMLElement;
}

interface SwiperOptions {
  effect?: string;
  grabCursor?: boolean;
  centeredSlides?: boolean;
  slidesPerView?: number;
  spaceBetween?: number;
  loop?: boolean;
  autoHeight?: boolean;
  creativeEffect?: SwiperCreativeEffect;
  keyboard?: SwiperKeyboard;
  touchRatio?: number;
  resistanceRatio?: number;
  touchStartPreventDefault?: boolean;
  touchStartForcePreventDefault?: boolean;
  touchMoveStopPropagation?: boolean;
  simulateTouch?: boolean;
  allowTouchMove?: boolean;
  touchEventsTarget?: string;
  threshold?: number;
  passiveListeners?: boolean;
  speed?: number;
  navigation?: SwiperNavigation;
  pagination?: SwiperPagination;
  on?: SwiperEvents;
}

interface SwiperCreativeEffect {
  prev?: SwiperSlideEffect;
  next?: SwiperSlideEffect;
}

interface SwiperSlideEffect {
  shadow?: boolean;
  translate?: [string | number, number, number];
  rotate?: [number, number, number];
  opacity?: number;
  scale?: number;
}

interface SwiperKeyboard {
  enabled?: boolean;
  onlyInViewport?: boolean;
}

interface SwiperNavigation {
  nextEl?: string;
  prevEl?: string;
}

interface SwiperPagination {
  el?: string;
  clickable?: boolean;
}

interface SwiperEvents {
  init?: (swiper: Swiper) => void;
  slideChange?: (swiper: Swiper) => void;
  slideChangeTransitionEnd?: (swiper: Swiper) => void;
  touchStart?: (swiper: Swiper, event: TouchEvent) => void;
  touchMove?: (swiper: Swiper, event: TouchEvent) => void;
}

// Carousel types
export type CarouselType = 'professional' | 'personal' | 'projects';

export interface CarouselState {
  selectedCarousel: CarouselType;
  professionalSwiper: Swiper;
  personalSwiper: Swiper;
  projectsSwiper: Swiper;
  professionalRow: HTMLElement;
  personalRow: HTMLElement;
  projectsRow: HTMLElement;
}

export interface CarouselElements {
  professionalPrev: HTMLElement;
  professionalNext: HTMLElement;
  personalPrev: HTMLElement;
  personalNext: HTMLElement;
}

// Two-finger swipe state
export interface SwipeState {
  touchStartY: number;
  touchStartX: number;
  isTwoFingerSwipe: boolean;
}

// Trackpad state
export interface TrackpadState {
  debounce: boolean;
  debounceTime: number;
}

// Export Swiper types for use in modules
export type { Swiper, SwiperOptions };
