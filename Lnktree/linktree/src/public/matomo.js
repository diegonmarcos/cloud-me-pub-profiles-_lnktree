/**
 * Matomo Tracking - Linktree Page
 *
 * Tracks:
 * - Link clicks (with category and subsection)
 * - Social icon clicks
 * - vCard downloads
 * - Collapsible "more" buttons
 * - Subsection interactions
 */

(function() {
  'use strict';

  // Skip tracking on file:// protocol or localhost
  if (window.location.protocol === 'file:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1') {
    return;
  }

  // Check if Matomo is loaded
  if (typeof _paq === 'undefined') {
    return;
  }

  // Safe push wrapper to prevent errors
  function track(args) {
    try {
      _paq.push(args);
    } catch (e) {
      // Silently ignore tracking errors
    }
  }

  // Helper: Get link category
  function getLinkCategory(element) {
    var section = element.closest('.link-section');
    if (section) {
      var title = section.querySelector('.section-title');
      return title ? title.textContent.trim() : 'Unknown';
    }
    return 'Unknown';
  }

  // Helper: Get link subsection
  function getLinkSubsection(element) {
    var container = element.closest('.links-container');
    if (container) {
      var subsectionTitle = container.previousElementSibling;
      if (subsectionTitle && subsectionTitle.classList.contains('subsection-title')) {
        return subsectionTitle.textContent.trim();
      }
    }
    return null;
  }

  // Click tracking
  document.addEventListener('click', function(e) {
    try {
      var target = e.target.closest('a, button');
      if (!target) return;

      // Social icon clicks
      if (target.closest('.social-icons') || target.classList.contains('social-icon')) {
        var platform = target.getAttribute('title') || target.textContent.trim() || 'Unknown';
        var url = target.href || 'no-url';

        track(['trackEvent', 'Social', 'Icon Click', platform, url]);
      }

      // Main link clicks (Professional/Personal sections)
      else if (target.closest('.links-container') && target.classList.contains('link-item')) {
        var category = getLinkCategory(target);
        var subsection = getLinkSubsection(target);
        var linkText = target.textContent.trim();
        var linkUrl = target.href || target.getAttribute('data-href') || 'no-url';

        var eventName = subsection ? category + ' - ' + subsection + ' - ' + linkText : category + ' - ' + linkText;

        track(['trackEvent', 'Linktree', 'Link Click', eventName, linkUrl]);
      }

      // Collapsible "more" buttons
      else if (target.classList.contains('more-btn') || target.textContent.includes('more')) {
        var section = getLinkCategory(target);
        var isExpanded = target.getAttribute('aria-expanded') === 'true';
        var action = isExpanded ? 'Collapse' : 'Expand';

        track(['trackEvent', 'Linktree', 'More Button', section + ' - ' + action]);
      }

      // vCard download
      else if (target.href && target.href.endsWith('.vcf')) {
        track(['trackEvent', 'Download', 'vCard', 'Contact Card']);
      }
    } catch (e) {
      // Silently ignore click tracking errors
    }
  });

  // Track scroll depth specifically for linktree sections
  var sectionsSeen = {};

  function trackSectionVisibility() {
    try {
      var sections = document.querySelectorAll('.link-section');

      sections.forEach(function(section) {
        var sectionTitle = section.querySelector('.section-title');
        var sectionName = sectionTitle ? sectionTitle.textContent.trim() : 'Unknown';

        if (!sectionsSeen[sectionName]) {
          var rect = section.getBoundingClientRect();
          var isVisible = rect.top < window.innerHeight && rect.bottom > 0;

          if (isVisible) {
            sectionsSeen[sectionName] = true;
            track(['trackEvent', 'Engagement', 'Section Viewed', sectionName]);
          }
        }
      });
    } catch (e) {
      // Silently ignore visibility tracking errors
    }
  }

  // Track section visibility on scroll
  window.addEventListener('scroll', function() {
    clearTimeout(window.scrollTimer);
    window.scrollTimer = setTimeout(trackSectionVisibility, 150);
  });

  // Initial check
  setTimeout(trackSectionVisibility, 1000);

})();
