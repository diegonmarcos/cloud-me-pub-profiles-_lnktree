// Video background module: the <video id="background-video"> starts muted with the static poster. Playback is
// driven by lite mode / the theme switcher, which set its src directly (the old play/pause toggle was removed).

import { getElementById } from '../utils/dom';

// Static fallback image (first frame or poster)
const STATIC_BACKGROUND = 'public/images/background_static.jpg';

export function initVideoBackground(): void {
  const video = getElementById<HTMLVideoElement>('background-video');
  if (video) {
    video.muted = true;
    video.poster = STATIC_BACKGROUND;
  }
}
