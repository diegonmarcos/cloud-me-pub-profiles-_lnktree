// Areas section (#1277): one horizontal, snap-scrolling row of small project cards grouped by field.
// Data: src/data/areas.json, generated at build time by scripts/areas-gen.mjs from the repo registry
// (_git-repos-master/repos-github.json). Inlined by esbuild; no runtime fetch.
import areasData from '../../data/areas.json';

export interface AreaProject { name: string; repos: number; public: number; url: string | null; repo?: string; private_only: boolean; }
export interface Area { field: string; icon: string; projects: AreaProject[]; }
export interface AreasData { section: { id: string; title: string }; areas: Area[]; }

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function renderAreas(row: HTMLElement, data: AreasData = areasData as AreasData): number {
  row.textContent = '';
  let cards = 0;
  for (const area of data.areas) {
    const chip = el('div', 'area-chip', `${area.icon} ${area.field}`);
    chip.setAttribute('role', 'heading');
    chip.setAttribute('aria-level', '3');
    row.appendChild(chip);
    for (const p of area.projects) {
      const card = el('div', 'link-section area-card');
      card.dataset.field = area.field;
      card.dataset.project = p.name;
      card.appendChild(el('span', 'area-card__icon', area.icon));
      card.appendChild(el('span', 'area-card__name', p.name));
      const count = p.repos === 0 ? 'hub' : `${p.repos} repo${p.repos === 1 ? '' : 's'}`;
      card.appendChild(el('span', 'area-card__count', p.private_only ? `${count} · private` : count));
      if (p.url) {
        const a = el('a', 'area-card__link');
        a.href = p.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', `${p.name} (${area.field}) on GitHub`);
        card.appendChild(a);
      } else {
        card.classList.add('area-card--private');
      }
      row.appendChild(card);
      cards++;
    }
  }
  return cards;
}

export function initAreas(): void {
  const row = document.querySelector<HTMLElement>('[data-areas-row]');
  if (row) renderAreas(row);
}
