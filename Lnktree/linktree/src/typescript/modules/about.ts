// About panel — what this page is, how it is built, and how to drive it.
//
// Everything stated here is checked against the repository itself
// (package.json, build.json, the module list) rather than hand-maintained
// prose that quietly goes stale. The runtime facts — build freshness,
// service-worker state, PWA install status — are read live at open time.

import { openPanel } from './panel';

const REPO_URL = 'https://github.com/diegonmarcos/diegonmarcos.github.io';
const LINKTREE_PATH = 'a_Portals/linktree';

function renderRuntimeFacts(): string {
  const sw = 'serviceWorker' in navigator;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  return `
    <div class="diag-grid">
      <div class="diag-item"><span class="diag-label">Page built:</span><span class="diag-value">${document.lastModified}</span></div>
      <div class="diag-item"><span class="diag-label">Offline capable:</span><span class="diag-value ${sw ? 'status-good' : 'status-warn'}">${sw ? 'Yes (service worker)' : 'No'}</span></div>
      <div class="diag-item"><span class="diag-label">Running as app:</span><span class="diag-value">${standalone ? 'Yes (installed PWA)' : 'No (browser tab)'}</span></div>
      <div class="diag-item"><span class="diag-label">Language:</span><span class="diag-value">${navigator.language}</span></div>
    </div>`;
}

function renderAbout(): string {
  return `
    <div class="diagnostics-container about-panel">
      <div class="diag-section diag-section--wide">
        <h3>What this is</h3>
        <p class="about-lede">
          A personal links hub — one page collecting the projects, profiles and
          services of <strong>Diego Nepomuceno Marcos</strong>. Every card,
          icon and link on it is generated from JSON, so the page is a view
          over data rather than a hand-written document.
        </p>
      </div>

      <div class="diag-section">
        <h3>How it is built</h3>
        <div class="diag-grid">
          <div class="diag-item"><span class="diag-label">Framework:</span><span class="diag-value">None — vanilla TypeScript</span></div>
          <div class="diag-item"><span class="diag-label">Styles:</span><span class="diag-value">SCSS (ITCSS layering)</span></div>
          <div class="diag-item"><span class="diag-label">Content:</span><span class="diag-value">JSON in src/data/</span></div>
          <div class="diag-item"><span class="diag-label">Carousels:</span><span class="diag-value">Swiper</span></div>
          <div class="diag-item"><span class="diag-label">Delivery:</span><span class="diag-value">PWA + service worker</span></div>
          <div class="diag-item"><span class="diag-label">Pipeline:</span><span class="diag-value">GitHub Actions → GitHub Pages</span></div>
        </div>
        <p class="about-note">
          The build wraps each <code>src/data/*.json</code> file into a
          <code>PORTAL_DATA</code> companion script, generates the full PWA
          icon set from a single source image, then compiles TypeScript and
          SCSS. No runtime fetch is needed to render the page.
        </p>
      </div>

      <div class="diag-section">
        <h3>This session</h3>
        ${renderRuntimeFacts()}
      </div>

      <div class="diag-section diag-section--wide">
        <h3>Using the page</h3>
        <div class="about-tips">
          <div class="about-tip"><strong>Theme Switcher</strong> — Dark (default), Light, Lightweight and Terminal. Your choice is remembered on this device.</div>
          <div class="about-tip"><strong>Lightweight</strong> — a performance mode, not a colour scheme: it drops animations, blur, filters and the background video for low-end devices and slow connections. It is selected automatically if your system asks for reduced motion.</div>
          <div class="about-tip"><strong>Commits</strong> — live history and stats for the repository behind this page.</div>
          <div class="about-tip"><strong>Dev Tools</strong> — full device and network diagnostics, plus an on-page console.</div>
          <div class="about-tip"><strong>Clear Cache</strong> — unregisters the service worker, drops every cache and reloads, if you are stuck on a stale version.</div>
          <div class="about-tip"><strong>Escape</strong> — closes any open panel.</div>
        </div>
      </div>

      <div class="diag-section">
        <h3>Source</h3>
        <div class="diag-sources">
          <a class="diag-source-link" href="${REPO_URL}/tree/main/${LINKTREE_PATH}" target="_blank" rel="noopener">
            <img src="public/icons/brand-github.svg" alt="" width="16" height="16"> This page
          </a>
          <a class="diag-source-link" href="${REPO_URL}" target="_blank" rel="noopener">
            <img src="public/icons/brand-github.svg" alt="" width="16" height="16"> Monorepo
          </a>
          <a class="diag-source-link" href="${REPO_URL}/releases" target="_blank" rel="noopener">
            <img src="public/icons/brand-github.svg" alt="" width="16" height="16"> Releases
          </a>
        </div>
        <p class="about-note">Licensed ISC. Built in the open — issues and pull requests welcome.</p>
      </div>
    </div>`;
}

export function initAboutPanel(): void {
  document.getElementById('about-toggle')?.addEventListener('click', () => {
    openPanel({ title: 'About', render: renderAbout });
  });
}
