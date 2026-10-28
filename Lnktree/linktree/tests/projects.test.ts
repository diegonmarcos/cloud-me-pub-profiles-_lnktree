import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import data from '../src/data/projects.json';
import { initPortalRender, listSlideIds, getSlide, renderSlide } from '../src/typescript/modules/portal-render';

interface Link    { label: string; url: string; icon: string; }
interface Column  { header: string; links: Link[]; }
interface Slide   { id: string; kind: string; title: string; columns: Column[]; }
const cfg = data as unknown as { section: { id: string; title: string }; slides: Slide[] };

describe('projects.json — declarative source of truth', () => {
  it('declares the Projects section', () => {
    expect(cfg.section.id).toBe('projects');
    expect(cfg.section.title).toBe('Projects');
  });

  it('exposes all 15 migrated slides across 3 boxes (7 projects + 3 personal-profiles + 5 professional-profiles)', () => {
    const ids = listSlideIds();
    expect(ids.length).toBe(15);
    // Projects — MACRO & QUANT inline card retired (absorbed into X card)
    for (const id of ['repos', 'ducks', 'suite', 'lab-tools', 'cloud', 'circus', 'structural']) expect(ids).toContain(id);
    // Personal Profiles — brucheion + serapeum merged into `projects`
    for (const id of ['personal-profile', 'media', 'data', 'projects']) expect(ids).toContain(id);
    expect(ids).not.toContain('brucheion');
    expect(ids).not.toContain('serapeum');
    // Professional Profiles
    for (const id of ['professional-profile', 'repos', 'nexus', 'leafy', 'stark']) expect(ids).toContain(id);
  });

  it('CLOUD slide carries trailing extras: primary "Cloud Portal" link + 5 profile-icons', () => {
    const cloud = cfg.slides.find(s => s.id === 'cloud') as unknown as { extras?: { primary_link?: { label: string }; profile_icons?: Array<{ url: string }> } };
    expect(cloud.extras?.primary_link?.label).toBe('Cloud Portal');
    expect(cloud.extras?.profile_icons?.length).toBe(5);
  });

  it('SUITE slide has the 8 columns split across 2 rows (top: 4 daily-driver cols, bottom: 4 data cols)', () => {
    const suite = cfg.slides.find(s => s.id === 'suite')! as unknown as { title: string; columns: Array<{ header: string; row?: number }> };
    expect(suite.title).toBe('SUITE');
    const headers = suite.columns.map(c => c.header);
    expect(headers).toEqual(['AI & IDE', 'Suite', 'Comms', 'Nav', 'Media', 'Memory', 'Health', 'Tools']);
    const rows = suite.columns.map(c => c.row ?? 0);
    expect(rows).toEqual([0, 0, 0, 0, 1, 1, 1, 1]);
  });

  it('SUITE AI & IDE no longer has Gitea / JSON Vision (moved to Data)', () => {
    const suite = cfg.slides.find(s => s.id === 'suite')!;
    const aiide = suite.columns.find(c => c.header === 'AI & IDE')!;
    const labels = aiide.links.map(l => l.label);
    expect(labels).not.toContain('Gitea');
    expect(labels).not.toContain('JSON Vision');
    expect(labels).toEqual(['Goose', 'Claude CLI', 'WebIDE', 'Jupyter NB']);
  });

  it('SUITE Suite column has Calendar + Contacts + drops Photos', () => {
    const suite = cfg.slides.find(s => s.id === 'suite')!;
    const suiteCol = suite.columns.find(c => c.header === 'Suite')!;
    const labels = suiteCol.links.map(l => l.label);
    expect(labels).toContain('Calendar');
    expect(labels).toContain('Contacts');
    expect(labels).not.toContain('Photos');
  });

  it('SUITE Comms column has exactly Mail + Mattermost + ntfy', () => {
    const suite = cfg.slides.find(s => s.id === 'suite')!;
    const comms = suite.columns.find(c => c.header === 'Comms')!;
    expect(comms.links.map(l => l.label)).toEqual(['Mail', 'Mattermost', 'ntfy']);
  });

  it('SUITE Nav has only Navigation + Maps (MyTrips moved to Data)', () => {
    const suite = cfg.slides.find(s => s.id === 'suite')!;
    const nav = suite.columns.find(c => c.header === 'Nav')!;
    expect(nav.links.map(l => l.label)).toEqual(['Navigation', 'Maps']);
  });

  it('SUITE bottom row exposes the broken-up Data group (Media / Memory / Health / Tools)', () => {
    const suite = cfg.slides.find(s => s.id === 'suite')!;
    const bottom = suite.columns.filter(c => (c as unknown as { row?: number }).row === 1);
    expect(bottom.map(c => c.header)).toEqual(['Media', 'Memory', 'Health', 'Tools']);
    const all = bottom.flatMap(c => c.links.map(l => l.label));
    // Every original Data item must still be present, just rehomed.
    for (const required of [
      'Feed', 'Movies', 'Music', 'MyPhotos', 'MyTrips', 'PhotoPrism',
      'Tracker', 'FeedYourself', 'Profile',
      'Gitea', 'JSON Vision', 'NocoDB', 'Vault',
    ]) {
      expect(all, `expected ${required} somewhere in the bottom row`).toContain(required);
    }
    // The retired umbrella header must be gone.
    expect(suite.columns.find(c => c.header === 'Data')).toBeUndefined();
    // Group nums skip the retired Data slot (4) — never reused.
    const groups = suite.columns.map(c => (c as unknown as { group: number }).group);
    expect(groups).toEqual([0, 1, 2, 3, 5, 6, 7, 8]);
    expect(groups).not.toContain(4);
  });

  it('LAB TOOLS slide has 3 columns (Data Science & ML, Markets, Engineer) — Quantum merged', () => {
    const labTools = cfg.slides.find(s => s.id === 'lab-tools')!;
    expect(labTools.columns.map(c => c.header)).toEqual(['Data Science & ML', 'Markets', 'Engineer']);
  });

  it('LAB TOOLS Data Science & ML column contains the merged Quantum entries', () => {
    const labTools = cfg.slides.find(s => s.id === 'lab-tools')!;
    const dsml = labTools.columns.find(c => c.header === 'Data Science & ML')!;
    const labels = dsml.links.map(l => l.label);
    for (const q of ['IBM Quantum', 'Qiskit', 'Google QAI', 'Cirq', 'PennyLane', 'Braket', 'Azure QC', 'QInspire']) {
      expect(labels, `expected ${q} in Data Science & ML`).toContain(q);
    }
    for (const ds of ['Colab', 'Kaggle', 'HuggingFace', 'PyTorch', 'TensorFlow', 'Scikit-learn']) {
      expect(labels, `expected ${ds} in Data Science & ML`).toContain(ds);
    }
  });

  it('Markets column has Fin Terminal first and My Financials (renamed from Ledger) pointing to the local /my-fin route', () => {
    const labTools = cfg.slides.find(s => s.id === 'lab-tools')!;
    const markets = labTools.columns.find(c => c.header === 'Markets')!;
    expect(markets.links[0]!.label).toBe('Fin Terminal');
    expect(markets.links[0]!.url).toBe('https://diegonmarcos.github.io/fin-terminal');
    const myFin = markets.links.find(l => l.label === 'My Financials');
    expect(myFin, 'My Financials entry must replace the old "Ledger" button').toBeDefined();
    expect(myFin!.url).toBe('https://diegonmarcos.github.io/my-fin');
    expect(myFin!.icon).toBe('ledger.svg');
    // The old wrong external link must be gone.
    expect(markets.links.find(l => l.label === 'Ledger')).toBeUndefined();
    expect(markets.links.find(l => l.url === 'https://www.ledger.com')).toBeUndefined();
  });

  it('every link has a non-empty label, https URL, and icon filename', () => {
    for (const slide of cfg.slides) {
      for (const col of slide.columns) {
        for (const lk of col.links) {
          expect(lk.label, `slide ${slide.id} column ${col.header}`).toBeTruthy();
          // Skip placeholder URLs (WIP slides with `#` links — e.g. the
          // PHI slide whose project URLs are not yet set).
          if (lk.url === '#') continue;
          expect(lk.url.startsWith('http'), `link ${lk.label} URL must be absolute`).toBe(true);
          expect(lk.icon, `link ${lk.label} icon`).toMatch(/\.svg$/);
        }
      }
    }
  });

  it('getSlide() round-trips for a known id', () => {
    expect(getSlide('lab-tools')?.title).toBe('LAB TOOLS');
    expect(getSlide('does-not-exist')).toBeUndefined();
  });
});

describe('portal-render — DOM output', () => {
  it('renderSlide("lab-tools") produces .swiper-slide with 3 .tools-column children', () => {
    const tree = renderSlide('lab-tools')!;
    expect(tree.classList.contains('swiper-slide')).toBe(true);
    const linkSection = tree.querySelector('.link-section')!;
    expect(linkSection.querySelector('h2.section-title')?.textContent).toBe('LAB TOOLS');
    expect(linkSection.querySelector('img.featured-image')).not.toBeNull();
    const dashboard = linkSection.querySelector('.tools-dashboard')!;
    // 3-col now (no --4 modifier)
    expect(dashboard.classList.contains('tools-dashboard--4')).toBe(false);
    const columns = dashboard.querySelectorAll('.tools-column');
    expect(columns.length).toBe(3);
  });

  it('renderSlide("suite") produces 2 stacked .tools-dashboard rows (top --4, bottom --4) separated by a .row-divider', () => {
    const tree = renderSlide('suite')!;
    const dashboards = tree.querySelectorAll('.tools-dashboard');
    expect(dashboards.length).toBe(2);
    expect(dashboards[0]!.classList.contains('tools-dashboard--4')).toBe(true);
    expect(dashboards[1]!.classList.contains('tools-dashboard--4')).toBe(true);
    expect(dashboards[0]!.querySelectorAll('.tools-column').length).toBe(4);
    expect(dashboards[1]!.querySelectorAll('.tools-column').length).toBe(4);
    // Sanity: top row carries the daily-driver headers, bottom row the Data split.
    const topHeaders    = Array.from(dashboards[0]!.querySelectorAll('.tools-column__header')).map(h => h.textContent?.trim());
    const bottomHeaders = Array.from(dashboards[1]!.querySelectorAll('.tools-column__header')).map(h => h.textContent?.trim());
    expect(topHeaders).toEqual(['AI & IDE', 'Suite', 'Comms', 'Nav']);
    expect(bottomHeaders).toEqual(['Media', 'Memory', 'Health', 'Tools']);
    // Section break between the two rows.
    const dividers = tree.querySelectorAll('hr.row-divider');
    expect(dividers.length).toBe(1);
    // Divider must sit BETWEEN the two dashboards (DOM order).
    const linksContainer = tree.querySelector('.links-container')!;
    const children = Array.from(linksContainer.children);
    const idxTop = children.indexOf(dashboards[0]!);
    const idxDiv = children.indexOf(dividers[0]!);
    const idxBot = children.indexOf(dashboards[1]!);
    expect(idxTop).toBeLessThan(idxDiv);
    expect(idxDiv).toBeLessThan(idxBot);
  });

  it('every .tools-column has the right .tools-column__header + .tools-column__links structure', () => {
    const tree = renderSlide('lab-tools')!;
    const cols = tree.querySelectorAll('.tools-column');
    for (const col of cols) {
      expect(col.querySelector('.tools-column__header')).not.toBeNull();
      expect(col.querySelector('.tools-column__links')).not.toBeNull();
    }
  });

  it('every rendered .tool-link has class, target=_blank, an icon, and the link label as text', () => {
    const tree = renderSlide('lab-tools')!;
    const links = tree.querySelectorAll('a.tool-link');
    expect(links.length).toBeGreaterThan(0);
    for (const a of Array.from(links)) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.querySelector('img.icon')).not.toBeNull();
      expect(a.textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  it('Fin Terminal link present in LAB TOOLS Markets', () => {
    const tree = renderSlide('lab-tools')!;
    const finLink = Array.from(tree.querySelectorAll<HTMLAnchorElement>('a.tool-link')).find(a => a.textContent?.includes('Fin Terminal'));
    expect(finLink!.href).toBe('https://diegonmarcos.github.io/fin-terminal');
  });
});

describe('PROJECTS slide — Brucheion + Serapeum merged into one two-row slide', () => {
  it('projects.json carries a single `projects` slide with row_headers ["Brucheion","Serapeum"] and 6 columns split row 0/1', () => {
    const projectsData = JSON.parse(
      readFileSync(resolve(__dirname, '..', 'src', 'data', 'projects.json'), 'utf8'),
    ) as { slides: Array<{ id: string; title?: string; row_headers?: Array<{ title?: string }>; columns?: Array<{ row?: number; header: string }> }> };
    const projects = projectsData.slides.find(s => s.id === 'projects');
    expect(projects, 'projects slide must exist').toBeDefined();
    expect(projects!.title).toBe('PHI');
    expect(projects!.row_headers?.map(h => h.title)).toEqual(['Brucheion', 'Serapeum']);
    const cols = projects!.columns!;
    expect(cols.length).toBe(6);
    expect(cols.filter(c => c.row === 0).map(c => c.header)).toEqual(['Basileia', 'Mousseion', 'Paneion']);
    expect(cols.filter(c => c.row === 1).map(c => c.header)).toEqual(['Akropolis', 'Bibliotheke', 'Adyton']);
  });

  it('renderSlide("projects") emits 2 dashboards, each preceded by an .row-header sub-title, separated by a .row-divider', () => {
    const tree = renderSlide('projects')!;
    expect(tree.classList.contains('swiper-slide')).toBe(true);
    expect(tree.querySelector('h2.section-title')?.textContent).toBe('PHI');

    const linksContainer = tree.querySelector('.links-container')!;
    const headers = Array.from(linksContainer.querySelectorAll<HTMLElement>('h3.row-header')).map(h => h.textContent);
    expect(headers).toEqual(['Brucheion', 'Serapeum']);

    const dashboards = linksContainer.querySelectorAll('.tools-dashboard');
    expect(dashboards.length).toBe(2);
    expect(dashboards[0]!.classList.contains('tools-dashboard--3')).toBe(true);
    expect(dashboards[1]!.classList.contains('tools-dashboard--3')).toBe(true);
    expect(Array.from(dashboards[0]!.querySelectorAll('.tools-column__header')).map(h => h.textContent?.trim()))
      .toEqual(['Basileia', 'Mousseion', 'Paneion']);
    expect(Array.from(dashboards[1]!.querySelectorAll('.tools-column__header')).map(h => h.textContent?.trim()))
      .toEqual(['Akropolis', 'Bibliotheke', 'Adyton']);

    const dividers = linksContainer.querySelectorAll('hr.row-divider');
    expect(dividers.length).toBe(1);

    // DOM order: header(B) → dash(B) → divider → header(S) → dash(S)
    const expectedOrder = ['h3.row-header', '.tools-dashboard', 'hr.row-divider', 'h3.row-header', '.tools-dashboard'];
    const actualOrder = Array.from(linksContainer.children)
      .map(c => expectedOrder.find(sel => c.matches(sel)))
      .filter(Boolean);
    expect(actualOrder).toEqual(expectedOrder);
    const headerOrder = Array.from(linksContainer.children)
      .filter(c => c.matches('h3.row-header'))
      .map(h => h.textContent);
    expect(headerOrder).toEqual(['Brucheion', 'Serapeum']);

    // PROJECTS keeps the standard one-banner-per-slide convention used by
    // every other tools slide: exactly ONE .featured-image at the top, NOT
    // one per row (the user explicitly opted out of per-half hero images).
    const banners = tree.querySelectorAll('img.featured-image');
    expect(banners.length).toBe(1);
    // The banner must sit ABOVE the .links-container, not inside it.
    expect(linksContainer.querySelector('img.featured-image')).toBeNull();
  });

  it('the legacy brucheion + serapeum slide ids are gone from the data + the renderer', () => {
    expect(getSlide('brucheion')).toBeUndefined();
    expect(getSlide('serapeum')).toBeUndefined();
  });
});

describe('Professional venture cards — Cores section consistency (NEXUS, LEAFY, STARK)', () => {
  interface ContactItem { label: string; url: string; icon: string; item: number }
  interface VentureSection { title: string; layout: string; cols?: number; items?: ContactItem[]; links?: Array<{ label: string }>; grid?: string; grid_groups?: unknown }
  interface VentureSlide   { id: string; sections: VentureSection[] }
  const cfg = JSON.parse(
    readFileSync(resolve(__dirname, '..', 'src', 'data', 'professional-profiles.json'), 'utf8'),
  ) as { slides: VentureSlide[] };
  const VENTURES = ['nexus', 'leafy', 'stark'] as const;

  it('STARK no longer has a "Divisions" section — renamed to "Cores" for consistency', () => {
    const stark = cfg.slides.find(s => s.id === 'stark')!;
    expect(stark.sections.find(sec => sec.title === 'Divisions'), 'Divisions must be gone').toBeUndefined();
    expect(stark.sections.find(sec => sec.title === 'Cores'), 'Cores must be present').toBeDefined();
  });

  it.each(VENTURES)('%s carries a "Cores" section using the REPOS-style compact List UI (layout="tool-links", cols=3)', (id) => {
    const slide = cfg.slides.find(s => s.id === id)!;
    const cores = slide.sections.find(sec => sec.title === 'Cores')!;
    expect(cores, `${id} must declare a Cores section`).toBeDefined();
    expect(cores.layout).toBe('tool-links');
    expect(cores.cols, `${id} Cores must declare cols: 3 for the 3-column grid`).toBe(3);
    expect(Array.isArray(cores.links)).toBe(true);
    expect(cores.links!.length).toBeGreaterThan(0);
    // Button-grid artefacts must be gone.
    expect(cores.grid, `${id} Cores must not declare a grid`).toBeUndefined();
    expect(cores.grid_groups, `${id} Cores must not declare grid_groups`).toBeUndefined();
  });

  it.each(VENTURES)('renderSlide("%s") emits the Cores section as REPOS-style <a class="tool-link"> rows inside a .tools-column__links.tools-column__links--3 grid — no big <a class="link"> pills, no .links-grid', (id) => {
    const tree = renderSlide(id)!;
    const subTitles = Array.from(tree.querySelectorAll<HTMLElement>('.profile-section h3.subsection-title'));
    const coresSection = subTitles.find(h => h.textContent === 'Cores')?.parentElement!;
    expect(coresSection, `${id} must render a Cores .profile-section`).not.toBeNull();

    // Wrong styles must NOT appear inside Cores.
    expect(coresSection.querySelector('.links-grid'), `${id} Cores must not render a .links-grid wrapper`).toBeNull();
    expect(coresSection.querySelector(':scope > a.link'), `${id} Cores must not render big .link pills`).toBeNull();

    // Correct REPOS-style structure with the 3-column modifier class.
    const list = coresSection.querySelector(':scope > .tools-column__links.tools-column__links--3');
    expect(list, `${id} Cores must render a .tools-column__links--3 grid wrapper`).not.toBeNull();
    const toolLinks = list!.querySelectorAll(':scope > a.tool-link');
    const expectedCount = (cfg.slides.find(s => s.id === id)!.sections.find(sec => sec.title === 'Cores')!.links!).length;
    expect(toolLinks.length).toBe(expectedCount);
    // Each .tool-link must carry an icon + a non-empty label, like REPOS.
    for (const a of Array.from(toolLinks)) {
      expect(a.querySelector('img.icon'), `${id} Cores tool-link missing icon`).not.toBeNull();
      expect(a.textContent?.trim().length, `${id} Cores tool-link missing label`).toBeGreaterThan(0);
      expect(a.getAttribute('target')).toBe('_blank');
    }
  });

  it.each(VENTURES)('%s Contact section absorbed the Institutional Presentation slideshow icon (Email + LinkedIn + slideshow), and the standalone "Material" section is gone', (id) => {
    const slide = cfg.slides.find(s => s.id === id)!;
    expect(slide.sections.find(sec => sec.title === 'Material'), `${id} Material section must be removed`).toBeUndefined();
    const contact = slide.sections.find(sec => sec.title === 'Contact')!;
    expect(contact.layout).toBe('contact-icons');
    expect(contact.items?.length, `${id} Contact must have 3 icons (Email, LinkedIn, Institutional Presentation)`).toBe(3);
    const labels = contact.items!.map(it => it.label);
    expect(labels.slice(0, 2)).toEqual(['Email', 'LinkedIn']);
    expect(labels[2]).toMatch(/Institutional Presentation$/);
    expect(contact.items![2]!.icon).toBe('slideshow.svg');
    // Item numbers stay unique within the Contact group.
    expect(new Set(contact.items!.map(it => it.item)).size).toBe(3);
  });

  it.each(VENTURES)('renderSlide("%s") puts the Institutional Presentation icon inside the Contact .profile-icons row (no big <a class="link"> pill anywhere)', (id) => {
    const tree = renderSlide(id)!;
    const subTitles = Array.from(tree.querySelectorAll<HTMLElement>('.profile-section h3.subsection-title'));
    const contactSection = subTitles.find(h => h.textContent === 'Contact')?.parentElement!;
    expect(contactSection, `${id} must render a Contact .profile-section`).not.toBeNull();
    const iconAnchors = contactSection.querySelectorAll('.profile-icons > a');
    expect(iconAnchors.length).toBe(3);
    const slideshow = Array.from(iconAnchors).find(a => a.querySelector('img[src$="slideshow.svg"]'));
    expect(slideshow, `${id} Contact must include a slideshow.svg icon`).toBeDefined();
    // No leftover Material section anywhere in the rendered tree.
    const materialHeader = subTitles.find(h => h.textContent === 'Material');
    expect(materialHeader, `${id} must not render a Material subsection`).toBeUndefined();
  });
});

describe('portal-render — initPortalRender hydrates the data-portal-mount placeholder', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('replaces the placeholder element with the rendered slide', () => {
    document.body.innerHTML = '<div id="parent"><div data-portal-mount="lab-tools"></div></div>';
    initPortalRender();
    const parent = document.getElementById('parent')!;
    expect(parent.querySelector('[data-portal-mount]')).toBeNull();
    expect(parent.querySelector('.section-title')?.textContent).toBe('LAB TOOLS');
  });

  it('skips placeholders pointing at unknown slide ids without throwing', () => {
    document.body.innerHTML = '<div id="parent"><div data-portal-mount="bogus"></div></div>';
    expect(() => initPortalRender()).not.toThrow();
    expect(document.querySelector('[data-portal-mount="bogus"]')).not.toBeNull();
  });
});
