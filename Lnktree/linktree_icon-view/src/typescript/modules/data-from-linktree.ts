// Builds the icon-view folder tree by walking the linktree-owned JSON
// (linktree/src/data/*.json, reached here through the src/data symlink).
//
// This is the whole reason the spin-off is not a file move. Inside linktree,
// Icon View built its tree by SCRAPING the DOM that portal-render.ts had
// painted — querying .section-box, .swiper-slide, .subsection-title and
// a[href]. Standing alone there is no such DOM. Reading the data instead is
// also strictly better: a CSS class rename in portal-render used to empty
// Icon View silently, with no error anywhere.
//
// Traversal mirrors linktree_mindmap's data-from-linktree.ts so the two
// portals can never disagree about what the data contains.

import projects from '../../data/projects.json';
import personalProfiles from '../../data/personal-profiles.json';
import professionalProfiles from '../../data/professional-profiles.json';
import type { RawLink, RawSection, RawRoot, RawSlide, TreeNode } from '../types';

const ROOTS: RawRoot[] = [
  professionalProfiles as unknown as RawRoot,
  personalProfiles as unknown as RawRoot,
  projects as unknown as RawRoot,
];

/** 'world.svg' -> 'world'. Icons are stored bare and resolved at render. */
const bare = (icon: string): string => icon.replace(/\.svg$/, '');

function toLink(lk: RawLink, idx: number, parentId: string): TreeNode | null {
  const title = (lk.label ?? lk.title ?? '').trim();
  if (!lk.url || !title) return null;
  const node: TreeNode = {
    type: 'link',
    id: `${parentId}/l${idx}`,
    title,
    children: [],
    url: lk.url,
    icon: lk.icon ? bare(lk.icon) : undefined,
  };
  if (lk.download) node.download = lk.download;
  return node;
}

/** A subgroup folder, or null when nothing inside it survived. */
function folder(id: string, title: string, links: RawLink[]): TreeNode | null {
  const children = links
    .map((lk, i) => toLink(lk, i, id))
    .filter((n): n is TreeNode => n !== null);
  if (children.length === 0) return null;
  return { type: 'folder', id, title, children };
}

/** Every link a `sections[]` entry can carry, in the order linktree renders. */
function sectionLinks(sec: RawSection): RawLink[] {
  return [
    ...(sec.items ?? []),
    ...(sec.links ?? []),
    ...(sec.icon_links ?? []),
    ...(sec.grid_groups ?? []).flat(),
  ];
}

function slideSubgroups(slide: RawSlide, slideId: string): TreeNode[] {
  const out: TreeNode[] = [];
  const push = (n: TreeNode | null): void => { if (n) out.push(n); };

  for (const col of slide.columns ?? []) {
    push(folder(`${slideId}/col/${col.header}`, col.header, col.links));
  }
  if (slide.contact_icons) {
    push(folder(`${slideId}/contact`, slide.contact_icons.subsection ?? 'Contact',
      slide.contact_icons.icons));
  }
  if (slide.profiles) {
    const lks: RawLink[] = [];
    if (slide.profiles.primary_link) lks.push(slide.profiles.primary_link);
    lks.push(...(slide.profiles.icons ?? []));
    push(folder(`${slideId}/profiles`, slide.profiles.subsection ?? 'Profiles', lks));
  }
  for (const sec of slide.sections ?? []) {
    push(folder(`${slideId}/sec/${sec.title}`, sec.title, sectionLinks(sec)));
  }
  if (slide.top_links?.length) {
    push(folder(`${slideId}/top`, 'Top', slide.top_links));
  }
  for (const g of slide.collapsible?.groups ?? []) {
    const title = g.subsection ?? 'More';
    push(folder(`${slideId}/grp/${title}`, title, g.links));
  }
  for (const sec of slide.collapsible?.sections ?? []) {
    push(folder(`${slideId}/csec/${sec.title}`, sec.title, sectionLinks(sec)));
  }
  if (slide.extras?.primary_link || slide.extras?.profile_icons?.length) {
    const lks: RawLink[] = [];
    if (slide.extras.primary_link) lks.push(slide.extras.primary_link);
    lks.push(...(slide.extras.profile_icons ?? []));
    push(folder(`${slideId}/extras`, 'More', lks));
  }
  return out;
}

export function buildTree(): TreeNode[] {
  const tree: TreeNode[] = [];

  for (const root of ROOTS) {
    const secId = root.section.id;
    const sectionNode: TreeNode = {
      type: 'folder', id: secId, title: root.section.title, children: [],
    };

    for (const slide of root.slides ?? []) {
      const slideId = `${secId}/${slide.id}`;
      const subgroups = slideSubgroups(slide, slideId);
      if (subgroups.length === 0) continue;

      // No collapsing. That mattered while this was click-through folders — a
      // card holding one subgroup meant opening a folder to find a folder. It
      // is wrong now that levels are RENDERED rather than navigated: the card
      // is a title and the subgroup is a sub-title, so collapsing would delete
      // the sub-title (Suite > Comms > Mail would lose "Comms").
      sectionNode.children.push({
        type: 'folder', id: slideId, title: slide.title, children: subgroups,
      });
    }

    if (sectionNode.children.length > 0) tree.push(sectionNode);
  }

  return tree;
}
