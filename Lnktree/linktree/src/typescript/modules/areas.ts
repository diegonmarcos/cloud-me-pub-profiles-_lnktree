// Areas (#1277, #1281, #1293): a two-level icon index (row 1 areas, row 2 the selected area's projects) on top; below it
// the selected project's cards on the site's one carousel (carousel.ts, same as every section): a home card for the project, then
// one card per sub-category (or per family) listing its repos and, for app-fleet repos, their declared apps.
// Data: src/data/areas.json, generated at build time by scripts/areas-gen.mjs (registry + repo descriptions + app
// manifests). Inlined by esbuild; no runtime fetch. Area and per-area project selection persist in localStorage.
import areasData from '../../data/areas.json';
import { el } from '../utils/dom';
import { slideCard } from './card';
import { refreshCarousel } from './carousel';

export interface AreaApp { name: string; url: string; description?: string; }
export interface AreaRepo { name: string; url?: string; hub?: boolean; private?: boolean; family?: string; apps?: AreaApp[]; }
export interface AreaCard { code: string; name: string; kind: 'family' | 'subcategory'; brief?: string; repos: AreaRepo[]; }
export interface AreaProject {
  code: string; name: string; icon: string; banner?: string; brief: string; repos: number; public: number; url: string | null; private_only: boolean;
  home: AreaRepo[]; cards: AreaCard[];
}
export interface Area { code: string; field: string; icon: string; banner: string; brief: string; url: string | null; home: AreaRepo[]; projects: AreaProject[]; }
export interface AreasData { section: { id: string; title: string }; areas: Area[]; }

export const STORAGE_KEY = 'linktree.area';
export const PROJECT_KEY = 'linktree.project.';
// The area's own home card (code N.0) sits first in the projects row of an area that has a hub repo.
export const AREA_HOME = '#area';

function icon(src: string): HTMLImageElement {
  return el('img', { class: 'icon', src, alt: '', loading: 'lazy', decoding: 'async' });
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const store = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const load = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };

// Cards are the shared card (card.ts, same as xProjects): .swiper-slide > .link-section > h2.section-title +
// img.featured-image + .links-container holding a .tools-dashboard of .tools-column (header + .tools-column__links of
// .tool-link), a .profile-section/.subsection-title for text, and a.link for the primary button. No Areas-only card styles.
function toolLink(label: string, ico: string, url?: string, title?: string): HTMLElement {
  const attrs: Record<string, string> = url ? { class: 'tool-link', href: url, target: '_blank', rel: 'noopener' } : { class: 'tool-link tool-link--private' };
  if (title) attrs['title'] = title;
  return el(url ? 'a' : 'span', attrs, [icon(ico), label]);
}

function repoItem(r: AreaRepo): HTMLElement {
  return r.private || !r.url
    ? toolLink(r.name, 'public/icons/lock.svg', undefined, 'private repository')
    : toolLink(r.name, 'public/icons/brand-github.svg', r.url);
}

const column = (header: string, items: HTMLElement[]): HTMLElement =>
  el('div', { class: 'tools-column' }, [el('div', { class: 'tools-column__header' }, [header]), el('div', { class: 'tools-column__links' }, items)]);

function dashboard(repos: AreaRepo[], grouped: boolean, fallback: string): HTMLElement {
  const groups: [string, AreaRepo[]][] = [];
  for (const r of repos) {
    const g = (grouped && r.family) || fallback;
    let e = groups.find((x) => x[0] === g);
    if (!e) groups.push(e = [g, []]);
    e[1].push(r);
  }
  const cols = groups.map(([g, list]) => column(g, list.map(repoItem)));
  for (const r of repos) if (r.apps?.length) {
    cols.push(column(`Apps (${r.apps.length})`, r.apps.map((app) => {
      const a = toolLink(app.name, 'public/icons/device-mobile.svg', app.url, app.description);
      a.dataset['app'] = app.name;
      return a;
    })));
  }
  return el('div', { class: `tools-dashboard tools-dashboard--${Math.min(cols.length, 3)}` }, cols);
}

const note = (text: string): HTMLElement => el('div', { class: 'profile-section' }, [el('h3', { class: 'subsection-title' }, [text])]);

// Every Areas card is the shared card (card.ts) with the project's banner, like an xProjects card.
// Card title: the outline code (subtle, .card-code) then the name, e.g. "1.1.2 C3".
function titled(code: string, text: string): DocumentFragment {
  const f = document.createDocumentFragment();
  f.append(el('span', { class: 'card-code' }, [code]), text);
  return f;
}

function card(kind: string, name: string, code: string, banner: string, project: string, area: Area, title: string) {
  return slideCard({ title: titled(code, title), image: { src: banner, alt: name },
    data: { kind, card: name, code, project, field: area.field } });
}

function areaHomeCard(area: Area): HTMLElement {
  const { slide, body } = card('area', area.field, `${area.code}.0`, area.banner, AREA_HOME, area, `${area.icon} ${area.field}`);
  body!.appendChild(note(area.brief));
  if (area.home.length) body!.appendChild(dashboard(area.home, false, 'Hub'));
  body!.appendChild(column('Projects', area.projects.map((p) => el('span', { class: 'tool-link' }, [`${p.code} ${p.icon} ${p.name}`]))));
  if (area.url) body!.appendChild(el('a', { class: 'link', href: area.url, target: '_blank', rel: 'noopener' }, [icon('public/icons/brand-github.svg'), 'Open hub']));
  return slide;
}

function homeCard(area: Area, p: AreaProject): HTMLElement {
  const { slide, body } = card('home', p.name, `${p.code}.0`, p.banner || area.banner, p.name, area, `${p.icon} ${p.name}`);
  const about = note(p.brief);
  about.appendChild(el('h3', { class: 'subsection-title' },
    [`${area.icon} ${area.field} · ${plural(p.repos, 'repo')} (${p.public} public) · ${plural(p.cards.length, 'card')}${p.private_only ? ' · private' : ''}`]));
  body!.appendChild(about);
  if (p.home.length) body!.appendChild(dashboard(p.home, false, 'Hub'));
  if (p.url) body!.appendChild(el('a', { class: 'link', href: p.url, target: '_blank', rel: 'noopener' },
    [icon('public/icons/brand-github.svg'), p.home.some((r) => r.url === p.url) ? 'Open hub' : 'Open repo']));
  if (p.cards.length) body!.appendChild(note(p.cards.map((c) => `${c.code} ${c.name}`).join(' · ')));
  return slide;
}

function familyCard(area: Area, p: AreaProject, c: AreaCard): HTMLElement {
  const { slide, body } = card(c.kind, c.name, c.code, p.banner || area.banner, p.name, area, c.name);
  const apps = c.repos.reduce((n, r) => n + (r.apps?.length || 0), 0);
  const meta = note(`${p.icon} ${p.name} · ${plural(c.repos.length, 'repo')}${apps ? ` · ${plural(apps, 'app')}` : ''}`);
  if (c.brief) meta.prepend(el('h3', { class: 'subsection-title' }, [c.brief]));
  body!.appendChild(meta);
  body!.appendChild(dashboard(c.repos, c.kind === 'subcategory', c.name));
  return slide;
}

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
  const p = project === AREA_HOME && area.home.length ? null : area.projects.find((x) => x.name === project) || area.projects[0];
  if (p === undefined) return;
  setActive(root.querySelector('[data-projects-row]'), 'project', p ? p.name : AREA_HOME);
  const row = root.querySelector<HTMLElement>('[data-area-cards]');
  if (row) refreshCarousel('areas', () => {
    row.textContent = '';
    if (!p) { row.appendChild(areaHomeCard(area)); return; }
    row.appendChild(homeCard(area, p));
    for (const c of p.cards) row.appendChild(familyCard(area, p, c));
  });
  store(PROJECT_KEY + area.field, p ? p.name : AREA_HOME);
}

export function selectArea(root: HTMLElement, field: string, data: AreasData = areasData as AreasData): void {
  const area = data.areas.find((a) => a.field === field) || data.areas[0];
  if (!area) return;
  setActive(root.querySelector('[data-areas-row]'), 'field', area.field);
  const prow = root.querySelector<HTMLElement>('[data-projects-row]');
  if (prow) {
    prow.textContent = '';
    if (area.home.length) {
      const h = chip(area.field, area.icon, `${area.code}.0 ${area.field} home: ${plural(area.projects.length, 'project')}`, () => selectProject(root, area.field, AREA_HOME, data));
      h.dataset.project = AREA_HOME;
      h.classList.add('area-chip--home');
      prow.appendChild(h);
    }
    for (const p of area.projects) {
      const c = chip(p.name, p.icon, `${p.code} ${p.name}: ${plural(p.repos, 'repo')}`, () => selectProject(root, area.field, p.name, data));
      c.dataset.project = p.name;
      prow.appendChild(c);
    }
    prow.scrollLeft = 0;
  }
  store(STORAGE_KEY, area.field);
  const saved = load(PROJECT_KEY + area.field);
  const valid = (saved === AREA_HOME && area.home.length) || area.projects.some((p) => p.name === saved);
  selectProject(root, area.field, valid ? saved! : area.home.length ? AREA_HOME : area.projects[0]?.name, data);
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
  const saved = load(STORAGE_KEY);
  const first = data.areas.find((a) => a.field === saved) ? saved! : data.areas[0]?.field;
  if (first) selectArea(root, first, data);
  return data.areas.length;
}

export function initAreas(): void {
  const root = document.querySelector<HTMLElement>('.areas-section');
  if (root) renderAreas(root);
}
