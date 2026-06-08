import type { Node } from '@xyflow/react';

/** Place new workflow nodes between Start and End instead of past the right edge. */
export function computeWorkflowNodePosition(nodes: Node[]): { x: number; y: number } {
  const start = nodes.find((n) => n.type === 'startNode');
  const end = nodes.find((n) => n.type === 'endNode');
  const middle = nodes.filter(
    (n) => n.type !== 'startNode' && n.type !== 'endNode',
  );

  if (start && end) {
    const startX = start.position.x;
    const endX = end.position.x;
    const slotIndex = middle.length + 1;
    const slotCount = middle.length + 2;
    const x = startX + ((endX - startX) * slotIndex) / slotCount;
    const y = start.position.y + (slotIndex % 2 === 0 ? 24 : -24);
    return { x, y };
  }

  const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x), 200);
  return { x: Math.min(maxX + 140, 640), y: 220 };
}
