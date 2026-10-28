// Main entry point for Linktree application

import { initLoader } from './modules/loader';
import { initStatusModal } from './modules/status/modal';
import { initCollapsibleSections, initControlsToggle } from './modules/collapsible';
import { initVideoBackground } from './modules/videoBackground';
import { initCarousels } from './modules/carousel';
import { initMobileScrollSelection } from './modules/mobileScroll';
import { initGalleryToggle } from './modules/gallery';
import { initAboutPanel } from './modules/about';
import { initCommitsPanel } from './modules/commits';
import { initMindmapOverlay } from './modules/mindmap-overlay';
import { initIconViewToggle } from './modules/iconViewToggle';
import { initAudioToggle } from './modules/audioToggle';
import { initVmControl } from './modules/vmControl';
import { initProfilePicSwiper } from './modules/profilePicSwiper';
import { initScrollFab } from './modules/scrollFab';
import { initLogcatViewer } from './modules/logcat';
import { initCardSwiper } from './modules/cardSwiper';
import { initPortalRender } from './modules/portal-render';
import { renderMenu } from './modules/menuRender';
import { initZoomToggle } from './modules/zoomToggle';
import { initThemeSwitcher } from './modules/themeSwitcher';
import { initTilt3d } from './modules/tilt3d';
import { initCanvasBackground } from './modules/canvas-bg';
import { setupSwAutoReload } from './utils/sw-auto-reload';
import { installImgRetry } from './utils/img-retry';

// First thing: any icon that fails to load is retried with backoff.
installImgRetry();

// requestIdleCallback shim for Safari / older WebKit. Falls through to a
// 100 ms setTimeout — same yield discipline, slightly less efficient.
type IdleCb = (cb: () => void) => void;
const onIdle: IdleCb = (cb) =>
  ('requestIdleCallback' in window
    ? (window as unknown as { requestIdleCallback: (c: () => void, o?: { timeout: number }) => void }).requestIdleCallback(cb, { timeout: 800 })
    : setTimeout(cb, 100));

/**
 * Initialize all application modules
 */
function initApp(): void {
  // Render the FAB + hamburger menus from shared data before anything
  // below looks up their button ids.
  renderMenu();

  // Hydrate declarative portal slides FIRST so subsequent modules
  // (Swiper carousels in particular) see the rendered DOM.
  initPortalRender();

  // Initialize collapsible sections
  initCollapsibleSections();

  initProfilePicSwiper();
  initCardSwiper();

  // Initialize controls toggle
  initControlsToggle();

  // Initialize mindmap overlay
  initMindmapOverlay();

  // Initialize in-page list view toggle
  initIconViewToggle();
  initAudioToggle();
  initZoomToggle();
  initScrollFab();
  initLogcatViewer();

  // Initialize random background video (or WebGL canvas if opted in).
  initVideoBackground();
  initCanvasBackground();

  // (video play/pause toggle removed — lite mode now controls the video directly)

  // Initialize Swiper carousels
  initCarousels();

  // Theme switcher: dark (default) / light / lightweight / terminal. Runs
  // after renderMenu() because it binds to the buttons that renders.
  initThemeSwitcher();

  // 3D mouse-tilt on link sections (compositor-only; no-ops in lite-mode).
  initTilt3d();

  // Defer non-critical, behind-FAB / off-screen init until the main thread
  // is idle. None of these are needed for first paint.
  onIdle(() => initStatusModal());
  onIdle(() => initCommitsPanel());
  onIdle(() => initAboutPanel());
  onIdle(() => initMobileScrollSelection());
  onIdle(() => initGalleryToggle());
  onIdle(() => initVmControl());

  // Hamburger menu
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const hamburgerNav = document.getElementById('hamburger-nav');
  if (hamburgerBtn && hamburgerNav) {
    hamburgerBtn.addEventListener('click', () => {
      const expanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
      hamburgerBtn.setAttribute('aria-expanded', String(!expanded));
      hamburgerNav.classList.toggle('is-open', !expanded);
    });
    // Delegate: clicking a hamburger-item triggers the target button
    hamburgerNav.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('.hamburger-item') as HTMLElement | null;
      if (!item) return;
      const targetId = item.dataset['trigger'];
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) target.click();
      // close menu
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerNav.classList.remove('is-open');
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('hamburger-menu');
      if (menu && !menu.contains(e.target as Node)) {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerNav.classList.remove('is-open');
      }
    });
  }

  // Card View button — close every overlay view and return to the default
  // swiper. Card View is not a view of its own: it IS the page, so "select it"
  // means "dismiss whatever is covering it".
  //
  // Each overlay owns a DIFFERENT open/close contract, and the previous version
  // of this handler got all three wrong:
  //
  //   Icon View  #iconview-overlay + .is-open  — it probed #iconview-content's
  //     style.display and offsetParent instead. The overlay is hidden with
  //     OPACITY and is always display:flex (see _icons.scss), so that test was
  //     permanently true and the handler always clicked #iconview-btn — a
  //     TOGGLE — which opened Icon View. That is why Card View led to Icon View.
  //   Mindmap    #mindmap-overlay + .active    — it set style.display='none',
  //     an inline style that addClass('active') can never undo, so Mindmap was
  //     dead until a reload.
  //   Gallery    body + .gallery-mode          — it probed a .gallery-overlay
  //     element rather than the class the module actually toggles.
  //
  // Each is now closed through its own contract, guarded by the same class the
  // owning module toggles, and via its CLOSE button rather than its toggle: a
  // close is idempotent and can never open something.
  const cardviewBtn = document.getElementById('cardview-btn');
  if (cardviewBtn) {
    cardviewBtn.addEventListener('click', () => {
      if (document.getElementById('iconview-overlay')?.classList.contains('is-open')) {
        (document.getElementById('iconview-overlay-close') as HTMLElement | null)?.click();
      }
      if (document.getElementById('mindmap-overlay')?.classList.contains('active')) {
        (document.getElementById('mindmap-overlay-close') as HTMLElement | null)?.click();
      }
      if (document.body.classList.contains('gallery-mode')) {
        (document.getElementById('gallery-toggle') as HTMLElement | null)?.click();
      }
    });
  }

  // Show FABs after everything is loaded and positioned
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const controlsFab = document.querySelector('.controls-fab-container') as HTMLElement;
      const hamburgerMenu = document.getElementById('hamburger-menu') as HTMLElement;

      if (controlsFab) {
        controlsFab.style.visibility = 'visible';
      }
      if (hamburgerMenu) {
        hamburgerMenu.style.visibility = 'visible';
      }
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await initLoader();
  requestAnimationFrame(() => {
    requestAnimationFrame(initApp);
  });
  // Register the Service Worker after first paint — never blocks startup.
  // Skipped on file:// (no SW support) and during local dev to keep
  // hot-reload predictable.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    onIdle(() => {
      navigator.serviceWorker.register('./script-service-worker.js', { updateViaCache: 'none' }).catch(() => undefined);
    });

    // Auto-reload on post-deploy SW updates only — never on first-ever
    // activation (where the page was already loaded from network and the
    // reload would just be cosmetic noise). See utils/sw-auto-reload.ts.
    setupSwAutoReload({
      serviceWorker: navigator.serviceWorker,
      reload: () => location.reload(),
    });

    // Console escape-hatch: paste `__resetSW()` in DevTools to unregister
    // the SW + drop every cache + reload. Useful when iterating locally.
    (window as unknown as { __resetSW: () => Promise<void> }).__resetSW = async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      location.reload();
    };

    document.getElementById('sw-reset-toggle')?.addEventListener('click', () =>
      (window as unknown as { __resetSW: () => Promise<void> }).__resetSW(),
    );
  }
});

// Export for potential external use
export { initApp };
