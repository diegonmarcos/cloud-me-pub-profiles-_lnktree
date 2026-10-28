// Shapes of the linktree-owned JSON, plus the tree this portal renders.
//
// The Raw* interfaces mirror linktree_mindmap/src/typescript/modules/
// data-from-linktree.ts. Linktree owns the LINK DATA; each portal owns its
// own VIEW. Adding a tool in linktree appears here on the next rebuild.

export interface RawLink { label?: string; title?: string; url: string; icon: string; download?: string; preview?: string; }
export interface RawColumn { header: string; links: RawLink[]; }
export interface RawSection {
  title: string; layout?: string;
  items?: RawLink[]; links?: RawLink[]; icon_links?: RawLink[]; grid_groups?: RawLink[][];
}
export interface RawCollapsibleGroup { subsection?: string; links: RawLink[]; }
export interface RawCollapsible { groups?: RawCollapsibleGroup[]; sections?: RawSection[]; }
export interface RawSlide {
  id: string; kind: string; title: string;
  columns?: RawColumn[];
  contact_icons?: { subsection?: string; icons: RawLink[] };
  profiles?: { subsection?: string; primary_link?: RawLink; icons?: RawLink[] };
  sections?: RawSection[];
  collapsible?: RawCollapsible;
  top_links?: RawLink[];
  extras?: { primary_link?: RawLink; profile_icons?: RawLink[] };
}
export interface RawRoot { section: { id: string; title: string }; slides: RawSlide[]; }

/** Folder / link node. Four levels: Section -> Card -> Subgroup -> Link. */
export interface TreeNode {
  type: 'folder' | 'link';
  id: string;
  title: string;
  children: TreeNode[];
  url?: string;
  /** Bare icon name, no extension and no path — resolved in iconview.ts. */
  icon?: string;
  download?: string;
}
