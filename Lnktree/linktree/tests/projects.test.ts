// Portal render contract, derived from the data files.
//
// The slide decks (projects.json, personal-profiles.json,
// professional-profiles.json) are edited often: columns get renamed, slides
// added, links moved. These tests therefore never hard-code slide counts,
// headers or link labels. They read the same JSON the renderer reads and
// assert that renderSlide() turns every declared node into the expected DOM,
// so they stay green across content edits and fail on renderer regressions.
import { describe, it, expect, beforeEach } from 'vitest';
import projects from '../src/data/projects.json';
import personalProfiles from '../src/data/personal-profiles.json';
import professionalProfiles from '../src/data/professional-profiles.json';
import { initPortalRender, listSlideIds, getSlide, renderSlide } from '../src/typescript/modules/portal-render';

interface Link    { label: string; url: string; icon: string }
interface Column  { header: string; links: Link[]; row?: number }
interface Section { title?: string; layout: string; cols?: number; items?: Array<{ icon: string }>; links?: Link[] }
interface Slide   {
  id: string; kind: string; title: string;
  columns?: Column[]; row_headers?: Array<{ title?: string }>;
  dashboard_modifier?: string; sections?: Section[];
}
interface Deck    { section: { id: string; title: string }; slides: Slide[] }

const DECKS: Record<string, Deck> = {
  'projects.json': projects as unknown as Deck,
  'personal-profiles.json': personalProfiles as unknown as Deck,
  'professional-profiles.json': professionalProfiles as unknown as Deck,
};
const ALL: Slide[] = Object.values(DECKS).flatMap(d => d.slides);
const byKind = (k: string) => ALL.filter(s => s.kind === k);
const KNOWN_KINDS = ['tools', 'profile-card', 'repos', 'venture-card', 'title-card'];

/** Columns grouped by row, in render order (same rule as the renderer). */
function rowsOf(slide: Slide): Column[][] {
  const cols = slide.columns ?? [];
  if (!cols.some(c => typeof c.row === 'number')) return [cols];
  const m = new Map<number, Column[]>();
  for (const c of cols) { const r = c.row ?? 0; if (!m.has(r)) m.set(r, []); m.get(r)!.push(c); }
  return [...m.keys()].sort((a, b) => a - b).map(r => m.get(r)!);
}
const text = (e: Element | null | undefined) => e?.textContent?.trim();

describe('slide decks: declarative source of truth', () => {
  it('Projects deck keeps its section id', () => {
    expect(DECKS['projects.json']!.section.id).toBe('projects');
  });

  it.each(Object.keys(DECKS))('%s: slide ids are unique, kinds known, titles non-empty', (f) => {
    const slides = DECKS[f]!.slides;
    expect(slides.length).toBeGreaterThan(0);
    expect(new Set(slides.map(s => s.id)).size).toBe(slides.length);
    for (const s of slides) {
      expect(KNOWN_KINDS, `${f} ${s.id} kind`).toContain(s.kind);
      expect(s.title, `${f} ${s.id} title`).toBeTruthy();
    }
  });

  it('listSlideIds() exposes every declared slide exactly once', () => {
    const ids = listSlideIds();
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(ALL.map(s => s.id)));
  });

  it('getSlide() round-trips every declared id and rejects unknown ones', () => {
    for (const s of ALL) expect(getSlide(s.id)?.id).toBe(s.id);
    expect(getSlide('does-not-exist')).toBeUndefined();
  });

  it('every column link has a label, a URL with a scheme (or the # placeholder) and an svg icon', () => {
    for (const s of ALL) for (const col of s.columns ?? []) {
      expect(col.header, `${s.id} column header`).toBeTruthy();
      for (const lk of col.links) {
        const where = `${s.id} / ${col.header} / ${lk.label}`;
        expect(lk.label, where).toBeTruthy();
        expect(lk.url, where).toMatch(/^(#|[a-z][a-z0-9+.-]*:)/i);
        expect(lk.icon, where).toMatch(/\.svg$/);
      }
    }
  });

  it('row_headers, when present, cover only rows that exist', () => {
    for (const s of ALL.filter(x => x.row_headers)) {
      const maxRow = Math.max(0, ...(s.columns ?? []).map(c => c.row ?? 0));
      expect(s.row_headers!.length, s.id).toBeLessThanOrEqual(maxRow + 1);
    }
  });
});

describe('portal-render: DOM output for every slide', () => {
  it.each(ALL.map(s => [s.id, s] as const))('renderSlide("%s") yields a .swiper-slide titled from the data', (_id, s) => {
    const tree = renderSlide(s.id)!;
    expect(tree).not.toBeNull();
    expect(tree.classList.contains('swiper-slide')).toBe(true);
    expect(text(tree.querySelector('.link-section > h2'))).toBe(s.title);
  });

  it.each(byKind('tools').map(s => [s.id, s] as const))('tools slide "%s": one dashboard per row, headers in order, dividers between rows', (_id, s) => {
    const tree = renderSlide(s.id)!;
    const container = tree.querySelector('.links-container')!;
    const rows = rowsOf(s);
    const hasRows = (s.columns ?? []).some(c => typeof c.row === 'number');
    const dashboards = container.querySelectorAll(':scope > .tools-dashboard');
    expect(dashboards.length).toBe(rows.length);
    rows.forEach((cols, i) => {
      const d = dashboards[i]!;
      if (hasRows) expect(d.classList.contains(`tools-dashboard--${cols.length}`), `${s.id} row ${i} modifier`).toBe(true);
      const headers = [...d.querySelectorAll(':scope > .tools-column > .tools-column__header')].map(text);
      expect(headers).toEqual(cols.map(c => c.header));
      for (const col of d.querySelectorAll(':scope > .tools-column')) {
        expect(col.querySelector('.tools-column__links')).not.toBeNull();
      }
    });
    expect(container.querySelectorAll(':scope > hr.row-divider').length).toBe(rows.length - 1);
    // Row headers render in row order.
    const declared = hasRows ? rows.map((cols) => s.row_headers?.[cols[0]!.row ?? 0]?.title).filter(Boolean) : [];
    expect([...container.querySelectorAll(':scope > h3.row-header')].map(text)).toEqual(declared);
    // The banner sits above the links container, never inside it.
    expect(container.querySelector('img.featured-image')).toBeNull();
  });

  it.each([...byKind('tools'), ...byKind('repos')].map(s => [s.id, s] as const))('slide "%s": every declared column link renders as a .tool-link (overflow included)', (_id, s) => {
    const tree = renderSlide(s.id)!;
    const declared = (s.columns ?? []).flatMap(c => c.links);
    const rendered = [...tree.querySelectorAll<HTMLAnchorElement>('.tools-column a.tool-link')];
    expect(rendered.length).toBe(declared.length);
    for (const a of rendered) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.querySelector('img.icon')).not.toBeNull();
      expect(text(a)!.length).toBeGreaterThan(0);
    }
    expect(new Set(rendered.map(a => a.getAttribute('href')))).toEqual(new Set(declared.map(l => l.url)));
  });

  it('the legacy brucheion + serapeum slide ids stay retired', () => {
    expect(getSlide('brucheion')).toBeUndefined();
    expect(getSlide('serapeum')).toBeUndefined();
  });
});

describe('venture cards: every section renders with its declared layout', () => {
  const ventures = byKind('venture-card');

  it('there is at least one venture card', () => {
    expect(ventures.length).toBeGreaterThan(0);
  });

  it.each(ventures.map(s => [s.id, s] as const))('venture "%s"', (_id, s) => {
    const tree = renderSlide(s.id)!;
    const rendered = [...tree.querySelectorAll<HTMLElement>('.profile-section')];
    const sections = s.sections ?? [];
    expect(rendered.length).toBe(sections.length);
    sections.forEach((sec, i) => {
      const node = rendered[i]!;
      if (sec.title) expect(text(node.querySelector(':scope > h3.subsection-title'))).toBe(sec.title);
      if (sec.layout === 'contact-icons') {
        expect(node.querySelectorAll(':scope > .profile-icons > a').length).toBe(sec.items?.length ?? 0);
      } else if (sec.layout === 'tool-links') {
        const sel = `:scope > .tools-column__links${sec.cols ? `.tools-column__links--${sec.cols}` : ''}`;
        const list = node.querySelector(sel);
        expect(list, `${s.id} ${sec.title} list`).not.toBeNull();
        expect(list!.querySelectorAll(':scope > a.tool-link').length).toBe(sec.links?.length ?? 0);
        expect(node.querySelector('.links-grid')).toBeNull();
      } else if (sec.layout === 'links') {
        expect(node.querySelectorAll(':scope > a').length).toBe(sec.links?.length ?? 0);
      }
    });
  });
});

describe('portal-render: initPortalRender hydrates data-portal-mount placeholders', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  const sample = byKind('tools')[0]!;

  it('replaces the placeholder element with the rendered slide', () => {
    document.body.innerHTML = `<div id="parent"><div data-portal-mount="${sample.id}"></div></div>`;
    initPortalRender();
    const parent = document.getElementById('parent')!;
    expect(parent.querySelector('[data-portal-mount]')).toBeNull();
    expect(text(parent.querySelector('.section-title'))).toBe(sample.title);
  });

  it('skips placeholders pointing at unknown slide ids without throwing', () => {
    document.body.innerHTML = '<div id="parent"><div data-portal-mount="bogus"></div></div>';
    expect(() => initPortalRender()).not.toThrow();
    expect(document.querySelector('[data-portal-mount="bogus"]')).not.toBeNull();
  });
});
