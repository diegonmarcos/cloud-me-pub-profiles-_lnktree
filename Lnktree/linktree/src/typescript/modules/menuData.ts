// Single source of truth for the FAB (bottom-right) and hamburger (top-left)
// menus — both render from this list instead of maintaining two copies of
// the same buttons in index.html.

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  href?: string;
  // Nested items. The hamburger renders these as a collapsible child menu;
  // the FAB, being an icon-only rail with no room to nest, renders them
  // inline under the group label instead.
  children?: MenuItem[];
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    label: 'View',
    items: [
      { id: 'btn-pixelworld', icon: 'device-gamepad.svg', label: 'Pixel World', href: 'https://diegonmarcos.github.io/linktree_pixel-world/' },
      { id: 'btn-mindmap', icon: 'git-branch.svg', label: 'Mindmap' },
      { id: 'iconview-btn', icon: 'cards.svg', label: 'Icon View' },
      { id: 'cardview-btn', icon: 'cards.svg', label: 'Card View' },
    ],
  },
  {
    // Zoom is not a view — it is a control OVER the current view. It does not
    // switch to anything, it tears down / rebuilds the card carousels in place
    // (see zoomToggle.ts), so it sat oddly beside Pixel World and Mindmap.
    label: 'Controls',
    items: [
      { id: 'zoom-out-btn', icon: 'zoom-out.svg', label: 'Zoom Out' },
      { id: 'zoom-in-btn', icon: 'zoom-in.svg', label: 'Zoom In' },
    ],
  },
  {
    label: 'Theme',
    items: [
      {
        id: 'theme-switcher',
        icon: 'brush.svg',
        label: 'Theme Switcher',
        children: [
          { id: 'theme-dark', icon: 'sparkles.svg', label: 'Dark' },
          { id: 'theme-light', icon: 'bulb.svg', label: 'Light' },
          { id: 'theme-lightweight', icon: 'bolt.svg', label: 'Lightweight' },
          { id: 'theme-terminal', icon: 'code.svg', label: 'Terminal' },
        ],
      },
      { id: 'audio-toggle', icon: 'headphones.svg', label: 'Audio Toggle' },
    ],
  },
  {
    label: 'Dev',
    items: [
      { id: 'commits-toggle', icon: 'ledger.svg', label: 'Commits' },
      { id: 'devtools-toggle', icon: 'database.svg', label: 'Dev Tools' },
      { id: 'logcat-toggle', icon: 'file-stack.svg', label: 'Logcat' },
      { id: 'sw-reset-toggle', icon: 'refresh.svg', label: 'Clear Cache' },
      { id: 'about-toggle', icon: 'info-circle.svg', label: 'About' },
    ],
  },
];
