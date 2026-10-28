// ==========================================================================
// Renderer - PixiJS v8 GPU-accelerated pipeline
// ==========================================================================

import { Application, Container, Sprite, Graphics, RenderTexture, Texture } from 'pixi.js';
import { TILE_SIZE } from '../config';
import type { Zone, GameState } from '../types';
import { TileType } from '../types';
import { getTileTexture } from '../sprites/tiles';
import { getCharacterTexture } from '../sprites/character';
import { getObjectTexture } from '../sprites/objects';
import { getDecorationTexture, getAnimatedDecorationTextures, ANIMATED_DECORATIONS } from '../sprites/decorations';
import { renderTextToTexture } from '../sprites/font';
import { get25DFactor } from './camera';

let app: Application;
let staticContainer: Container;
let dynamicContainer: Container;
let staticSprite: Sprite;
let staticTexture: RenderTexture | null = null;
let cachedZoneId = '';

// Dynamic entity references (rebuilt per zone)
let objectSprites: Map<string, Sprite> = new Map();
let objectGlows: Map<string, Graphics> = new Map();
let objectLabels: Map<string, { sprite: Sprite; nearbyTex: Texture; farTex: Texture }> = new Map();
let animalEntries: Array<{ sprite: Sprite; textures: Texture[]; height: number }> = [];
let playerSprite: Sprite;

/** Initialize PixiJS Application. */
export async function initRenderer(): Promise<Application> {
  app = new Application();
  await app.init({
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: false,
    roundPixels: true,
    resolution: 1,
    autoDensity: true,
  });
  app.ticker.stop();

  // Set canvas id for SCSS targeting
  const canvas = app.canvas as HTMLCanvasElement;
  canvas.id = 'pixi-canvas';

  // Container hierarchy
  staticContainer = new Container();
  dynamicContainer = new Container();
  dynamicContainer.sortableChildren = true;

  staticSprite = new Sprite();
  staticContainer.addChild(staticSprite);

  app.stage.addChild(staticContainer);
  app.stage.addChild(dynamicContainer);

  // Player sprite (created once, texture updated per frame)
  playerSprite = new Sprite();
  playerSprite.anchor.set(0.5, 1.0);
  dynamicContainer.addChild(playerSprite);

  return app;
}

/** Rebuild the static zone cache (called on zone change). */
export function cacheStaticLayer(zone: Zone): void {
  if (cachedZoneId === zone.id) return;
  cachedZoneId = zone.id;

  const w = zone.width * TILE_SIZE;
  const h = zone.height * TILE_SIZE;

  // Destroy old render texture
  if (staticTexture) {
    staticTexture.destroy(true);
  }

  // Create temporary container to render into RenderTexture
  const tempContainer = new Container();

  // Draw tiles
  for (let row = 0; row < zone.height; row++) {
    for (let col = 0; col < zone.width; col++) {
      const tile = zone.tiles[row][col];
      const tileSprite = new Sprite(getTileTexture(tile));
      tileSprite.x = col * TILE_SIZE;
      tileSprite.y = row * TILE_SIZE;
      tempContainer.addChild(tileSprite);

      // Draw door glow indicator
      if (tile === TileType.Door) {
        const glow = new Graphics();
        glow.rect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        glow.fill({ color: 0x60a5fa, alpha: 0.3 });
        tempContainer.addChild(glow);
      }
    }
  }

  // Draw static decorations
  for (const dec of zone.decorations) {
    if (ANIMATED_DECORATIONS.has(dec.type as string)) continue;
    const decSprite = new Sprite(getDecorationTexture(dec.type));
    decSprite.x = dec.x * TILE_SIZE;
    decSprite.y = dec.y * TILE_SIZE;
    tempContainer.addChild(decSprite);
  }

  // Render to RenderTexture
  staticTexture = RenderTexture.create({ width: w, height: h, scaleMode: 'nearest' });
  app.renderer.render({ container: tempContainer, target: staticTexture });

  // Update static sprite
  staticSprite.texture = staticTexture;
  staticSprite.x = 0;
  staticSprite.y = 0;

  // Cleanup temporary container
  tempContainer.destroy({ children: true });
}

/** Populate dynamic container with object sprites, animated decorations, labels, glow. */
export function rebuildDynamicEntities(zone: Zone): void {
  // Clear previous dynamic entities (except player sprite)
  for (const s of objectSprites.values()) s.destroy();
  for (const g of objectGlows.values()) g.destroy();
  for (const l of objectLabels.values()) l.sprite.destroy();
  for (const a of animalEntries) a.sprite.destroy();
  objectSprites.clear();
  objectGlows.clear();
  objectLabels.clear();
  animalEntries = [];

  // Ensure player is still in the container
  if (!playerSprite.parent) {
    dynamicContainer.addChild(playerSprite);
  }

  // Objects
  for (const obj of zone.objects) {
    const px = obj.x * TILE_SIZE;
    const py = obj.y * TILE_SIZE;

    // Glow (hidden by default) — stays on ground plane, no counter-scale
    const glow = new Graphics();
    glow.rect(-1, -1, TILE_SIZE + 2, TILE_SIZE + 2);
    glow.fill({ color: 0xffdd57, alpha: 0.4 });
    glow.x = px;
    glow.y = py;
    glow.visible = false;
    glow.zIndex = py;
    dynamicContainer.addChild(glow);
    objectGlows.set(obj.id, glow);

    // Object sprite — anchor center-bottom for counter-scaling
    const sprite = new Sprite(getObjectTexture(obj.type));
    sprite.anchor.set(0.5, 1.0);
    sprite.x = px + TILE_SIZE / 2;
    sprite.y = py + TILE_SIZE;
    sprite.zIndex = py;
    dynamicContainer.addChild(sprite);
    objectSprites.set(obj.id, sprite);

    // Pre-cache label textures (nearby + far variants)
    const nearbyTex = renderTextToTexture(obj.label, '#ffdd57');
    const farTex = renderTextToTexture(obj.label, '#aaaaaa');
    const labelSprite = new Sprite(farTex);
    labelSprite.anchor.set(0.5, 1.0);
    labelSprite.x = px + TILE_SIZE / 2;
    labelSprite.y = py;
    labelSprite.zIndex = py;
    dynamicContainer.addChild(labelSprite);
    objectLabels.set(obj.id, { sprite: labelSprite, nearbyTex, farTex });
  }

  // Animated decorations (animals + portals) — use regular Sprites with manual frame swap
  for (const dec of zone.decorations) {
    if (!ANIMATED_DECORATIONS.has(dec.type as string)) continue;
    const textures = getAnimatedDecorationTextures(dec.type);
    const sprite = new Sprite(textures[0]);
    const texH = textures[0].height;
    const texW = textures[0].width;
    sprite.anchor.set(0.5, 1.0);
    sprite.x = dec.x * TILE_SIZE + texW / 2;
    sprite.y = dec.y * TILE_SIZE + texH;
    sprite.zIndex = dec.y * TILE_SIZE;
    dynamicContainer.addChild(sprite);
    animalEntries.push({ sprite, textures, height: texH });
  }
}

/** Update dynamic entities each frame. */
export function renderDynamic(zone: Zone, gameState: GameState): void {
  const player = gameState.player;
  const counterScale = 1 / get25DFactor();

  // Update player sprite
  const frame = player.isMoving ? (player.animFrame % 2) + 1 : 0;
  playerSprite.texture = getCharacterTexture(player.direction, frame);
  playerSprite.x = player.x + TILE_SIZE / 2;
  playerSprite.y = player.y + TILE_SIZE;
  playerSprite.zIndex = player.y;
  playerSprite.scale.set(1, counterScale);

  // Update object glow visibility, label textures, and counter-scale
  const time = performance.now();
  for (const obj of zone.objects) {
    const isNearby = gameState.nearbyObject?.id === obj.id;

    // Glow — stays on ground plane, no counter-scale
    const glow = objectGlows.get(obj.id);
    if (glow) {
      glow.visible = isNearby;
      if (isNearby) {
        glow.alpha = 0.3 + 0.2 * Math.sin(time / 300);
      }
    }

    // Object sprite counter-scale
    const sprite = objectSprites.get(obj.id);
    if (sprite) {
      sprite.scale.set(1, counterScale);
    }

    // Label texture swap + counter-scale
    const label = objectLabels.get(obj.id);
    if (label) {
      label.sprite.texture = isNearby ? label.nearbyTex : label.farTex;
      label.sprite.scale.set(1, counterScale);
    }
  }

  // Animate animals/portals — swap texture + counter-scale
  const animFrame = Math.floor(time / 500) % 2;
  for (const entry of animalEntries) {
    entry.sprite.texture = entry.textures[animFrame % entry.textures.length];
    entry.sprite.scale.set(1, counterScale);
  }
}

/** Force rebuild static cache on next call. */
export function invalidateStaticCache(): void {
  cachedZoneId = '';
}

/** Get the PixiJS Application instance. */
export function getApp(): Application {
  return app;
}
