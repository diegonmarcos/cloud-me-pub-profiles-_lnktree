// Renders the linktree as the Cloud SuperApp's Cloud page: section tabs, then
// titled groups of icons. There is no folder navigation — see the note above
// the state block for why the levels are rendered rather than navigated.

import type { TreeNode } from '../types';

// Folders are no longer a thing to click into, so there is no folder glyph:
// a card is a title now, not a tile.
const FALLBACK_ICON = 'link';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
// The glyph is INLINED into the span rather than set as an <img src> or a CSS
// mask. cloud-superapp's _tiles.scss records why, and it applies verbatim here:
// the tint comes from `color` through the SVG's own currentColor, an <img>
// cannot inherit that, and Android WebView renders `mask-image` as a solid
// square. All 55 icons in linktree/src/public/icons use currentColor, so they
// come out lavender on the dark glass with no per-icon work.
//
// Fetched once per name and cached. Failures resolve to null rather than
// throwing, so one missing file cannot blank a whole grid.
const iconCache = new Map<string, Promise<string | null>>();

function loadIcon(name: string): Promise<string | null> {
  const cached = iconCache.get(name);
  if (cached) return cached;
  const p = fetch(`public/icons/${name}.svg`)
    .then((r) => (r.ok ? r.text() : null))
    .catch(() => null);
  iconCache.set(name, p);
  return p;
}

/** Fill `host` with the named glyph once it arrives. */
function paintIcon(host: HTMLElement, name: string): void {
  void loadIcon(name).then((svg) => {
    if (svg) { host.innerHTML = svg; return; }
    if (name !== FALLBACK_ICON) paintIcon(host, FALLBACK_ICON);
  });
}

// ---------------------------------------------------------------------------
// State — one active section, no drill-down
// ---------------------------------------------------------------------------
// This replaced click-through folders. The launcher does not make you open a
// folder to reach Mail: the Cloud page shows every group at once, titled, and
// the tabs switch SECTIONS. So the four levels are rendered, not navigated:
//
//   Professional | Projects | Personal   -> page-tabs        (tabs)
//   Suite                                -> tile-group__title (title 0)
//   Comms                                -> settings-list__group (title 2)
//   Mail                                 -> tile              (icon)
//
// Both title styles are cloud-superapp's own. tile-group__title is the bold
// 16sp mixed-case lavender heading the APK uses for a Suite group;
// settings-list__group is the uppercase tracked-out divider it uses between
// subsections — the very style tile-group__title's comment contrasts itself
// against.

let tree: TreeNode[] = [];
let active = 0;

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
// Every class here is cloud-superapp's. style.css IS its stylesheet (src/scss is
// a symlink), so invented class names paint nothing.

function renderTabs(): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'page-tabs-bar';
  const tabs = document.createElement('div');
  tabs.className = 'page-tabs';
  tabs.setAttribute('role', 'tablist');
  bar.appendChild(tabs);

  tree.forEach((section, i) => {
    const a = document.createElement('a');
    a.className = i === active ? 'page-tabs__item is-active' : 'page-tabs__item';
    a.textContent = section.title;
    a.href = '#';
    a.setAttribute('role', 'tab');
    a.setAttribute('aria-selected', String(i === active));
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (i === active) return;
      active = i;
      render();
    });
    tabs.appendChild(a);
  });

  return bar;
}

/** span.tile__icon carrying an inlined, currentColor-tinted glyph. */
function tileIcon(name: string): HTMLElement {
  const icon = document.createElement('span');
  icon.className = 'tile__icon';
  icon.setAttribute('aria-hidden', 'true');
  paintIcon(icon, name);
  return icon;
}

/** One leaf link, as a tile. */
function renderTile(link: TreeNode): HTMLElement {
  const tile = document.createElement('a');
  tile.className = 'tile';
  tile.setAttribute('role', 'listitem');
  tile.href = link.url ?? '#';
  tile.title = link.title;
  // Embedded in linktree as an iframe, so links must break out of it —
  // otherwise the target loads inside the tile grid, and any site sending
  // X-Frame-Options renders blank.
  tile.target = '_top';
  tile.rel = 'noopener';
  if (link.download) tile.setAttribute('download', link.download);
  tile.appendChild(tileIcon(link.icon ?? FALLBACK_ICON));

  const label = document.createElement('span');
  label.className = 'tile__label';
  label.textContent = link.title;
  tile.appendChild(label);
  return tile;
}

/** tile-grid--strip: the single-row, non-wrapping variant the APK's
 *  GroupedTilesFragment uses for Suite groups on the Cloud page. */
function renderGrid(links: TreeNode[]): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'tile-grid tile-grid--strip';
  grid.setAttribute('role', 'list');
  for (const l of links) grid.appendChild(renderTile(l));
  return grid;
}

/** Title 2 — the subsection divider above a subgroup's icons. */
function renderSubTitle(text: string): HTMLElement {
  const h = document.createElement('div');
  h.className = 'settings-list__group';
  h.textContent = text;
  return h;
}

/** One card (linktree slide) — Title 0, then its subgroups. */
function renderCard(card: TreeNode): HTMLElement {
  const group = document.createElement('section');
  group.className = 'tile-group';

  const title = document.createElement('h2');
  title.className = 'tile-group__title';
  title.textContent = card.title;
  group.appendChild(title);

  // A card's children are subgroup folders, but a slide can also carry links
  // with no subgroup of their own. Those go straight under the card title
  // rather than inventing a heading for them.
  const loose = card.children.filter((c) => c.type === 'link');
  if (loose.length) group.appendChild(renderGrid(loose));

  for (const sub of card.children.filter((c) => c.type === 'folder')) {
    const links = sub.children.filter((c) => c.type === 'link');
    if (links.length === 0) continue;
    group.appendChild(renderSubTitle(sub.title));
    group.appendChild(renderGrid(links));
  }

  return group;
}

function render(): void {
  const content = document.getElementById('content');
  if (!content) return;
  content.innerHTML = '';
  content.appendChild(renderTabs());

  const section = tree[active];
  if (!section) return;
  for (const card of section.children) {
    if (card.type === 'folder') content.appendChild(renderCard(card));
  }
}

/** The one genuinely live bit of the status strip, as in cloud-superapp. */
function startClock(): void {
  const el = document.getElementById('status-clock');
  if (!el) return;
  const tick = (): void => {
    const d = new Date();
    el.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  tick();
  window.setInterval(tick, 30_000);
}

export function initIconView(data: TreeNode[]): void {
  tree = data;
  active = 0;
  startClock();
  render();
}
