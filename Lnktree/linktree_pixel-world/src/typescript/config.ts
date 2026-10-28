// ==========================================================================
// Config - Linktree Pixel World
// ==========================================================================

export const TILE_SIZE = 16;
export const CAMERA_SCALE = 4;
export const PLAYER_SPEED = 2; // pixels per frame at 60fps
export const ANIM_FRAME_DURATION = 150; // ms per walk frame
export const INTERACTION_DISTANCE = 1; // tiles
export const CAMERA_LERP = 0.12;
export const ZONE_TRANSITION_MS = 400;
export const Y_COMPRESS_25D = 0.6;
export const Y_COMPRESS_LERP = 0.08;

// Pixel palette (NES-inspired)
export const COLORS = {
  // Terrain
  grass:      '#38b764',
  grassDark:  '#257953',
  grassLight: '#4ecb71',
  path:       '#d4a373',
  pathDark:   '#b08050',
  woodFloor:  '#c4956a',
  woodDark:   '#a0522d',
  wall:       '#555577',
  wallDark:   '#3a3a55',
  wallLight:  '#7777aa',
  roof:       '#cc3333',
  roofDark:   '#991c1c',
  water:      '#3b7dd8',
  waterLight: '#5b9de8',
  stone:      '#888899',
  stoneDark:  '#666677',
  door:       '#d4a373',
  doorFrame:  '#8b6914',
  carpet:     '#8b2252',
  carpetDark: '#6b1a42',
  flowers:    '#38b764', // base is grass

  // UI
  bgDark:     '#0d0d1a',
  highlight:  '#ffdd57',
  interact:   '#ffdd57',
  doorGlow:   '#60a5fa',

  // Category
  professional: '#4ade80',
  personal:     '#f472b6',
  root:         '#60a5fa',

  // Character
  skin:       '#f5c6a0',
  hair:       '#3a2a1a',
  shirt:      '#4488cc',
  shirtDark:  '#336699',
  pants:      '#334455',
  pantsDark:  '#223344',
  shoes:      '#553322',
  eyes:       '#222222',

  // Objects
  screenGlow: '#44ff88',
  screenDark: '#115533',
  bookRed:    '#cc4444',
  bookBlue:   '#4466cc',
  bookGreen:  '#44aa44',
  wood:       '#a0522d',
  woodLight:  '#c4956a',
  metal:      '#aabbcc',
  metalDark:  '#778899',

  // Winter terrain
  snow:       '#e8e8f0',
  snowDark:   '#c8c8d8',
  snowLight:  '#f4f4ff',
  ice:        '#a8d8ea',
  iceDark:    '#88b8d0',
  iceLight:   '#c8e8f4',
  frozenPath: '#b0b8c8',
  frozenDark: '#9098a8',

  // Winter decorations
  snowLeaf:   '#e0e8f0',
  snowLeafL:  '#c8d8e0',
  snowBark:   '#8a7a6a',

  // Building facades
  roofBlue:    '#2244aa',
  roofBlueDk:  '#1a3388',
  windowGlow:  '#aaddff',
  windowFrame: '#445566',
  awning:      '#cc6633',
  awningDark:  '#aa5522',
  neonPink:    '#ff66aa',
  neonGreen:   '#66ff88',
  chimney:     '#665544',

  // Portal
  portalPurple:  '#aa44ff',
  portalPurpDk:  '#7722cc',
  portalPurpLt:  '#cc88ff',
  portalBlue:    '#4488ff',
  portalBlueLt:  '#88bbff',
  portalCore:    '#ffffff',

  // Animals
  foxOrange:   '#dd7733',
  foxOrangeDk: '#bb5522',
  foxTail:     '#eebb77',
  foxWhite:    '#f0e8d8',
  rabbitBrown: '#c4956a',
  rabbitBrDk:  '#a07050',
  rabbitWhite: '#f0e8d8',
  rabbitPink:  '#ffaaaa',

  // Decorations
  treeTrunk:  '#6b3410',
  treeLeaf:   '#2d8b46',
  treeLeafL:  '#3aad5c',
  flowerRed:  '#ff4466',
  flowerYel:  '#ffdd44',
  flowerBlu:  '#4488ff',
  waterFoam:  '#aaddff',
  lampLight:  '#ffeeaa',
  lampPost:   '#555566',

  // Transparent
  transparent: '',
} as const;

// Zone IDs
export const ZONE_IDS = {
  overworldPro:      'overworld-pro',
  overworldPersonal: 'overworld-personal',
  office:     'office',
  codeLab:    'code-lab',
  nexusHQ:    'nexus-hq',
  house:      'house',
  techHub:    'tech-hub',
  cafe:       'cafe',
  arcade:     'arcade',
} as const;

// Which overworld each building belongs to (for Back navigation)
export const WORLD_ZONES: Record<string, string> = {
  'office':    'overworld-pro',
  'code-lab':  'overworld-pro',
  'nexus-hq':  'overworld-pro',
  'house':     'overworld-personal',
  'tech-hub':  'overworld-personal',
  'cafe':      'overworld-personal',
  'arcade':    'overworld-personal',
};

// Map data node IDs to zone IDs
export const NODE_TO_ZONE: Record<string, string> = {
  'profile-pro':      ZONE_IDS.office,
  'repos':            ZONE_IDS.codeLab,
  'nexus':            ZONE_IDS.nexusHQ,
  'profile-personal': ZONE_IDS.house,
  'deving':           ZONE_IDS.techHub,
  'tools':            ZONE_IDS.cafe,
  'circus':           ZONE_IDS.arcade,
};
