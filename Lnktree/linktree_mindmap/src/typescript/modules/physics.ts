// ==========================================================================
// Physics Module - Linktree Mindmap
// ==========================================================================

import type { GraphNode, GraphEdge } from '../types';
import { config } from '../config';

// -----------------------------------------------------------------------------
// Physics State
// -----------------------------------------------------------------------------

let noiseTime = 0;

// -----------------------------------------------------------------------------
// Update Physics
// -----------------------------------------------------------------------------

export function updatePhysics(
  nodes: GraphNode[],
  edges: GraphEdge[],
  deltaTime: number,
  centerX: number,
  centerY: number
): void {
  const physics = config.physics;
  const dt = Math.min(deltaTime, 32) / 16; // Normalize to ~60fps

  noiseTime += physics.ambientFrequency * deltaTime;

  // Apply forces to each node
  nodes.forEach((node) => {
    // Skip if node is being dragged
    if ((node as any).dragging) return;

    let fx = 0;
    let fy = 0;

    // 1. Center gravity (pull toward center)
    const toCenterX = centerX - node.x;
    const toCenterY = centerY - node.y;
    fx += toCenterX * physics.centerGravity;
    fy += toCenterY * physics.centerGravity;

    // 2. Node-node repulsion
    nodes.forEach((other) => {
      if (other === node) return;

      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Strong repulsion to maintain expanded layout
      const minDist = node.radius + other.radius + 40;
      if (dist < minDist * 5) {
        const force = physics.repulsion / (dist * dist);
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }
    });

    // 3. Edge attraction (spring force toward connected nodes)
    edges.forEach((edge) => {
      let other: GraphNode | null = null;
      if (edge.source === node) other = edge.target;
      if (edge.target === node) other = edge.source;
      if (!other) return;

      const dx = other.x - node.x;
      const dy = other.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Use current distance as target - we want to maintain the expanded radial layout
      // Only pull together if they're too far apart, never compress
      const targetDist = dist * 0.98; // Very slight pull, mostly maintain distance

      const force = (dist - targetDist) * physics.attraction;
      fx += (dx / dist) * force;
      fy += (dy / dist) * force;
    });

    // 4. Ambient drift (perlin-like noise)
    const noiseX = Math.sin(noiseTime + node.breathePhase) * physics.ambientForce;
    const noiseY = Math.cos(noiseTime * 1.3 + node.breathePhase * 0.7) * physics.ambientForce;
    fx += noiseX;
    fy += noiseY;

    // Apply force to velocity
    node.vx += fx * dt;
    node.vy += fy * dt;

    // Apply damping
    node.vx *= physics.damping;
    node.vy *= physics.damping;

    // Clamp velocity
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > physics.maxVelocity) {
      node.vx = (node.vx / speed) * physics.maxVelocity;
      node.vy = (node.vy / speed) * physics.maxVelocity;
    }

    // Ensure minimum velocity for "living" feel
    if (speed < physics.minVelocity && speed > 0) {
      const boost = physics.minVelocity / speed;
      node.vx *= boost * 0.5;
      node.vy *= boost * 0.5;
    }

    // Update position
    node.x += node.vx * dt;
    node.y += node.vy * dt;
  });
}

// -----------------------------------------------------------------------------
// Update Breathing Animation
// -----------------------------------------------------------------------------

export function updateBreathing(nodes: GraphNode[], time: number): void {
  const breatheDuration = config.visual.breatheDuration;

  nodes.forEach((node) => {
    // Calculate breathing scale
    const breatheAmount = 0.03 * node.glowIntensity; // Larger glow = more breathing
    node.breatheScale = 1 + breatheAmount * Math.sin(time / breatheDuration * Math.PI * 2 + node.breathePhase);
  });
}

// -----------------------------------------------------------------------------
// Smooth Opacity Transitions
// -----------------------------------------------------------------------------

export function updateOpacityTransitions(
  _nodes: GraphNode[],
  _edges: GraphEdge[],
  _deltaTime: number
): void {
  // For smooth transitions, we'd track target opacity separately
  // For now, opacity is set directly by highlightPath
}
