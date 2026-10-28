// Audio Toggle Module — disabled. Background video audio caused unwanted
// sound; the toggle is now hidden and the video stays permanently muted
// with no way to unmute it from the UI.

import { getElementById } from '../utils/dom';

/**
 * Force the background video muted and hide the (now inert) toggle button.
 */
export function initAudioToggle(): void {
  const btn = getElementById<HTMLButtonElement>('audio-toggle');
  const video = getElementById<HTMLVideoElement>('background-video');

  if (video) video.muted = true;
  if (btn) btn.style.display = 'none';
}
