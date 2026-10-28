// ==========================================================================
// Renderer Module - CSS/DOM-based Rendering
// ==========================================================================

import type { GraphNode, GraphEdge, ViewState } from '../types';

// -----------------------------------------------------------------------------
// DOM Elements
// -----------------------------------------------------------------------------

let graphContainer: HTMLElement | null = null;
let graphWorld: HTMLElement | null = null;
let edgesSvg: SVGSVGElement | null = null;
let nodeElements: Map<string, HTMLElement> = new Map();
let edgeElements: Map<string, SVGPathElement> = new Map();

// -----------------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------------

export function initRenderer(container: HTMLElement): void {
  graphContainer = container;
  graphWorld = document.getElementById('graph-world');
  edgesSvg = document.getElementById('edges-svg') as unknown as SVGSVGElement;

  if (!graphWorld || !edgesSvg) {
    console.error('Graph DOM elements not found');
    return;
  }

  // Set SVG viewBox to match container
  updateSvgViewBox();
  window.addEventListener('resize', updateSvgViewBox);
}

function updateSvgViewBox(): void {
  if (!edgesSvg || !graphContainer) return;
  const w = graphContainer.clientWidth;
  const h = graphContainer.clientHeight;
  edgesSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  edgesSvg.style.width = `${w}px`;
  edgesSvg.style.height = `${h}px`;
}

export function getCanvasSize(): { width: number; height: number } {
  return {
    width: graphContainer?.clientWidth || window.innerWidth,
    height: graphContainer?.clientHeight || window.innerHeight,
  };
}

// -----------------------------------------------------------------------------
// Create DOM Elements
// -----------------------------------------------------------------------------

export function createNodeElements(nodes: GraphNode[]): void {
  const container = graphWorld;
  if (!container) return;

  // Clear existing
  container.innerHTML = '';
  nodeElements.clear();

  nodes.forEach((node, index) => {
    const el = document.createElement('div');
    el.className = `node node--depth-${Math.min(node.depth, 5)}`;
    el.dataset.nodeId = node.id;
    el.style.setProperty('--node-color', node.color);
    el.style.setProperty('--enter-delay', String(index));

    // Set icon as background image
    el.style.setProperty('--icon-url', `url(public/icons/${node.icon}.svg)`);
    el.style.backgroundImage = 'none'; // Icon via ::before pseudo

    // Create icon element instead of pseudo (for better control)
    const icon = document.createElement('img');
    icon.className = 'node-icon';
    icon.src = `public/icons/${node.icon}.svg`;
    icon.alt = '';
    icon.draggable = false;
    el.appendChild(icon);

    // Label
    const label = document.createElement('span');
    label.className = 'node-label';
    label.textContent = node.label;
    el.appendChild(label);

    // Badge (child count)
    if (node.children.length > 0 && node.depth < 3) {
      const badge = document.createElement('span');
      badge.className = 'node-badge';
      badge.textContent = String(node.children.length);
      el.appendChild(badge);
    }

    container.appendChild(el);
    nodeElements.set(node.id, el);
  });
}

export function createEdgeElements(edges: GraphEdge[]): void {
  const svg = edgesSvg;
  if (!svg) return;

  // Clear existing
  svg.innerHTML = '';
  edgeElements.clear();

  // Create defs for gradients
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(defs);

  edges.forEach((edge, index) => {
    // Create gradient for this edge
    const gradientId = `edge-gradient-${index}`;
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.id = gradientId;
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', edge.source.color);

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', edge.target.color);

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);

    // Create path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.className.baseVal = 'edge';
    path.setAttribute('stroke', `url(#${gradientId})`);
    path.dataset.sourceId = edge.source.id;
    path.dataset.targetId = edge.target.id;

    svg.appendChild(path);
    edgeElements.set(`${edge.source.id}-${edge.target.id}`, path);
  });
}

// -----------------------------------------------------------------------------
// Update Positions (called on pan/zoom/layout)
// -----------------------------------------------------------------------------

export function render(
  nodes: GraphNode[],
  edges: GraphEdge[],
  view: ViewState
): void {
  if (!graphWorld || !edgesSvg || !graphContainer) return;

  const centerX = graphContainer.clientWidth / 2;
  const centerY = graphContainer.clientHeight / 2;

  // Apply view transform to graph world
  graphWorld.style.transform = `
    translate(${centerX + view.x}px, ${centerY + view.y}px)
    scale(${view.scale})
    translate(${-centerX}px, ${-centerY}px)
  `;

  // Update SVG transform to match
  edgesSvg.style.transform = graphWorld.style.transform;

  // Update node positions - use translate3d for GPU acceleration
  nodes.forEach((node) => {
    const el = nodeElements.get(node.id);
    if (el) {
      // GPU-accelerated positioning via translate3d (replaces left/top)
      el.style.transform = `translate3d(${node.x}px, ${node.y}px, 0) translate(-50%, -50%)`;

      // Update state classes
      el.classList.toggle('highlighted', node.highlighted);
      el.classList.toggle('dimmed', !node.highlighted && nodes.some(n => n.highlighted));
      el.classList.toggle('focused', node.focused);

      // Update opacity for distance-based dimming
      if (!node.highlighted && !node.hovered) {
        el.style.opacity = String(node.opacity);
      } else {
        el.style.opacity = '1';
      }
    }
  });

  // Update edge paths
  edges.forEach((edge) => {
    const path = edgeElements.get(`${edge.source.id}-${edge.target.id}`);
    if (path) {
      // Calculate curved path
      const { source, target } = edge;
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offset = dist * 0.15;
      const nx = -dy / dist;
      const ny = dx / dist;
      const controlX = midX + nx * offset;
      const controlY = midY + ny * offset;

      // Update path d attribute
      path.setAttribute('d', `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`);

      // Update gradient positions
      const gradientId = path.getAttribute('stroke')?.match(/url\(#(.+)\)/)?.[1];
      if (gradientId) {
        const gradient = edgesSvg?.querySelector(`#${gradientId}`);
        if (gradient) {
          gradient.setAttribute('x1', String(source.x));
          gradient.setAttribute('y1', String(source.y));
          gradient.setAttribute('x2', String(target.x));
          gradient.setAttribute('y2', String(target.y));
        }
      }

      // Update state classes
      path.classList.toggle('highlighted', edge.highlighted);
    }
  });
}

// -----------------------------------------------------------------------------
// Get Node Element (for hit testing)
// -----------------------------------------------------------------------------

export function getNodeElement(nodeId: string): HTMLElement | undefined {
  return nodeElements.get(nodeId);
}

export function getNodeAtPoint(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  if (el?.classList.contains('node')) {
    return (el as HTMLElement).dataset.nodeId || null;
  }
  if (el?.closest('.node')) {
    return (el.closest('.node') as HTMLElement).dataset.nodeId || null;
  }
  return null;
}

// -----------------------------------------------------------------------------
// Cleanup
// -----------------------------------------------------------------------------

export function destroyRenderer(): void {
  window.removeEventListener('resize', updateSvgViewBox);
  nodeElements.clear();
  edgeElements.clear();
  if (graphWorld) graphWorld.innerHTML = '';
  if (edgesSvg) edgesSvg.innerHTML = '';
}
