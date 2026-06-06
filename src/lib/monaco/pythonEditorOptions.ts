/** Shared Monaco options for Python task scripts. */
export const PYTHON_EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 4,
  indentSize: 4,
  insertSpaces: true,
  detectIndentation: true,
  autoIndent: 'advanced' as const,
  wordWrap: 'off' as const,
  formatOnType: true,
  formatOnPaste: true,
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false,
  },
  acceptSuggestionOnCommitCharacter: true,
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
};

type MonacoEditor = {
  updateOptions: (options: typeof PYTHON_EDITOR_OPTIONS) => void;
  getModel: () => { updateOptions: (options: Record<string, unknown>) => void } | null;
  onKeyDown: (listener: (e: { stopPropagation: () => void }) => void) => void;
  focus: () => void;
};

export function configurePythonEditor(editor: MonacoEditor): void {
  editor.updateOptions(PYTHON_EDITOR_OPTIONS);
  editor.getModel()?.updateOptions({
    insertSpaces: true,
    tabSize: 4,
    indentSize: 4,
  });
  // Prevent parent handlers (e.g. React Flow under pipeline modals) from swallowing Space/Tab.
  editor.onKeyDown((e) => e.stopPropagation());
}
