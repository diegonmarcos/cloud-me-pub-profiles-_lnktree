// ==========================================================================
// Main Entry Point - Linktree Mindmap (PERFORMANCE OPTIMIZED)
// ==========================================================================

import type { GraphNode, GraphEdge, ViewState } from './types';
import { loadGraphData, buildGraph } from './modules/data';
import { initRenderer, render, getCanvasSize, createNodeElements, createEdgeElements } from './modules/renderer';
import { computeInitialLayout, createViewState, calculateFitZoom, setInitialFitZoom } from './modules/graph';
import {
  initInteraction,
  setCallbacks,
  setFocusedNode,
  clearFocus,
  setRenderCallback,
} from './modules/interaction';
import {
  initUI,
  showLoading,
  hideLoading,
  setOnBack,
  setNodes,
  setOnNodeSelect,
  setRenderCallback as setUIRenderCallback,
  updateCanvasSize,
  updateZoomIndicator,
  updateMinimap,
  updateBreadcrumb,
  focusOnNodeWithUI,
  setCurrentNode,
} from './modules/ui';
// WebGL GPU-accelerated particle system for stars
import { initParticles, updateParticles, renderParticles, destroyParticles } from './modules/particles';

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------

let nodes: GraphNode[] = [];
let edges: GraphEdge[] = [];
let view: ViewState;
let expansionFrameId: number | null = null;
let starsAnimationId: number | null = null;
let lastStarsTime = 0;

// DOM elements
let graphContainer: HTMLElement | null = null;

// -----------------------------------------------------------------------------
// Initialize Application
// -----------------------------------------------------------------------------

async function init(): Promise<void> {
  try {
    showLoading();

    // Get graph container element
    graphContainer = document.getElementById('graph-container');
    if (!graphContainer) {
      throw new Error('Graph container element not found');
    }

    // Initialize WebGL stars (GPU-accelerated)
    const starsCanvas = document.getElementById('stars-canvas') as HTMLCanvasElement;
    if (starsCanvas) {
      initParticles(starsCanvas);
      startStarsAnimation();
    }

    // Initialize renderer (DOM-based)
    initRenderer(graphContainer);

    // Load graph data
    const data = await loadGraphData();
    const graph = buildGraph(data);
    nodes = graph.nodes;
    edges = graph.edges;

    // Create view state
    view = createViewState();

    // Compute initial layout (sets target positions)
    const { width, height } = getCanvasSize();
    computeInitialLayout(nodes, width / 2, height / 2);

    // Calculate zoom to fit all nodes on screen
    const fitZoom = calculateFitZoom(nodes, width, height);
    setInitialFitZoom(fitZoom);
    view.scale = fitZoom;
    view.targetScale = fitZoom;

    // Create DOM elements for nodes and edges
    createNodeElements(nodes);
    createEdgeElements(edges);

    // Start all nodes at center (collapsed state)
    const centerX = width / 2;
    const centerY = height / 2;
    nodes.forEach((node) => {
      node.x = centerX;
      node.y = centerY;
    });

    // Initialize interaction (event-driven updates)
    initInteraction(graphContainer as unknown as HTMLCanvasElement, nodes, edges, view);
    setCallbacks(handleNodeClick, handleBackgroundClick);
    setRenderCallback(() => {
      render(nodes, edges, view);
      updateMinimap(nodes, edges);
      updateZoomIndicator();
    });

    // Initialize UI
    initUI(view, width, height);
    setNodes(nodes);
    setOnBack(handleBackToFullView);
    setOnNodeSelect(handleNodeSelect);
    setUIRenderCallback(() => {
      render(nodes, edges, view);
      updateMinimap(nodes, edges);
    });

    hideLoading();

    // Run expansion animation ONCE, then stop
    runExpansionAnimation();

  } catch (error) {
    console.error('Failed to initialize:', error);
    hideLoading();
    alert('Failed to load mindmap data. Please refresh the page.');
  }
}

// -----------------------------------------------------------------------------
// WebGL Stars Animation (runs continuously but efficiently on GPU)
// -----------------------------------------------------------------------------

function startStarsAnimation(): void {
  lastStarsTime = performance.now();

  function animateStars(time: number): void {
    const deltaTime = time - lastStarsTime;
    lastStarsTime = time;

    updateParticles(deltaTime);
    renderParticles();

    starsAnimationId = requestAnimationFrame(animateStars);
  }

  starsAnimationId = requestAnimationFrame(animateStars);
}

// -----------------------------------------------------------------------------
// Expansion Animation (runs once, then stops)
// -----------------------------------------------------------------------------

function runExpansionAnimation(): void {
  const startTime = performance.now();
  const duration = 2000; // 2 seconds
  const { width, height } = getCanvasSize();
  const centerX = width / 2;
  const centerY = height / 2;

  function animateExpansion(time: number): void {
    const elapsed = time - startTime;
    const progress = Math.min(1, elapsed / duration);

    // Easing function (ease-out cubic)
    const eased = 1 - Math.pow(1 - progress, 3);

    // Interpolate nodes from center to target positions
    nodes.forEach((node) => {
      node.x = centerX + (node.targetX - centerX) * eased;
      node.y = centerY + (node.targetY - centerY) * eased;
    });

    // Render current state
    render(nodes, edges, view);

    if (progress < 1) {
      expansionFrameId = requestAnimationFrame(animateExpansion);
    } else {
      // Expansion complete
      expansionFrameId = null;

      // Final render with nodes at target positions
      nodes.forEach((node) => {
        node.x = node.targetX;
        node.y = node.targetY;
      });
      render(nodes, edges, view);
    }
  }

  expansionFrameId = requestAnimationFrame(animateExpansion);
}

// -----------------------------------------------------------------------------
// Event Handlers
// -----------------------------------------------------------------------------

function handleNodeClick(node: GraphNode): void {
  setFocusedNode(node);
  setCurrentNode(node);
  updateBreadcrumb(node);

  // If leaf node with exactly 1 link, open it directly
  if (node.links.length === 1 && node.children.length === 0) {
    const link = node.links[0];
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }
  // No popup panel - just highlight the node

  render(nodes, edges, view);
  updateMinimap(nodes, edges);
}

function handleNodeSelect(node: GraphNode): void {
  setFocusedNode(node);
  focusOnNodeWithUI(node);
  render(nodes, edges, view);
  updateMinimap(nodes, edges);
}

function handleBackgroundClick(): void {
  clearFocus();
  updateBreadcrumb(null);
  render(nodes, edges, view);
  updateMinimap(nodes, edges);
}

function handleBackToFullView(): void {
  clearFocus();
  updateBreadcrumb(null);
  render(nodes, edges, view);
  updateMinimap(nodes, edges);
}

// -----------------------------------------------------------------------------
// Resize Handler
// -----------------------------------------------------------------------------

function handleResize(): void {
  const { width, height } = getCanvasSize();
  updateCanvasSize(width, height);
  render(nodes, edges, view);
}

window.addEventListener('resize', handleResize);

// -----------------------------------------------------------------------------
// Cleanup
// -----------------------------------------------------------------------------

function cleanup(): void {
  if (expansionFrameId !== null) {
    cancelAnimationFrame(expansionFrameId);
  }
  if (starsAnimationId !== null) {
    cancelAnimationFrame(starsAnimationId);
  }
  destroyParticles();
  window.removeEventListener('resize', handleResize);
}

window.addEventListener('beforeunload', cleanup);

// -----------------------------------------------------------------------------
// Prevent Overscroll/Pull-to-Refresh (Mobile)
// -----------------------------------------------------------------------------

// Block document-level touchmove to prevent gray overscroll area
document.addEventListener('touchmove', (e: TouchEvent) => {
  // Allow touchmove only on elements that need scrolling (none in this app)
  if (e.target === document.body || e.target === document.documentElement) {
    e.preventDefault();
  }
}, { passive: false });

// Block scroll events on document
document.addEventListener('scroll', (e: Event) => {
  e.preventDefault();
  window.scrollTo(0, 0);
}, { passive: false });

// Ensure window never scrolls
window.addEventListener('scroll', () => {
  window.scrollTo(0, 0);
});

// -----------------------------------------------------------------------------
// Start Application
// -----------------------------------------------------------------------------

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
