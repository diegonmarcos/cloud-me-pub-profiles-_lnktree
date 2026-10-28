// ==========================================================================
// Object Sprites - Interactive world objects (16x16)
// ==========================================================================

import { COLORS as C } from '../config';
import { ObjectType } from '../types';
import type { SpriteData } from '../types';
import { getSprite } from './cache';
import { getTexture } from './pixi-texture-cache';
import type { Texture } from 'pixi.js';

const _ = C.transparent;

// --- Computer/Monitor ---
const COMPUTER: SpriteData = [
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenGlow, C.screenGlow, C.screenDark, C.screenGlow, C.screenDark, C.screenGlow, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenGlow, C.screenDark, C.screenDark, C.screenGlow, C.screenGlow, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenDark, C.screenGlow, C.screenGlow, C.screenDark, C.screenDark, C.screenGlow, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenGlow, C.screenDark, C.screenDark, C.screenGlow, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenDark, C.screenDark, C.screenGlow, C.screenDark, C.screenGlow, C.screenGlow, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, _, _, _, _, C.metal, C.metal, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.metal, C.metal, _, _, _, _, _, _, _],
  [_, _, _, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _],
  [_, _, C.metalDark, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metalDark, _, _],
  [_, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _],
];

// --- Bookshelf ---
const BOOKSHELF: SpriteData = [
  [C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood],
  [C.wood, C.bookRed, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookBlue, C.wood],
  [C.wood, C.bookRed, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookBlue, C.wood],
  [C.wood, C.bookRed, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookBlue, C.wood],
  [C.wood, C.bookRed, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookBlue, C.wood],
  [C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood],
  [C.wood, C.bookGreen, C.bookBlue, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookRed, C.wood],
  [C.wood, C.bookGreen, C.bookBlue, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookRed, C.wood],
  [C.wood, C.bookGreen, C.bookBlue, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookRed, C.wood],
  [C.wood, C.bookGreen, C.bookBlue, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookBlue, C.bookRed, C.bookGreen, C.bookRed, C.wood],
  [C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood],
  [C.wood, C.bookBlue, C.bookRed, C.bookGreen, C.bookRed, C.bookBlue, _, _, _, C.bookGreen, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookBlue, C.wood],
  [C.wood, C.bookBlue, C.bookRed, C.bookGreen, C.bookRed, C.bookBlue, _, _, _, C.bookGreen, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookBlue, C.wood],
  [C.wood, C.bookBlue, C.bookRed, C.bookGreen, C.bookRed, C.bookBlue, _, _, _, C.bookGreen, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookBlue, C.wood],
  [C.wood, C.bookBlue, C.bookRed, C.bookGreen, C.bookRed, C.bookBlue, _, _, _, C.bookGreen, C.bookRed, C.bookBlue, C.bookGreen, C.bookRed, C.bookBlue, C.wood],
  [C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood],
];

// --- Signpost ---
const SIGNPOST: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, _, _, _],
  [_, _, _, C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood, _, _, _],
  [_, _, _, C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood, _, _, _],
  [_, _, _, C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood, _, _, _],
  [_, _, _, C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood, _, _, _],
  [_, _, _, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, _, _, _],
  [_, _, _, _, _, _, _, C.wood, C.wood, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.wood, C.wood, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.wood, C.wood, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.wood, C.wood, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.wood, C.wood, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.wood, C.wood, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.wood, C.wood, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.wood, C.wood, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.wood, C.wood, C.wood, C.wood, _, _, _, _, _, _],
];

// --- Mailbox ---
const MAILBOX: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _, _],
  [_, _, _, _, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metalDark, _, _, _, _],
  [_, _, _, _, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metalDark, _, _, _, _],
  [_, _, _, _, C.metal, C.metal, C.woodDark, C.woodDark, C.woodDark, C.metal, C.metal, C.metalDark, _, _, _, _],
  [_, _, _, _, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metal, C.metalDark, _, _, _, _],
  [_, _, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _, _],
  [_, _, _, _, _, _, _, C.metalDark, C.metalDark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.metalDark, C.metalDark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.metalDark, C.metalDark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.metalDark, C.metalDark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.metalDark, C.metalDark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.metalDark, C.metalDark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _, _, _, _],
];

// --- Arcade Cabinet ---
const ARCADE: SpriteData = [
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenGlow, C.screenDark, C.screenGlow, C.screenDark, C.screenGlow, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenDark, C.screenGlow, C.screenGlow, C.screenGlow, C.screenDark, C.screenGlow, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenGlow, C.screenDark, C.screenDark, C.screenGlow, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, C.flowerRed, _, _, C.flowerBlu, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, _, C.metalDark, _, _, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, _, _, _, _, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, _, _, _, _, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, _, _, _, _, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
];

// --- TV ---
const TV: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _],
  [_, _, C.metalDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _],
  [_, _, C.metalDark, C.screenDark, C.screenGlow, C.screenGlow, C.screenDark, C.screenDark, C.screenGlow, C.screenDark, C.screenGlow, C.screenDark, C.screenDark, C.metalDark, _, _],
  [_, _, C.metalDark, C.screenDark, C.screenDark, C.screenGlow, C.screenGlow, C.screenDark, C.screenDark, C.screenGlow, C.screenDark, C.screenGlow, C.screenDark, C.metalDark, _, _],
  [_, _, C.metalDark, C.screenDark, C.screenGlow, C.screenDark, C.screenDark, C.screenGlow, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _],
  [_, _, C.metalDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _],
  [_, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _],
  [_, _, _, _, _, _, _, C.metalDark, C.metalDark, _, _, _, _, _, _, _],
  [_, _, _, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Globe ---
const GLOBE: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.water, C.water, C.water, C.water, _, _, _, _, _, _],
  [_, _, _, _, _, C.water, C.water, C.grass, C.grass, C.water, C.water, _, _, _, _, _],
  [_, _, _, _, C.water, C.water, C.grass, C.grass, C.grass, C.water, C.water, C.water, _, _, _, _],
  [_, _, _, _, C.water, C.grass, C.grass, C.water, C.water, C.water, C.grass, C.water, _, _, _, _],
  [_, _, _, _, C.water, C.water, C.water, C.water, C.water, C.water, C.water, C.water, _, _, _, _],
  [_, _, _, _, C.water, C.water, C.water, C.grass, C.grass, C.water, C.water, C.water, _, _, _, _],
  [_, _, _, _, C.water, C.water, C.grass, C.grass, C.grass, C.grass, C.water, C.water, _, _, _, _],
  [_, _, _, _, _, C.water, C.water, C.grass, C.water, C.water, C.water, _, _, _, _, _],
  [_, _, _, _, _, _, C.water, C.water, C.water, C.water, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, C.metalDark, C.metalDark, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _, _, _, _],
  [_, _, _, _, _, C.metalDark, C.metal, C.metal, C.metal, C.metal, C.metalDark, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

// --- Jukebox ---
const JUKEBOX: SpriteData = [
  [_, _, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.flowerRed, C.flowerYel, C.flowerRed, C.flowerYel, C.flowerRed, C.flowerYel, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenGlow, C.screenDark, C.screenGlow, C.screenDark, C.screenGlow, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.screenDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.flowerRed, _, C.flowerBlu, _, C.flowerYel, _, C.flowerRed, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, _, _, _, _, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, _, _, _, _, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, _, _, _, _, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, _, _, _, _, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, _, _, _, _, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, _, _, _, _, _, _, _, _, C.metalDark, _, _, _],
  [_, _, _, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, C.metalDark, _, _, _],
];

// --- Desk ---
const DESK: SpriteData = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood],
  [C.woodDark, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodDark],
  [C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark, C.woodDark],
  [_, C.wood, C.wood, _, _, _, _, _, _, _, _, _, _, C.wood, C.wood, _],
  [_, C.wood, C.wood, _, _, _, _, _, _, _, _, _, _, C.wood, C.wood, _],
  [_, C.wood, C.wood, _, _, _, _, _, _, _, _, _, _, C.wood, C.wood, _],
  [_, C.wood, C.wood, _, _, _, _, _, _, _, _, _, _, C.wood, C.wood, _],
  [_, C.wood, C.wood, _, _, _, _, _, _, _, _, _, _, C.wood, C.wood, _],
  [_, C.wood, C.wood, _, _, _, _, _, _, _, _, _, _, C.wood, C.wood, _],
];

// --- Bulletin Board ---
const BULLETIN: SpriteData = [
  [C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood],
  [C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood],
  [C.wood, C.woodLight, '#ffffff', '#ffffff', '#ffffff', C.woodLight, C.woodLight, '#ffffcc', '#ffffcc', '#ffffcc', C.woodLight, C.woodLight, '#ccffcc', '#ccffcc', C.woodLight, C.wood],
  [C.wood, C.woodLight, '#ffffff', '#ffffff', '#ffffff', C.woodLight, C.woodLight, '#ffffcc', '#ffffcc', '#ffffcc', C.woodLight, C.woodLight, '#ccffcc', '#ccffcc', C.woodLight, C.wood],
  [C.wood, C.woodLight, '#ffffff', '#ffffff', '#ffffff', C.woodLight, C.woodLight, '#ffffcc', '#ffffcc', '#ffffcc', C.woodLight, C.woodLight, '#ccffcc', '#ccffcc', C.woodLight, C.wood],
  [C.wood, C.woodLight, '#ffffff', '#ffffff', '#ffffff', C.woodLight, C.woodLight, '#ffffcc', '#ffffcc', '#ffffcc', C.woodLight, C.woodLight, '#ccffcc', '#ccffcc', C.woodLight, C.wood],
  [C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood],
  [C.wood, C.woodLight, '#ffcccc', '#ffcccc', '#ffcccc', '#ffcccc', C.woodLight, C.woodLight, '#ccccff', '#ccccff', '#ccccff', C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood],
  [C.wood, C.woodLight, '#ffcccc', '#ffcccc', '#ffcccc', '#ffcccc', C.woodLight, C.woodLight, '#ccccff', '#ccccff', '#ccccff', C.woodLight, '#ffffff', '#ffffff', C.woodLight, C.wood],
  [C.wood, C.woodLight, '#ffcccc', '#ffcccc', '#ffcccc', '#ffcccc', C.woodLight, C.woodLight, '#ccccff', '#ccccff', '#ccccff', C.woodLight, '#ffffff', '#ffffff', C.woodLight, C.wood],
  [C.wood, C.woodLight, '#ffcccc', '#ffcccc', '#ffcccc', '#ffcccc', C.woodLight, C.woodLight, '#ccccff', '#ccccff', '#ccccff', C.woodLight, '#ffffff', '#ffffff', C.woodLight, C.wood],
  [C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood],
  [C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood],
  [C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood],
  [C.wood, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.woodLight, C.wood],
  [C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood, C.wood],
];

// Object sprite registry
const OBJECT_SPRITES: Record<ObjectType, SpriteData> = {
  [ObjectType.Computer]: COMPUTER,
  [ObjectType.Bookshelf]: BOOKSHELF,
  [ObjectType.Signpost]: SIGNPOST,
  [ObjectType.Mailbox]: MAILBOX,
  [ObjectType.Arcade]: ARCADE,
  [ObjectType.TV]: TV,
  [ObjectType.Globe]: GLOBE,
  [ObjectType.Jukebox]: JUKEBOX,
  [ObjectType.Desk]: DESK,
  [ObjectType.Bulletin]: BULLETIN,
};

/** Get a cached canvas for an object type. */
export function getObjectSprite(type: ObjectType): HTMLCanvasElement {
  return getSprite(`obj_${type}`, 16, 16, OBJECT_SPRITES[type]);
}

/** Get a PixiJS Texture for an object type. */
export function getObjectTexture(type: ObjectType): Texture {
  return getTexture(`obj_${type}`, 16, 16, OBJECT_SPRITES[type]);
}
