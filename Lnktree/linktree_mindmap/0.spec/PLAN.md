# Linktree Mindmap - Enhanced Design Plan

## Vision

A **living, breathing** graph visualization that combines Obsidian's organic fluidity with glassmorphism aesthetics. The graph should feel like floating glass orbs in a cosmic void, connected by streams of light energy.

---

## Design Philosophy

### 1. The Living Graph

Unlike static diagrams, this graph **never fully settles**:

- Nodes have subtle **breathing animation** (gentle scale pulse)
- Slight **ambient drift** - nodes float like objects in zero gravity
- **Particle system** in background - tiny stars/dust floating
- Physics simulation with **soft damping** - movements feel organic

### 2. Glass Orb Nodes

Each node is a **frosted glass sphere**:

```
┌─────────────────────────────────────┐
│                                     │
│    ╭───────────╮                    │
│    │  ◉ icon   │  ← Glass orb      │
│    │           │     with inner     │
│    ╰───────────╯     color glow     │
│         │                           │
│      "Label"    ← Floating label    │
│                                     │
└─────────────────────────────────────┘

Node anatomy:
- Outer ring: rgba(255,255,255,0.1) border
- Fill: rgba(color, 0.15) with backdrop-blur
- Inner glow: radial gradient of node color
- Icon: centered, white with slight shadow
```

### 3. Energy Connections

Lines are **flowing energy streams**, not static lines:

```
Parent ●━━━━━━━━━━━━━━━━━━━━━● Child
       ╰── gradient ──────────╯
       ╰── animated particles ─╯
       ╰── bezier curve ───────╯
```

- **Bezier curves** that flex based on node positions
- **Gradient stroke** transitioning parent → child color
- **Flowing particles** along the line (on hover/active)
- **Glow effect** that pulses subtly

### 4. Depth & Atmosphere

Create a sense of **cosmic depth**:

```
Layer 0 (far):    Deep space gradient + star particles
Layer 1:          Blurred inactive connections
Layer 2:          Active connections with glow
Layer 3 (near):   Glass nodes with sharp edges
Layer 4:          Tooltips/UI overlays
```

- **Parallax effect** on mouse move (subtle)
- **Depth of field** - unfocused nodes slightly blur
- **Vignette** around edges

---

## Visual Specifications

### Color Palette

```scss
// Base colors (from linktree)
$void-bg: #0a0a0f;           // Deep space black
$glass-white: rgba(255, 255, 255, 0.08);
$glass-border: rgba(255, 255, 255, 0.15);

// Node colors
$color-root: #60a5fa;        // Soft blue (DNM)
$color-professional: #4ade80; // Soft green
$color-personal: #f472b6;     // Soft pink

// Glow colors (more saturated for effects)
$glow-root: #3b82f6;
$glow-professional: #22c55e;
$glow-personal: #ec4899;
```

### Node Sizes by Depth

| Depth | Radius | Glow Intensity | Opacity | Label |
|-------|--------|----------------|---------|-------|
| 0 (Root) | 50px | 100% | 1.0 | Always visible, large |
| 1 (Branch) | 35px | 80% | 0.95 | Visible on proximity |
| 2 (Card) | 25px | 60% | 0.85 | Hover only |
| 3 (Section) | 18px | 40% | 0.70 | Hover only |
| 4+ (Leaf) | 12px | 25% | 0.50 | Tooltip only |

### Animation Timings

```scss
$breathe-duration: 4s;       // Node breathing cycle
$drift-duration: 20s;        // Ambient drift cycle
$hover-transition: 0.3s;     // Hover state change
$ripple-duration: 0.6s;      // Ripple through connections
$particle-speed: 2s;         // Line particle flow
```

---

## Interaction Design

### Hover Behavior

**Phase 1: Node Glow** (0-100ms)
- Hovered node brightens
- Glass effect intensifies
- Label fades in

**Phase 2: Path Illumination** (100-300ms)
- Energy ripples outward along connections
- Ancestor path lights up (root → node)
- Descendant paths light up (node → leaves)

**Phase 3: Context Fade** (200-400ms)
- Unrelated nodes fade to 20% opacity
- Unrelated connections fade to 10%
- Creates "spotlight" effect

```
Before hover:          After hover on "Repos":

    ●───●───●              ●───●───●
   /         \            /    ↓    \
  ●     ●     ●          ○   [●]    ○
       / \                   /   \
      ●   ●                 ●     ●
                           ↑       ↑
                      highlighted path
```

### Click Behavior

**Single Click on Branch Node:**
- Smooth zoom/pan to center that subtree
- Other branches drift away (not hidden)
- "Back" button appears to return

**Single Click on Leaf Node:**
- Opens glass panel with links
- Panel has frosted glass effect
- Links styled as mini-cards

**Double Click / Escape:**
- Reset to full view with smooth animation

### Drag & Pan

- **Drag node**: Temporarily pin it, affects physics
- **Drag canvas**: Pan the view
- **Scroll/Pinch**: Zoom in/out
- **Momentum**: Continues briefly after release

---

## Technical Architecture

### Canvas Layers

```
┌────────────────────────────────────────┐
│ Layer 4: UI Overlay (HTML/CSS)         │ ← Tooltips, panels
├────────────────────────────────────────┤
│ Layer 3: Nodes (Canvas)                │ ← Glass orbs
├────────────────────────────────────────┤
│ Layer 2: Connections Glow (Canvas)     │ ← Blurred lines
├────────────────────────────────────────┤
│ Layer 1: Connections (Canvas)          │ ← Sharp lines
├────────────────────────────────────────┤
│ Layer 0: Background (CSS/Canvas)       │ ← Particles, gradient
└────────────────────────────────────────┘
```

### Physics System

```typescript
interface PhysicsConfig {
  // Forces
  repulsion: 150,          // Node-node repulsion
  attraction: 0.03,        // Edge spring strength
  centerGravity: 0.02,     // Pull toward center
  damping: 0.92,           // Velocity decay (high = more drift)

  // Ambient motion
  ambientForce: 0.5,       // Random drift strength
  ambientFrequency: 0.001, // How often drift changes

  // Constraints
  minVelocity: 0.01,       // Never fully stop
  maxVelocity: 5,          // Speed limit
}
```

### Rendering Pipeline

```typescript
function render(ctx: CanvasRenderingContext2D): void {
  // 1. Clear with gradient background
  drawBackground(ctx);

  // 2. Draw particle system
  drawParticles(ctx);

  // 3. Draw connection glows (blurred layer)
  ctx.filter = 'blur(8px)';
  drawConnections(ctx, { glowOnly: true });
  ctx.filter = 'none';

  // 4. Draw connections (sharp)
  drawConnections(ctx, { glowOnly: false });

  // 5. Draw nodes
  nodes.forEach(node => drawGlassNode(ctx, node));

  // 6. Draw labels
  drawLabels(ctx);
}
```

---

## Component Breakdown

### Glass Node Renderer

```typescript
function drawGlassNode(ctx: CanvasRenderingContext2D, node: Node): void {
  const { x, y, radius, color, opacity, highlighted } = node;

  // Outer glow
  const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
  glowGradient.addColorStop(0, withAlpha(color, 0.4 * opacity));
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Glass fill
  const glassGradient = ctx.createRadialGradient(x, y - radius * 0.3, 0, x, y, radius);
  glassGradient.addColorStop(0, withAlpha('#ffffff', 0.15 * opacity));
  glassGradient.addColorStop(0.5, withAlpha(color, 0.1 * opacity));
  glassGradient.addColorStop(1, withAlpha(color, 0.2 * opacity));

  ctx.fillStyle = glassGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Glass border
  ctx.strokeStyle = withAlpha('#ffffff', 0.2 * opacity);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Icon (if large enough)
  if (radius > 15) {
    drawIcon(ctx, node.icon, x, y, radius * 0.5);
  }
}
```

### Energy Connection Renderer

```typescript
function drawConnection(ctx: CanvasRenderingContext2D, edge: Edge): void {
  const { source, target, highlighted } = edge;

  // Calculate bezier control points
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const offset = distance(source, target) * 0.2;
  const controlX = midX + offset * Math.sin(angle);
  const controlY = midY - offset * Math.cos(angle);

  // Gradient along path
  const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
  gradient.addColorStop(0, withAlpha(source.color, highlighted ? 0.8 : 0.3));
  gradient.addColorStop(1, withAlpha(target.color, highlighted ? 0.8 : 0.3));

  ctx.strokeStyle = gradient;
  ctx.lineWidth = highlighted ? 2 : 1;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(source.x, source.y);
  ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
  ctx.stroke();

  // Animated particles on highlighted paths
  if (highlighted) {
    drawFlowingParticles(ctx, edge, controlX, controlY);
  }
}
```

---

## File Structure (Updated)

```
linktree_mindmap/
├── 0.spec/
│   └── PLAN.md
├── 1.ops/
│   └── build.sh
├── src_static/
│   ├── index.html
│   ├── scss/
│   │   ├── main.scss
│   │   ├── abstracts/
│   │   │   ├── _variables.scss    # Colors, sizes, timings
│   │   │   └── _mixins.scss       # Glass effects, glows
│   │   ├── base/
│   │   │   ├── _reset.scss
│   │   │   └── _typography.scss
│   │   ├── components/
│   │   │   ├── _canvas.scss       # Canvas container
│   │   │   ├── _tooltip.scss      # Glass tooltip panel
│   │   │   ├── _link-panel.scss   # Link cards panel
│   │   │   └── _controls.scss     # Zoom, reset buttons
│   │   ├── layout/
│   │   │   └── _main.scss         # Full-screen layout
│   │   └── utilities/
│   │       └── _animations.scss   # Keyframes for UI
│   └── typescript/
│       ├── main.ts                # Entry point
│       ├── types.ts               # All type definitions
│       ├── config.ts              # Physics & visual config
│       ├── modules/
│       │   ├── graph.ts           # Graph data structure
│       │   ├── physics.ts         # Force simulation
│       │   ├── renderer.ts        # Canvas drawing
│       │   ├── particles.ts       # Background particle system
│       │   ├── interaction.ts     # Mouse/touch handlers
│       │   └── ui.ts              # Tooltip, panels
│       └── utils/
│           ├── math.ts            # Vector operations
│           ├── color.ts           # Color manipulation
│           └── easing.ts          # Animation curves
├── public/
│   ├── data.json
│   └── icons/
├── dist/
├── package.json
└── tsconfig.json
```

---

## Milestones (Revised)

### M1: Foundation
- [ ] HTML/CSS skeleton with full-screen canvas
- [ ] Background gradient + basic particle system
- [ ] Load and parse data.json

### M2: Static Graph
- [ ] Render nodes as glass orbs (no physics)
- [ ] Render connections as bezier curves
- [ ] Correct positioning in a tree layout

### M3: Physics
- [ ] Force-directed simulation
- [ ] Ambient drift animation
- [ ] Node breathing animation

### M4: Interaction
- [ ] Hover detection
- [ ] Path highlighting with ripple
- [ ] Context fading

### M5: Navigation
- [ ] Click to zoom/focus subtree
- [ ] Link panel for leaf nodes
- [ ] Pan and zoom controls

### M6: Polish
- [ ] Flowing particles on connections
- [ ] Smooth transitions everywhere
- [ ] Mobile/touch support
- [ ] Performance optimization

---

## Inspiration References

- **Obsidian Graph View**: Organic physics, node glow, connection curves
- **Linktree Glass Cards**: Frosted glass, subtle borders, dark theme
- **Three.js Particle Examples**: Ambient floating particles
- **Apple Vision Pro UI**: Depth, layers, glass materials

---

## Performance Considerations

- Use `requestAnimationFrame` with delta time
- Spatial hashing for hover detection (O(1) instead of O(n))
- Batch draw calls by style
- Throttle physics when tab not visible
- Consider WebGL for 500+ nodes (unlikely needed)
