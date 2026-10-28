// ==========================================================================
// Embedded Graph Data - Linktree Mindmap
// ==========================================================================
// Source of truth: linktree/src/data/*.json (linktree owns; exposed here via src/data symlink).
// Presentation: ./view-config.json (colors per section, root identity).
// Adding a tool in linktree → appears here automatically on next rebuild.

import { buildMindmapData } from './modules/data-from-linktree';
import type { GraphData } from './types';

export const GRAPH_DATA: GraphData = buildMindmapData();
