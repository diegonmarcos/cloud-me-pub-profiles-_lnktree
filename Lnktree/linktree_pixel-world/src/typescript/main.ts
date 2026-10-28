// ==========================================================================
// Main - Entry point, game loop, zone transitions
// ==========================================================================

import { TILE_SIZE, ZONE_IDS, WORLD_ZONES, ZONE_TRANSITION_MS } from './config';
import type { GameState, Zone, DoorExit } from './types';
import { Direction } from './types';
import { GRAPH_DATA } from './data-embedded';

// Modules
import { initBackground, resizeBackground, renderBackground, stopBackgroundLoop } from './modules/background';
import { initCamera, setCameraTarget, snapCamera, updateCamera, resizeCamera, toggle25D, is25DMode } from './modules/camera';
import { initRenderer, cacheStaticLayer, rebuildDynamicEntities, renderDynamic, invalidateStaticCache, getApp } from './modules/renderer';
import { initPlayer, getPlayerState, movePlayer, updatePlayer, processQueue, teleportPlayer } from './modules/player';
import { initInput, destroyInput, isTouchDevice, InputAction } from './modules/input';
import { initInteraction, updateInteraction, dismissCurrentDialog } from './modules/interaction';
import { initUI, showZoneLabel, showDpad, hideLoading, updateWorldTitle, update25DButton } from './modules/ui';
import { initDialog, isDialogOpen, dialogUp, dialogDown, dialogConfirm } from './modules/dialog';
import { buildWorld, getZone } from './modules/world';
import { initMinimap, cacheMinimap, renderMinimap, invalidateMinimap } from './modules/minimap';

// ── State ──────────────────────────────────────────────────
let zones: Map<string, Zone>;
let currentZone: Zone;
let gameState: GameState;
let running = false;
let lastTime = 0;
let transitionOverlay: HTMLElement;

/** Check if a zone ID is an overworld. */
function isOverworld(zoneId: string): boolean {
  return zoneId === ZONE_IDS.overworldPro || zoneId === ZONE_IDS.overworldPersonal;
}

/** Get the world title and theme for a zone. */
function getWorldInfo(zoneId: string): { title: string; theme: 'winter' | 'summer' | 'neutral' } {
  // Professional world (winter) zones
  if (zoneId === ZONE_IDS.overworldPro || zoneId === ZONE_IDS.office ||
      zoneId === ZONE_IDS.codeLab || zoneId === ZONE_IDS.nexusHQ) {
    return { title: 'Professional World', theme: 'winter' };
  }
  // Personal world (summer) zones
  return { title: 'Personal World', theme: 'summer' };
}

// ── Init ───────────────────────────────────────────────────
async function init(): Promise<void> {
  // DOM elements
  const bgCanvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
  transitionOverlay = document.getElementById('zone-transition') as HTMLElement;

  // Build world from embedded data
  zones = buildWorld(GRAPH_DATA);
  currentZone = zones.get(ZONE_IDS.overworldPro)!;

  // Init player at overworld start
  const player = initPlayer(currentZone.playerStart.x, currentZone.playerStart.y);

  // Game state
  gameState = {
    currentZone: ZONE_IDS.overworldPro,
    player,
    nearbyObject: null,
    isTransitioning: false,
    showTooltip: false,
    isMobile: isTouchDevice(),
  };

  // Init modules
  initBackground(bgCanvas);

  // PixiJS init (async)
  const app = await initRenderer();
  bgCanvas.after(app.canvas as HTMLCanvasElement);
  initCamera(app);

  initInteraction();
  initUI();
  initDialog();
  initMinimap();

  // Cache static layer + dynamic entities + minimap for starting zone
  cacheStaticLayer(currentZone);
  rebuildDynamicEntities(currentZone);
  cacheMinimap(currentZone);

  // Snap camera to player
  const px = player.x + TILE_SIZE / 2;
  const py = player.y + TILE_SIZE / 2;
  snapCamera(px, py);

  // Input
  initInput(handleInput);

  // Mobile d-pad
  if (gameState.isMobile) {
    showDpad();
  }

  // 2.5D toggle button
  document.getElementById('btn-25d')!.addEventListener('click', () => {
    toggle25D();
    update25DButton(is25DMode());
  });

  // Resize handler
  window.addEventListener('resize', onResize);

  // Prevent mobile overscroll
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  // Hide loading, show zone label + world title
  hideLoading();
  showZoneLabel(currentZone.name);
  const info = getWorldInfo(gameState.currentZone);
  updateWorldTitle(info.title, info.theme);

  // Start game loop
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// ── Input Handler ──────────────────────────────────────────
function handleInput(action: InputAction): void {
  if (gameState.isTransitioning) return;

  // 2.5D toggle — always available
  if (action === InputAction.Toggle25D) {
    toggle25D();
    update25DButton(is25DMode());
    return;
  }

  // When dialog is open: Up/Down navigate links, Enter opens, Esc dismisses
  // Left/Right still move the player (dialog auto-hides on walk away)
  if (isDialogOpen()) {
    switch (action) {
      case InputAction.MoveUp:    dialogUp(); return;
      case InputAction.MoveDown:  dialogDown(); return;
      case InputAction.Interact:  dialogConfirm(); return;
      case InputAction.Back:      dismissCurrentDialog(); return;
      case InputAction.MoveLeft:
      case InputAction.MoveRight: {
        const dir = actionToDirection(action);
        const doorExit = movePlayer(dir, currentZone);
        if (doorExit) {
          transitionToZone(doorExit);
        }
        return;
      }
    }
    return;
  }

  switch (action) {
    case InputAction.MoveUp:
    case InputAction.MoveDown:
    case InputAction.MoveLeft:
    case InputAction.MoveRight: {
      const dir = actionToDirection(action);
      const doorExit = movePlayer(dir, currentZone);
      if (doorExit) {
        transitionToZone(doorExit);
      }
      break;
    }
    case InputAction.Interact:
      // Dialog auto-shows on proximity; Enter is handled above when dialog is open
      break;
    case InputAction.Back: {
      const zoneId = gameState.currentZone;
      if (isOverworld(zoneId)) {
        // Already at top level — do nothing
        break;
      }
      // In a building — go to parent overworld
      const parentOverworld = WORLD_ZONES[zoneId];
      if (parentOverworld) {
        // Find a door leading back to the parent overworld
        for (const [_key, door] of currentZone.doors) {
          if (door.targetZone === parentOverworld) {
            transitionToZone(door);
            break;
          }
        }
      }
      break;
    }
  }
}

function actionToDirection(action: InputAction): Direction {
  switch (action) {
    case InputAction.MoveUp: return Direction.Up;
    case InputAction.MoveDown: return Direction.Down;
    case InputAction.MoveLeft: return Direction.Left;
    case InputAction.MoveRight: return Direction.Right;
    default: return Direction.Down;
  }
}

// ── Zone Transition ────────────────────────────────────────
function transitionToZone(exit: DoorExit): void {
  if (gameState.isTransitioning) return;
  gameState.isTransitioning = true;

  // Fade to black
  transitionOverlay.classList.add('active');

  setTimeout(() => {
    // Switch zone
    const newZone = getZone(zones, exit.targetZone);
    if (!newZone) {
      gameState.isTransitioning = false;
      transitionOverlay.classList.remove('active');
      return;
    }

    currentZone = newZone;
    gameState.currentZone = exit.targetZone;
    gameState.nearbyObject = null;

    // Teleport player
    teleportPlayer(exit.targetX, exit.targetY, Direction.Down);
    const player = getPlayerState();

    // Rebuild static cache + dynamic entities + minimap
    invalidateStaticCache();
    cacheStaticLayer(currentZone);
    rebuildDynamicEntities(currentZone);
    invalidateMinimap();
    cacheMinimap(currentZone);

    // Snap camera
    snapCamera(player.x + TILE_SIZE / 2, player.y + TILE_SIZE / 2);

    // Show zone label + update world title
    showZoneLabel(currentZone.name);
    const worldInfo = getWorldInfo(exit.targetZone);
    updateWorldTitle(worldInfo.title, worldInfo.theme);

    // Fade in
    setTimeout(() => {
      transitionOverlay.classList.remove('active');
      gameState.isTransitioning = false;
    }, 100);
  }, ZONE_TRANSITION_MS);
}

// ── Game Loop ──────────────────────────────────────────────
function gameLoop(time: number): void {
  if (!running) return;

  const dt = time - lastTime;
  lastTime = time;

  // Update
  update(dt);

  // Render
  render();

  requestAnimationFrame(gameLoop);
}

function update(dt: number): void {
  if (gameState.isTransitioning) return;

  // Update player movement
  updatePlayer(dt);
  const player = getPlayerState();

  // Process queued movement
  const doorExit = processQueue(currentZone);
  if (doorExit) {
    transitionToZone(doorExit);
    return;
  }

  // Update camera target
  setCameraTarget(player.x + TILE_SIZE / 2, player.y + TILE_SIZE / 2);
  updateCamera();

  // Update interactions (proximity detection, tooltip)
  // Sync player state into gameState
  gameState.player = player;
  updateInteraction(gameState, currentZone);
}

function render(): void {
  // Background (WebGL starfield)
  renderBackground();

  // Dynamic entities (player, objects with glow)
  renderDynamic(currentZone, gameState);

  // Minimap overlay
  renderMinimap(gameState.player);

  // Flush PixiJS draw calls to GPU
  getApp().render();
}

// ── Resize ─────────────────────────────────────────────────
function onResize(): void {
  const bgCanvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
  resizeBackground(bgCanvas);
  resizeCamera();
}

// ── Cleanup ────────────────────────────────────────────────
function cleanup(): void {
  running = false;
  stopBackgroundLoop();
  destroyInput();
  window.removeEventListener('resize', onResize);
}

// ── Bootstrap ──────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { void init(); });
} else {
  void init();
}

// Expose cleanup for HMR / SPA navigation
(window as unknown as Record<string, unknown>).__pixelWorldCleanup = cleanup;
