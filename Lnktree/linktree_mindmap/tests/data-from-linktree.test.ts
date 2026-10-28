import { describe, it, expect } from 'vitest';
import { buildMindmapData } from '../src/typescript/modules/data-from-linktree';
import { GRAPH_DATA } from '../src/typescript/data-embedded';

describe('mindmap — derived from linktree/src/data/ (via src/data symlink)', () => {
  const data = buildMindmapData();

  it('has the canonical root with 3 section children', () => {
    expect(data.root.id).toBe('dnm');
    expect(data.root.label).toBe('DNM');
    expect(data.root.children).toEqual(['professional-profiles', 'personal-profiles', 'projects']);
  });

  it('every root child references a defined section node with slide children', () => {
    for (const childId of data.root.children ?? []) {
      const node = data.nodes[childId];
      expect(node, `section node ${childId}`).toBeDefined();
      expect(node!.children?.length, `${childId} has slides`).toBeGreaterThan(0);
    }
  });

  it('every node referenced by a children[] is itself defined', () => {
    const queue: string[] = [...(data.root.children ?? [])];
    const seen = new Set<string>();
    while (queue.length) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const n = data.nodes[id];
      expect(n, `dangling reference: ${id}`).toBeDefined();
      for (const c of n!.children ?? []) queue.push(c);
    }
  });

  it('Fin Terminal link appears under projects/lab-tools/Markets column', () => {
    const colNode = data.nodes['projects/lab-tools/col/Markets'];
    expect(colNode, 'Markets column node').toBeDefined();
    const finTerm = colNode!.links?.find(l => l.label === 'Fin Terminal');
    expect(finTerm, 'Fin Terminal link present').toBeDefined();
    expect(finTerm!.url).toBe('https://diegonmarcos.github.io/fin-terminal');
  });

  it('icons are stripped of .svg extension (mindmap convention)', () => {
    let total = 0;
    for (const node of Object.values(data.nodes)) {
      for (const lk of node.links ?? []) {
        expect(lk.icon, `link "${lk.label}"`).not.toMatch(/\.svg$/);
        total++;
      }
    }
    expect(total).toBeGreaterThan(50);  // sanity floor — we shipped ~150 links
  });

  it('exported GRAPH_DATA equals buildMindmapData() — entry point matches transformer', () => {
    expect(GRAPH_DATA).toEqual(data);
  });
});
