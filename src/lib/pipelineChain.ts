import type { Connection, Edge, Node } from '@xyflow/react';

const edgeStyle = { strokeWidth: 2 };

export function makeChainEdge(source: string, target: string): Edge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    animated: true,
    style: edgeStyle,
  };
}

export function findBoundaryNode(
  nodes: Node[],
  type: 'startNode' | 'endNode',
): Node | undefined {
  return nodes.find((node) => node.type === type);
}

/** Rebuild linear edges from left-to-right positions (fallback only). */
export function rebuildChainEdgesFromPositions(nodes: Node[]): Edge[] {
  if (nodes.length < 2) return [];
  const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);
  const edges: Edge[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    edges.push(makeChainEdge(sorted[i].id, sorted[i + 1].id));
  }
  return edges;
}

export function resolvePipelineEdges(nodes: Node[], edges: Edge[] | undefined | null): Edge[] {
  if (edges?.length) return edges;
  return rebuildChainEdgesFromPositions(nodes);
}

/** Walk the edge chain from Start and return nodes in execution order. */
export function orderNodesFromEdges(nodes: Node[], edges: Edge[]): Node[] {
  const start = findBoundaryNode(nodes, 'startNode');
  const end = findBoundaryNode(nodes, 'endNode');
  if (!start) {
    return [...nodes].sort((a, b) => a.position.x - b.position.x);
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string>();
  edges.forEach((edge) => {
    outgoing.set(edge.source, edge.target);
  });

  const ordered: Node[] = [];
  const visited = new Set<string>();
  let current: string | undefined = start.id;

  while (current && !visited.has(current)) {
    visited.add(current);
    const node = nodeMap.get(current);
    if (node) ordered.push(node);
    if (end && current === end.id) break;
    current = outgoing.get(current);
  }

  const orphaned = nodes
    .filter((node) => !visited.has(node.id))
    .sort((a, b) => a.position.x - b.position.x);

  return [...ordered, ...orphaned];
}

export function isValidPipelineConnection(
  nodes: Node[],
  connection: Pick<Connection, 'source' | 'target'>,
): boolean {
  const { source, target } = connection;
  if (!source || !target || source === target) return false;

  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);
  if (!sourceNode || !targetNode) return false;
  if (sourceNode.type === 'endNode' || targetNode.type === 'startNode') return false;
  return true;
}

/** Insert/replace an edge in a linear chain and bridge any gap created. */
export function applyChainConnection(edges: Edge[], connection: Connection): Edge[] {
  const { source, target } = connection;
  if (!source || !target || source === target) return edges;

  const oldOutgoing = edges.find((edge) => edge.source === source);
  const oldIncoming = edges.find((edge) => edge.target === target);

  let next = edges.filter((edge) => edge.source !== source && edge.target !== target);
  next.push(makeChainEdge(source, target));

  const left = oldIncoming?.source;
  const right = oldOutgoing?.target;

  if (left && right && left !== right) {
    const alreadyLinked = next.some((edge) => edge.source === left && edge.target === right);
    if (!alreadyLinked) {
      next.push(makeChainEdge(left, right));
    }
  }

  return next;
}

/** Insert a node directly before a target node in the chain (typically End). */
export function insertNodeBeforeTarget(
  edges: Edge[],
  newNodeId: string,
  targetId: string,
): Edge[] {
  const incoming = edges.find((edge) => edge.target === targetId);
  if (!incoming) {
    return [...edges, makeChainEdge(newNodeId, targetId)];
  }

  const withoutIncoming = edges.filter((edge) => edge.id !== incoming.id);
  return [
    ...withoutIncoming,
    makeChainEdge(incoming.source, newNodeId),
    makeChainEdge(newNodeId, targetId),
  ];
}

/** Remove a node from the chain and connect its predecessor to its successor. */
export function removeNodeFromChain(edges: Edge[], nodeId: string): Edge[] {
  const incoming = edges.find((edge) => edge.target === nodeId);
  const outgoing = edges.find((edge) => edge.source === nodeId);
  let next = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);

  if (incoming && outgoing) {
    next = applyChainConnection(next, {
      source: incoming.source,
      target: outgoing.target,
    } as Connection);
  }

  return next;
}

export function isCompleteLinearChain(nodes: Node[], edges: Edge[]): boolean {
  const start = findBoundaryNode(nodes, 'startNode');
  const end = findBoundaryNode(nodes, 'endNode');
  if (!start || !end || nodes.length < 2) return false;

  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();

  edges.forEach((edge) => {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) ?? 0) + 1);
  });

  for (const node of nodes) {
    const incoming = incomingCount.get(node.id) ?? 0;
    const outgoing = outgoingCount.get(node.id) ?? 0;

    if (node.id === start.id) {
      if (incoming !== 0 || outgoing !== 1) return false;
      continue;
    }
    if (node.id === end.id) {
      if (incoming !== 1 || outgoing !== 0) return false;
      continue;
    }
    if (incoming !== 1 || outgoing !== 1) return false;
  }

  const ordered = orderNodesFromEdges(nodes, edges);
  return ordered.length === nodes.length && ordered[ordered.length - 1]?.id === end.id;
}

/** @deprecated Use resolvePipelineEdges / orderNodesFromEdges instead. */
export function rebuildChainEdges(nodes: Node[]): Edge[] {
  return rebuildChainEdgesFromPositions(nodes);
}
