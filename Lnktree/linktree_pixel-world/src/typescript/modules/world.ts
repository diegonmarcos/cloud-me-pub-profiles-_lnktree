// ==========================================================================
// World - Zone tile maps, object positions, door connections
// ==========================================================================
// Overworld Pro: 16x14 | Overworld Personal: 20x16 | Buildings: 14x12

import type { Zone, GraphData, DoorExit, Decoration, WorldObject } from '../types';
import { TileType as T, DecorationType, ObjectType as OT } from '../types';
import { buildZoneObjects } from './data';

// Shorthand - Summer tiles
const G = T.Grass;
const P = T.Path;
const W = T.Wall;
const F = T.WoodFloor;
const D = T.Door;
const S = T.Stone;
const Fl = T.Flowers;
const DG = T.DarkGrass;
const C = T.Carpet;

// Shorthand - Winter tiles
const Sn = T.Snow;
const SD = T.SnowDark;
const SF = T.SnowFlowers;
const Ic = T.Ice;
const FP = T.FrozenPath;

// ============================================================
// OVERWORLD PRO - Professional World (16x14)
// ============================================================
// Layout:
//   Top: Office (left, 3-wide), Code Lab (right, 3-wide)
//   Mid-left: Nexus HQ (3-wide)     Center: Fountain     Mid-right: (open)
//   Bottom center: Portal to Personal World (stone area)
const OVERWORLD_PRO_TILES: T[][] = [
  //0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
  [SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD], // 0
  [SD, SF, Sn, Sn, Sn, Sn, Sn, FP, FP, Sn, Sn, Sn, Sn, Sn, SF, SD], // 1
  [SD, Sn, Sn, FP, FP, FP, FP, FP, FP, FP, FP, FP, FP, Sn, Sn, SD], // 2
  [SD, Sn, Sn, FP, D,  FP, FP, FP, FP, FP, FP, D,  FP, Sn, Sn, SD], // 3
  [SD, Sn, Sn, Sn, Sn, FP, FP, FP, FP, FP, FP, Sn, Sn, Sn, Sn, SD], // 4
  [SD, FP, FP, FP, FP, FP, FP, Ic, Ic, FP, FP, FP, FP, FP, Sn, SD], // 5
  [SD, D,  FP, FP, FP, FP, FP, Ic, Ic, FP, FP, FP, FP, FP, Sn, SD], // 6
  [SD, Sn, FP, FP, FP, FP, FP, Ic, Ic, FP, FP, FP, FP, FP, Sn, SD], // 7
  [SD, Sn, Sn, FP, FP, FP, FP, FP, FP, FP, FP, FP, FP, Sn, Sn, SD], // 8
  [SD, Sn, Sn, Sn, Sn, FP, FP, FP, FP, FP, FP, Sn, Sn, Sn, Sn, SD], // 9
  [SD, Sn, Sn, Sn, Sn, FP, FP, FP, FP, FP, FP, Sn, Sn, Sn, Sn, SD], // 10
  [SD, Sn, Sn, Sn, Sn, FP, FP, FP, FP, FP, FP, Sn, Sn, Sn, Sn, SD], // 11
  [SD, SF, Sn, Sn, Sn, FP, FP, FP, FP, FP, FP, Sn, Sn, Sn, SF, SD], // 12
  [SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD, SD], // 13
];

// ============================================================
// OVERWORLD PERSONAL - Personal World (20x16)
// ============================================================
// Layout:
//   Top row: House (left, 3-wide), Tech Hub (right, 3-wide)
//   Left: Cafe (3-wide)    Center: Fountain plaza    Right: Arcade (3-wide)
//   Bottom center: Portal to Professional World (stone area)
const OVERWORLD_PERSONAL_TILES: T[][] = [
  //0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19
  [DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG], // 0
  [DG, Fl, G,  G,  G,  G,  G,  G,  G,  P,  P,  G,  G,  G,  G,  G,  G,  G,  Fl, DG], // 1
  [DG, G,  G,  G,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  G,  G,  G,  DG], // 2
  [DG, G,  G,  G,  P,  D,  P,  P,  P,  P,  P,  P,  P,  P,  D,  P,  G,  G,  G,  DG], // 3
  [DG, G,  G,  G,  G,  G,  P,  P,  P,  P,  P,  P,  P,  P,  G,  G,  G,  G,  G,  DG], // 4
  [DG, G,  G,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  G,  G,  DG], // 5
  [DG, P,  P,  P,  P,  P,  P,  P,  P,  S,  S,  P,  P,  P,  P,  P,  P,  P,  P,  DG], // 6
  [DG, D,  P,  P,  P,  P,  P,  P,  P,  S,  S,  P,  P,  P,  P,  P,  P,  P,  D,  DG], // 7
  [DG, G,  P,  P,  P,  P,  P,  P,  P,  S,  S,  P,  P,  P,  P,  P,  P,  P,  G,  DG], // 8
  [DG, G,  G,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  G,  G,  DG], // 9
  [DG, G,  G,  G,  G,  G,  P,  P,  P,  P,  P,  P,  P,  P,  G,  G,  G,  G,  G,  DG], // 10
  [DG, G,  G,  G,  G,  G,  P,  P,  P,  P,  P,  P,  P,  P,  G,  G,  G,  G,  G,  DG], // 11
  [DG, G,  G,  G,  G,  G,  P,  P,  P,  P,  P,  P,  P,  P,  G,  G,  G,  G,  G,  DG], // 12
  [DG, G,  G,  G,  G,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  G,  G,  G,  G,  DG], // 13
  [DG, Fl, G,  G,  G,  P,  P,  P,  P,  P,  P,  P,  P,  P,  P,  G,  G,  G,  Fl, DG], // 14
  [DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG, DG], // 15
];

// ============================================================
// OFFICE - Profile Professional (14x12)
// ============================================================
const OFFICE_TILES: T[][] = [
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  C,  C,  C,  C,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  C,  C,  C,  C,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  C,  C,  C,  C,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  D,  F,  F,  F,  F,  F,  W],
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
];

// ============================================================
// CODE LAB - Repos (14x12)
// ============================================================
const CODE_LAB_TILES: T[][] = [
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  D,  F,  F,  F,  F,  F,  W],
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
];

// ============================================================
// NEXUS HQ (14x12)
// ============================================================
const NEXUS_HQ_TILES: T[][] = [
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  C,  C,  C,  C,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  C,  C,  C,  C,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  C,  C,  C,  C,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  D,  F,  F,  F,  F,  F,  W],
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
];

// ============================================================
// HOUSE - Profile Personal (14x12)
// ============================================================
const HOUSE_TILES: T[][] = [
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  C,  C,  C,  C,  C,  C,  C,  C,  F,  F,  W],
  [W,  F,  F,  C,  C,  C,  C,  C,  C,  C,  C,  F,  F,  W],
  [W,  F,  F,  C,  C,  C,  C,  C,  C,  C,  C,  F,  F,  W],
  [W,  F,  F,  C,  C,  C,  C,  C,  C,  C,  C,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  D,  F,  F,  F,  F,  F,  W],
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
];

// ============================================================
// TECH HUB - Deving (14x12)
// ============================================================
const TECH_HUB_TILES: T[][] = [
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  D,  F,  F,  F,  F,  F,  W],
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
];

// ============================================================
// CAFE - Tools (14x12)
// ============================================================
const CAFE_TILES: T[][] = [
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  C,  C,  C,  C,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  C,  C,  C,  C,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  C,  C,  C,  C,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  D,  F,  F,  F,  F,  F,  W],
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
];

// ============================================================
// ARCADE - Circus (14x12)
// ============================================================
const ARCADE_TILES: T[][] = [
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  W],
  [W,  F,  F,  F,  F,  F,  F,  D,  F,  F,  F,  F,  F,  W],
  [W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
];

// ============================================================
// Object positions per zone (where interactive objects go)
// ============================================================
// 14-wide buildings: walls at x=0 and x=13, usable x: 1-12
// 12-tall buildings: walls at y=0 and y=11, door at y=10, usable y: 1-9
const OBJECT_POSITIONS: Record<string, Array<{ x: number; y: number }>> = {
  'office':   [
    { x: 2, y: 1 }, { x: 6, y: 1 }, { x: 11, y: 1 },
    { x: 2, y: 4 }, { x: 11, y: 4 },
    { x: 2, y: 8 }, { x: 6, y: 8 }, { x: 11, y: 8 },
    { x: 6, y: 4 },
  ],
  'code-lab': [
    { x: 2, y: 1 }, { x: 6, y: 1 }, { x: 11, y: 1 },
    { x: 2, y: 4 }, { x: 11, y: 4 },
    { x: 2, y: 8 }, { x: 6, y: 8 }, { x: 11, y: 8 },
    { x: 2, y: 6 }, { x: 11, y: 6 },
  ],
  'nexus-hq': [
    { x: 2, y: 2 }, { x: 11, y: 2 },
    { x: 2, y: 7 }, { x: 11, y: 7 },
  ],
  'house':    [
    { x: 1, y: 1 }, { x: 6, y: 1 }, { x: 12, y: 1 },
    { x: 1, y: 4 }, { x: 12, y: 4 },
    { x: 1, y: 8 }, { x: 6, y: 8 }, { x: 12, y: 8 },
    { x: 1, y: 6 }, { x: 12, y: 6 },
    { x: 6, y: 4 }, { x: 6, y: 6 }, { x: 4, y: 8 },
  ],
  'tech-hub': [
    { x: 2, y: 1 }, { x: 6, y: 1 }, { x: 11, y: 1 },
    { x: 2, y: 4 }, { x: 11, y: 4 },
    { x: 2, y: 8 }, { x: 6, y: 8 }, { x: 11, y: 8 },
    { x: 6, y: 4 },
  ],
  'cafe':     [
    { x: 2, y: 2 }, { x: 11, y: 2 },
    { x: 2, y: 7 }, { x: 6, y: 7 }, { x: 11, y: 7 },
  ],
  'arcade':   [
    { x: 2, y: 2 }, { x: 6, y: 2 }, { x: 11, y: 2 },
    { x: 6, y: 7 },
  ],
};

// ============================================================
// Decorations per zone
// ============================================================
const ZONE_DECORATIONS: Record<string, Decoration[]> = {
  'overworld-pro': [
    // Building facades (positioned 1 row above wall blocks, aligned to building left edge)
    { type: DecorationType.BuildingOffice,  x: 3, y: 0 },
    { type: DecorationType.BuildingCodeLab, x: 10, y: 0 },
    { type: DecorationType.BuildingNexus,   x: 0, y: 3 },
    // Portal
    { type: DecorationType.SnowPortal, x: 6, y: 10 },
    // Animal
    { type: DecorationType.Fox, x: 13, y: 8 },
    // Scenery
    { type: DecorationType.SnowTree, x: 14, y: 2 },
    { type: DecorationType.SnowTree, x: 1, y: 10 },
    { type: DecorationType.SnowTree, x: 14, y: 10 },
    { type: DecorationType.Fountain, x: 7, y: 6 },
    { type: DecorationType.Lamp, x: 4, y: 5 },
    { type: DecorationType.Lamp, x: 11, y: 5 },
    { type: DecorationType.Lamp, x: 4, y: 8 },
    { type: DecorationType.Lamp, x: 11, y: 8 },
    { type: DecorationType.SnowBush, x: 15, y: 5 },
  ],
  'overworld-personal': [
    // Building facades
    { type: DecorationType.BuildingHouse,   x: 4, y: 0 },
    { type: DecorationType.BuildingTechHub, x: 13, y: 0 },
    { type: DecorationType.BuildingCafe,    x: 0, y: 4 },
    { type: DecorationType.BuildingArcade,  x: 17, y: 4 },
    // Portal
    { type: DecorationType.Portal, x: 8, y: 12 },
    // Animal
    { type: DecorationType.Rabbit, x: 3, y: 10 },
    // Scenery
    { type: DecorationType.Tree, x: 1, y: 12 },
    { type: DecorationType.Tree, x: 18, y: 12 },
    { type: DecorationType.Fountain, x: 9, y: 7 },
    { type: DecorationType.Lamp, x: 4, y: 5 },
    { type: DecorationType.Lamp, x: 15, y: 5 },
    { type: DecorationType.Lamp, x: 4, y: 9 },
    { type: DecorationType.Lamp, x: 15, y: 9 },
    { type: DecorationType.Flower, x: 3, y: 4 },
    { type: DecorationType.Flower, x: 16, y: 4 },
    { type: DecorationType.Flower, x: 3, y: 12 },
    { type: DecorationType.Flower, x: 16, y: 12 },
  ],
  'office': [
    { type: DecorationType.Rug, x: 6, y: 5 },
  ],
  'house': [
    { type: DecorationType.Rug, x: 6, y: 4 },
    { type: DecorationType.Flower, x: 1, y: 7 },
  ],
  'nexus-hq': [
    { type: DecorationType.Rug, x: 6, y: 5 },
  ],
  'cafe': [
    { type: DecorationType.Rug, x: 6, y: 5 },
    { type: DecorationType.Flower, x: 12, y: 8 },
  ],
};

// ============================================================
// Door connections (bidirectional)
// ============================================================

interface DoorConnection {
  fromZone: string;
  fromX: number;
  fromY: number;
  toZone: string;
  toX: number;
  toY: number;
}

const DOOR_CONNECTIONS: DoorConnection[] = [
  // === OVERWORLD PRO doors ===
  // Overworld Pro ↔ Office (centered door at col 4)
  { fromZone: 'overworld-pro', fromX: 4, fromY: 3, toZone: 'office', toX: 7, toY: 9 },
  { fromZone: 'office', fromX: 7, fromY: 10, toZone: 'overworld-pro', toX: 4, toY: 4 },

  // Overworld Pro ↔ Code Lab (centered door at col 11)
  { fromZone: 'overworld-pro', fromX: 11, fromY: 3, toZone: 'code-lab', toX: 7, toY: 9 },
  { fromZone: 'code-lab', fromX: 7, fromY: 10, toZone: 'overworld-pro', toX: 11, toY: 4 },

  // Overworld Pro ↔ Nexus HQ (centered door at col 1)
  { fromZone: 'overworld-pro', fromX: 1, fromY: 6, toZone: 'nexus-hq', toX: 7, toY: 9 },
  { fromZone: 'nexus-hq', fromX: 7, fromY: 10, toZone: 'overworld-pro', toX: 1, toY: 7 },

  // Overworld Pro ↔ Personal World (portal at bottom center)
  { fromZone: 'overworld-pro', fromX: 6, fromY: 11, toZone: 'overworld-personal', toX: 9, toY: 2 },
  { fromZone: 'overworld-pro', fromX: 7, fromY: 11, toZone: 'overworld-personal', toX: 9, toY: 2 },

  // === OVERWORLD PERSONAL doors ===
  // Overworld Personal ↔ House (centered door at col 5)
  { fromZone: 'overworld-personal', fromX: 5, fromY: 3, toZone: 'house', toX: 7, toY: 9 },
  { fromZone: 'house', fromX: 7, fromY: 10, toZone: 'overworld-personal', toX: 5, toY: 4 },

  // Overworld Personal ↔ Tech Hub (centered door at col 14)
  { fromZone: 'overworld-personal', fromX: 14, fromY: 3, toZone: 'tech-hub', toX: 7, toY: 9 },
  { fromZone: 'tech-hub', fromX: 7, fromY: 10, toZone: 'overworld-personal', toX: 14, toY: 4 },

  // Overworld Personal ↔ Cafe (centered door at col 1)
  { fromZone: 'overworld-personal', fromX: 1, fromY: 7, toZone: 'cafe', toX: 7, toY: 9 },
  { fromZone: 'cafe', fromX: 7, fromY: 10, toZone: 'overworld-personal', toX: 1, toY: 8 },

  // Overworld Personal ↔ Arcade (centered door at col 18)
  { fromZone: 'overworld-personal', fromX: 18, fromY: 7, toZone: 'arcade', toX: 7, toY: 9 },
  { fromZone: 'arcade', fromX: 7, fromY: 10, toZone: 'overworld-personal', toX: 18, toY: 8 },

  // Overworld Personal ↔ Professional World (portal at bottom center)
  { fromZone: 'overworld-personal', fromX: 8, fromY: 13, toZone: 'overworld-pro', toX: 7, toY: 9 },
  { fromZone: 'overworld-personal', fromX: 9, fromY: 13, toZone: 'overworld-pro', toX: 7, toY: 9 },
];

// ============================================================
// Zone names for display
// ============================================================
const ZONE_NAMES: Record<string, string> = {
  'overworld-pro':      'Professional World',
  'overworld-personal': 'Personal World',
  'office':    'Office',
  'code-lab':  'Code Lab',
  'nexus-hq':  'Nexus HQ',
  'house':     'House',
  'tech-hub':  'Tech Hub',
  'cafe':      'Cafe',
  'arcade':    'Arcade',
};

// ============================================================
// Build all zones from data
// ============================================================

const TILE_MAPS: Record<string, T[][]> = {
  'overworld-pro':      OVERWORLD_PRO_TILES,
  'overworld-personal': OVERWORLD_PERSONAL_TILES,
  'office':     OFFICE_TILES,
  'code-lab':   CODE_LAB_TILES,
  'nexus-hq':   NEXUS_HQ_TILES,
  'house':      HOUSE_TILES,
  'tech-hub':   TECH_HUB_TILES,
  'cafe':       CAFE_TILES,
  'arcade':     ARCADE_TILES,
};

export function buildWorld(data: GraphData): Map<string, Zone> {
  const zones = new Map<string, Zone>();

  for (const [zoneId, tiles] of Object.entries(TILE_MAPS)) {
    const height = tiles.length;
    const width = tiles[0].length;

    // Build door map for this zone
    const doors = new Map<string, DoorExit>();
    for (const conn of DOOR_CONNECTIONS) {
      if (conn.fromZone === zoneId) {
        doors.set(`${conn.fromX},${conn.fromY}`, {
          targetZone: conn.toZone,
          targetX: conn.toX,
          targetY: conn.toY,
        });
      }
    }

    // Build objects from data
    const positions = OBJECT_POSITIONS[zoneId] || [];
    let objects: WorldObject[];
    if (zoneId === 'overworld-pro') {
      objects = buildOverworldProSignposts();
    } else if (zoneId === 'overworld-personal') {
      objects = buildOverworldPersonalSignposts();
    } else {
      objects = buildZoneObjects(zoneId, data, positions);
    }

    // Get decorations
    const decorations = ZONE_DECORATIONS[zoneId] || [];

    // Player start position
    let playerStart = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
    if (zoneId === 'overworld-pro') {
      playerStart = { x: 7, y: 7 };
    } else if (zoneId === 'overworld-personal') {
      playerStart = { x: 9, y: 8 };
    }

    zones.set(zoneId, {
      id: zoneId,
      name: ZONE_NAMES[zoneId] || zoneId,
      width,
      height,
      tiles,
      objects,
      decorations,
      doors,
      playerStart,
    });
  }

  return zones;
}

/** Build signpost objects for the Professional overworld. */
function buildOverworldProSignposts(): WorldObject[] {
  return [
    { id: 'sign-office',    type: OT.Signpost, x: 4,  y: 2,  label: 'Office',           links: [] },
    { id: 'sign-codelab',   type: OT.Signpost, x: 11, y: 2,  label: 'Code Lab',         links: [] },
    { id: 'sign-nexus',     type: OT.Signpost, x: 1,  y: 5,  label: 'Nexus HQ',         links: [] },
    { id: 'sign-portal-per',type: OT.Signpost, x: 5,  y: 11, label: 'Personal World',   links: [] },
  ];
}

/** Build signpost objects for the Personal overworld. */
function buildOverworldPersonalSignposts(): WorldObject[] {
  return [
    { id: 'sign-house',     type: OT.Signpost, x: 5,  y: 2,  label: 'House',              links: [] },
    { id: 'sign-techhub',   type: OT.Signpost, x: 14, y: 2,  label: 'Tech Hub',           links: [] },
    { id: 'sign-cafe',      type: OT.Signpost, x: 1,  y: 6,  label: 'Cafe',               links: [] },
    { id: 'sign-arcade',    type: OT.Signpost, x: 18, y: 6,  label: 'Arcade',             links: [] },
    { id: 'sign-portal-pro',type: OT.Signpost, x: 5,  y: 13, label: 'Professional World', links: [] },
  ];
}

/** Get a zone by ID. */
export function getZone(zones: Map<string, Zone>, id: string): Zone | undefined {
  return zones.get(id);
}
