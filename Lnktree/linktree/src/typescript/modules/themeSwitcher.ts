// Theme Switcher — one exclusive choice out of dark / light / lightweight /
// terminal, persisted under localStorage['theme'].
//
// This replaces the old split between themeToggle (dark↔light) and
// performanceMode (the "lite" toggle, which the menu confusingly labelled
// "Light Mode" even though it is a performance mode, not a colour scheme).
// Both are now themes in one mutually-exclusive list, so the two can no
// longer be enabled at once and end up fighting over the same surfaces.
//
// Dark is ALWAYS the default: the OS `prefers-color-scheme` signal is
// deliberately ignored, so a visitor on a light-themed desktop still lands
// on the designed dark look. The one OS signal honoured is
// `prefers-reduced-motion` — motion sensitivity is an accessibility need,
// not a styling preference — and only for visitors with no saved choice.
//
// Each theme maps to at most one <body> class; the colour work itself is
// fully declarative in scss/components/_theme-*.scss. Note that `lite-mode`
// is also read by canvas-bg.ts and tilt3d.ts as their "skip the expensive
// effects" gate, so that class name is a behavioural contract — rename it
// there too or not at all.

const STORAGE_KEY = 'theme';
const LEGACY_LITE_KEY = 'liteMode';

export type ThemeName = 'dark' | 'light' | 'lightweight' | 'terminal';

interface Theme {
  name: ThemeName;
  bodyClass: string; // '' for dark — the un-classed baseline
  buttonId: string;
  // Whether the background video should run. Every non-dark theme hides it
  // via CSS, but a display:none <video> keeps decoding in many browsers, so
  // it has to be paused explicitly as well.
  video: boolean;
}

const THEMES: Theme[] = [
  { name: 'dark', bodyClass: '', buttonId: 'theme-dark', video: true },
  { name: 'light', bodyClass: 'light-theme', buttonId: 'theme-light', video: false },
  { name: 'lightweight', bodyClass: 'lite-mode', buttonId: 'theme-lightweight', video: false },
  { name: 'terminal', bodyClass: 'terminal-theme', buttonId: 'theme-terminal', video: false },
];

function isThemeName(value: string | null): value is ThemeName {
  return THEMES.some((t) => t.name === value);
}

// Wrap a class swap in `document.startViewTransition` when supported —
// native cross-fade between themes, on the compositor. Falls through to a
// plain mutation where unsupported (Firefox today, Safari < 18).
type StartViewTransition = (cb: () => void) => unknown;
function withTransition(mutate: () => void): void {
  const sv = (document as unknown as { startViewTransition?: StartViewTransition }).startViewTransition;
  if (typeof sv === 'function') sv.call(document, mutate);
  else mutate();
}

function syncVideo(theme: Theme): void {
  const video = document.getElementById('background-video') as HTMLVideoElement | null;
  if (!video) return;
  if (theme.video && video.paused) {
    video.play().catch(() => { /* autoplay can be blocked — harmless */ });
  } else if (!theme.video && !video.paused) {
    video.pause();
  }
}

function applyTheme(name: ThemeName): void {
  const theme = THEMES.find((t) => t.name === name) ?? THEMES[0]!;

  withTransition(() => {
    for (const t of THEMES) {
      if (t.bodyClass) document.body.classList.remove(t.bodyClass);
    }
    if (theme.bodyClass) document.body.classList.add(theme.bodyClass);
  });

  syncVideo(theme);

  // Mark the active choice on both menus — the hamburger children proxy
  // their clicks to these same buttons, so highlighting them is enough.
  for (const t of THEMES) {
    const btn = document.getElementById(t.buttonId);
    btn?.classList.toggle('active', t.name === theme.name);
    document
      .querySelector(`.hamburger-item[data-trigger="${t.buttonId}"]`)
      ?.classList.toggle('active', t.name === theme.name);
  }
}

function resolveInitial(): ThemeName {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (isThemeName(saved)) return saved;
  // Migrate visitors who set the old separate lite-mode flag.
  if (localStorage.getItem(LEGACY_LITE_KEY) === 'true') return 'lightweight';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'lightweight';
  return 'dark';
}

export function getTheme(): ThemeName {
  const active = THEMES.find((t) => t.bodyClass && document.body.classList.contains(t.bodyClass));
  return active ? active.name : 'dark';
}

export function setTheme(name: ThemeName): void {
  applyTheme(name);
  localStorage.setItem(STORAGE_KEY, name);
  localStorage.removeItem(LEGACY_LITE_KEY);
}

export function initThemeSwitcher(): void {
  applyTheme(resolveInitial());
  for (const theme of THEMES) {
    document.getElementById(theme.buttonId)?.addEventListener('click', () => setTheme(theme.name));
  }
}
