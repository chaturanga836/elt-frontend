import type { Edge, Node } from '@xyflow/react';

/** Rebuild linear edges from left-to-right node positions (Start → … → End). */
export function rebuildChainEdges(nodes: Node[]): Edge[] {
  if (nodes.length < 2) return [];
  const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);
  const edges: Edge[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const source = sorted[i];
    const target = sorted[i + 1];
    edges.push({
      id: `e-${source.id}-${target.id}`,
      source: source.id,
      target: target.id,
      animated: true,
      style: { strokeWidth: 2 },
    });
  }
  return edges;
}
