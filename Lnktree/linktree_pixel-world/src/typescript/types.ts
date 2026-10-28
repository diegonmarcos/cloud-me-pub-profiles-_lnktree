// ==========================================================================
// Types - Linktree Pixel World
// ==========================================================================

// --- Data types (from mindmap) ---

export interface LinkData {
  label: string;
  url: string;
  icon: string;
  download?: boolean;
}

export interface NodeData {
  id: string;
  label: string;
  fullLabel?: string;
  icon: string;
  color: string;
  children?: string[];
  links?: LinkData[];
}

export interface GraphData {
  root: NodeData;
  nodes: Record<string, NodeData>;
}

// --- Tile types ---

export const enum TileType {
  Empty = 0,
  Grass = 1,
  Path = 2,
  WoodFloor = 3,
  Wall = 4,
  WallTop = 5,
  Water = 6,
  Stone = 7,
  Door = 8,
  Flowers = 9,
  DarkGrass = 10,
  Carpet = 11,
  // Winter tiles (Professional World)
  Snow = 12,
  SnowDark = 13,
  SnowFlowers = 14,
  Ice = 15,
  FrozenPath = 16,
}

// --- Directions ---

export const enum Direction {
  Down = 0,
  Up = 1,
  Left = 2,
  Right = 3,
}

// --- Sprite types ---

export type SpriteData = string[][]; // rows of hex color strings ('' = transparent)

export interface SpriteFrame {
  width: number;
  height: number;
  data: SpriteData;
}

// --- World objects ---

export interface WorldObject {
  id: string;
  type: ObjectType;
  x: number; // tile x
  y: number; // tile y
  label: string;
  links?: LinkData[];
  nodeId?: string;
}

export const enum ObjectType {
  Computer = 'computer',
  Bookshelf = 'bookshelf',
  Signpost = 'signpost',
  Mailbox = 'mailbox',
  Arcade = 'arcade',
  TV = 'tv',
  Globe = 'globe',
  Jukebox = 'jukebox',
  Desk = 'desk',
  Bulletin = 'bulletin',
}

// --- Decorations ---

export const enum DecorationType {
  Tree = 'tree',
  Flower = 'flower',
  Fountain = 'fountain',
  Lamp = 'lamp',
  Rug = 'rug',
  Bush = 'bush',
  // Winter decorations
  SnowTree = 'snow-tree',
  SnowBush = 'snow-bush',
  // Buildings
  BuildingOffice = 'building-office',
  BuildingCodeLab = 'building-codelab',
  BuildingNexus = 'building-nexus',
  BuildingHouse = 'building-house',
  BuildingTechHub = 'building-techhub',
  BuildingCafe = 'building-cafe',
  BuildingArcade = 'building-arcade',
  // Portals
  Portal = 'portal',
  SnowPortal = 'snow-portal',
  // Animals
  Rabbit = 'rabbit',
  Fox = 'fox',
}

export interface Decoration {
  type: DecorationType;
  x: number;
  y: number;
}

// --- Zones ---

export interface DoorExit {
  targetZone: string;
  targetX: number;
  targetY: number;
}

export interface Zone {
  id: string;
  name: string;
  width: number;  // in tiles
  height: number; // in tiles
  tiles: TileType[][];  // [row][col]
  objects: WorldObject[];
  decorations: Decoration[];
  doors: Map<string, DoorExit>; // "x,y" → exit
  playerStart: { x: number; y: number };
  bgColor?: string;
}

// --- Player state ---

export interface PlayerState {
  x: number;      // pixel x (sub-tile precision for smooth movement)
  y: number;      // pixel y
  tileX: number;  // current tile x
  tileY: number;  // current tile y
  targetX: number;
  targetY: number;
  direction: Direction;
  isMoving: boolean;
  animFrame: number;
  animTimer: number;
}

// --- Game state ---

export interface GameState {
  currentZone: string;
  player: PlayerState;
  nearbyObject: WorldObject | null;
  isTransitioning: boolean;
  showTooltip: boolean;
  isMobile: boolean;
}

// --- Camera ---

export interface CameraState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
}
