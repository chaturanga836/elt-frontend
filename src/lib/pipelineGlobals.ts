export type PipelineGlobalDef = {
  key: string;
  description?: string;
  initial_value?: unknown;
};

export type GlobalBindingDef = {
  key: string;
  source_path: string;
};

export type PipelineGlobalsConfig = {
  variables: PipelineGlobalDef[];
};

export const EMPTY_PIPELINE_GLOBALS: PipelineGlobalsConfig = {
  variables: [],
};

export function parsePipelineGlobals(canvas: unknown): PipelineGlobalsConfig {
  if (!canvas || typeof canvas !== 'object') return EMPTY_PIPELINE_GLOBALS;
  const raw = (canvas as Record<string, unknown>).pipeline_globals;
  if (!raw || typeof raw !== 'object') return EMPTY_PIPELINE_GLOBALS;
  const variables = (raw as PipelineGlobalsConfig).variables;
  if (!Array.isArray(variables)) return EMPTY_PIPELINE_GLOBALS;
  return {
    variables: variables
      .filter((v) => v && typeof v === 'object' && typeof v.key === 'string')
      .map((v) => ({
        key: v.key.trim(),
        ...(v.description ? { description: v.description } : {}),
        ...(v.initial_value !== undefined ? { initial_value: v.initial_value } : {}),
      }))
      .filter((v) => v.key),
  };
}
