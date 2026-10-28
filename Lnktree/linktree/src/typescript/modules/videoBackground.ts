// Video background module

import { getElementById, addClass, removeClass } from '../utils/dom';

const VIDEOS = [
  'public/videos/background.mp4',
  'public/videos/background2.mp4',
  'public/videos/background3.mp4',
  'public/videos/background4.mp4'
];

// Static fallback image (first frame or poster)
const STATIC_BACKGROUND = 'public/images/background_static.jpg';

let videoElement: HTMLVideoElement | null = null;
let isPlaying = false;

/**
 * Get a random video from the list
 */
function getRandomVideo(): string {
  return VIDEOS[Math.floor(Math.random() * VIDEOS.length)];
}

/**
 * Initialize random background video
 */
export function initVideoBackground(): void {
  videoElement = getElementById<HTMLVideoElement>('background-video');

  if (videoElement) {
    videoElement.muted = true;
    videoElement.poster = STATIC_BACKGROUND;
    // Do NOT set src here — only set it in playVideo() when user explicitly enables
  }
}

/**
 * Initialize video play/pause toggle control
 */
export function initVideoToggle(): void {
  const toggle = getElementById<HTMLButtonElement>('video-toggle');

  if (!toggle || !videoElement) return;

  // Load saved preference (default: OFF — video only plays when explicitly enabled)
  const savedPref = localStorage.getItem('videoPlaying');
  if (savedPref === 'true') {
    isPlaying = true;
    addClass(toggle, 'active');
    playVideo();
  } else {
    isPlaying = false;
    removeClass(toggle, 'active');
    pauseAndShowStatic();
  }

  toggle.addEventListener('click', () => {
    if (isPlaying) {
      pauseAndShowStatic();
      removeClass(toggle, 'active');
    } else {
      playVideo();
      addClass(toggle, 'active');
    }
    localStorage.setItem('videoPlaying', String(isPlaying));
  });
}

/**
 * Pause video and switch to static image to save memory
 */
function pauseAndShowStatic(): void {
  if (!videoElement) return;

  videoElement.pause();
  // Remove video source to free memory - the poster image will show
  videoElement.removeAttribute('src');
  videoElement.load(); // Reset to release memory
  isPlaying = false;
}

/**
 * Resume video playback
 */
function playVideo(): void {
  if (!videoElement) return;

  videoElement.src = getRandomVideo();
  videoElement.muted = true;
  videoElement.play().catch(() => {
    // Autoplay might be blocked, that's okay
  });
  isPlaying = true;
}
