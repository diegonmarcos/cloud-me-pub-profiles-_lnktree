// ==========================================================================
// UI Module - Linktree Mindmap (Enhanced UX)
// ==========================================================================

import type { GraphNode, ViewState } from '../types';
import { zoomIn, zoomOut, resetView, focusOnNode } from './graph';

// -----------------------------------------------------------------------------
// DOM Elements
// -----------------------------------------------------------------------------

let btnBack: HTMLElement | null = null;
let btnHome: HTMLElement | null = null;
let btnReset: HTMLElement | null = null;
let btnZoomIn: HTMLElement | null = null;
let btnZoomOut: HTMLElement | null = null;
let btnFullscreen: HTMLElement | null = null;
let zoomIndicator: HTMLElement | null = null;
let loading: HTMLElement | null = null;
let searchContainer: HTMLElement | null = null;
let searchInput: HTMLInputElement | null = null;
let searchResults: HTMLElement | null = null;
let breadcrumb: HTMLElement | null = null;
let breadcrumbNav: HTMLElement | null = null;
let minimapCanvas: HTMLCanvasElement | null = null;
let minimapViewport: HTMLElement | null = null;
let keyboardHints: HTMLElement | null = null;
let hintsClose: HTMLElement | null = null;

let view: ViewState | null = null;
let canvasWidth = 0;
let canvasHeight = 0;
let allNodes: GraphNode[] = [];
let currentNode: GraphNode | null = null;

// Callbacks
let onBack: (() => void) | null = null;
let onNodeSelect: ((node: GraphNode) => void) | null = null;
let onRenderNeeded: (() => void) | null = null;

// -----------------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------------

export function initUI(
  viewState: ViewState,
  width: number,
  height: number
): void {
  view = viewState;
  canvasWidth = width;
  canvasHeight = height;

  // Get elements
  btnBack = document.getElementById('btn-back');
  btnHome = document.getElementById('btn-home');
  btnReset = document.getElementById('btn-reset');
  btnZoomIn = document.getElementById('btn-zoom-in');
  btnZoomOut = document.getElementById('btn-zoom-out');
  btnFullscreen = document.getElementById('btn-fullscreen');
  zoomIndicator = document.getElementById('zoom-indicator');
  loading = document.getElementById('loading');
  searchContainer = document.getElementById('search-container');
  searchInput = document.getElementById('search-input') as HTMLInputElement;
  searchResults = document.getElementById('search-results');
  breadcrumb = document.getElementById('breadcrumb');
  breadcrumbNav = document.getElementById('breadcrumb-nav');
  minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
  minimapViewport = document.getElementById('minimap-viewport');
  keyboardHints = document.getElementById('keyboard-hints');
  hintsClose = document.getElementById('hints-close');

  // Bind events
  btnReset?.addEventListener('click', handleReset);
  btnHome?.addEventListener('click', handleReset);
  btnZoomIn?.addEventListener('click', handleZoomIn);
  btnZoomOut?.addEventListener('click', handleZoomOut);
  btnFullscreen?.addEventListener('click', handleFullscreen);
  btnBack?.addEventListener('click', handleBack);
  hintsClose?.addEventListener('click', hideKeyboardHints);

  // Search events
  searchInput?.addEventListener('input', handleSearchInput);
  searchInput?.addEventListener('focus', () => searchContainer?.classList.add('focused'));
  searchInput?.addEventListener('blur', () => {
    setTimeout(() => {
      searchContainer?.classList.remove('focused');
      if (searchResults) searchResults.hidden = true;
    }, 200);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeydown);

  // Initial zoom indicator
  updateZoomIndicator();
}

export function setNodes(nodes: GraphNode[]): void {
  allNodes = nodes;
}

export function setOnBack(callback: () => void): void {
  onBack = callback;
}

export function setOnNodeSelect(callback: (node: GraphNode) => void): void {
  onNodeSelect = callback;
}

export function setRenderCallback(callback: () => void): void {
  onRenderNeeded = callback;
}

export function updateCanvasSize(width: number, height: number): void {
  canvasWidth = width;
  canvasHeight = height;
}

// -----------------------------------------------------------------------------
// Loading
// -----------------------------------------------------------------------------

export function showLoading(): void {
  if (loading) loading.hidden = false;
}

export function hideLoading(): void {
  if (loading) loading.hidden = true;
}

// -----------------------------------------------------------------------------
// Zoom Indicator
// -----------------------------------------------------------------------------

export function updateZoomIndicator(): void {
  if (zoomIndicator && view) {
    const percent = Math.round(view.scale * 100);
    zoomIndicator.textContent = `${percent}%`;
  }
}

// -----------------------------------------------------------------------------
// Breadcrumb
// -----------------------------------------------------------------------------

export function updateBreadcrumb(node: GraphNode | null): void {
  if (!breadcrumb || !breadcrumbNav) return;

  if (!node) {
    breadcrumb.hidden = true;
    return;
  }

  // Build path from root to node
  const path: GraphNode[] = [];
  let current: GraphNode | null = node;
  while (current) {
    path.unshift(current);
    current = current.parent;
  }

  // Create breadcrumb HTML
  breadcrumbNav.innerHTML = path
    .map((n, i) => {
      const isLast = i === path.length - 1;
      const label = n.label;
      if (isLast) {
        return `<span class="breadcrumb-current" style="color: ${n.color}">${label}</span>`;
      }
      return `<button class="breadcrumb-item" data-node-id="${n.id}" style="--accent: ${n.color}">${label}</button><span class="breadcrumb-sep">›</span>`;
    })
    .join('');

  // Add click handlers
  breadcrumbNav.querySelectorAll('.breadcrumb-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nodeId = (btn as HTMLElement).dataset.nodeId;
      const targetNode = allNodes.find((n) => n.id === nodeId);
      if (targetNode && onNodeSelect) {
        onNodeSelect(targetNode);
      }
    });
  });

  breadcrumb.hidden = false;
}

// -----------------------------------------------------------------------------
// Search
// -----------------------------------------------------------------------------

function handleSearchInput(): void {
  if (!searchInput || !searchResults) return;

  const query = searchInput.value.toLowerCase().trim();

  if (query.length < 2) {
    searchResults.hidden = true;
    return;
  }

  // Find matching nodes
  const matches = allNodes.filter(
    (n) =>
      n.label.toLowerCase().includes(query) ||
      (n.fullLabel && n.fullLabel.toLowerCase().includes(query))
  );

  if (matches.length === 0) {
    searchResults.innerHTML = '<div class="search-empty">No results found</div>';
    searchResults.hidden = false;
    return;
  }

  // Show results (max 8)
  searchResults.innerHTML = matches
    .slice(0, 8)
    .map(
      (node) => `
      <button class="search-result" data-node-id="${node.id}">
        <span class="search-result-dot" style="background: ${node.color}"></span>
        <span class="search-result-label">${node.fullLabel || node.label}</span>
        <span class="search-result-path">${getNodePath(node)}</span>
      </button>
    `
    )
    .join('');

  // Add click handlers
  searchResults.querySelectorAll('.search-result').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nodeId = (btn as HTMLElement).dataset.nodeId;
      const node = allNodes.find((n) => n.id === nodeId);
      if (node && onNodeSelect) {
        onNodeSelect(node);
        searchInput!.value = '';
        searchResults!.hidden = true;
        searchInput!.blur();
      }
    });
  });

  searchResults.hidden = false;
}

function getNodePath(node: GraphNode): string {
  const path: string[] = [];
  let current = node.parent;
  while (current) {
    path.unshift(current.label);
    current = current.parent;
  }
  return path.join(' › ');
}

// -----------------------------------------------------------------------------
// Minimap
// -----------------------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

export function updateMinimap(nodes: GraphNode[], edges: any[]): void {
  if (!minimapCanvas || !minimapViewport || !view) return;

  const ctx = minimapCanvas.getContext('2d');
  if (!ctx) return;

  const w = minimapCanvas.width;
  const h = minimapCanvas.height;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Find bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  nodes.forEach((n) => {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  });

  const padding = 20;
  const graphW = maxX - minX + padding * 2;
  const graphH = maxY - minY + padding * 2;
  const scale = Math.min(w / graphW, h / graphH);

  const offsetX = (w - graphW * scale) / 2 - minX * scale + padding * scale;
  const offsetY = (h - graphH * scale) / 2 - minY * scale + padding * scale;

  // Draw edges with highlighting (highlighted vs dimmed)
  const hasHighlights = edges.some(e => e.highlighted);

  edges.forEach((e) => {
    // Set color based on highlight state
    if (e.highlighted) {
      // Create gradient for highlighted edges
      const gradient = ctx.createLinearGradient(
        e.source.x * scale + offsetX,
        e.source.y * scale + offsetY,
        e.target.x * scale + offsetX,
        e.target.y * scale + offsetY
      );
      gradient.addColorStop(0, e.source.color);
      gradient.addColorStop(1, e.target.color);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.0;
    } else if (hasHighlights) {
      // Dim non-highlighted edges when something is selected
      ctx.strokeStyle = 'rgba(100,100,100,0.15)';
      ctx.lineWidth = 0.4;
    } else {
      // Default state - all edges normal
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.5;
    }

    ctx.beginPath();
    ctx.moveTo(e.source.x * scale + offsetX, e.source.y * scale + offsetY);
    ctx.lineTo(e.target.x * scale + offsetX, e.target.y * scale + offsetY);
    ctx.stroke();
  });

  // Draw nodes (with dimming matching main graph)
  const hasNodeHighlights = nodes.some(n => n.highlighted);

  nodes.forEach((n) => {
    const x = n.x * scale + offsetX;
    const y = n.y * scale + offsetY;
    const r = Math.max(2, n.radius * scale * 0.3);

    // Match main graph brightness behavior
    if (n.highlighted) {
      // Highlighted nodes: bright with glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = n.color;
      ctx.fillStyle = n.color;
    } else if (hasNodeHighlights) {
      // When something is selected, dim non-highlighted nodes to gray
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    } else {
      // Default state: all nodes shown with their colors
      ctx.shadowBlur = 0;
      const rgb = hexToRgb(n.color);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Update viewport indicator
  const vpW = (canvasWidth / view.scale) * scale;
  const vpH = (canvasHeight / view.scale) * scale;
  const vpX = (-view.x / view.scale + canvasWidth / 2 / view.scale) * scale + offsetX - vpW / 2;
  const vpY = (-view.y / view.scale + canvasHeight / 2 / view.scale) * scale + offsetY - vpH / 2;

  minimapViewport.style.width = `${Math.min(w, vpW)}px`;
  minimapViewport.style.height = `${Math.min(h, vpH)}px`;
  minimapViewport.style.left = `${Math.max(0, Math.min(w - vpW, vpX))}px`;
  minimapViewport.style.top = `${Math.max(0, Math.min(h - vpH, vpY))}px`;
}

// -----------------------------------------------------------------------------
// Keyboard Hints
// -----------------------------------------------------------------------------

function showKeyboardHints(): void {
  if (keyboardHints) {
    keyboardHints.hidden = false;
    requestAnimationFrame(() => keyboardHints?.classList.add('visible'));
  }
}

function hideKeyboardHints(): void {
  if (keyboardHints) {
    keyboardHints.classList.remove('visible');
    setTimeout(() => {
      if (keyboardHints) keyboardHints.hidden = true;
    }, 300);
    localStorage.setItem('mindmap-hints-shown', 'true');
  }
}

// -----------------------------------------------------------------------------
// Back Button
// -----------------------------------------------------------------------------

export function showBackButton(): void {
  if (btnBack) btnBack.hidden = false;
}

export function hideBackButton(): void {
  if (btnBack) btnBack.hidden = true;
}

// -----------------------------------------------------------------------------
// Control Handlers
// -----------------------------------------------------------------------------

function handleReset(): void {
  if (view) {
    resetView(view);
    // Sync actual values with targets
    view.x = view.targetX;
    view.y = view.targetY;
    view.scale = view.targetScale;
    hideBackButton();
    updateBreadcrumb(null);
    updateZoomIndicator();
    if (onBack) onBack();
    if (onRenderNeeded) onRenderNeeded();
  }
}

function handleZoomIn(): void {
  if (view) {
    zoomIn(view);
    // Sync actual scale with target
    view.scale = view.targetScale;
    updateZoomIndicator();
    if (onRenderNeeded) onRenderNeeded();
  }
}

function handleZoomOut(): void {
  if (view) {
    zoomOut(view);
    // Sync actual scale with target
    view.scale = view.targetScale;
    updateZoomIndicator();
    if (onRenderNeeded) onRenderNeeded();
  }
}

function handleFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    btnFullscreen?.classList.add('active');
  } else {
    document.exitFullscreen();
    btnFullscreen?.classList.remove('active');
  }
}

function handleBack(): void {
  if (view) {
    resetView(view);
    // Sync actual values with targets
    view.x = view.targetX;
    view.y = view.targetY;
    view.scale = view.targetScale;
    hideBackButton();
    updateBreadcrumb(null);
    updateZoomIndicator();
    if (onBack) onBack();
    if (onRenderNeeded) onRenderNeeded();
  }
}

// -----------------------------------------------------------------------------
// Keyboard Navigation
// -----------------------------------------------------------------------------

let selectedNodeIndex = -1;

function handleKeydown(e: KeyboardEvent): void {
  // Ignore if typing in search
  if (document.activeElement === searchInput) {
    if (e.key === 'Escape') {
      searchInput?.blur();
      if (searchResults) searchResults.hidden = true;
    }
    return;
  }

  // Focus search with /
  if (e.key === '/' || e.key === 's') {
    e.preventDefault();
    searchInput?.focus();
    return;
  }

  // Fullscreen with f
  if (e.key === 'f') {
    handleFullscreen();
    return;
  }

  // Escape to close hints or reset view
  if (e.key === 'Escape') {
    if (keyboardHints && !keyboardHints.hidden) {
      hideKeyboardHints();
    } else if (view) {
      handleReset();
    }
  }

  // Zoom with +/-
  if (e.key === '+' || e.key === '=') {
    handleZoomIn();
  }
  if (e.key === '-' || e.key === '_') {
    handleZoomOut();
  }

  // Reset with 0 or r
  if (e.key === '0' || e.key === 'r') {
    handleReset();
  }

  // Arrow navigation
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    handleArrowNavigation(e.key);
  }

  // Enter to open link directly (if node has exactly 1 link)
  if (e.key === 'Enter' && currentNode) {
    if (currentNode.links.length === 1) {
      window.open(currentNode.links[0].url, '_blank', 'noopener,noreferrer');
    }
  }

  // Show help with ?
  if (e.key === '?') {
    showKeyboardHints();
  }
}

function handleArrowNavigation(key: string): void {
  if (allNodes.length === 0) return;

  // If no node selected, select root
  if (selectedNodeIndex < 0) {
    selectedNodeIndex = 0;
    selectNode(allNodes[0]);
    return;
  }

  const current = allNodes[selectedNodeIndex];
  let next: GraphNode | null = null;

  switch (key) {
    case 'ArrowUp':
      // Go to parent
      if (current.parent) {
        next = current.parent;
      }
      break;
    case 'ArrowDown':
      // Go to first child
      if (current.children.length > 0) {
        next = current.children[0];
      }
      break;
    case 'ArrowLeft':
    case 'ArrowRight':
      // Go to sibling
      if (current.parent) {
        const siblings = current.parent.children;
        const idx = siblings.indexOf(current);
        const dir = key === 'ArrowRight' ? 1 : -1;
        const newIdx = (idx + dir + siblings.length) % siblings.length;
        next = siblings[newIdx];
      }
      break;
  }

  if (next) {
    selectedNodeIndex = allNodes.indexOf(next);
    selectNode(next);
  }
}

function selectNode(node: GraphNode): void {
  currentNode = node;
  updateBreadcrumb(node);

  if (onNodeSelect) {
    onNodeSelect(node);
  }
}

export function setCurrentNode(node: GraphNode | null): void {
  currentNode = node;
  if (node) {
    selectedNodeIndex = allNodes.indexOf(node);
    updateBreadcrumb(node);
  }
}

// -----------------------------------------------------------------------------
// Focus on Node (with UI updates)
// -----------------------------------------------------------------------------

export function focusOnNodeWithUI(node: GraphNode): void {
  if (!view) return;

  focusOnNode(node, view, canvasWidth, canvasHeight);
  // Sync actual values with targets
  view.x = view.targetX;
  view.y = view.targetY;
  view.scale = view.targetScale;
  showBackButton();
  updateBreadcrumb(node);
  updateZoomIndicator();
  setCurrentNode(node);

  // Don't auto-show link panel on click - let user explore the graph freely
  // User can press Enter or double-click to open links if needed

  if (onRenderNeeded) onRenderNeeded();
}

// -----------------------------------------------------------------------------
// Cleanup
// -----------------------------------------------------------------------------

export function destroyUI(): void {
  btnReset?.removeEventListener('click', handleReset);
  btnHome?.removeEventListener('click', handleReset);
  btnZoomIn?.removeEventListener('click', handleZoomIn);
  btnZoomOut?.removeEventListener('click', handleZoomOut);
  btnFullscreen?.removeEventListener('click', handleFullscreen);
  btnBack?.removeEventListener('click', handleBack);
  hintsClose?.removeEventListener('click', hideKeyboardHints);
  document.removeEventListener('keydown', handleKeydown);
}
