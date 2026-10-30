// Areas (#1277, #1281, #1293): a two-level icon index (row 1 areas, row 2 the selected area's projects) on top; below it
// the selected project's cards on the site's one carousel (carousel.ts, same as every section): a home card for the project, then
// one card per sub-category (or per family). Home cards (area, project) list their children as rows (card / repo /
// webapp) plus the landing link, no applications; the card link jumps in-page (gotoCard). Every card is a kind:"tools" slide rendered by portal-render.ts
// renderToolsSlide, the xProjects renderer (#1308): columns of application categories, apps as icon + short label.
// Data: src/data/areas.json, generated at build time by scripts/areas-gen.mjs (registry + repo descriptions + app
// manifests). Inlined by esbuild; no runtime fetch. Area and per-area project selection persist in localStorage.
import areasData from '../../data/areas.json';
import { el } from '../utils/dom';
import { renderToolsSlide, type SlideTools } from './portal-render';
import { getCarousel, refreshCarousel } from './carousel';

// Every card is an xProjects tools slide (projects.json kind "tools", #1308): banner, title with its outline code, columns
// of application categories, each app an icon + short label linking where it runs.
export interface AreaProject { code: string; name: string; icon: string; repos: number; planned?: boolean; cards: SlideTools[]; }
export interface Area { code: string; field: string; icon: string; banner: string; home: SlideTools | null; projects: AreaProject[]; }
export interface AreasData { section: { id: string; title: string }; areas: Area[]; }

export const STORAGE_KEY = 'linktree.area';
export const PROJECT_KEY = 'linktree.project.';
// The area's own home card (code N.0) sits first in the projects row of EVERY area (#1330): its projects as rows.
export const AREA_HOME = '#area';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const store = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const load = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };

function setActive(row: HTMLElement | null, attr: string, value: string): void {
  if (!row) return;
  for (const chip of row.querySelectorAll<HTMLButtonElement>('.area-chip')) {
    const on = chip.dataset[attr] === value;
    chip.classList.toggle('is-active', on);
    chip.setAttribute('aria-selected', String(on));
    chip.tabIndex = on ? 0 : -1;
  }
}

function chip(text: string, ico: string, title: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', { class: 'area-chip', type: 'button', title, role: 'tab', 'aria-label': text },
    [el('span', { class: 'area-chip__icon' }, [ico]), el('span', { class: 'area-chip__label' }, [text])]);
  b.addEventListener('click', onClick);
  return b;
}

export function selectProject(root: HTMLElement, field: string, project: string, data: AreasData = areasData as AreasData): void {
  const area = data.areas.find((a) => a.field === field) || data.areas[0];
  if (!area) return;
  const p = project === AREA_HOME && area.home ? null : area.projects.find((x) => x.name === project) || area.projects[0];
  if (p === undefined) return;
  setActive(root.querySelector('[data-projects-row]'), 'project', p ? p.name : AREA_HOME);
  const row = root.querySelector<HTMLElement>('[data-area-cards]');
  if (row) refreshCarousel('areas', () => {
    row.textContent = '';
    // The same renderer as the xProjects tools slides: no Areas-specific card markup.
    for (const s of p ? p.cards : [area.home!]) {
      const slide = renderToolsSlide(s);
      slide.dataset['cardId'] = s.id; // target of the in-page card links of the home cards (gotoCard)
      row.appendChild(slide);
    }
  });
  store(PROJECT_KEY + area.field, p ? p.name : AREA_HOME);
}

// In-page card link (#1330): select the project that owns card `id` (the area home when it is the area's own card), then
// move the carousel to that card. Returns false for an unknown id.
export function gotoCard(root: HTMLElement, id: string, data: AreasData = areasData as AreasData): boolean {
  for (const area of data.areas) {
    const own = area.home?.id === id;
    const p = own ? null : area.projects.find((x) => x.cards.some((c) => c.id === id));
    if (!own && !p) continue;
    if (root.querySelector('[data-areas-row] .area-chip.is-active')?.getAttribute('data-field') !== area.field) selectArea(root, area.field, data);
    selectProject(root, area.field, p ? p.name : AREA_HOME, data);
    const i = p ? p.cards.findIndex((c) => c.id === id) : 0;
    getCarousel('areas')?.swiper?.slideTo(i, 0);
    root.querySelector<HTMLElement>('[data-area-cards]')?.scrollIntoView?.({ block: 'nearest' });
    return true;
  }
  return false;
}

export function selectArea(root: HTMLElement, field: string, data: AreasData = areasData as AreasData): void {
  const area = data.areas.find((a) => a.field === field) || data.areas[0];
  if (!area) return;
  setActive(root.querySelector('[data-areas-row]'), 'field', area.field);
  const prow = root.querySelector<HTMLElement>('[data-projects-row]');
  if (prow) {
    prow.textContent = '';
    if (area.home) {
      const h = chip(area.field, area.icon, `${area.code}.0 ${area.field} home: ${plural(area.projects.length, 'project')}`, () => selectProject(root, area.field, AREA_HOME, data));
      h.dataset.project = AREA_HOME;
      h.classList.add('area-chip--home');
      prow.appendChild(h);
    }
    for (const p of area.projects) {
      const c = chip(p.name, p.icon, `${p.code} ${p.name}: ${p.planned ? 'planned' : plural(p.repos, 'repo')}`, () => selectProject(root, area.field, p.name, data));
      c.dataset.project = p.name;
      prow.appendChild(c);
    }
    prow.scrollLeft = 0;
  }
  store(STORAGE_KEY, area.field);
  const saved = load(PROJECT_KEY + area.field);
  const valid = (saved === AREA_HOME && area.home) || area.projects.some((p) => p.name === saved);
  selectProject(root, area.field, valid ? saved! : area.home ? AREA_HOME : area.projects[0]?.name, data);
}

export function renderAreas(root: HTMLElement, data: AreasData = areasData as AreasData): number {
  const bar = root.querySelector<HTMLElement>('[data-areas-row]');
  if (!bar) return 0;
  bar.textContent = '';
  for (const area of data.areas) {
    const c = chip(area.field, area.icon, `${area.code} ${area.field} (${plural(area.projects.length, 'project')})`, () => selectArea(root, area.field, data));
    c.dataset.field = area.field;
    bar.appendChild(c);
  }
  if (!root.dataset['cardLinks']) {
    root.dataset['cardLinks'] = '1';
    root.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('a[data-card]');
      if (a && gotoCard(root, a.dataset['card']!, data)) e.preventDefault();
    });
  }
  const saved = load(STORAGE_KEY);
  const first = data.areas.find((a) => a.field === saved) ? saved! : data.areas[0]?.field;
  if (first) selectArea(root, first, data);
  return data.areas.length;
}

export function initAreas(): void {
  const root = document.querySelector<HTMLElement>('.areas-section');
  if (root) renderAreas(root);
}
