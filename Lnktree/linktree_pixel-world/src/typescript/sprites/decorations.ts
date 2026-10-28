// ==========================================================================
// Decoration Sprites - Non-interactive visual elements (variable sizes)
// ==========================================================================

import { COLORS as C } from '../config';
import { DecorationType } from '../types';
import type { SpriteData } from '../types';
import { getSprite } from './cache';
import { getTexture } from './pixi-texture-cache';
import type { Texture } from 'pixi.js';

const _ = C.transparent;

// --- Tree (16x16) ---
const TREE: SpriteData = [
  [_, _, _, _, _, _, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, _, _, _, _, _, _],
  [_, _, _, _, _, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, _, _, _, _, _],
  [_, _, _, _, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, _, _, _, _],
  [_, _, _, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, _, _, _],
  [_, _, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, _, _],
  [_, _, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, _, _],
  [_, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, _],
  [_, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, _],
  [_, _, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, _, _],
  [_, _, _, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, _, _, _],
  [_, _, _, _, _, _, _, C.treeTrunk, C.treeTrunk, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.treeTrunk, C.treeTrunk, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.treeTrunk, C.treeTrunk, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.treeTrunk, C.treeTrunk, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.treeTrunk, C.treeTrunk, C.treeTrunk, C.treeTrunk, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Single Flower (16x16) ---
const FLOWER: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.flowerRed, C.flowerRed, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.flowerRed, C.flowerYel, C.flowerRed, C.flowerRed, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.flowerRed, C.flowerRed, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.grass, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.grass, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.grassDark, C.grass, C.grassDark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Fountain (16x16) ---
const FOUNTAIN: SpriteData = [
  [_, _, _, _, _, _, _, C.waterLight, C.waterLight, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.waterLight, C.water, C.waterLight, C.waterLight, _, _, _, _, _, _],
  [_, _, _, _, _, C.waterLight, _, C.water, _, C.waterLight, C.waterLight, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.stone, C.stone, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.stone, C.stone, _, _, _, _, _, _, _],
  [_, _, _, _, C.stone, C.stone, C.stone, C.stone, C.stone, C.stone, C.stone, C.stone, _, _, _, _],
  [_, _, _, C.stone, C.water, C.water, C.water, C.water, C.water, C.water, C.water, C.water, C.stone, _, _, _],
  [_, _, _, C.stone, C.water, C.waterLight, C.water, C.water, C.water, C.waterLight, C.water, C.water, C.stone, _, _, _],
  [_, _, _, C.stone, C.water, C.water, C.water, C.waterLight, C.water, C.water, C.water, C.water, C.stone, _, _, _],
  [_, _, _, C.stone, C.water, C.water, C.waterLight, C.water, C.water, C.water, C.waterLight, C.water, C.stone, _, _, _],
  [_, _, _, _, C.stone, C.stone, C.stone, C.stone, C.stone, C.stone, C.stone, C.stone, _, _, _, _],
  [_, _, _, _, C.stoneDark, C.stoneDark, C.stoneDark, C.stoneDark, C.stoneDark, C.stoneDark, C.stoneDark, C.stoneDark, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Lamp (16x16) ---
const LAMP: SpriteData = [
  [_, _, _, _, _, _, _, C.lampLight, C.lampLight, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.lampLight, C.lampLight, C.lampLight, C.lampLight, _, _, _, _, _, _],
  [_, _, _, _, _, C.lampLight, C.lampLight, '#ffffff', C.lampLight, C.lampLight, C.lampLight, _, _, _, _, _],
  [_, _, _, _, _, _, C.lampLight, C.lampLight, C.lampLight, C.lampLight, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.lampPost, C.lampPost, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.lampPost, C.lampPost, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.lampPost, C.lampPost, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.lampPost, C.lampPost, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.lampPost, C.lampPost, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.lampPost, C.lampPost, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.lampPost, C.lampPost, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.lampPost, C.lampPost, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.lampPost, C.lampPost, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.lampPost, C.lampPost, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.lampPost, C.lampPost, C.lampPost, C.lampPost, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Rug (16x16) ---
const RUG: SpriteData = Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (___, x) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return C.carpetDark;
    return C.carpet;
  })
);

// --- Bush (16x16) ---
const BUSH: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, _, _, _, _, _, _],
  [_, _, _, _, _, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, _, _, _, _, _],
  [_, _, _, _, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, _, _, _, _],
  [_, _, _, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, _, _, _],
  [_, _, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, _, _],
  [_, _, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeafL, C.treeLeaf, _, _],
  [_, _, _, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, C.treeLeaf, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Snow Tree (16x16) ---
const SNOW_TREE: SpriteData = [
  [_, _, _, _, _, _, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, _, _, _, _, _, _],
  [_, _, _, _, _, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, C.snowLeaf, _, _, _, _, _],
  [_, _, _, _, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeafL, C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, _, _, _, _],
  [_, _, _, C.snowLeaf, C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, _, _, _],
  [_, _, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, C.snowLeaf, _, _],
  [_, _, C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, _, _],
  [_, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, _],
  [_, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeafL, C.snowLeaf, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, _],
  [_, _, C.snowLeaf, C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, _, _],
  [_, _, _, C.snowLeaf, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, C.snowLeaf, _, _, _],
  [_, _, _, _, _, _, _, C.snowBark, C.snowBark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.snowBark, C.snowBark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.snowBark, C.snowBark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.snowBark, C.snowBark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.snowBark, C.snowBark, C.snowBark, C.snowBark, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Snow Bush (16x16) ---
const SNOW_BUSH: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, _, _, _, _, _, _],
  [_, _, _, _, _, C.snowLeaf, '#ffffff', C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, _, _, _, _, _],
  [_, _, _, _, C.snowLeaf, C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, _, _, _, _],
  [_, _, _, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, '#ffffff', C.snowLeafL, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, _, _, _],
  [_, _, C.snowLeaf, C.snowLeaf, C.snowLeafL, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, C.snowLeaf, _, _],
  [_, _, C.snowLeaf, '#ffffff', C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeafL, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, '#ffffff', C.snowLeaf, _, _],
  [_, _, _, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, C.snowLeaf, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// ============================================================
// BUILDING FACADES (48x48 = 3x3 tiles)
// ============================================================

// Helper: fill a row with a repeated color
function fillRow(width: number, color: string): string[] {
  return Array(width).fill(color);
}

// --- BuildingOffice (48x48) - Blue-grey office with windows ---
const BUILDING_OFFICE: SpriteData = (() => {
  const w = C.wall, wl = C.wallLight, wd = C.wallDark;
  const rb = C.roofBlue, rbd = C.roofBlueDk;
  const wg = C.windowGlow, wf = C.windowFrame;
  const d = C.door, df = C.doorFrame;
  const rows: SpriteData = [];
  // Row 0-3: Roof
  for (let r = 0; r < 4; r++) {
    const row = fillRow(48, r < 2 ? rbd : rb);
    // Roof edge details
    if (r === 0) { row[0] = _; row[1] = _; row[46] = _; row[47] = _; }
    if (r === 1) { row[0] = _; row[47] = _; }
    rows.push(row);
  }
  // Row 4: roof trim
  rows.push(fillRow(48, wd));
  // Row 5-15: Upper wall with windows
  for (let r = 5; r < 16; r++) {
    const row = fillRow(48, w);
    // Left edge
    row[0] = wd; row[1] = wd;
    // Right edge
    row[46] = wd; row[47] = wd;
    // Windows at cols 6-10, 20-26 (sign area), 37-41
    if (r >= 7 && r <= 13) {
      // Left window
      if (r === 7 || r === 13) { for (let c = 6; c <= 10; c++) row[c] = wf; }
      else { row[6] = wf; for (let c = 7; c <= 9; c++) row[c] = wg; row[10] = wf; }
      // Center "OFFICE" sign area - just a darker panel
      if (r >= 8 && r <= 12) {
        for (let c = 19; c <= 28; c++) row[c] = wd;
        if (r === 10) { for (let c = 20; c <= 27; c++) row[c] = wl; } // text highlight
      }
      // Right window
      if (r === 7 || r === 13) { for (let c = 37; c <= 41; c++) row[c] = wf; }
      else { row[37] = wf; for (let c = 38; c <= 40; c++) row[c] = wg; row[41] = wf; }
    }
    rows.push(row);
  }
  // Row 16: divider
  rows.push(fillRow(48, wd));
  // Row 17-35: Lower wall with 3 windows
  for (let r = 17; r < 36; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    if (r >= 20 && r <= 30) {
      // Three windows
      for (const startCol of [5, 20, 35]) {
        if (r === 20 || r === 30) { for (let c = startCol; c <= startCol + 7; c++) row[c] = wf; }
        else { row[startCol] = wf; for (let c = startCol + 1; c <= startCol + 6; c++) row[c] = wg; row[startCol + 7] = wf; }
      }
    }
    rows.push(row);
  }
  // Row 36-37: Door area base
  for (let r = 36; r < 38; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    // Door frame
    for (let c = 20; c <= 27; c++) row[c] = df;
    rows.push(row);
  }
  // Row 38-46: Door opening
  for (let r = 38; r < 47; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    row[20] = df; row[27] = df;
    for (let c = 21; c <= 26; c++) row[c] = d;
    rows.push(row);
  }
  // Row 47: base
  rows.push(fillRow(48, wd));
  return rows;
})();

// --- BuildingCodeLab (48x48) - Tech lab with green screens ---
const BUILDING_CODELAB: SpriteData = (() => {
  const w = C.wall, wd = C.wallDark;
  const sg = C.screenGlow, sd = C.screenDark;
  const wf = C.windowFrame;
  const d = C.door, df = C.doorFrame;
  const mt = C.metal, mtd = C.metalDark;
  const rows: SpriteData = [];
  // Row 0-2: Flat roof with antenna
  for (let r = 0; r < 3; r++) {
    const row = fillRow(48, _);
    if (r === 0) { row[10] = mt; row[11] = mt; row[38] = mt; }
    if (r === 1) { row[10] = mt; row[11] = mt; for (let c = 2; c < 46; c++) row[c] = mtd; row[38] = mt; }
    if (r === 2) { for (let c = 0; c < 48; c++) row[c] = mt; }
    rows.push(row);
  }
  // Row 3: roof base
  rows.push(fillRow(48, wd));
  // Row 4-15: Upper wall with green screens
  for (let r = 4; r < 16; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    if (r >= 6 && r <= 13) {
      // Left screen
      if (r === 6 || r === 13) { for (let c = 5; c <= 14; c++) row[c] = wf; }
      else { row[5] = wf; for (let c = 6; c <= 13; c++) row[c] = (r % 2 === 0) ? sg : sd; row[14] = wf; }
      // Right screen
      if (r === 6 || r === 13) { for (let c = 33; c <= 42; c++) row[c] = wf; }
      else { row[33] = wf; for (let c = 34; c <= 41; c++) row[c] = (r % 2 === 0) ? sg : sd; row[42] = wf; }
    }
    // Center server rack pattern
    if (r >= 7 && r <= 12) {
      for (let c = 20; c <= 27; c++) row[c] = (r % 2 === 0) ? mtd : mt;
    }
    rows.push(row);
  }
  // Row 16: divider
  rows.push(fillRow(48, wd));
  // Row 17-35: Lower wall with more screens
  for (let r = 17; r < 36; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    if (r >= 20 && r <= 30) {
      for (const startCol of [5, 20, 35]) {
        if (r === 20 || r === 30) { for (let c = startCol; c <= startCol + 7; c++) row[c] = wf; }
        else { row[startCol] = wf; for (let c = startCol + 1; c <= startCol + 6; c++) row[c] = (r % 3 === 0) ? sg : sd; row[startCol + 7] = wf; }
      }
    }
    rows.push(row);
  }
  // Row 36-37: Door frame
  for (let r = 36; r < 38; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    for (let c = 20; c <= 27; c++) row[c] = df;
    rows.push(row);
  }
  // Row 38-46: Door opening
  for (let r = 38; r < 47; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    row[20] = df; row[27] = df;
    for (let c = 21; c <= 26; c++) row[c] = d;
    rows.push(row);
  }
  // Row 47: base
  rows.push(fillRow(48, wd));
  return rows;
})();

// --- BuildingNexus (48x48) - Corporate HQ with emblem ---
const BUILDING_NEXUS: SpriteData = (() => {
  const w = C.wall, wl = C.wallLight, wd = C.wallDark;
  const wg = C.windowGlow, wf = C.windowFrame;
  const d = C.door, df = C.doorFrame;
  const rows: SpriteData = [];
  // Row 0-5: Tall roof / parapet
  for (let r = 0; r < 6; r++) {
    const row = fillRow(48, r < 3 ? wd : w);
    if (r < 2) { row[0] = _; row[47] = _; }
    if (r === 0) { row[1] = _; row[46] = _; }
    // Crenellation pattern on top
    if (r === 0) { for (let c = 2; c < 46; c++) row[c] = (c % 4 < 2) ? wl : _; }
    rows.push(row);
  }
  // Row 6: trim
  rows.push(fillRow(48, wl));
  // Row 7-17: Upper wall with emblem
  for (let r = 7; r < 18; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    // Emblem: diamond shape at center (cols 19-28, rows 9-15)
    if (r >= 9 && r <= 15) {
      const mid = 23;
      const halfW = r <= 12 ? (r - 9) : (15 - r);
      for (let c = mid - halfW; c <= mid + halfW + 1; c++) {
        if (c >= 19 && c <= 28) row[c] = wl;
      }
    }
    // Double windows on sides
    if (r >= 9 && r <= 15) {
      // Left pair
      if (r === 9 || r === 15) { for (let c = 5; c <= 9; c++) row[c] = wf; for (let c = 11; c <= 15; c++) row[c] = wf; }
      else {
        row[5] = wf; for (let c = 6; c <= 8; c++) row[c] = wg; row[9] = wf;
        row[11] = wf; for (let c = 12; c <= 14; c++) row[c] = wg; row[15] = wf;
      }
      // Right pair
      if (r === 9 || r === 15) { for (let c = 32; c <= 36; c++) row[c] = wf; for (let c = 38; c <= 42; c++) row[c] = wf; }
      else {
        row[32] = wf; for (let c = 33; c <= 35; c++) row[c] = wg; row[36] = wf;
        row[38] = wf; for (let c = 39; c <= 41; c++) row[c] = wg; row[42] = wf;
      }
    }
    rows.push(row);
  }
  // Row 18: divider
  rows.push(fillRow(48, wd));
  // Row 19-35: Lower wall with windows
  for (let r = 19; r < 36; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    if (r >= 22 && r <= 32) {
      for (const startCol of [5, 20, 35]) {
        if (r === 22 || r === 32) { for (let c = startCol; c <= startCol + 7; c++) row[c] = wf; }
        else { row[startCol] = wf; for (let c = startCol + 1; c <= startCol + 6; c++) row[c] = wg; row[startCol + 7] = wf; }
      }
    }
    rows.push(row);
  }
  // Row 36-37: Door frame
  for (let r = 36; r < 38; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    for (let c = 18; c <= 29; c++) row[c] = df;
    rows.push(row);
  }
  // Row 38-46: Double door
  for (let r = 38; r < 47; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    row[18] = df; row[29] = df;
    for (let c = 19; c <= 28; c++) row[c] = d;
    row[23] = df; row[24] = df; // center divide
    rows.push(row);
  }
  // Row 47: base
  rows.push(fillRow(48, wd));
  return rows;
})();

// --- BuildingHouse (48x48) - Cottage with chimney ---
const BUILDING_HOUSE: SpriteData = (() => {
  const wd = C.wallDark;
  const rf = C.roof, rfd = C.roofDark;
  const wg = C.windowGlow, wf = C.windowFrame;
  const d = C.door, df = C.doorFrame;
  const ch = C.chimney;
  const wdl = C.woodLight;
  const rows: SpriteData = [];
  // Row 0-1: Chimney only
  for (let r = 0; r < 2; r++) {
    const row = fillRow(48, _);
    // Chimney at right side
    for (let c = 38; c <= 41; c++) row[c] = ch;
    rows.push(row);
  }
  // Row 2-9: Pointed roof
  for (let r = 2; r < 10; r++) {
    const row = fillRow(48, _);
    const indent = (9 - r) * 3;
    for (let c = indent; c < 48 - indent; c++) {
      row[c] = (r % 2 === 0) ? rf : rfd;
    }
    // Chimney continues through roof
    if (r < 6) { for (let c = 38; c <= 41; c++) row[c] = ch; }
    rows.push(row);
  }
  // Row 10: roof edge
  rows.push(fillRow(48, rfd));
  // Row 11-15: Upper wall
  for (let r = 11; r < 16; r++) {
    const row = fillRow(48, wdl);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    rows.push(row);
  }
  // Row 16-30: Main wall with curtained windows
  for (let r = 16; r < 31; r++) {
    const row = fillRow(48, wdl);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    if (r >= 18 && r <= 28) {
      // Left window with curtains
      if (r === 18 || r === 28) { for (let c = 6; c <= 14; c++) row[c] = wf; }
      else {
        row[6] = wf; row[7] = C.flowerRed; // curtain
        for (let c = 8; c <= 12; c++) row[c] = wg;
        row[13] = C.flowerRed; row[14] = wf; // curtain
      }
      // Right window with curtains
      if (r === 18 || r === 28) { for (let c = 33; c <= 41; c++) row[c] = wf; }
      else {
        row[33] = wf; row[34] = C.flowerRed;
        for (let c = 35; c <= 39; c++) row[c] = wg;
        row[40] = C.flowerRed; row[41] = wf;
      }
    }
    // Flower box under windows
    if (r === 29) {
      for (let c = 7; c <= 13; c++) row[c] = (c % 2 === 0) ? C.flowerRed : C.flowerYel;
      for (let c = 34; c <= 40; c++) row[c] = (c % 2 === 0) ? C.flowerBlu : C.flowerYel;
    }
    rows.push(row);
  }
  // Row 31-35: Lower wall
  for (let r = 31; r < 36; r++) {
    const row = fillRow(48, wdl);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    rows.push(row);
  }
  // Row 36-37: Door frame
  for (let r = 36; r < 38; r++) {
    const row = fillRow(48, wdl);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    for (let c = 20; c <= 27; c++) row[c] = df;
    rows.push(row);
  }
  // Row 38-46: Door
  for (let r = 38; r < 47; r++) {
    const row = fillRow(48, wdl);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    row[20] = df; row[27] = df;
    for (let c = 21; c <= 26; c++) row[c] = d;
    // Doorknob
    if (r === 42) row[25] = C.metal;
    rows.push(row);
  }
  // Row 47: base
  rows.push(fillRow(48, wd));
  return rows;
})();

// --- BuildingTechHub (48x48) - Modern flat with blue glow ---
const BUILDING_TECHHUB: SpriteData = (() => {
  const w = C.wall, wd = C.wallDark, wl = C.wallLight;
  const wg = C.windowGlow, wf = C.windowFrame;
  const d = C.door, df = C.doorFrame;
  const mt = C.metal, mtd = C.metalDark;
  const rows: SpriteData = [];
  // Row 0-2: Flat roof with satellite dish
  for (let r = 0; r < 3; r++) {
    const row = fillRow(48, _);
    if (r === 0) { row[36] = mt; row[37] = mtd; }
    if (r === 1) { row[35] = mt; row[36] = mt; row[37] = mt; row[38] = mtd; for (let c = 2; c < 46; c++) if (!row[c]) row[c] = _; }
    if (r === 2) { for (let c = 0; c < 48; c++) row[c] = mtd; }
    rows.push(row);
  }
  // Row 3: roof trim
  rows.push(fillRow(48, wl));
  // Row 4-35: Wall with large blue-glow windows
  for (let r = 4; r < 36; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    if (r >= 7 && r <= 33) {
      // Three tall windows
      for (const startCol of [5, 19, 33]) {
        if (r === 7 || r === 33) { for (let c = startCol; c <= startCol + 9; c++) row[c] = wf; }
        else { row[startCol] = wf; for (let c = startCol + 1; c <= startCol + 8; c++) row[c] = wg; row[startCol + 9] = wf; }
      }
    }
    rows.push(row);
  }
  // Row 36-37: Door frame
  for (let r = 36; r < 38; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    for (let c = 20; c <= 27; c++) row[c] = df;
    rows.push(row);
  }
  // Row 38-46: Door
  for (let r = 38; r < 47; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    row[20] = df; row[27] = df;
    for (let c = 21; c <= 26; c++) row[c] = d;
    rows.push(row);
  }
  // Row 47: base
  rows.push(fillRow(48, wd));
  return rows;
})();

// --- BuildingCafe (48x48) - Warm with awning ---
const BUILDING_CAFE: SpriteData = (() => {
  const w = C.woodLight, wd = C.woodDark;
  const aw = C.awning, awd = C.awningDark;
  const wf = C.windowFrame;
  const d = C.door, df = C.doorFrame;
  const rows: SpriteData = [];
  // Row 0-7: Awning (striped orange)
  for (let r = 0; r < 8; r++) {
    const row = fillRow(48, _);
    const indent = Math.max(0, 3 - r);
    for (let c = indent; c < 48 - indent; c++) {
      row[c] = (c % 4 < 2) ? aw : awd;
    }
    if (r < 2) { row[0] = _; row[47] = _; }
    rows.push(row);
  }
  // Row 8: awning edge with scallops
  const scallop = fillRow(48, aw);
  for (let c = 0; c < 48; c++) { if (c % 3 === 0) scallop[c] = awd; }
  rows.push(scallop);
  // Row 9: wall top
  rows.push(fillRow(48, wd));
  // Row 10-15: Upper wall
  for (let r = 10; r < 16; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    rows.push(row);
  }
  // Row 16-30: Main wall with warm-glow windows + coffee cup sign
  for (let r = 16; r < 31; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    if (r >= 18 && r <= 28) {
      // Left window
      if (r === 18 || r === 28) { for (let c = 5; c <= 14; c++) row[c] = wf; }
      else { row[5] = wf; for (let c = 6; c <= 13; c++) row[c] = C.lampLight; row[14] = wf; }
      // Center: coffee cup icon (simple)
      if (r >= 20 && r <= 26) {
        for (let c = 21; c <= 26; c++) row[c] = wd;
        if (r === 20) { for (let c = 22; c <= 25; c++) row[c] = C.lampLight; } // steam
      }
      // Right window
      if (r === 18 || r === 28) { for (let c = 33; c <= 42; c++) row[c] = wf; }
      else { row[33] = wf; for (let c = 34; c <= 41; c++) row[c] = C.lampLight; row[42] = wf; }
    }
    rows.push(row);
  }
  // Row 31-35: Lower wall
  for (let r = 31; r < 36; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    rows.push(row);
  }
  // Row 36-37: Door frame
  for (let r = 36; r < 38; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    for (let c = 20; c <= 27; c++) row[c] = df;
    rows.push(row);
  }
  // Row 38-46: Door
  for (let r = 38; r < 47; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    row[20] = df; row[27] = df;
    for (let c = 21; c <= 26; c++) row[c] = d;
    rows.push(row);
  }
  // Row 47: base
  rows.push(fillRow(48, wd));
  return rows;
})();

// --- BuildingArcade (48x48) - Colorful with neon ---
const BUILDING_ARCADE: SpriteData = (() => {
  const w = C.wall, wd = C.wallDark, wl = C.wallLight;
  const np = C.neonPink, ng = C.neonGreen;
  const wg = C.windowGlow, wf = C.windowFrame;
  const d = C.door, df = C.doorFrame;
  const rows: SpriteData = [];
  // Row 0-3: Marquee top (neon border)
  for (let r = 0; r < 4; r++) {
    const row = fillRow(48, wd);
    if (r === 0 || r === 3) {
      for (let c = 0; c < 48; c++) row[c] = (c % 4 < 2) ? np : ng;
    }
    if (r === 1 || r === 2) {
      row[0] = np; row[1] = ng; row[46] = np; row[47] = ng;
      for (let c = 2; c < 46; c++) row[c] = wd;
      // "ARCADE" text area
      if (r === 1) { for (let c = 16; c < 32; c++) row[c] = np; }
      if (r === 2) { for (let c = 16; c < 32; c++) row[c] = ng; }
    }
    rows.push(row);
  }
  // Row 4: trim
  rows.push(fillRow(48, wl));
  // Row 5-15: Upper wall with neon accents
  for (let r = 5; r < 16; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    // Neon strips on sides
    if (r % 2 === 0) { row[2] = np; row[45] = np; }
    else { row[2] = ng; row[45] = ng; }
    // Joystick icon (center, rows 7-13)
    if (r >= 7 && r <= 13) {
      const mid = 24;
      if (r <= 9) { row[mid - 1] = wl; row[mid] = wl; } // stick
      if (r >= 10 && r <= 12) { for (let c = mid - 3; c <= mid + 2; c++) row[c] = wl; } // base
      if (r === 13) { for (let c = mid - 4; c <= mid + 3; c++) row[c] = wd; } // shadow
    }
    rows.push(row);
  }
  // Row 16: neon divider
  const neonDiv = fillRow(48, _);
  for (let c = 0; c < 48; c++) neonDiv[c] = (c % 2 === 0) ? np : ng;
  rows.push(neonDiv);
  // Row 17-35: Lower wall with colorful windows
  for (let r = 17; r < 36; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    if (r % 2 === 0) { row[2] = np; row[45] = ng; }
    if (r >= 20 && r <= 30) {
      for (const startCol of [5, 20, 35]) {
        if (r === 20 || r === 30) { for (let c = startCol; c <= startCol + 7; c++) row[c] = wf; }
        else {
          row[startCol] = wf;
          for (let c = startCol + 1; c <= startCol + 6; c++) row[c] = (r % 3 === 0) ? np : ((r % 3 === 1) ? ng : wg);
          row[startCol + 7] = wf;
        }
      }
    }
    rows.push(row);
  }
  // Row 36-37: Door frame
  for (let r = 36; r < 38; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    for (let c = 20; c <= 27; c++) row[c] = df;
    rows.push(row);
  }
  // Row 38-46: Door
  for (let r = 38; r < 47; r++) {
    const row = fillRow(48, w);
    row[0] = wd; row[1] = wd; row[46] = wd; row[47] = wd;
    row[20] = df; row[27] = df;
    for (let c = 21; c <= 26; c++) row[c] = d;
    rows.push(row);
  }
  // Row 47: neon base
  const neonBase = fillRow(48, _);
  for (let c = 0; c < 48; c++) neonBase[c] = (c % 2 === 0) ? np : ng;
  rows.push(neonBase);
  return rows;
})();

// ============================================================
// PORTAL SPRITES (32x32 = 2x2 tiles)
// ============================================================

// --- Portal vortex generator (32x32, no stone frame) ---
function makePortalVortex(
  colors: [string, string, string, string, string, string],
  shift: number,
): SpriteData {
  const [core, ring1, ring2, ring3, ring4, edge] = colors;
  const rows: SpriteData = [];
  for (let r = 0; r < 32; r++) {
    const row = fillRow(32, _);
    // Portal vortex (full oval, cols 1-30, rows 1-30)
    if (r >= 1 && r < 31) {
      const cy = 15.5;
      const cx = 15.5;
      const ry = 14.5;
      const rx = 14.5;
      const dy = r - cy;
      const dyNorm = dy / ry;
      if (Math.abs(dyNorm) <= 1) {
        const halfW = rx * Math.sqrt(1 - dyNorm * dyNorm);
        const left = Math.round(cx - halfW);
        const right = Math.round(cx + halfW);
        for (let c = Math.max(1, left); c <= Math.min(30, right); c++) {
          const dcx = c - cx;
          const dist = Math.sqrt((dcx / rx) * (dcx / rx) + dyNorm * dyNorm);
          const d = dist + shift;
          if (d < 0.25) row[c] = core;
          else if (d < 0.42) row[c] = ring1;
          else if (d < 0.58) row[c] = ring2;
          else if (d < 0.74) row[c] = ring3;
          else if (d < 0.9) row[c] = ring4;
          else if (d < 1.0) row[c] = edge;
        }
      }
    }
    rows.push(row);
  }
  return rows;
}

// --- Portal frames (purple/blue vortex) ---
const PORTAL_FRAME_0 = makePortalVortex(
  [C.portalCore, C.portalPurpLt, C.portalPurple, C.portalBlue, C.portalBlueLt, C.portalPurpDk], 0,
);
const PORTAL_FRAME_1 = makePortalVortex(
  [C.portalCore, C.portalPurpLt, C.portalPurple, C.portalBlue, C.portalBlueLt, C.portalPurpDk], -0.12,
);

// --- SnowPortal frames (icy blue/white vortex) ---
const SNOW_PORTAL_FRAME_0 = makePortalVortex(
  [C.portalCore, C.iceLight, C.portalBlueLt, C.portalBlue, C.ice, C.iceDark], 0,
);
const SNOW_PORTAL_FRAME_1 = makePortalVortex(
  [C.portalCore, C.iceLight, C.portalBlueLt, C.portalBlue, C.ice, C.iceDark], -0.12,
);

// ============================================================
// ANIMAL SPRITES (16x16, 2 frames each)
// ============================================================

// --- Rabbit Frame 0: Idle (ears up, sitting) ---
const RABBIT_FRAME_0: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.rabbitBrown, _, _, C.rabbitBrown, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.rabbitBrown, _, _, C.rabbitBrown, _, _, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrown, C.rabbitPink, _, _, C.rabbitPink, C.rabbitBrown, _, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, _, _, _, _, _],
  [_, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitWhite, C.rabbitBrown, C.rabbitBrown, C.rabbitWhite, C.rabbitBrown, C.rabbitBrown, _, _, _, _],
  [_, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitPink, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, _, _, _, _, _],
  [_, _, _, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, _, _, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrown, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitBrown, _, _, _, _, _],
  [_, _, _, _, C.rabbitBrown, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitBrown, _, _, _, _],
  [_, _, _, _, C.rabbitBrown, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitBrown, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrDk, C.rabbitBrown, _, _, C.rabbitBrown, C.rabbitBrDk, _, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrDk, C.rabbitBrDk, _, _, C.rabbitBrDk, C.rabbitBrDk, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Rabbit Frame 1: Hop (legs tucked) ---
const RABBIT_FRAME_1: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.rabbitBrown, _, _, C.rabbitBrown, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.rabbitBrown, _, _, C.rabbitBrown, _, _, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrown, C.rabbitPink, _, _, C.rabbitPink, C.rabbitBrown, _, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, _, _, _, _, _],
  [_, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitWhite, C.rabbitBrown, C.rabbitBrown, C.rabbitWhite, C.rabbitBrown, C.rabbitBrown, _, _, _, _],
  [_, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitPink, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, _, _, _, _, _],
  [_, _, _, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, _, _, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrown, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitBrown, _, _, _, _, _],
  [_, _, _, _, C.rabbitBrown, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitBrown, _, _, _, _],
  [_, _, _, _, C.rabbitBrown, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitWhite, C.rabbitBrown, _, _, _, _],
  [_, _, _, _, _, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, C.rabbitBrown, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Fox Frame 0: Idle (sitting, facing right-ish) ---
const FOX_FRAME_0: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, C.foxOrange, C.foxOrange, _, _, _, _, C.foxOrange, C.foxOrange, _, _, _, _],
  [_, _, _, C.foxOrange, C.foxOrangeDk, C.foxOrange, C.foxOrange, _, _, C.foxOrange, C.foxOrangeDk, C.foxOrange, C.foxOrange, _, _, _],
  [_, _, _, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, _, _, _],
  [_, _, _, C.foxOrange, C.foxWhite, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxWhite, C.foxOrange, C.foxOrange, _, _, _],
  [_, _, _, _, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, _, _, _, _],
  [_, _, _, _, _, C.foxOrange, C.foxOrange, C.foxWhite, C.foxWhite, C.foxOrange, C.foxOrange, _, _, _, _, _],
  [_, _, _, _, C.foxOrange, C.foxOrange, C.foxWhite, C.foxWhite, C.foxWhite, C.foxWhite, C.foxOrange, C.foxOrange, _, _, _, _],
  [_, _, _, C.foxOrange, C.foxOrange, C.foxWhite, C.foxWhite, C.foxWhite, C.foxWhite, C.foxWhite, C.foxWhite, C.foxOrange, C.foxOrange, _, _, _],
  [_, _, _, C.foxOrange, C.foxOrange, C.foxOrange, C.foxWhite, C.foxWhite, C.foxWhite, C.foxWhite, C.foxOrange, C.foxOrange, C.foxOrange, _, _, _],
  [_, _, _, _, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, _, _, _, _],
  [_, _, _, _, C.foxOrangeDk, _, _, _, _, _, _, C.foxOrangeDk, _, C.foxTail, C.foxOrange, _],
  [_, _, _, _, C.foxOrangeDk, _, _, _, _, _, _, C.foxOrangeDk, C.foxTail, C.foxOrange, C.foxWhite, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, C.foxTail, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Fox Frame 1: Head turn (looking slightly left) ---
const FOX_FRAME_1: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, C.foxOrange, C.foxOrange, _, _, _, _, C.foxOrange, C.foxOrange, _, _, _, _],
  [_, _, _, C.foxOrange, C.foxOrangeDk, C.foxOrange, C.foxOrange, _, _, C.foxOrange, C.foxOrangeDk, C.foxOrange, C.foxOrange, _, _, _],
  [_, _, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, _, _, _],
  [_, _, C.foxOrange, C.foxWhite, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxWhite, C.foxOrange, C.foxOrange, _, _, _],
  [_, _, _, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, _, _, _, _],
  [_, _, _, _, C.foxOrange, C.foxOrange, C.foxOrange, C.foxWhite, C.foxWhite, C.foxOrange, C.foxOrange, _, _, _, _, _],
  [_, _, _, _, C.foxOrange, C.foxOrange, C.foxWhite, C.foxWhite, C.foxWhite, C.foxWhite, C.foxOrange, C.foxOrange, _, _, _, _],
  [_, _, _, C.foxOrange, C.foxOrange, C.foxWhite, C.foxWhite, C.foxWhite, C.foxWhite, C.foxWhite, C.foxWhite, C.foxOrange, C.foxOrange, _, _, _],
  [_, _, _, C.foxOrange, C.foxOrange, C.foxOrange, C.foxWhite, C.foxWhite, C.foxWhite, C.foxWhite, C.foxOrange, C.foxOrange, C.foxOrange, _, _, _],
  [_, _, _, _, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, C.foxOrange, _, _, _, _],
  [_, _, _, _, C.foxOrangeDk, _, _, _, _, _, _, C.foxOrangeDk, _, C.foxTail, C.foxOrange, _],
  [_, _, _, _, C.foxOrangeDk, _, _, _, _, _, _, C.foxOrangeDk, C.foxTail, C.foxOrange, C.foxWhite, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, C.foxTail, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// ============================================================
// Decoration definitions with variable sizes
// ============================================================

interface DecorationDef {
  data: SpriteData;
  width: number;
  height: number;
}

const DECORATION_DEFS: Record<string, DecorationDef> = {
  [DecorationType.Tree]:           { data: TREE, width: 16, height: 16 },
  [DecorationType.Flower]:         { data: FLOWER, width: 16, height: 16 },
  [DecorationType.Fountain]:       { data: FOUNTAIN, width: 16, height: 16 },
  [DecorationType.Lamp]:           { data: LAMP, width: 16, height: 16 },
  [DecorationType.Rug]:            { data: RUG, width: 16, height: 16 },
  [DecorationType.Bush]:           { data: BUSH, width: 16, height: 16 },
  [DecorationType.SnowTree]:       { data: SNOW_TREE, width: 16, height: 16 },
  [DecorationType.SnowBush]:       { data: SNOW_BUSH, width: 16, height: 16 },
  // Buildings (48x48)
  [DecorationType.BuildingOffice]:  { data: BUILDING_OFFICE, width: 48, height: 48 },
  [DecorationType.BuildingCodeLab]: { data: BUILDING_CODELAB, width: 48, height: 48 },
  [DecorationType.BuildingNexus]:   { data: BUILDING_NEXUS, width: 48, height: 48 },
  [DecorationType.BuildingHouse]:   { data: BUILDING_HOUSE, width: 48, height: 48 },
  [DecorationType.BuildingTechHub]: { data: BUILDING_TECHHUB, width: 48, height: 48 },
  [DecorationType.BuildingCafe]:    { data: BUILDING_CAFE, width: 48, height: 48 },
  [DecorationType.BuildingArcade]:  { data: BUILDING_ARCADE, width: 48, height: 48 },
};

// Animated frame data (not in DECORATION_DEFS because they're in the dynamic layer)
const ANIMATED_FRAMES: Record<string, { frames: SpriteData[]; width: number; height: number }> = {
  [DecorationType.Rabbit]:     { frames: [RABBIT_FRAME_0, RABBIT_FRAME_1], width: 16, height: 16 },
  [DecorationType.Fox]:        { frames: [FOX_FRAME_0, FOX_FRAME_1], width: 16, height: 16 },
  [DecorationType.Portal]:     { frames: [PORTAL_FRAME_0, PORTAL_FRAME_1], width: 32, height: 32 },
  [DecorationType.SnowPortal]: { frames: [SNOW_PORTAL_FRAME_0, SNOW_PORTAL_FRAME_1], width: 32, height: 32 },
};

/** Set of animated decoration types (rendered in dynamic layer). */
export const ANIMATED_DECORATIONS = new Set<string>([
  DecorationType.Rabbit,
  DecorationType.Fox,
  DecorationType.Portal,
  DecorationType.SnowPortal,
]);

/** Get a cached canvas for a static decoration type (variable size). */
export function getDecorationSprite(type: DecorationType): HTMLCanvasElement {
  const def = DECORATION_DEFS[type as string];
  if (!def) {
    const anim = ANIMATED_FRAMES[type as string];
    if (anim) return getSprite(`dec_${type}_f0`, anim.width, anim.height, anim.frames[0]);
    return getSprite(`dec_${type}`, 16, 16, FLOWER);
  }
  return getSprite(`dec_${type}`, def.width, def.height, def.data);
}

/** Get a specific animation frame for an animated decoration. */
export function getAnimatedDecorationSprite(type: DecorationType, frame: number): HTMLCanvasElement {
  const anim = ANIMATED_FRAMES[type as string];
  if (!anim) return getDecorationSprite(type);
  const f = frame % anim.frames.length;
  return getSprite(`dec_${type}_f${f}`, anim.width, anim.height, anim.frames[f]);
}

/** Get the pixel dimensions of a decoration. */
export function getDecorationSize(type: DecorationType): { width: number; height: number } {
  const def = DECORATION_DEFS[type as string];
  if (def) return { width: def.width, height: def.height };
  const anim = ANIMATED_FRAMES[type as string];
  if (anim) return { width: anim.width, height: anim.height };
  return { width: 16, height: 16 };
}

/** Get a PixiJS Texture for a static decoration type. */
export function getDecorationTexture(type: DecorationType): Texture {
  const def = DECORATION_DEFS[type as string];
  if (!def) {
    const anim = ANIMATED_FRAMES[type as string];
    if (anim) return getTexture(`dec_${type}_f0`, anim.width, anim.height, anim.frames[0]);
    return getTexture(`dec_${type}`, 16, 16, FLOWER);
  }
  return getTexture(`dec_${type}`, def.width, def.height, def.data);
}

/** Get PixiJS Textures for all animation frames of a decoration. */
export function getAnimatedDecorationTextures(type: DecorationType): Texture[] {
  const anim = ANIMATED_FRAMES[type as string];
  if (!anim) return [getDecorationTexture(type)];
  return anim.frames.map((data, i) => getTexture(`dec_${type}_f${i}`, anim.width, anim.height, data));
}
