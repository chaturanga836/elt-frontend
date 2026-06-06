/** Shared Monaco options for Python task scripts. */
export const PYTHON_EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 4,
  indentSize: 4,
  /** One indent mode per editor: true = Tab inserts spaces, false = Tab inserts \\t */
  insertSpaces: true,
  detectIndentation: false,
  autoIndent: 'full' as const,
  wordWrap: 'off' as const,
  formatOnType: false,
  formatOnPaste: true,
  tabCompletion: 'off' as const,
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

type MonacoKeyEvent = {
  browserEvent?: KeyboardEvent;
};

type MonacoEditor = {
  updateOptions: (options: typeof PYTHON_EDITOR_OPTIONS) => void;
  getModel: () => { updateOptions: (options: Record<string, unknown>) => void } | null;
  onKeyDown: (listener: (e: MonacoKeyEvent) => void) => void;
  focus: () => void;
};

export function configurePythonEditor(editor: MonacoEditor): void {
  editor.updateOptions(PYTHON_EDITOR_OPTIONS);
  editor.getModel()?.updateOptions({
    insertSpaces: true,
    tabSize: 4,
    indentSize: 4,
  });
  // Stop keys from reaching React Flow (capture/bubble on document) — use the DOM event.
  editor.onKeyDown((e) => {
    e.browserEvent?.stopPropagation();
  });
}
