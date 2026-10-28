// ==========================================================================
// Configuration - Linktree Mindmap
// ==========================================================================

import type { AppConfig } from './types';

export const config: AppConfig = {
  physics: {
    repulsion: 0,             // No repulsion after expansion
    attraction: 0,            // No attraction - stay where placed
    centerGravity: 0,         // No center gravity - no centralization!
    damping: 0.98,            // High damping to stop any residual motion
    ambientForce: 0,          // No drift
    ambientFrequency: 0.002,  // Not used
    minVelocity: 0,           // Allow complete stop
    maxVelocity: 1,           // Very low speed limit
  },

  visual: {
    // Radius by depth: [root, branch, card, section, leaf]
    nodeRadiusByDepth: [45, 32, 24, 16, 12],

    // Glow intensity by depth (0-1)
    glowIntensityByDepth: [1.0, 0.8, 0.6, 0.4, 0.25],

    // Opacity by depth (0-1)
    opacityByDepth: [1.0, 0.95, 0.85, 0.7, 0.5],

    // Animation
    breatheDuration: 4000, // ms

    // Background particles
    particleCount: 80,
  },
};

// -----------------------------------------------------------------------------
// Color Palette
// -----------------------------------------------------------------------------

export const colors = {
  // Base
  voidBg: '#0a0a0f',
  voidBgLight: '#12121a',

  // Glass
  glassWhite: 'rgba(255, 255, 255, 0.08)',
  glassWhiteHover: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',

  // Node colors (defaults, can be overridden by data)
  root: '#60a5fa',
  professional: '#4ade80',
  personal: '#f472b6',

  // Text
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  textDim: 'rgba(255, 255, 255, 0.4)',
};

// -----------------------------------------------------------------------------
// Layout Constants
// -----------------------------------------------------------------------------

export const layout = {
  // Initial tree layout spacing (will be calculated dynamically)
  levelSpacing: 280,      // Fallback if calculation fails
  siblingSpacing: 120,    // Horizontal space between siblings (not used in radial)

  // View constraints
  minZoom: 0.2,
  maxZoom: 2.5,
  defaultZoom: 1.0,       // Default zoom to see everything

  // Animation
  panEasing: 0.12,        // Pan/zoom interpolation speed
  hoverFadeSpeed: 0.15,   // Opacity transition speed

  // Expansion animation
  expansionDuration: 2000,  // ms - time to expand from collapsed to full
  expansionEasing: 0.08,    // Smooth expansion speed
};
