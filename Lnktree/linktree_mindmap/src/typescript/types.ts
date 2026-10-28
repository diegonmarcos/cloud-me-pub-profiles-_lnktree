// ==========================================================================
// Type Definitions - Linktree Mindmap
// ==========================================================================

// -----------------------------------------------------------------------------
// Data Types (from JSON)
// -----------------------------------------------------------------------------

export interface LinkData {
  label: string;
  url: string;
  icon: string;
  download?: boolean;
}

export interface NodeData {
  id: string;
  label: string;
  fullLabel?: string;
  icon: string;
  color: string;
  children?: string[];
  links?: LinkData[];
}

export interface GraphData {
  root: NodeData;
  nodes: Record<string, NodeData>;
}

// -----------------------------------------------------------------------------
// Graph Node (runtime)
// -----------------------------------------------------------------------------

export interface GraphNode {
  id: string;
  label: string;
  fullLabel?: string;
  icon: string;
  color: string;
  depth: number;
  parent: GraphNode | null;
  children: GraphNode[];
  links: LinkData[];

  // Position & physics
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;

  // Visual state
  radius: number;
  opacity: number;
  glowIntensity: number;
  highlighted: boolean;
  hovered: boolean;
  focused: boolean;

  // Animation
  breathePhase: number;
  breatheScale: number;
}

// -----------------------------------------------------------------------------
// Graph Edge
// -----------------------------------------------------------------------------

export interface GraphEdge {
  source: GraphNode;
  target: GraphNode;
  highlighted: boolean;
  opacity: number;
}

// -----------------------------------------------------------------------------
// Particle (background)
// -----------------------------------------------------------------------------

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

// -----------------------------------------------------------------------------
// View State
// -----------------------------------------------------------------------------

export interface ViewState {
  x: number;        // Pan offset X
  y: number;        // Pan offset Y
  scale: number;    // Zoom level
  targetX: number;
  targetY: number;
  targetScale: number;
}

// -----------------------------------------------------------------------------
// Interaction State
// -----------------------------------------------------------------------------

export interface InteractionState {
  hoveredNode: GraphNode | null;
  focusedNode: GraphNode | null;
  draggingNode: GraphNode | null;
  isPanning: boolean;
  panStartX: number;
  panStartY: number;
  lastMouseX: number;
  lastMouseY: number;
}

// -----------------------------------------------------------------------------
// Config Types
// -----------------------------------------------------------------------------

export interface PhysicsConfig {
  repulsion: number;
  attraction: number;
  centerGravity: number;
  damping: number;
  ambientForce: number;
  ambientFrequency: number;
  minVelocity: number;
  maxVelocity: number;
}

export interface VisualConfig {
  nodeRadiusByDepth: number[];
  glowIntensityByDepth: number[];
  opacityByDepth: number[];
  breatheDuration: number;
  particleCount: number;
}

export interface AppConfig {
  physics: PhysicsConfig;
  visual: VisualConfig;
}

// -----------------------------------------------------------------------------
// Event Types
// -----------------------------------------------------------------------------

export type NodeEventHandler = (node: GraphNode, event: MouseEvent | TouchEvent) => void;
export type CanvasEventHandler = (event: MouseEvent | TouchEvent) => void;
