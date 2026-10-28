// ==========================================================================
// Graph Module - Linktree Mindmap
// ==========================================================================

import type { GraphNode, ViewState } from '../types';
import { layout } from '../config';

// -----------------------------------------------------------------------------
// Initial Layout (Tree)
// -----------------------------------------------------------------------------

export function computeInitialLayout(
  nodes: GraphNode[],
  centerX: number,
  centerY: number
): void {
  const root = nodes.find((n) => n.depth === 0);
  if (!root) return;

  // Position root at center
  root.x = root.targetX = centerX;
  root.y = root.targetY = centerY;

  // Use generous spacing - will zoom out to fit
  const optimalSpacing = 180;

  // Layout all nodes in an expanded radial tree
  layoutRadialTree(root, centerX, centerY, 0, Math.PI * 2, 0, optimalSpacing);
}

// Calculate zoom level needed to fit all nodes on screen
export function calculateFitZoom(
  nodes: GraphNode[],
  screenWidth: number,
  screenHeight: number
): number {
  if (nodes.length === 0) return 1;

  // Find bounding box of all nodes
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach(node => {
    const r = node.radius + 30; // Include radius + label space
    minX = Math.min(minX, node.targetX - r);
    maxX = Math.max(maxX, node.targetX + r);
    minY = Math.min(minY, node.targetY - r);
    maxY = Math.max(maxY, node.targetY + r);
  });

  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;

  // Available screen space (with padding)
  const availableWidth = screenWidth * 0.9;
  const availableHeight = screenHeight * 0.9;

  // Calculate scale to fit everything
  const scaleX = availableWidth / graphWidth;
  const scaleY = availableHeight / graphHeight;
  const fitScale = Math.min(scaleX, scaleY, 1); // Don't zoom in past 1

  return Math.max(fitScale, layout.minZoom);
}

function layoutRadialTree(
  node: GraphNode,
  centerX: number,
  centerY: number,
  startAngle: number,
  angleRange: number,
  depth: number,
  spacing: number
): void {
  if (node.children.length === 0) return;

  // Calculate radius for this depth level using calculated spacing
  const radius = spacing * (depth + 1);

  // Distribute children evenly across the available angle range
  const childCount = node.children.length;
  const anglePerChild = angleRange / childCount;

  node.children.forEach((child, i) => {
    // Calculate angle for this child (centered in its slice)
    const childAngle = startAngle + anglePerChild * i + anglePerChild / 2;

    // Position child at this angle and radius from center (not parent!)
    child.x = child.targetX = centerX + Math.cos(childAngle) * radius;
    child.y = child.targetY = centerY + Math.sin(childAngle) * radius;

    // Recursively layout this child's subtree within its angular slice
    layoutRadialTree(
      child,
      centerX,
      centerY,
      startAngle + anglePerChild * i,
      anglePerChild,
      depth + 1,
      spacing
    );
  });
}

// -----------------------------------------------------------------------------
// View State Management
// -----------------------------------------------------------------------------

export function createViewState(): ViewState {
  return {
    x: 0,
    y: 0,
    scale: layout.defaultZoom,
    targetX: 0,
    targetY: 0,
    targetScale: layout.defaultZoom,
  };
}

export function updateViewState(view: ViewState): void {
  // Smooth interpolation toward target
  view.x += (view.targetX - view.x) * layout.panEasing;
  view.y += (view.targetY - view.y) * layout.panEasing;
  view.scale += (view.targetScale - view.scale) * layout.panEasing;

  // Clamp scale
  view.scale = Math.max(layout.minZoom, Math.min(layout.maxZoom, view.scale));
  view.targetScale = Math.max(layout.minZoom, Math.min(layout.maxZoom, view.targetScale));
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  view: ViewState,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  return {
    x: (screenX - centerX - view.x) / view.scale + centerX,
    y: (screenY - centerY - view.y) / view.scale + centerY,
  };
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  view: ViewState,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  return {
    x: (worldX - centerX) * view.scale + centerX + view.x,
    y: (worldY - centerY) * view.scale + centerY + view.y,
  };
}

// -----------------------------------------------------------------------------
// Focus on Node
// -----------------------------------------------------------------------------

export function focusOnNode(
  node: GraphNode,
  view: ViewState,
  canvasWidth: number,
  canvasHeight: number
): void {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Pan to center the node
  view.targetX = centerX - node.x;
  view.targetY = centerY - node.y;

  // Zoom in slightly
  view.targetScale = Math.min(1.5, layout.maxZoom);
}

// Store the initial fit zoom for reset
let initialFitZoom = 1;

export function setInitialFitZoom(zoom: number): void {
  initialFitZoom = zoom;
}

export function resetView(view: ViewState): void {
  view.targetX = 0;
  view.targetY = 0;
  view.targetScale = initialFitZoom;
}

// -----------------------------------------------------------------------------
// Zoom Controls
// -----------------------------------------------------------------------------

export function zoomIn(view: ViewState): void {
  view.targetScale = Math.min(view.targetScale * 1.3, layout.maxZoom);
}

export function zoomOut(view: ViewState): void {
  view.targetScale = Math.max(view.targetScale / 1.3, layout.minZoom);
}

export function zoomAtPoint(
  view: ViewState,
  screenX: number,
  screenY: number,
  delta: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  const oldScale = view.targetScale;
  const newScale = Math.max(
    layout.minZoom,
    Math.min(layout.maxZoom, oldScale * (1 - delta * 0.001))
  );

  // Zoom toward mouse position
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const mouseX = screenX - centerX;
  const mouseY = screenY - centerY;

  const scaleDiff = newScale - oldScale;
  view.targetX -= (mouseX - view.targetX) * (scaleDiff / oldScale);
  view.targetY -= (mouseY - view.targetY) * (scaleDiff / oldScale);
  view.targetScale = newScale;
}
