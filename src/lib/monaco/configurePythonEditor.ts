import { PYTHON_EDITOR_OPTIONS } from '@/lib/monaco/pythonEditorOptions';

type MonacoEditorLike = {
  updateOptions: (options: typeof PYTHON_EDITOR_OPTIONS) => void;
  getModel: () => { updateOptions: (options: Record<string, unknown>) => void } | null;
};

/** Shared Monaco setup for Python task scripts — options only; no keyboard interception. */
export function configurePythonEditor(editor: MonacoEditorLike): void {
  editor.updateOptions(PYTHON_EDITOR_OPTIONS);
  editor.getModel()?.updateOptions({
    insertSpaces: true,
    tabSize: 4,
    indentSize: 4,
  });
}
