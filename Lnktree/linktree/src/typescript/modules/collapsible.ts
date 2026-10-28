// Collapsible sections module

import { querySelectorAll, getElementById, addClass, removeClass, hasClass } from '../utils/dom';

/**
 * Update parent collapsible heights when child content changes
 */
function updateParentHeights(element: HTMLElement): void {
  let parentCollapsible = element.parentElement?.closest('.collapsible-content') as HTMLElement | null;

  while (parentCollapsible) {
    if (hasClass(parentCollapsible, 'open')) {
      // Set to a very large value temporarily to measure actual content
      const currentHeight = parentCollapsible.style.maxHeight;
      parentCollapsible.style.maxHeight = 'none';
      const actualHeight = parentCollapsible.scrollHeight;
      parentCollapsible.style.maxHeight = currentHeight;

      // Trigger reflow
      void parentCollapsible.offsetHeight;

      // Set to actual height
      parentCollapsible.style.maxHeight = actualHeight + 'px';
    }
    parentCollapsible = parentCollapsible.parentElement?.closest('.collapsible-content') as HTMLElement | null;
  }
}

/**
 * Initialize collapsible content heights
 */
function initCollapsibleHeights(): void {
  const contents = querySelectorAll<HTMLElement>('.collapsible-content');

  contents.forEach(content => {
    if (hasClass(content, 'open')) {
      content.style.maxHeight = content.scrollHeight + 'px';
    } else {
      content.style.maxHeight = '0px';
    }
  });
}

/**
 * Handle toggle click
 */
function handleToggleClick(toggle: HTMLElement): void {
  const targetId = toggle.getAttribute('data-target');
  if (!targetId) return;

  const content = getElementById<HTMLElement>(targetId);
  if (!content) return;

  if (hasClass(content, 'open')) {
    // Close the collapsible
    removeClass(content, 'open');
    removeClass(toggle, 'open');
    const plusIcon = toggle.querySelector('.plus-icon');
    if (plusIcon) plusIcon.classList.add('was-open');
    content.style.maxHeight = '0px';

    // Update parent heights after closing
    setTimeout(() => updateParentHeights(content), 100);
  } else {
    // Open the collapsible
    addClass(content, 'open');
    addClass(toggle, 'open');
    const plusIcon = toggle.querySelector('.plus-icon');
    if (plusIcon) plusIcon.classList.remove('was-open');
    content.style.maxHeight = content.scrollHeight + 'px';

    // Update this collapsible's height after a moment
    setTimeout(() => {
      if (hasClass(content, 'open')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    }, 50);

    // Update parent collapsibles multiple times to ensure proper sizing
    setTimeout(() => updateParentHeights(content), 100);
    setTimeout(() => updateParentHeights(content), 300);
    setTimeout(() => updateParentHeights(content), 500);
  }
}

/**
 * Initialize collapsible sections
 */
export function initCollapsibleSections(): void {
  // Initialize heights
  initCollapsibleHeights();

  // Add click listeners to toggles
  const toggles = querySelectorAll<HTMLElement>('.more-toggle');

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => handleToggleClick(toggle));
  });
}

/**
 * Initialize controls FAB (floating action button)
 * Desktop: Hover to expand, closes when the mouse leaves the container
 * Mobile: Click/tap to toggle
 */
export function initControlsToggle(): void {
  const controlsFab = getElementById<HTMLElement>('controls-fab');
  const controlsList = getElementById<HTMLElement>('controls-list');
  const container = controlsFab?.parentElement;

  if (!controlsFab || !controlsList || !container) return;

  // Detect if device is mobile/touch
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const closeControls = () => {
    removeClass(controlsList, 'open');
    removeClass(controlsFab, 'open');
  };

  const openControls = () => {
    addClass(controlsList, 'open');
    addClass(controlsFab, 'open');
  };

  // Desktop: hover to expand, mouseleave on the container (fab + list) to close.
  // No timers here — a timer-based auto-close raced with continued hovering
  // and closed the menu out from under the cursor.
  if (!isMobile) {
    controlsFab.addEventListener('mouseenter', () => {
      openControls();
    });

    container.addEventListener('mouseleave', () => {
      closeControls();
    });
  }

  // Click/tap to toggle (works on both desktop and mobile)
  controlsFab.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasClass(controlsList, 'open')) {
      closeControls();
    } else {
      openControls();
    }
  });

  // Touch events for mobile (ensure tap works)
  if (isMobile) {
    controlsFab.addEventListener('touchstart', (e) => {
      e.preventDefault();

      if (hasClass(controlsList, 'open')) {
        closeControls();
      } else {
        openControls();
      }
    }, { passive: false });
  }
}
