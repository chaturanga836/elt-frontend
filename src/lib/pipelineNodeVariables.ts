import type { Edge, Node } from '@xyflow/react';
import { getPredecessorNode } from '@/lib/pipelineChain';

export type PipelineVariableDef = {
  key: string;
  description?: string;
};

export type UpstreamOutputField = {
  path: string;
  label: string;
  description?: string;
  nodeLabel?: string;
  nodeType?: string;
};

const INPUT_TEMPLATE_RE = /^\{\{input\.([^}]+)\}\}$/;

export function formatInputTemplate(path: string): string {
  return `{{input.${path}}}`;
}

export function parseInputTemplateValue(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(INPUT_TEMPLATE_RE);
  return match ? match[1] : null;
}

function nodeLabel(node: Node): string {
  const data = (node.data || {}) as Record<string, unknown>;
  const config = (data.node_config as Record<string, unknown>) || {};
  return (
    (data.label as string) ||
    (config.label as string) ||
    ((data.config as { name?: string } | null)?.name ?? '') ||
    node.type ||
    'Node'
  );
}

function flattenObjectPaths(
  value: unknown,
  prefix = '',
  maxDepth = 3,
): string[] {
  if (maxDepth <= 0 || value == null) return prefix ? [prefix] : [];
  if (Array.isArray(value)) {
    const paths = prefix ? [prefix] : [];
    if (value.length > 0) {
      paths.push(...flattenObjectPaths(value[0], prefix ? `${prefix}.0` : '0', maxDepth - 1));
    }
    return paths;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return prefix ? [prefix] : [];
    const paths: string[] = [];
    for (const [key, child] of entries) {
      const next = prefix ? `${prefix}.${key}` : key;
      if (child != null && typeof child === 'object') {
        paths.push(...flattenObjectPaths(child, next, maxDepth - 1));
      } else {
        paths.push(next);
      }
    }
    return paths;
  }
  return prefix ? [prefix] : [];
}

function startOutputFields(node: Node): UpstreamOutputField[] {
  const config = ((node.data || {}) as Record<string, unknown>).node_config as
    | Record<string, unknown>
    | undefined;
  const startInput = config?.start_input;
  if (startInput == null) {
    return [];
  }
  const paths = flattenObjectPaths(startInput);
  if (!paths.length) {
    return [{ path: 'start_input', label: 'start_input', description: 'Start node payload' }];
  }
  return paths.map((path) => ({
    path,
    label: path,
    description: 'From Start initial input',
  }));
}

function taskOutputFields(node: Node): UpstreamOutputField[] {
  const data = (node.data || {}) as Record<string, unknown>;
  const config = (data.node_config as Record<string, unknown>) || {};
  const declared = config.output_variables as PipelineVariableDef[] | undefined;
  if (declared?.length) {
    return declared
      .filter((v) => v.key?.trim())
      .map((v) => ({
        path: v.key.trim(),
        label: v.key.trim(),
        description: v.description || 'Script return field',
      }));
  }
  return [
    {
      path: 'result',
      label: 'result',
      description: 'Define output variables on the script node, or use any key from the script return dict',
    },
  ];
}

export function restNodeOutputFields(): UpstreamOutputField[] {
  return [
    { path: 'status_code', label: 'status_code', description: 'HTTP status code' },
    { path: 'url', label: 'url', description: 'Request URL' },
    { path: 'data', label: 'data', description: 'Response body (JSON or text)' },
    { path: 'headers', label: 'headers', description: 'Response headers' },
    { path: 'connection', label: 'connection', description: 'Resolved connection metadata' },
  ];
}

function dbOutputFields(node: Node): UpstreamOutputField[] {
  const config = (((node.data || {}) as Record<string, unknown>).node_config ||
    {}) as Record<string, unknown>;
  const op = String(config.operation || 'read');
  const common: UpstreamOutputField[] = [
    { path: 'operation', label: 'operation', description: 'DB operation name' },
    { path: 'connection_id', label: 'connection_id', description: 'Database connection ID' },
  ];
  if (op === 'read' || op === 'script') {
    return [
      ...common,
      { path: 'rows', label: 'rows', description: 'Query result rows' },
      { path: 'row_count', label: 'row_count', description: 'Number of rows' },
      { path: 'columns', label: 'columns', description: 'Column names (read)' },
    ];
  }
  return [
    ...common,
    { path: 'row_count', label: 'row_count', description: 'Affected row count' },
  ];
}

/** Declared output fields for a pipeline node (becomes the next node's input payload shape). */
export function getNodeOutputFields(node: Node): UpstreamOutputField[] {
  switch (node.type) {
    case 'startNode':
      return startOutputFields(node);
    case 'taskNode':
      return taskOutputFields(node);
    case 'restNode':
      return restNodeOutputFields();
    case 'dbNode':
      return dbOutputFields(node);
    default:
      return [];
  }
}

export function getImmediateUpstreamOutputFields(
  nodes: Node[],
  edges: Edge[],
  nodeId: string,
): { predecessor: Node | null; fields: UpstreamOutputField[] } {
  const predecessor = getPredecessorNode(nodes, edges, nodeId);
  if (!predecessor || predecessor.type === 'endNode') {
    return { predecessor: null, fields: [] };
  }

  const label = nodeLabel(predecessor);
  const fields = getNodeOutputFields(predecessor).map((f) => ({
    ...f,
    nodeLabel: label,
    nodeType: predecessor.type,
  }));
  return { predecessor, fields };
}

export function outputVariablesFromFields(
  fields: UpstreamOutputField[],
): PipelineVariableDef[] {
  return fields.map((f) => ({
    key: f.path,
    description: f.description,
  }));
}
