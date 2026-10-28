// Gallery view toggle module

import { getElementById, querySelectorAll, addClass, removeClass, setCSSProperty } from '../utils/dom';

let galleryEnabled = false;

/**
 * Set thumbnail backgrounds for links with data-preview attribute
 */
function setThumbnailBackgrounds(): void {
  const links = querySelectorAll<HTMLElement>('.link');

  links.forEach(link => {
    const previewUrl = link.getAttribute('data-preview');
    if (previewUrl) {
      setCSSProperty(link, '--thumbnail-url', `url(${previewUrl})`);
    }
  });
}

/**
 * Toggle gallery mode on/off
 */
function toggleGalleryMode(button: HTMLButtonElement): void {
  galleryEnabled = !galleryEnabled;
  localStorage.setItem('galleryEnabled', String(galleryEnabled));

  if (galleryEnabled) {
    setThumbnailBackgrounds();
    addClass(document.body, 'gallery-mode');
    addClass(button, 'active');
  } else {
    removeClass(document.body, 'gallery-mode');
    removeClass(button, 'active');
  }
}

/**
 * Initialize gallery view toggle
 */
export function initGalleryToggle(): void {
  const galleryToggle = getElementById<HTMLButtonElement>('gallery-toggle');

  if (!galleryToggle) return;

  // Load saved state
  galleryEnabled = localStorage.getItem('galleryEnabled') === 'true';

  // Initialize on page load if enabled
  if (galleryEnabled) {
    setThumbnailBackgrounds();
    addClass(document.body, 'gallery-mode');
    addClass(galleryToggle, 'active');
  }

  // Event listener
  galleryToggle.addEventListener('click', () => toggleGalleryMode(galleryToggle));
}
