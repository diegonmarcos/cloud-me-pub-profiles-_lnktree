// Areas (#1277, #1281, #1293): a two-level icon index (row 1 areas, row 2 the selected area's projects) on top; below it
// the selected project's cards in a one-card-per-view snap carousel (swipe or arrows): a home card for the project, then
// one card per sub-category (or per family) listing its repos and, for app-fleet repos, their declared apps.
// Data: src/data/areas.json, generated at build time by scripts/areas-gen.mjs (registry + repo descriptions + app
// manifests). Inlined by esbuild; no runtime fetch. Area and per-area project selection persist in localStorage.
import areasData from '../../data/areas.json';

export interface AreaApp { name: string; url: string; description?: string; }
export interface AreaRepo { name: string; url?: string; hub?: boolean; private?: boolean; family?: string; apps?: AreaApp[]; }
export interface AreaCard { name: string; kind: 'family' | 'subcategory'; repos: AreaRepo[]; }
export interface AreaProject {
  name: string; icon: string; brief: string; repos: number; public: number; url: string | null; private_only: boolean;
  home: AreaRepo[]; cards: AreaCard[];
}
export interface Area { field: string; icon: string; banner: string; projects: AreaProject[]; }
export interface AreasData { section: { id: string; title: string }; areas: Area[]; }

export const STORAGE_KEY = 'linktree.area';
export const PROJECT_KEY = 'linktree.project.';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function icon(src: string): HTMLImageElement {
  const i = el('img', 'icon');
  i.src = src; i.alt = ''; i.loading = 'lazy'; i.decoding = 'async';
  return i;
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const store = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const load = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };

function repoItem(r: AreaRepo): HTMLElement {
  if (r.private || !r.url) {
    const s = el('span', 'tool-link tool-link--private');
    s.title = 'private repository';
    s.appendChild(icon('public/icons/lock.svg'));
    s.appendChild(document.createTextNode(r.name));
    return s;
  }
  const a = el('a', 'tool-link');
  a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
  a.appendChild(icon('public/icons/brand-github.svg'));
  a.appendChild(document.createTextNode(r.name));
  return a;
}

function repoList(repos: AreaRepo[], grouped: boolean): HTMLElement {
  const body = el('div', 'links-container area-card__body');
  const groups: [string | null, AreaRepo[]][] = [];
  for (const r of repos) {
    const g = grouped ? r.family || null : null;
    let e = groups.find((x) => x[0] === g);
    if (!e) groups.push(e = [g, []]);
    e[1].push(r);
  }
  for (const [g, list] of groups) {
    if (g) body.appendChild(el('div', 'area-card__group', g));
    const links = el('div', 'area-card__links');
    for (const r of list) links.appendChild(repoItem(r));
    body.appendChild(links);
    for (const r of list) if (r.apps?.length) {
      body.appendChild(el('div', 'area-card__group', `Apps (${r.apps.length})`));
      const apps = el('div', 'area-card__apps');
      for (const app of r.apps) {
        const a = el('a', 'tool-link area-card__app');
        a.href = app.url; a.target = '_blank'; a.rel = 'noopener';
        a.dataset.app = app.name;
        if (app.description) a.title = app.description;
        a.appendChild(icon('public/icons/device-mobile.svg'));
        a.appendChild(document.createTextNode(app.name));
        apps.appendChild(a);
      }
      body.appendChild(apps);
    }
  }
  return body;
}

function shell(kind: string, name: string, p: AreaProject, area: Area): HTMLElement {
  const card = el('div', 'link-section area-card');
  card.dataset.kind = kind;
  card.dataset.card = name;
  card.dataset.project = p.name;
  card.dataset.field = area.field;
  return card;
}

function homeCard(area: Area, p: AreaProject): HTMLElement {
  const card = shell('home', p.name, p, area);
  const title = el('h2', 'section-title');
  if (p.url) {
    const a = el('a', 'area-card__title-link', `${p.icon} ${p.name}`);
    a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
    title.appendChild(a);
  } else title.textContent = `${p.icon} ${p.name}`;
  card.appendChild(title);
  const img = el('img', 'featured-image area-card__banner');
  img.src = area.banner; img.alt = p.name; img.loading = 'lazy'; img.decoding = 'async';
  card.appendChild(img);
  card.appendChild(el('p', 'area-card__brief', p.brief));
  card.appendChild(el('div', 'area-card__meta',
    `${area.icon} ${area.field} · ${plural(p.repos, 'repo')} (${p.public} public) · ${plural(p.cards.length, 'card')}${p.private_only ? ' · private' : ''}`));
  if (p.home.length) card.appendChild(repoList(p.home, false));
  if (p.url) {
    const a = el('a', 'area-card__open', p.home.some((r) => r.url === p.url) ? 'Open hub →' : 'Open repo →');
    a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
    card.appendChild(a);
  }
  const hint = el('div', 'area-card__next', p.cards.map((c) => c.name).join(' · '));
  card.appendChild(hint);
  return card;
}

function familyCard(area: Area, p: AreaProject, c: AreaCard): HTMLElement {
  const card = shell(c.kind, c.name, p, area);
  card.appendChild(el('h2', 'section-title', c.name));
  const apps = c.repos.reduce((n, r) => n + (r.apps?.length || 0), 0);
  card.appendChild(el('div', 'area-card__meta', `${p.icon} ${p.name} · ${plural(c.repos.length, 'repo')}${apps ? ` · ${plural(apps, 'app')}` : ''}`));
  card.appendChild(repoList(c.repos, c.kind === 'subcategory'));
  return card;
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
  const b = el('button', 'area-chip');
  b.type = 'button';
  b.title = title;
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-label', text);
  b.appendChild(el('span', 'area-chip__icon', ico));
  b.appendChild(el('span', 'area-chip__label', text));
  b.addEventListener('click', onClick);
  return b;
}

export function selectProject(root: HTMLElement, field: string, project: string, data: AreasData = areasData as AreasData): void {
  const area = data.areas.find((a) => a.field === field) || data.areas[0];
  if (!area) return;
  const p = area.projects.find((x) => x.name === project) || area.projects[0];
  if (!p) return;
  setActive(root.querySelector('[data-projects-row]'), 'project', p.name);
  const row = root.querySelector<HTMLElement>('[data-area-cards]');
  if (row) {
    row.textContent = '';
    row.appendChild(homeCard(area, p));
    for (const c of p.cards) row.appendChild(familyCard(area, p, c));
    row.scrollLeft = 0;
  }
  store(PROJECT_KEY + area.field, p.name);
}

export function selectArea(root: HTMLElement, field: string, data: AreasData = areasData as AreasData): void {
  const area = data.areas.find((a) => a.field === field) || data.areas[0];
  if (!area) return;
  setActive(root.querySelector('[data-areas-row]'), 'field', area.field);
  const prow = root.querySelector<HTMLElement>('[data-projects-row]');
  if (prow) {
    prow.textContent = '';
    for (const p of area.projects) {
      const c = chip(p.name, p.icon, `${p.name}: ${plural(p.repos, 'repo')}`, () => selectProject(root, area.field, p.name, data));
      c.dataset.project = p.name;
      prow.appendChild(c);
    }
    prow.scrollLeft = 0;
  }
  store(STORAGE_KEY, area.field);
  const saved = load(PROJECT_KEY + area.field);
  selectProject(root, area.field, area.projects.some((p) => p.name === saved) ? saved! : area.projects[0]?.name, data);
}

export function renderAreas(root: HTMLElement, data: AreasData = areasData as AreasData): number {
  const bar = root.querySelector<HTMLElement>('[data-areas-row]');
  if (!bar) return 0;
  bar.textContent = '';
  for (const area of data.areas) {
    const c = chip(area.field, area.icon, `${area.field} (${plural(area.projects.length, 'project')})`, () => selectArea(root, area.field, data));
    c.dataset.field = area.field;
    bar.appendChild(c);
  }
  const row = root.querySelector<HTMLElement>('[data-area-cards]');
  for (const [sel, dir] of [['[data-cards-prev]', -1], ['[data-cards-next]', 1]] as const) {
    root.querySelector<HTMLButtonElement>(sel)?.addEventListener('click', () => row?.scrollBy({ left: dir * row.clientWidth, behavior: 'smooth' }));
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
