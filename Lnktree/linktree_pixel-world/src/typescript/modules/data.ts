// ==========================================================================
// Data - Parse GraphData into zone object assignments
// ==========================================================================

import type { GraphData, LinkData, WorldObject } from '../types';
import { ObjectType } from '../types';
import { NODE_TO_ZONE } from '../config';

/** Flatten a node's children leaf links into WorldObject[] */
export function getLinksForNode(data: GraphData, nodeId: string): { label: string; links: LinkData[] }[] {
  const node = data.nodes[nodeId];
  if (!node) return [];

  const results: { label: string; links: LinkData[] }[] = [];

  if (node.children) {
    for (const childId of node.children) {
      const child = data.nodes[childId];
      if (child?.links && child.links.length > 0) {
        results.push({ label: child.label, links: child.links });
      }
    }
  }

  return results;
}

// Map object types to node categories for visual variety
const OBJECT_TYPES_BY_ZONE: Record<string, ObjectType[]> = {
  'office':    [ObjectType.Desk, ObjectType.Computer, ObjectType.Mailbox, ObjectType.Bookshelf],
  'code-lab':  [ObjectType.Computer, ObjectType.Bookshelf, ObjectType.Computer],
  'nexus-hq':  [ObjectType.Desk, ObjectType.Computer, ObjectType.Bulletin],
  'house':     [ObjectType.TV, ObjectType.Globe, ObjectType.Bookshelf, ObjectType.Jukebox],
  'tech-hub':  [ObjectType.Computer, ObjectType.Desk, ObjectType.Computer],
  'cafe':      [ObjectType.Bulletin, ObjectType.Desk, ObjectType.Bookshelf],
  'arcade':    [ObjectType.Arcade, ObjectType.Jukebox, ObjectType.TV],
};

/** Build WorldObject[] for a zone from graph data. */
export function buildZoneObjects(
  zoneId: string,
  data: GraphData,
  positions: Array<{ x: number; y: number }>
): WorldObject[] {
  // Find the node ID for this zone
  let nodeId: string | null = null;
  for (const [nid, zid] of Object.entries(NODE_TO_ZONE)) {
    if (zid === zoneId) { nodeId = nid; break; }
  }
  if (!nodeId) return [];

  const linkGroups = getLinksForNode(data, nodeId);
  const objectTypes = OBJECT_TYPES_BY_ZONE[zoneId] || [ObjectType.Computer];
  const objects: WorldObject[] = [];

  for (let i = 0; i < linkGroups.length && i < positions.length; i++) {
    const group = linkGroups[i];
    const pos = positions[i];
    objects.push({
      id: `${zoneId}-obj-${i}`,
      type: objectTypes[i % objectTypes.length],
      x: pos.x,
      y: pos.y,
      label: group.label,
      links: group.links,
      nodeId: nodeId,
    });
  }

  return objects;
}
