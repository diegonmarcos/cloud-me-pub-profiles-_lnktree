// ==========================================================================
// Interaction Module - DOM-based Event Handling
// ==========================================================================

import type { GraphNode, ViewState, InteractionState } from '../types';
import { highlightPath } from './data';
import { resetView, zoomAtPoint } from './graph';
import { getNodeElement } from './renderer';

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------

let state: InteractionState = {
  hoveredNode: null,
  focusedNode: null,
  draggingNode: null,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  lastMouseX: 0,
  lastMouseY: 0,
};

let container: HTMLElement | null = null;
let nodes: GraphNode[] = [];
let edges: any[] = [];
let view: ViewState | null = null;

// Callbacks
let onNodeClick: ((node: GraphNode) => void) | null = null;
let onBackgroundClick: (() => void) | null = null;
let onRenderNeeded: (() => void) | null = null;

// Touch state
let lastTouchDist = 0;
let isTouchDragging = false;

export function setRenderCallback(callback: () => void): void {
  onRenderNeeded = callback;
}

function triggerRender(): void {
  if (onRenderNeeded) {
    onRenderNeeded();
  }
}

// -----------------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------------

export function initInteraction(
  containerElement: HTMLCanvasElement | HTMLElement,
  graphNodes: GraphNode[],
  graphEdges: any[],
  viewState: ViewState
): void {
  container = containerElement as HTMLElement;
  nodes = graphNodes;
  edges = graphEdges;
  view = viewState;

  // Attach event handlers to nodes
  nodes.forEach((node) => {
    const el = getNodeElement(node.id);
    if (!el) return;

    // Mouse click
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onNodeClick) onNodeClick(node);
    });

    // Mouse hover
    el.addEventListener('mouseenter', () => {
      state.hoveredNode = node;
      node.hovered = true;
      highlightPath(nodes, edges, node);
      triggerRender();
    });

    el.addEventListener('mouseleave', () => {
      node.hovered = false;
      state.hoveredNode = null;
      if (!state.focusedNode) {
        highlightPath(nodes, edges, null);
      }
      triggerRender();
    });
  });

  // Container events for pan/zoom
  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mouseup', onMouseUp);
  container.addEventListener('mouseleave', onMouseUp);
  container.addEventListener('wheel', onWheel, { passive: false });
  container.addEventListener('dblclick', onDoubleClick);

  // Background click
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === container || target.id === 'graph-world' || target.id === 'edges-svg' || target.tagName === 'svg' || target.tagName === 'path') {
      if (onBackgroundClick) onBackgroundClick();
    }
  });

  // Touch events
  container.addEventListener('touchstart', onTouchStart, { passive: false });
  container.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('touchend', onTouchEnd, { passive: false });
}

export function setCallbacks(
  nodeClick: (node: GraphNode) => void,
  backgroundClick: () => void
): void {
  onNodeClick = nodeClick;
  onBackgroundClick = backgroundClick;
}

export function updateInteractionData(
  graphNodes: GraphNode[],
  graphEdges: any[]
): void {
  nodes = graphNodes;
  edges = graphEdges;
}

// -----------------------------------------------------------------------------
// Mouse Handlers
// -----------------------------------------------------------------------------

function onMouseDown(e: MouseEvent): void {
  // Don't start pan if clicking on a node
  const target = e.target as HTMLElement;
  if (target.closest('.node')) return;

  state.isPanning = true;
  state.panStartX = e.clientX;
  state.panStartY = e.clientY;
  if (container) container.style.cursor = 'grabbing';
}

function onMouseMove(e: MouseEvent): void {
  if (!state.isPanning || !view) return;

  const dx = e.clientX - state.panStartX;
  const dy = e.clientY - state.panStartY;

  view.x += dx;
  view.y += dy;
  view.targetX = view.x;
  view.targetY = view.y;

  state.panStartX = e.clientX;
  state.panStartY = e.clientY;

  triggerRender();
}

function onMouseUp(): void {
  state.isPanning = false;
  if (container) container.style.cursor = 'grab';
}

function onWheel(e: WheelEvent): void {
  e.preventDefault();
  if (!view || !container) return;

  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  zoomAtPoint(view, x, y, e.deltaY, container.clientWidth, container.clientHeight);
  view.x = view.targetX;
  view.y = view.targetY;
  view.scale = view.targetScale;

  triggerRender();
}

function onDoubleClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  if (target.closest('.node')) return; // Let node handle it

  // Double-click on background: reset view
  if (view) {
    resetView(view);
    view.x = view.targetX;
    view.y = view.targetY;
    view.scale = view.targetScale;
    state.focusedNode = null;
    highlightPath(nodes, edges, null);
    triggerRender();
  }
}

// -----------------------------------------------------------------------------
// Touch Handlers
// -----------------------------------------------------------------------------

function onTouchStart(e: TouchEvent): void {
  const target = e.target as HTMLElement;

  // If touching a node, let it handle the tap
  if (target.closest('.node')) {
    // Handle node tap
    const nodeEl = target.closest('.node') as HTMLElement;
    const nodeId = nodeEl?.dataset.nodeId;
    const node = nodes.find(n => n.id === nodeId);
    if (node && onNodeClick) {
      e.preventDefault();
      onNodeClick(node);
    }
    return;
  }

  // If touching UI elements, let them handle it
  if (target.closest('#ui-overlay') && !target.closest('#graph-container')) {
    return;
  }

  e.preventDefault();

  if (e.touches.length === 1) {
    state.isPanning = true;
    state.panStartX = e.touches[0].clientX;
    state.panStartY = e.touches[0].clientY;
    isTouchDragging = false;
  } else if (e.touches.length === 2) {
    state.isPanning = false;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    lastTouchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }
}

function onTouchMove(e: TouchEvent): void {
  if (!view || !container) return;

  const target = e.target as HTMLElement;
  if (target.closest('#ui-overlay') && !target.closest('#graph-container')) {
    return;
  }

  e.preventDefault();
  isTouchDragging = true;

  if (e.touches.length === 1 && state.isPanning) {
    const touch = e.touches[0];
    const dx = touch.clientX - state.panStartX;
    const dy = touch.clientY - state.panStartY;

    view.x += dx;
    view.y += dy;
    view.targetX = view.x;
    view.targetY = view.y;

    state.panStartX = touch.clientX;
    state.panStartY = touch.clientY;

    triggerRender();
  } else if (e.touches.length === 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const centerX = (t1.clientX + t2.clientX) / 2;
    const centerY = (t1.clientY + t2.clientY) / 2;
    const rect = container.getBoundingClientRect();

    const delta = (lastTouchDist - dist) * 2;
    zoomAtPoint(view, centerX - rect.left, centerY - rect.top, delta, container.clientWidth, container.clientHeight);

    view.x = view.targetX;
    view.y = view.targetY;
    view.scale = view.targetScale;

    lastTouchDist = dist;
    triggerRender();
  }
}

function onTouchEnd(e: TouchEvent): void {
  const target = e.target as HTMLElement;

  // Tap on background (no drag)
  if (!isTouchDragging && e.changedTouches.length === 1) {
    if (!target.closest('.node') && !target.closest('#ui-overlay')) {
      if (onBackgroundClick) onBackgroundClick();
    }
  }

  state.isPanning = false;
  isTouchDragging = false;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export function getHoveredNode(): GraphNode | null {
  return state.hoveredNode;
}

export function getFocusedNode(): GraphNode | null {
  return state.focusedNode;
}

export function setFocusedNode(node: GraphNode | null): void {
  state.focusedNode = node;
  if (node) {
    highlightPath(nodes, edges, node);
  }
}

export function clearFocus(): void {
  state.focusedNode = null;
  highlightPath(nodes, edges, null);
}

// -----------------------------------------------------------------------------
// Cleanup
// -----------------------------------------------------------------------------

export function destroyInteraction(): void {
  if (!container) return;

  container.removeEventListener('mousedown', onMouseDown);
  container.removeEventListener('mousemove', onMouseMove);
  container.removeEventListener('mouseup', onMouseUp);
  container.removeEventListener('mouseleave', onMouseUp);
  container.removeEventListener('wheel', onWheel);
  container.removeEventListener('dblclick', onDoubleClick);
  container.removeEventListener('touchstart', onTouchStart);
  container.removeEventListener('touchmove', onTouchMove);
  container.removeEventListener('touchend', onTouchEnd);
}
