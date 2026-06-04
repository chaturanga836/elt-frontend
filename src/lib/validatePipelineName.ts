/** Shown in the pipeline name field when empty — not saved as the pipeline name. */
export const PIPELINE_NAME_PLACEHOLDER = 'Untitled Pipeline';

const PIPELINE_NAME_REGEX = /^[a-zA-Z0-9_\-\s]+$/;

export function isPipelineNameValid(name: string | null | undefined): boolean {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return false;
  return PIPELINE_NAME_REGEX.test(trimmed);
}

export function pipelineNameValidationMessage(
  name: string | null | undefined,
): string | null {
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    return 'Please enter a pipeline name.';
  }
  if (!PIPELINE_NAME_REGEX.test(trimmed)) {
    return 'Use only letters, numbers, spaces, underscores (_), and dashes (-).';
  }
  return null;
}
