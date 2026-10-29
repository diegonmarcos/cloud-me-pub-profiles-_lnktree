// Areas + Projects (#1277, #1281): a compact bar of area icon chips; the selected area's projects render below as
// full rich cards (banner header, family columns of repos) in a horizontal snap carousel. One screen together.
// Data: src/data/areas.json, generated at build time by scripts/areas-gen.mjs from the repo registry
// (_git-repos-master/repos-github.json). Inlined by esbuild; no runtime fetch. Selection persists in localStorage.
import areasData from '../../data/areas.json';

export interface AreaRepo { name?: string; url?: string; hub?: boolean; private?: boolean; }
export interface AreaFamily { name: string; repos: AreaRepo[]; }
export interface AreaSub { name: string | null; families: AreaFamily[]; }
export interface AreaProject { name: string; repos: number; public: number; url: string | null; private_only: boolean; subcategories: AreaSub[]; }
export interface Area { field: string; icon: string; banner: string; projects: AreaProject[]; }
export interface AreasData { section: { id: string; title: string }; areas: Area[]; }

export const STORAGE_KEY = 'linktree.area';

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

function renderCard(area: Area, p: AreaProject): HTMLElement {
  const card = el('div', 'link-section area-project-card');
  card.dataset.project = p.name;
  card.dataset.field = area.field;
  const title = el('h2', 'section-title');
  if (p.url) {
    const a = el('a', 'area-project-card__title-link', p.name);
    a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
    title.appendChild(a);
  } else title.textContent = p.name;
  card.appendChild(title);
  const img = el('img', 'featured-image area-project-card__banner');
  img.src = area.banner; img.alt = p.name; img.loading = 'lazy'; img.decoding = 'async';
  card.appendChild(img);
  card.appendChild(el('div', 'area-project-card__meta', `${area.icon} ${area.field} · ${p.repos} repo${p.repos === 1 ? '' : 's'}${p.private_only ? ' · private' : ''}`));
  const body = el('div', 'links-container area-project-card__body');
  for (const sub of p.subcategories) {
    if (sub.name) body.appendChild(el('div', 'area-project-card__sub', sub.name));
    const n = Math.min(Math.max(sub.families.length, 1), 3);
    const dash = el('div', `tools-dashboard tools-dashboard--${n}`);
    for (const fam of sub.families) {
      const col = el('div', 'tools-column');
      col.appendChild(el('div', 'tools-column__header', fam.name));
      const links = el('div', 'tools-column__links');
      const priv = fam.repos.filter((r) => r.private).length;
      for (const r of fam.repos) {
        if (r.private || !r.url || !r.name) continue;
        const a = el('a', 'tool-link');
        a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
        a.appendChild(icon('public/icons/brand-github.svg'));
        a.appendChild(document.createTextNode(r.name));
        links.appendChild(a);
      }
      if (priv) {
        const s = el('span', 'tool-link tool-link--private');
        s.appendChild(icon('public/icons/lock.svg'));
        s.appendChild(document.createTextNode(priv === 1 ? 'private repo' : `${priv} private repos`));
        links.appendChild(s);
      }
      col.appendChild(links);
      dash.appendChild(col);
    }
    body.appendChild(dash);
  }
  card.appendChild(body);
  return card;
}

export function selectArea(root: HTMLElement, field: string, data: AreasData = areasData as AreasData): void {
  const area = data.areas.find((a) => a.field === field) || data.areas[0];
  if (!area) return;
  for (const chip of root.querySelectorAll<HTMLButtonElement>('.area-chip')) {
    const on = chip.dataset.field === area.field;
    chip.classList.toggle('is-active', on);
    chip.setAttribute('aria-selected', String(on));
    chip.tabIndex = on ? 0 : -1;
  }
  const label = root.querySelector('[data-area-label]');
  if (label) label.textContent = `${area.icon} ${area.field}`;
  const row = root.querySelector<HTMLElement>('[data-area-projects]');
  if (row) {
    row.textContent = '';
    for (const p of area.projects) row.appendChild(renderCard(area, p));
    row.scrollLeft = 0;
  }
  try { localStorage.setItem(STORAGE_KEY, area.field); } catch { /* private mode */ }
}

export function renderAreas(root: HTMLElement, data: AreasData = areasData as AreasData): number {
  const bar = root.querySelector<HTMLElement>('[data-areas-row]');
  if (!bar) return 0;
  bar.textContent = '';
  for (const area of data.areas) {
    const chip = el('button', 'area-chip');
    chip.type = 'button';
    chip.dataset.field = area.field;
    chip.title = `${area.field} (${area.projects.length} project${area.projects.length === 1 ? '' : 's'})`;
    chip.setAttribute('role', 'tab');
    chip.setAttribute('aria-label', area.field);
    chip.appendChild(el('span', 'area-chip__icon', area.icon));
    chip.appendChild(el('span', 'area-chip__label', area.field));
    chip.addEventListener('click', () => selectArea(root, area.field, data));
    bar.appendChild(chip);
  }
  let saved: string | null = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
  const first = data.areas.find((a) => a.field === saved) ? saved! : data.areas[0]?.field;
  if (first) selectArea(root, first, data);
  return data.areas.length;
}

export function initAreas(): void {
  const root = document.querySelector<HTMLElement>('.areas-section');
  if (root) renderAreas(root);
}
