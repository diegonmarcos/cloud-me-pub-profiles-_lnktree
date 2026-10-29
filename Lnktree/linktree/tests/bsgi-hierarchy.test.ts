// b-s-g-i hierarchy invariants: every box and slide carries its scoped
// number; group / item numbers are all-or-none per parent (newer slides such
// as the generated CLOUD columns omit them, nothing in src/ consumes them) and
// unique per parent when present, so the composite address
// `b{box}s{slide}g{group}i{item}` still resolves a single node.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dataDir = resolve(__dirname, '..', 'src', 'data');
const files = ['projects.json', 'personal-profiles.json', 'professional-profiles.json'];

interface Item   { item: number; [k: string]: unknown }
interface Group  { group: number; links?: Item[]; items?: Item[]; icon_links?: Item[]; grid_groups?: Item[][] }
interface Slide  {
  slide: number; title?: string;
  columns?: Group[]; sections?: Group[];
  contact_icons?: { icons?: Item[] }; profiles?: { icons?: Item[] };
  collapsible?: { groups?: Group[]; sections?: Group[] };
  top_links?: Item[]; card_swiper?: Item[];
}
interface SectionCfg { section: { box: number; title: string }; slides: Slide[] }

function expectUnique(nums: number[], ctx: string): void {
  const set = new Set(nums);
  expect(set.size, `duplicate numbers in ${ctx}: ${nums.join(',')}`).toBe(nums.length);
}

function checkItems(items: Item[] | undefined, ctx: string): void {
  if (!items?.length) return;
  const numbered = items.filter(it => it.item !== undefined);
  if (!numbered.length) return;
  for (const it of items) expect(typeof it.item, `${ctx} item missing 'item' number (siblings are numbered)`).toBe('number');
  expectUnique(items.map(i => i.item), ctx);
}

function checkGroups(gs: Group[] | undefined, ctx: string): void {
  if (!gs?.length) return;
  gs.forEach((g, i) => checkGroup(g, `${ctx}[${i}]`));
  if (!gs.some(g => g.group !== undefined)) return;
  for (const g of gs) expect(typeof g.group, `${ctx} group missing 'group' number (siblings are numbered)`).toBe('number');
  expectUnique(gs.map(g => g.group), `${ctx} groups`);
}

function checkGroup(g: Group, ctx: string): void {
  checkItems(g.links,      `${ctx}.links`);
  checkItems(g.items,      `${ctx}.items`);
  checkItems(g.icon_links, `${ctx}.icon_links`);
  if (g.grid_groups) {
    const flat = g.grid_groups.flat();
    checkItems(flat, `${ctx}.grid_groups[*]`);
  }
}

function checkSlide(s: Slide, ctx: string): void {
  expect(typeof s.slide, `${ctx} missing 'slide' number`).toBe('number');
  checkGroups(s.columns,  `${ctx}.columns`);
  checkGroups(s.sections, `${ctx}.sections`);
  checkItems(s.contact_icons?.icons, `${ctx}.contact_icons`);
  checkItems(s.profiles?.icons,      `${ctx}.profiles.icons`);
  checkGroups(s.collapsible?.groups,   `${ctx}.collapsible.groups`);
  checkGroups(s.collapsible?.sections, `${ctx}.collapsible.sections`);
  checkItems(s.top_links,   `${ctx}.top_links`);
  checkItems(s.card_swiper, `${ctx}.card_swiper`);
}

describe('b-s-g-i hierarchy — every node carries its scoped number', () => {
  for (const f of files) {
    const cfg = JSON.parse(readFileSync(resolve(dataDir, f), 'utf8')) as SectionCfg;

    it(`${f} section carries 'box' (number)`, () => {
      expect(typeof cfg.section.box, `${f} section.box`).toBe('number');
      expect(cfg.section.box).toBeGreaterThanOrEqual(0);
    });

    it(`${f} every slide carries 'slide' (number, unique)`, () => {
      cfg.slides.forEach((s, i) => checkSlide(s, `${f}.slides[${i}]`));
      expectUnique(cfg.slides.map(s => s.slide), `${f}.slides`);
    });
  }

  it('all 3 boxes carry distinct box numbers (0, 1, 2)', () => {
    const boxes = files.map(f => (JSON.parse(readFileSync(resolve(dataDir, f), 'utf8')) as SectionCfg).section.box);
    expectUnique(boxes, 'box numbers across all 3 files');
    expect(boxes.sort()).toEqual([0, 1, 2]);
  });

  it('SUITE address resolves to the expected composite', () => {
    const cfg = JSON.parse(readFileSync(resolve(dataDir, 'projects.json'), 'utf8')) as SectionCfg;
    const suite = cfg.slides.find(s => (s as unknown as { id: string }).id === 'suite')!;
    const addr = `b${cfg.section.box}s${suite.slide}`;
    expect(addr).toBe('b2s2');
  });
});
