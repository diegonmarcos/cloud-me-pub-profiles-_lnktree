// Areas (#1277, #1281, #1293): a three-level icon index on top (row 1 areas, then a "|" separator and the direct entries
// such as Repos, each opening one card; row 2 the selected area's projects; row 3 the selected project's families, a tap
// moves the carousel to that family's card). The area's own home card shows when the area is tapped (no row-2 chip); below it
// the selected project's cards on the site's one carousel (carousel.ts, same as every section): a home card for the project, then
// one card per sub-category (or per family). Home cards (area, project) list their children as rows (card / repo /
// webapp) plus the landing link, no applications; the card link jumps in-page (gotoCard). Every card is a kind:"tools" slide rendered by portal-render.ts
// renderToolsSlide, the xProjects renderer (#1308): columns of application categories, apps as icon + short label.
// Data: src/data/areas.json, generated at build time by scripts/areas-gen.mjs (registry + repo descriptions + app
// manifests). Inlined by esbuild; no runtime fetch. Area and per-area project selection persist in localStorage.
import areasData from '../../data/areas.json';
import { el } from '../utils/dom';
import { renderToolsSlide, renderReposSlide, type SlideTools, type SlideRepos } from './portal-render';
import { getCarousel, refreshCarousel } from './carousel';

// Every card is an xProjects tools slide (projects.json kind "tools", #1308): banner, title with its outline code, columns
// of application categories, each app an icon + short label linking where it runs.
export interface AreaProject { code: string; name: string; icon: string; repos: number; planned?: boolean; cards: SlideTools[]; }
export interface Area { code: string; field: string; icon: string; banner: string; home: SlideTools | null; projects: AreaProject[]; }
// Row 1 after the separator: one declared card opened directly (scripts/areas-cards.json direct; Repos is the xProjects repos card).
export interface DirectEntry { field: string; icon: string; card: SlideTools | SlideRepos; }
export interface AreasData { section: { id: string; title: string }; areas: Area[]; direct?: DirectEntry[]; }

// The generated JSON's string kinds do not narrow to the slide unions on their own.
const DATA = areasData as unknown as AreasData;

export const STORAGE_KEY = 'linktree.area';
export const PROJECT_KEY = 'linktree.project.';
// The area's own home card (code N.0): shown when the area is selected and no project is (#1330): its projects as rows.
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
    [...(ico ? [el('span', { class: 'area-chip__icon' }, [ico])] : []), el('span', { class: 'area-chip__label' }, [text])]);
  b.addEventListener('click', onClick);
  return b;
}

// Mount cards on the one carousel. The same renderers as the xProjects slides: no Areas-specific card markup.
function mountCards(root: HTMLElement, cards: (SlideTools | SlideRepos)[]): void {
  const row = root.querySelector<HTMLElement>('[data-area-cards]');
  if (row) refreshCarousel('areas', () => {
    row.textContent = '';
    for (const s of cards) {
      const slide = s.kind === 'repos' ? renderReposSlide(s) : renderToolsSlide(s);
      slide.dataset['cardId'] = s.id; // target of the in-page card links of the home cards (gotoCard)
      row.appendChild(slide);
    }
  });
}

// Row 3: the families of the selected project (its cards after the home card); a tap moves the carousel to that card.
function renderFamilies(root: HTMLElement, p: AreaProject | null): void {
  const frow = root.querySelector<HTMLElement>('[data-families-row]');
  if (!frow) return;
  frow.textContent = '';
  if (!p) return;
  p.cards.slice(1).forEach((s, k) => {
    const name = s.data?.['card'] || s.title;
    const c = chip(name, '', `${s.code} ${name}`, () => {
      setActive(frow, 'family', name);
      getCarousel('areas')?.swiper?.slideTo(k + 1, 0);
    });
    c.dataset.family = name;
    frow.appendChild(c);
  });
  frow.scrollLeft = 0;
}

export function selectProject(root: HTMLElement, field: string, project: string, data: AreasData = DATA): void {
  const area = data.areas.find((a) => a.field === field) || data.areas[0];
  if (!area) return;
  const p = project === AREA_HOME && area.home ? null : area.projects.find((x) => x.name === project) || area.projects[0];
  if (p === undefined) return;
  setActive(root.querySelector('[data-projects-row]'), 'project', p ? p.name : AREA_HOME);
  renderFamilies(root, p);
  mountCards(root, p ? p.cards : [area.home!]);
  store(PROJECT_KEY + area.field, p ? p.name : AREA_HOME);
}

// A direct row-1 entry (Repos): its one card, no project or family rows.
export function selectDirect(root: HTMLElement, field: string, data: AreasData = DATA): void {
  const d = data.direct?.find((x) => x.field === field);
  if (!d) return;
  setActive(root.querySelector('[data-areas-row]'), 'field', d.field);
  for (const sel of ['[data-projects-row]', '[data-families-row]']) { const r = root.querySelector<HTMLElement>(sel); if (r) r.textContent = ''; }
  mountCards(root, [d.card]);
  store(STORAGE_KEY, d.field);
}

// In-page card link (#1330): select the project that owns card `id` (the area home when it is the area's own card), then
// move the carousel to that card. Returns false for an unknown id.
export function gotoCard(root: HTMLElement, id: string, data: AreasData = DATA): boolean {
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

export function selectArea(root: HTMLElement, field: string, data: AreasData = DATA): void {
  if (data.direct?.some((d) => d.field === field)) { selectDirect(root, field, data); return; }
  const area = data.areas.find((a) => a.field === field) || data.areas[0];
  if (!area) return;
  setActive(root.querySelector('[data-areas-row]'), 'field', area.field);
  const prow = root.querySelector<HTMLElement>('[data-projects-row]');
  if (prow) {
    prow.textContent = '';
    for (const p of area.projects) {
      const c = chip(p.name, p.icon, `${p.code} ${p.name}: ${p.planned ? 'planned' : plural(p.repos, 'repo')}`, () => selectProject(root, area.field, p.name, data));
      c.dataset.project = p.name;
      prow.appendChild(c);
    }
    prow.scrollLeft = 0;
  }
  store(STORAGE_KEY, area.field);
  const saved = load(PROJECT_KEY + area.field);
  // Tapping the area shows its home card (row 2 then has no active chip); a remembered project is restored.
  const valid = (saved === AREA_HOME && area.home) || area.projects.some((p) => p.name === saved);
  selectProject(root, area.field, valid ? saved! : area.home ? AREA_HOME : area.projects[0]?.name, data);
}

export function renderAreas(root: HTMLElement, data: AreasData = DATA): number {
  const bar = root.querySelector<HTMLElement>('[data-areas-row]');
  if (!bar) return 0;
  bar.textContent = '';
  for (const area of data.areas) {
    const c = chip(area.field, area.icon, `${area.code} ${area.field} (${plural(area.projects.length, 'project')})`, () => selectArea(root, area.field, data));
    c.dataset.field = area.field;
    bar.appendChild(c);
  }
  if (data.direct?.length) {
    bar.appendChild(el('span', { class: 'areas-sep', 'aria-hidden': 'true' }, ['|']));
    for (const d of data.direct) {
      const c = chip(d.field, d.icon, `${d.field}: ${d.card.title}`, () => selectDirect(root, d.field, data));
      c.dataset.field = d.field;
      bar.appendChild(c);
    }
  }
  if (!root.dataset['cardLinks']) {
    root.dataset['cardLinks'] = '1';
    root.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('a[data-card]');
      if (a && gotoCard(root, a.dataset['card']!, data)) e.preventDefault();
    });
  }
  const saved = load(STORAGE_KEY);
  const first = data.areas.find((a) => a.field === saved) || data.direct?.find((d) => d.field === saved) ? saved! : data.areas[0]?.field;
  if (first) selectArea(root, first, data);
  return data.areas.length;
}

export function initAreas(): void {
  const root = document.querySelector<HTMLElement>('.areas-section');
  if (root) renderAreas(root);
}
