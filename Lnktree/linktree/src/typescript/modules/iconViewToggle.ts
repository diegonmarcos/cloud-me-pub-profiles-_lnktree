// Icon View overlay — embeds the linktree_icon-view portal in an iframe.
//
// This file used to be ~390 lines that built a folder tree by SCRAPING the DOM
// portal-render.ts had painted (.section-box, .swiper-slide, .subsection-title,
// a[href]) and rendered it into #iconview-content. That logic now lives in the
// linktree_icon-view portal, where it walks the linktree JSON instead — so a
// CSS class rename here can no longer empty the view in silence. Keeping both
// copies would have meant two renderers drifting apart.
//
// The URL is a CONSTANT, deliberately. mindmap-overlay.ts took its URL from an
// anchor's .href, and the anchor it looked for (#mindmap-btn) does not exist —
// only a .mindmap-btn CSS class does — so its init guard returned early and the
// Mindmap overlay never worked at all. A constant cannot go missing.
// Absolute, not relative: in dev each portal is served on its own port
// (linktree 8001, icon-view 8020), so ../linktree_icon-view/ would not resolve.

import { getElementById, addClass, removeClass } from '../utils/dom';

const ICONVIEW_URL = 'https://diegonmarcos.github.io/linktree_icon-view/';

export function initIconViewToggle(): void {
  const btn = getElementById<HTMLElement>('iconview-btn');
  const overlay = getElementById<HTMLElement>('iconview-overlay');
  const closeBtn = getElementById<HTMLButtonElement>('iconview-overlay-close');
  const iframe = getElementById<HTMLIFrameElement>('iconview-iframe');
  const backgroundVideo = getElementById<HTMLVideoElement>('background-video');

  if (!btn || !overlay || !closeBtn || !iframe) return;

  let loaded = false;

  function open(): void {
    // Load once. Re-assigning src on every open would restart the portal and
    // throw away whatever folder the user had navigated into.
    if (!loaded) {
      iframe!.src = ICONVIEW_URL;
      loaded = true;
    }
    // Same GPU relief mindmap-overlay applies: the looping background video and
    // an iframe compositing at once is what makes this stutter on a phone.
    backgroundVideo?.pause();
    addClass(overlay!, 'is-open');
    addClass(document.body, 'iconview-open');
    closeBtn!.focus();
  }

  function close(): void {
    removeClass(overlay!, 'is-open');
    removeClass(document.body, 'iconview-open');
    backgroundVideo?.play().catch(() => { /* autoplay policy — not fatal */ });
    btn!.focus();
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    overlay!.classList.contains('is-open') ? close() : open();
  });

  closeBtn.addEventListener('click', close);

  // Backdrop click closes. There is no "navigate back a level" case any more —
  // the portal owns its own history, and Back inside the iframe unwinds folders.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay!.classList.contains('is-open')) close();
  });
}
