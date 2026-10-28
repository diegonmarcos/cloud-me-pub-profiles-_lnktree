// Builds mindmap GraphData by walking the linktree-owned JSON sources
// (linktree/src/data/*.json, exposed here via the src/data symlink)
// plus a local view-config.json that supplies presentation-only metadata
// (colors per section, root identity, default icon).
//
// Linktree owns the LINK DATA. Mindmap owns the VIEW CONFIG. Adding a new
// tool in linktree → appears here automatically on the next rebuild.

import projects        from '../../data/projects.json';
import personalProfiles     from '../../data/personal-profiles.json';
import professionalProfiles from '../../data/professional-profiles.json';
import viewConfig           from '../../view-config.json';
import type { GraphData, NodeData, LinkData } from '../types';

interface RawLink   { label: string; url: string; icon: string; download?: string; preview?: string; }
interface RawIcon   { title?: string; label?: string; url: string; icon: string; preview?: string; }
interface RawColumn { header: string; links: RawLink[]; }
interface RawSection { title: string; layout?: string; items?: RawIcon[]; links?: RawLink[]; icon_links?: RawIcon[]; grid_groups?: RawLink[][]; }
interface RawCollapsibleGroup { subsection?: string; links: RawLink[]; }
interface RawCollapsible { groups?: RawCollapsibleGroup[]; sections?: RawSection[]; }
interface RawSlide {
  id: string; kind: string; title: string;
  columns?: RawColumn[];
  contact_icons?: { subsection?: string; icons: RawIcon[] };
  profiles?: { subsection?: string; primary_link?: RawLink; icons?: RawIcon[] };
  sections?: RawSection[];
  collapsible?: RawCollapsible;
  top_links?: RawLink[];
  extras?: { primary_link?: RawLink; profile_icons?: RawIcon[] };
}
interface RawSection0 { section: { id: string; title: string }; slides: RawSlide[]; }

interface ViewConfig {
  root: { id: string; label: string; fullLabel?: string; icon: string; color: string };
  section_colors: Record<string, string>;
  default_icon: string;
}
const cfg = viewConfig as ViewConfig;

const SECTIONS: RawSection0[] = [
  professionalProfiles as unknown as RawSection0,
  personalProfiles     as unknown as RawSection0,
  projects        as unknown as RawSection0,
];

// 'world.svg' → 'world' (mindmap uses bare icon names without .svg).
const ic = (icon: string): string => icon.replace(/\.svg$/, '');

const link = (lk: { label?: string; title?: string; url: string; icon: string; download?: string }): LinkData => {
  const out: LinkData = { label: lk.label ?? lk.title ?? '', url: lk.url, icon: ic(lk.icon) };
  if (lk.download) out.download = true;
  return out;
};

export function buildMindmapData(): GraphData {
  const nodes: Record<string, NodeData> = {};
  const sectionIds: string[] = [];

  for (const sec of SECTIONS) {
    const secId    = sec.section.id;
    const secColor = cfg.section_colors[secId] ?? '#888';
    sectionIds.push(secId);
    const slideIds: string[] = [];

    for (const slide of sec.slides) {
      const slideId = `${secId}/${slide.id}`;
      slideIds.push(slideId);
      const childIds: string[] = [];

      // tools-kind columns
      if (slide.columns) {
        for (const col of slide.columns) {
          const id = `${slideId}/col/${col.header}`;
          childIds.push(id);
          nodes[id] = {
            id, label: col.header,
            icon: cfg.default_icon, color: secColor,
            links: col.links.map(link),
          };
        }
      }

      // profile-card (Personal style)
      if (slide.contact_icons) {
        const id = `${slideId}/contact`;
        childIds.push(id);
        nodes[id] = {
          id, label: slide.contact_icons.subsection ?? 'Contact',
          icon: 'mail', color: secColor,
          links: slide.contact_icons.icons.map(link),
        };
      }
      if (slide.profiles) {
        const id = `${slideId}/profiles`;
        childIds.push(id);
        const lks: LinkData[] = [];
        if (slide.profiles.primary_link) lks.push(link(slide.profiles.primary_link));
        for (const i of slide.profiles.icons ?? []) lks.push(link(i));
        nodes[id] = {
          id, label: slide.profiles.subsection ?? 'Profiles',
          icon: 'user', color: secColor, links: lks,
        };
      }

      // profile-card (Professional style) + venture-card sections[]
      for (const psec of slide.sections ?? []) {
        const id = `${slideId}/sec/${psec.title}`;
        childIds.push(id);
        const lks: LinkData[] = [];
        for (const it of psec.items ?? []) lks.push(link(it));
        for (const lk of psec.links ?? []) lks.push(link(lk));
        for (const il of psec.icon_links ?? []) lks.push(link(il));
        for (const grp of psec.grid_groups ?? []) for (const lk of grp) lks.push(link(lk));
        nodes[id] = { id, label: psec.title, icon: cfg.default_icon, color: secColor, links: lks };
      }

      // repos top_links
      if (slide.top_links?.length) {
        const id = `${slideId}/top`;
        childIds.push(id);
        nodes[id] = {
          id, label: 'Top', icon: 'brand-github', color: secColor,
          links: slide.top_links.map(link),
        };
      }

      // collapsible groups
      if (slide.collapsible?.groups) {
        for (const g of slide.collapsible.groups) {
          const id = `${slideId}/grp/${g.subsection ?? 'more'}`;
          childIds.push(id);
          nodes[id] = {
            id, label: g.subsection ?? 'More',
            icon: cfg.default_icon, color: secColor,
            links: g.links.map(link),
          };
        }
      }
      if (slide.collapsible?.sections) {
        for (const psec of slide.collapsible.sections) {
          const id = `${slideId}/csec/${psec.title}`;
          childIds.push(id);
          const lks: LinkData[] = [];
          for (const lk of psec.links ?? []) lks.push(link(lk));
          for (const it of psec.items ?? []) lks.push(link(it));
          nodes[id] = { id, label: psec.title, icon: cfg.default_icon, color: secColor, links: lks };
        }
      }

      // tools-kind extras (CLOUD trailing primary link + profile-icons)
      if (slide.extras?.primary_link || slide.extras?.profile_icons?.length) {
        const id = `${slideId}/extras`;
        childIds.push(id);
        const lks: LinkData[] = [];
        if (slide.extras.primary_link) lks.push(link(slide.extras.primary_link));
        for (const it of slide.extras.profile_icons ?? []) lks.push(link(it));
        nodes[id] = { id, label: 'More', icon: cfg.default_icon, color: secColor, links: lks };
      }

      // Slide node — has children if it grouped anything, otherwise empty.
      const slideNode: NodeData = {
        id: slideId, label: slide.title,
        icon: cfg.default_icon, color: secColor,
      };
      if (childIds.length > 0) slideNode.children = childIds;
      nodes[slideId] = slideNode;
    }

    nodes[secId] = {
      id: secId, label: sec.section.title,
      icon: cfg.default_icon, color: secColor,
      children: slideIds,
    };
  }

  const root: NodeData = {
    id:    cfg.root.id,
    label: cfg.root.label,
    icon:  cfg.root.icon,
    color: cfg.root.color,
    children: sectionIds,
  };
  if (cfg.root.fullLabel) root.fullLabel = cfg.root.fullLabel;

  return { root, nodes };
}
