// Card view modes — two only:
//   cards-view-single-card (default): each group's Swiper shows one card
//     at a time.
//   cards-view-all-cards (zoom out): each group stays in its original
//     position but its Swiper is torn down so all of its cards open in a
//     row to the right instead of just the first one.
// zoom-in/zoom-out buttons toggle between the two.

import { getElementById } from '../utils/dom';
import { teardownCarousels, rebuildCarousels } from './carousel';

const ALL_CARDS_CLASS = 'cards-view-all-cards';

export function initZoomToggle(): void {
  const zoomOutBtn = getElementById<HTMLButtonElement>('zoom-out-btn');
  const zoomInBtn = getElementById<HTMLButtonElement>('zoom-in-btn');
  const root = document.documentElement;

  zoomOutBtn?.addEventListener('click', () => {
    if (root.classList.contains(ALL_CARDS_CLASS)) return;
    root.classList.add(ALL_CARDS_CLASS);
    teardownCarousels();
  });

  zoomInBtn?.addEventListener('click', () => {
    if (!root.classList.contains(ALL_CARDS_CLASS)) return;
    root.classList.remove(ALL_CARDS_CLASS);
    rebuildCarousels();
  });
}
