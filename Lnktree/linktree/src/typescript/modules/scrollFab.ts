// Scroll-based FAB visibility — works with swiper (touch) and window scroll.
// Uses CSS class "fab-hidden" + transitions defined in _controls.scss.

export function initScrollFab(): void {
  const controlsFab = document.querySelector('.controls-fab-container') as HTMLElement | null;
  const hamburgerMenu = document.getElementById('hamburger-menu') as HTMLElement | null;
  const controlsList = document.getElementById('controls-list') as HTMLElement | null;

  if (!controlsFab || !hamburgerMenu) return;

  let hideTimeout: number | null = null;
  let showTimeout: number | null = null;

  function isMenuOpen(): boolean {
    return controlsList?.classList.contains('open') ?? false;
  }

  function hideFabs(): void {
    if (isMenuOpen()) return;
    if (showTimeout !== null) { clearTimeout(showTimeout); showTimeout = null; }
    controlsFab!.classList.add('fab-hidden');
    hamburgerMenu!.classList.add('fab-hidden');
  }

  function scheduleShow(): void {
    if (hideTimeout !== null) { clearTimeout(hideTimeout); hideTimeout = null; }
    showTimeout = window.setTimeout(() => {
      controlsFab!.classList.remove('fab-hidden');
      hamburgerMenu!.classList.remove('fab-hidden');
      showTimeout = null;
    }, 400);
  }

  // Touch: swiper gestures fire touchstart/touchend, not window scroll
  document.addEventListener('touchstart', () => {
    const fabTouched = controlsFab!.contains(document.activeElement)
      || hamburgerMenu!.contains(document.activeElement);
    if (!fabTouched) {
      if (showTimeout !== null) { clearTimeout(showTimeout); showTimeout = null; }
      hideTimeout = window.setTimeout(hideFabs, 80);
    }
  }, { passive: true });

  document.addEventListener('touchend', scheduleShow, { passive: true });

  // Window scroll: for any vertically scrollable slide content
  window.addEventListener('scroll', () => {
    hideFabs();
    scheduleShow();
  }, { passive: true });

  // Pointer down on FABs themselves: always keep visible
  [controlsFab, hamburgerMenu].forEach(element => {
    element.addEventListener('pointerdown', () => {
      if (hideTimeout !== null) { clearTimeout(hideTimeout); hideTimeout = null; }
      controlsFab!.classList.remove('fab-hidden');
      hamburgerMenu!.classList.remove('fab-hidden');
    });
  });
}
