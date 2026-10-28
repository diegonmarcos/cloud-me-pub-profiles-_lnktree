// ==========================================================================
// Interaction - Proximity detection, auto-show dialog on approach
// ==========================================================================

import { INTERACTION_DISTANCE } from '../config';
import type { Zone, WorldObject, PlayerState, GameState } from '../types';
import { tileDistance } from '../utils/math';
import { showDialog, hideDialog, isDialogOpen, getDismissedId } from './dialog';

let dismissedForId: string | null = null;

export function initInteraction(): void {
  // No DOM elements needed — dialog handles its own DOM
}

/** Find the closest interactive object within range (with links). */
export function findNearbyObject(player: PlayerState, zone: Zone): WorldObject | null {
  let closest: WorldObject | null = null;
  let closestDist = Infinity;

  for (const obj of zone.objects) {
    if (!obj.links || obj.links.length === 0) continue;
    const dist = tileDistance(player.tileX, player.tileY, obj.x, obj.y);
    if (dist <= INTERACTION_DISTANCE && dist < closestDist) {
      closest = obj;
      closestDist = dist;
    }
  }

  return closest;
}

/** Update interaction state for current frame. */
export function updateInteraction(gameState: GameState, zone: Zone): void {
  const nearby = findNearbyObject(gameState.player, zone);

  if (nearby !== gameState.nearbyObject) {
    // Object changed — clear dismissed state if we moved to a different object
    if (!nearby || nearby.id !== dismissedForId) {
      dismissedForId = null;
    }
    gameState.nearbyObject = nearby;
  }

  if (nearby && nearby.id !== dismissedForId) {
    if (!isDialogOpen()) {
      showDialog(nearby);
    }
  } else if (!nearby && isDialogOpen()) {
    hideDialog();
  }
}

/** Mark the current object's dialog as dismissed (user pressed Esc). */
export function dismissCurrentDialog(): void {
  dismissedForId = getDismissedId();
  hideDialog();
}
