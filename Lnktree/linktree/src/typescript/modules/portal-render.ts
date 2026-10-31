// Declarative renderer for ALL three section-boxes — Projects,
// Personal Profiles, Professional Profiles. Reads three JSON files, each
// describing one section with multiple slides. Hydrates any element marked
// `data-portal-mount="<slide-id>"` with the rendered DOM tree.
//
// Output HTML is byte-equivalent to the hand-coded markup so SCSS keeps
// matching without changes. Adding a tool / link / column = JSON edit only.

import projects from '../../data/projects.json';
import personalProfiles from '../../data/personal-profiles.json';
import professionalProfiles from '../../data/professional-profiles.json';
import { el } from '../utils/dom';
import { slideCard } from './card';

// --------------------------------------------------------------------------
// Schema
// --------------------------------------------------------------------------

// `card` (Areas home cards, #1330): id of another card of the same carousel; the link then jumps in-page instead of opening a tab.
export interface Link { label: string; url: string; icon: string; preview?: string; download?: string; card?: string; }
interface IconItem    { url: string; title?: string; label?: string; icon: string; preview?: string; }
export interface Column { header: string; header_url?: string | null; links: Link[]; row?: number; }
// `primary_link` is the single large button a tools card has always had.
// `primary_links` adds any number BELOW it, same styling — the Cloud card
// needs two (the Cloud portal and Cloud Mobile). Kept as a separate optional
// key rather than widening primary_link to an array so every existing card
// keeps working untouched.
interface ToolsExtras { primary_link?: Link; primary_links?: Link[]; profile_icons?: IconItem[]; }

interface RowHeader   { title?: string; }
export interface SlideTools {
  id: string; kind: 'tools'; title: string;
  // Areas cards (#1308) are tools slides too: `code` is the outline code shown quietly before the title
  // (.card-code), `tagline` one optional line under the banner, `data` data-* attributes on .link-section.
  code?: string; tagline?: string; data?: Record<string, string>;
  image?: { src: string; alt?: string };
  dashboard_modifier?: string;
  columns: Column[];
  // Optional sub-headers rendered above each row's dashboard when columns
  // declare a `row` index. Indexed by the row number itself, NOT by array
  // position — `row_headers[2]` annotates the dashboard built from columns
  // with `row: 2`. Sparse arrays are fine; missing entries skip the header.
  row_headers?: RowHeader[];
  extras?: ToolsExtras;
}

interface CardSwiperItem { type?: 'image' | 'video'; src: string; alt?: string; active?: boolean; }
interface SubSection { subsection?: string; title?: string; }
interface ContactIconsBlock extends SubSection { icons: IconItem[]; }
interface ProfilesBlock    extends SubSection { primary_link?: Link; hub_icons?: IconItem[]; icons?: IconItem[]; }
interface CollapsibleGroup extends SubSection { links: Link[]; }
interface CollapsibleBlock { toggle_target?: string; id?: string; groups?: CollapsibleGroup[]; sections?: ProfileSection[]; }

interface ProfileSection {
  title?: string;
  // 'tool-links' — REPOS-style compact list: each link rendered as
  // <a class="tool-link"> (small icon + label, dense vertical stack).
  // Distinct from 'links' which emits the large <a class="link"> pills.
  layout: 'contact-icons' | 'mixed' | 'links' | 'links-grid' | 'tool-links';
  items?: IconItem[];
  links?: Link[];
  icon_links?: IconItem[];
  grid?: string;
  grid_groups?: Link[][];
  // For 'tool-links' layout: number of grid columns (1col mobile, N cols
  // at ≥420px). Maps to .tools-column__links--N modifier in _links.scss.
  cols?: number;
}

interface SlideProfileCard {
  id: string; kind: 'profile-card'; title: string;
  card_swiper: CardSwiperItem[];
  contact_icons?: ContactIconsBlock;       // Personal-style
  profiles?: ProfilesBlock;                // Personal-style
  sections?: ProfileSection[];             // Professional-style
  collapsible?: CollapsibleBlock;
}

export interface SlideRepos {
  id: string; kind: 'repos'; title: string;
  image?: { src: string; alt?: string };
  top_links?: Link[];
  dashboard_modifier?: string;
  columns: Column[];
}

interface SlideVentureCard {
  id: string; kind: 'venture-card'; title: string;
  image?: { src: string; alt?: string } | string;
  sections: ProfileSection[];
  primary_link?: Link;
}

interface SlideTitleCard {
  id: string; kind: 'title-card'; title: string;
}

type Slide = SlideTools | SlideProfileCard | SlideRepos | SlideVentureCard | SlideTitleCard;

interface SectionCfg {
  section: { id: string; title: string; swiper_class: string };
  slides: Slide[];
}

// --------------------------------------------------------------------------
// Loaded data — flatten across all three sources keyed by slide id.
// --------------------------------------------------------------------------

const SECTIONS: SectionCfg[] = [
  professionalProfiles as unknown as SectionCfg,
  projects as unknown as SectionCfg,
  personalProfiles as unknown as SectionCfg,
];
const SLIDES_BY_ID: Map<string, Slide> = new Map();
for (const s of SECTIONS) for (const sl of s.slides) SLIDES_BY_ID.set(`${s.section.id}/${sl.id}`, sl);
// Also key by bare id (for backwards compat with single-section mounts where ids are unique)
for (const s of SECTIONS) for (const sl of s.slides) {
  if (!SLIDES_BY_ID.has(sl.id)) SLIDES_BY_ID.set(sl.id, sl);
}

// --------------------------------------------------------------------------
// DOM helpers
// --------------------------------------------------------------------------

function iconImg(icon: string, alt = ''): HTMLElement {
  return el('img', {
    class: 'icon',
    src: `public/icons/${icon}`,
    alt,
    loading: 'lazy',
    decoding: 'async',
  });
}

// --------------------------------------------------------------------------
// kind: tools
// --------------------------------------------------------------------------

function renderToolLink(link: Link): HTMLElement {
  const a = link.card
    ? el('a', { class: 'tool-link', href: link.url, 'data-card': link.card })
    : el('a', { class: 'tool-link', href: link.url, target: '_blank' });
  a.appendChild(iconImg(link.icon));
  a.appendChild(document.createTextNode(link.label));
  return a;
}

// Columns beyond this many links get a "+" expand toggle instead of
// rendering everything up front — some (e.g. Cloud/Security) run 8-10 deep.
const TOOLS_COLUMN_LIMIT = 6;
let toolsColumnAutoId = 0;

function renderColumn(col: Column): HTMLElement {
  const headerEl = col.header_url
    ? (() => {
        const a = el('a', { class: 'tools-column__header', href: col.header_url, target: '_blank' });
        a.appendChild(document.createTextNode(col.header));
        return a;
      })()
    : el('div', { class: 'tools-column__header' }, [col.header]);
  const linksWrap = el('div', { class: 'tools-column__links' });
  const visible = col.links.slice(0, TOOLS_COLUMN_LIMIT);
  const overflow = col.links.slice(TOOLS_COLUMN_LIMIT);
  for (const lk of visible) linksWrap.appendChild(renderToolLink(lk));

  if (!overflow.length) return el('div', { class: 'tools-column' }, [headerEl, linksWrap]);

  const targetId = `tools-column-more-${toolsColumnAutoId++}`;
  const toggle = el('button', { class: 'more-toggle tools-column__toggle', type: 'button', 'data-target': targetId });
  toggle.appendChild(el('span', { class: 'plus-icon' }, ['+']));
  const collapsibleContent = el('div', { class: 'collapsible-content', id: targetId });
  for (const lk of overflow) collapsibleContent.appendChild(renderToolLink(lk));
  return el('div', { class: 'tools-column' }, [headerEl, linksWrap, toggle, collapsibleContent]);
}

// The ONE tools-card renderer: xProjects slides (projects.json) and every Areas card (areas.ts) go through it.
export function renderToolsSlide(slide: SlideTools): HTMLElement {
  let title: string | Node = slide.title;
  if (slide.code) {
    const f = document.createDocumentFragment();
    f.append(el('span', { class: 'card-code' }, [slide.code]), slide.title);
    title = f;
  }
  const card = slideCard({ title, image: slide.image, body: false, ...(slide.data ? { data: slide.data } : {}) });

  // Multi-row layout: when ANY column carries `row`, group columns by row
  // and emit one .tools-dashboard per row with an auto-derived `--N`
  // modifier (where N = column count in that row). When NO column has
  // `row`, fall back to the legacy single-dashboard mode honoring the
  // slide's explicit `dashboard_modifier`.
  const linksContainer = el('div', { class: 'links-container' });
  if (slide.tagline) linksContainer.appendChild(el('h3', { class: 'subsection-title' }, [slide.tagline]));
  const hasRows = slide.columns.some(c => typeof c.row === 'number');
  if (hasRows) {
    const byRow = new Map<number, Column[]>();
    for (const c of slide.columns) {
      const r = c.row ?? 0;
      if (!byRow.has(r)) byRow.set(r, []);
      byRow.get(r)!.push(c);
    }
    const rows = Array.from(byRow.keys()).sort((a, b) => a - b);
    rows.forEach((r, idx) => {
      const cols = byRow.get(r)!;
      const header = slide.row_headers?.[r];
      if (header?.title) {
        linksContainer.appendChild(el('h3', { class: 'subsection-title row-header' }, [header.title]));
      }
      const dash = el('div', { class: `tools-dashboard tools-dashboard--${cols.length}` });
      for (const col of cols) dash.appendChild(renderColumn(col));
      linksContainer.appendChild(dash);
      // Visual separator between consecutive rows (none after the last).
      if (idx < rows.length - 1) {
        linksContainer.appendChild(el('hr', { class: 'row-divider' }));
      }
    });
  } else {
    const dashClass = `tools-dashboard${slide.dashboard_modifier ? ' ' + slide.dashboard_modifier : ''}`;
    const dashboard = el('div', { class: dashClass });
    for (const col of slide.columns) dashboard.appendChild(renderColumn(col));
    linksContainer.appendChild(dashboard);
  }
  // Singular first, then the list — so a card can stack several large
  // buttons in declared order without the data having to repeat itself.
  const primaryLinks: Link[] = [
    ...(slide.extras?.primary_link ? [slide.extras.primary_link] : []),
    ...(slide.extras?.primary_links ?? []),
  ];
  for (const lk of primaryLinks) {
    const a = el('a', { class: 'link', href: lk.url, target: '_blank' });
    a.appendChild(iconImg(lk.icon));
    a.appendChild(document.createTextNode(lk.label));
    linksContainer.appendChild(a);
  }
  if (slide.extras?.profile_icons?.length) {
    const row = el('div', { class: 'profile-icons' });
    for (const it of slide.extras.profile_icons) {
      const a = el('a', { href: it.url, title: it.title ?? it.label ?? '', target: '_blank' });
      a.appendChild(el('img', { src: `public/icons/${it.icon}`, alt: it.title ?? it.label ?? '', loading: 'lazy', decoding: 'async' }));
      row.appendChild(a);
    }
    linksContainer.appendChild(row);
  }
  card.section.appendChild(linksContainer);
  return card.slide;
}

// --------------------------------------------------------------------------
// Shared widget renderers
// --------------------------------------------------------------------------

function renderCardSwiper(items: CardSwiperItem[]): HTMLElement {
  const wrap = el('div', { class: 'card-swiper' });
  for (const item of items) {
    const cls = `featured-image card-slide${item.active ? ' active' : ''}`;
    if (item.type === 'video') {
      const videoEl = el('video', { class: cls, src: item.src, autoplay: '', loop: '', muted: '', playsinline: '', preload: 'metadata' });
      // setAttribute('muted','') is unreliable on some browsers/Android —
      // the IDL property must be set directly for guaranteed mute.
      (videoEl as HTMLVideoElement).muted = true;
      wrap.appendChild(videoEl);
    } else {
      const imgAttrs: Record<string, string> = { class: cls, src: item.src, alt: item.alt ?? '', decoding: 'async' };
      if (item.active) {
        imgAttrs['fetchpriority'] = 'high';
      } else {
        imgAttrs['loading'] = 'lazy';
        imgAttrs['fetchpriority'] = 'low';
      }
      wrap.appendChild(el('img', imgAttrs));
    }
  }
  return wrap;
}

function renderIconAnchor(it: IconItem): HTMLElement {
  const attrs: Record<string, string> = { href: it.url, title: it.title ?? it.label ?? '', target: '_blank' };
  if (it.preview) attrs['data-preview'] = it.preview;
  const a = el('a', attrs);
  a.appendChild(el('img', { src: `public/icons/${it.icon}`, alt: it.title ?? it.label ?? '', loading: 'lazy', decoding: 'async' }));
  return a;
}

function renderLinkAnchor(link: Link): HTMLElement {
  const attrs: Record<string, string> = { class: 'link', href: link.url, target: '_blank' };
  if (link.preview) attrs['data-preview'] = link.preview;
  if (link.download) attrs['download'] = link.download;
  const a = el('a', attrs);
  a.appendChild(iconImg(link.icon));
  a.appendChild(document.createTextNode(link.label));
  return a;
}

function renderProfileSection(sec: ProfileSection): HTMLElement {
  const wrap = el('div', { class: 'profile-section' });
  if (sec.title) wrap.appendChild(el('h3', { class: 'subsection-title' }, [sec.title]));
  if (sec.layout === 'contact-icons') {
    const row = el('div', { class: 'profile-icons' });
    for (const it of sec.items ?? []) row.appendChild(renderIconAnchor(it));
    wrap.appendChild(row);
  } else if (sec.layout === 'links') {
    for (const lk of sec.links ?? []) wrap.appendChild(renderLinkAnchor(lk));
  } else if (sec.layout === 'tool-links') {
    // REPOS-style: compact .tool-link rows (small icon + label) inside a
    // .tools-column__links container so they pick up the column-internal
    // typography + alignment defined in _links.scss. `cols` opts into a
    // multi-column grid (1col mobile, N cols ≥420px).
    const cls = `tools-column__links${sec.cols ? ` tools-column__links--${sec.cols}` : ''}`;
    const list = el('div', { class: cls });
    for (const lk of sec.links ?? []) list.appendChild(renderToolLink(lk));
    wrap.appendChild(list);
  } else if (sec.layout === 'mixed') {
    for (const lk of sec.links ?? []) wrap.appendChild(renderLinkAnchor(lk));
    if (sec.icon_links?.length) {
      const row = el('div', { class: 'profile-icons' });
      for (const it of sec.icon_links) row.appendChild(renderIconAnchor(it));
      wrap.appendChild(row);
    }
  } else if (sec.layout === 'links-grid') {
    const gridClass = `links-grid${sec.grid ? ' ' + sec.grid : ''}`;
    if (sec.grid_groups?.length) {
      for (const group of sec.grid_groups) {
        const grid = el('div', { class: gridClass });
        for (const lk of group) grid.appendChild(renderLinkAnchor(lk));
        wrap.appendChild(grid);
      }
    } else if (sec.links?.length) {
      const grid = el('div', { class: gridClass });
      for (const lk of sec.links) grid.appendChild(renderLinkAnchor(lk));
      wrap.appendChild(grid);
    }
  }
  return wrap;
}

// --------------------------------------------------------------------------
// kind: profile-card
// --------------------------------------------------------------------------

function renderProfileCardSlide(slide: SlideProfileCard): HTMLElement {
  const card = slideCard({ title: slide.title, media: renderCardSwiper(slide.card_swiper) });
  const linksContainer = card.body!;

  if (slide.contact_icons) {
    if (slide.contact_icons.subsection) linksContainer.appendChild(el('h3', { class: 'subsection-title' }, [slide.contact_icons.subsection]));
    const row = el('div', { class: 'profile-icons' });
    for (const it of slide.contact_icons.icons) row.appendChild(renderIconAnchor(it));
    linksContainer.appendChild(row);
  }
  if (slide.profiles) {
    if (slide.profiles.subsection) linksContainer.appendChild(el('h3', { class: 'subsection-title' }, [slide.profiles.subsection]));
    if (slide.profiles.primary_link) linksContainer.appendChild(renderLinkAnchor(slide.profiles.primary_link));
    if (slide.profiles.hub_icons?.length) {
      const hubRow = el('div', { class: 'profile-icons profile-icons--hubs' });
      for (const it of slide.profiles.hub_icons) hubRow.appendChild(renderIconAnchor(it));
      linksContainer.appendChild(hubRow);
    }
    if (slide.profiles.icons?.length) {
      const row = el('div', { class: 'profile-icons' });
      for (const it of slide.profiles.icons) row.appendChild(renderIconAnchor(it));
      linksContainer.appendChild(row);
    }
  }
  if (slide.sections) for (const sec of slide.sections) linksContainer.appendChild(renderProfileSection(sec));

  if (slide.collapsible) {
    const targetId = slide.collapsible.toggle_target ?? slide.collapsible.id ?? `${slide.id}-more`;
    const toggle = el('button', { class: 'more-toggle', type: 'button', 'data-target': targetId });
    toggle.appendChild(el('span', { class: 'arrow' }, ['⌄']));
    linksContainer.appendChild(toggle);
    const collapsibleContent = el('div', { class: 'collapsible-content', id: targetId });
    if (slide.collapsible.groups) {
      for (const g of slide.collapsible.groups) {
        if (g.subsection) collapsibleContent.appendChild(el('h3', { class: 'subsection-title' }, [g.subsection]));
        for (const lk of g.links) collapsibleContent.appendChild(renderLinkAnchor(lk));
      }
    }
    if (slide.collapsible.sections) for (const sec of slide.collapsible.sections) collapsibleContent.appendChild(renderProfileSection(sec));
    linksContainer.appendChild(collapsibleContent);
  }
  return card.slide;
}

// --------------------------------------------------------------------------
// kind: repos
// --------------------------------------------------------------------------

export function renderReposSlide(slide: SlideRepos): HTMLElement {
  const card = slideCard({ title: slide.title, image: slide.image });
  const linksContainer = card.body!;
  for (const lk of slide.top_links ?? []) linksContainer.appendChild(renderLinkAnchor(lk));
  // Multi-row layout: when ANY column carries `row`, group columns by row
  // and emit one .tools-dashboard per row with an auto-derived `--N`
  // modifier. When NO column has `row`, fall back to the legacy
  // single-dashboard mode honoring the slide's explicit `dashboard_modifier`.
  const hasRows = slide.columns.some(c => typeof c.row === 'number');
  if (hasRows) {
    const byRow = new Map<number, Column[]>();
    for (const c of slide.columns) {
      const r = c.row ?? 0;
      if (!byRow.has(r)) byRow.set(r, []);
      byRow.get(r)!.push(c);
    }
    const rows = Array.from(byRow.keys()).sort((a, b) => a - b);
    rows.forEach((r, idx) => {
      const cols = byRow.get(r)!;
      const dash = el('div', { class: `tools-dashboard tools-dashboard--${cols.length}` });
      for (const col of cols) dash.appendChild(renderColumn(col));
      linksContainer.appendChild(dash);
      if (idx < rows.length - 1) {
        linksContainer.appendChild(el('hr', { class: 'row-divider' }));
      }
    });
  } else {
    const dashClass = `tools-dashboard${slide.dashboard_modifier ? ' ' + slide.dashboard_modifier : ''}`;
    const dashboard = el('div', { class: dashClass });
    for (const col of slide.columns) dashboard.appendChild(renderColumn(col));
    linksContainer.appendChild(dashboard);
  }
  return card.slide;
}

// --------------------------------------------------------------------------
// kind: venture-card
// --------------------------------------------------------------------------

function renderVentureCardSlide(slide: SlideVentureCard): HTMLElement {
  const image = typeof slide.image === 'string' ? { src: slide.image } : slide.image;
  const card = slideCard({ title: slide.title, image });
  for (const sec of slide.sections) card.body!.appendChild(renderProfileSection(sec));
  if (slide.primary_link) card.body!.appendChild(renderLinkAnchor(slide.primary_link));
  return card.slide;
}

function renderTitleCardSlide(slide: SlideTitleCard): HTMLElement {
  return slideCard({ title: slide.title, titleClass: 'title-card__title', sectionClass: 'link-section--title-card', body: false }).slide;
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

export function renderSlide(id: string): HTMLElement | null {
  const slide = SLIDES_BY_ID.get(id);
  if (!slide) return null;
  switch (slide.kind) {
    case 'tools':         return renderToolsSlide(slide);
    case 'profile-card':  return renderProfileCardSlide(slide);
    case 'repos':         return renderReposSlide(slide);
    case 'venture-card':  return renderVentureCardSlide(slide);
    case 'title-card':    return renderTitleCardSlide(slide);
  }
  return null;
}

// Idempotent — replaces every `[data-portal-mount="<slide-id>"]` placeholder.
export function initPortalRender(): void {
  const mounts = document.querySelectorAll<HTMLElement>('[data-portal-mount]');
  for (const m of mounts) {
    const id = m.dataset['portalMount'];
    if (!id) continue;
    const tree = renderSlide(id);
    if (tree) m.parentElement?.replaceChild(tree, m);
  }
}

// Test/inspection helpers
export function listSlideIds(): string[] {
  // Return only the bare-id form for backwards compat with existing tests.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of SECTIONS) for (const sl of s.slides) {
    if (!seen.has(sl.id)) { seen.add(sl.id); out.push(sl.id); }
  }
  return out;
}
export function getSlide(id: string): Slide | undefined { return SLIDES_BY_ID.get(id); }
