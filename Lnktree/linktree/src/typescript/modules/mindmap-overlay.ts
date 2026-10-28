// Mindmap Overlay Module

import { getElementById, addClass, removeClass } from '../utils/dom';

/**
 * Initialize mindmap overlay
 * Opens overlay on hover, loads mindmap in iframe
 */
export function initMindmapOverlay(): void {
  const mindmapBtn = getElementById<HTMLAnchorElement>('mindmap-btn');
  const mindmapControlBtn = getElementById<HTMLElement>('btn-mindmap');
  const overlay = getElementById<HTMLElement>('mindmap-overlay');
  const closeBtn = getElementById<HTMLButtonElement>('mindmap-overlay-close');
  const iframe = getElementById<HTMLIFrameElement>('mindmap-iframe');
  const backgroundVideo = getElementById<HTMLVideoElement>('background-video');

  // mindmapBtn is OPTIONAL. It used to be required, and that is why this
  // overlay never opened: there is no element with id="mindmap-btn" anywhere in
  // the page — only a `.mindmap-btn` CSS class — so this guard returned early on
  // every load and clicking Mindmap in the menu did nothing. The real menu
  // button is #btn-mindmap (menuRender sets el.id = item.id from menuData), and
  // it is handled below.
  if (!overlay || !closeBtn || !iframe) return;

  // Was mindmapBtn.href — i.e. read off the element that does not exist. A
  // constant cannot go missing. Absolute because in dev each portal is served
  // on its own port, so a relative path would not resolve.
  const mindmapUrl = 'https://diegonmarcos.github.io/linktree_mindmap/';
  let hoverTimeout: number | null = null;
  let iframeLoaded = false;

  const openOverlay = () => {
    // Load iframe src only once (don't reload every time)
    if (!iframeLoaded) {
      iframe.src = mindmapUrl;
      iframeLoaded = true;
      console.log('Loading mindmap iframe for first time:', mindmapUrl);
    }

    // CRITICAL GPU FIX #1: Pause background video to free GPU resources
    if (backgroundVideo) {
      backgroundVideo.pause();
      console.log('Paused background video (GPU optimization)');
    }

    addClass(overlay, 'active');
    // Hide the launcher button while the overlay is up — only if it exists.
    if (mindmapBtn) addClass(mindmapBtn, 'hidden');
  };

  const closeOverlay = () => {
    removeClass(overlay, 'active');
    if (mindmapBtn) removeClass(mindmapBtn, 'hidden');

    // Resume background video when overlay closes
    if (backgroundVideo) {
      backgroundVideo.play().catch(err => {
        console.warn('Could not resume background video:', err);
      });
    }
  };

  // Hover-to-open only applies to the legacy anchor, which is absent today.
  // Guarded rather than deleted: the behaviour returns for free if that element
  // is ever reintroduced.
  if (mindmapBtn) {
    mindmapBtn.addEventListener('mouseenter', () => {
      hoverTimeout = window.setTimeout(() => {
        openOverlay();
      }, 500); // 500ms delay
    });

    // Cancel open if mouse leaves before delay
    mindmapBtn.addEventListener('mouseleave', () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
    });

    mindmapBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openOverlay();
    });
  }

  // Control button opens mindmap
  if (mindmapControlBtn) {
    mindmapControlBtn.addEventListener('click', () => {
      openOverlay();
    });
  }

  // Close button
  closeBtn.addEventListener('click', () => {
    closeOverlay();
  });

  // Close on overlay background click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeOverlay();
    }
  });
}
