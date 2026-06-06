import { PYTHON_EDITOR_OPTIONS } from '@/lib/monaco/pythonEditorOptions';

type MonacoKeyCode = {
  Tab: number;
};

type MonacoApi = {
  KeyCode: MonacoKeyCode;
};

type MonacoEditorLike = {
  focus: () => void;
  trigger: (source: string, handlerId: string) => void;
  updateOptions: (options: typeof PYTHON_EDITOR_OPTIONS) => void;
  getModel: () => { updateOptions: (options: Record<string, unknown>) => void } | null;
  getDomNode: () => HTMLElement | null;
  onKeyDown: (
    listener: (e: {
      keyCode: number;
      shiftKey: boolean;
      browserEvent?: KeyboardEvent;
    }) => void,
  ) => { dispose: () => void };
};

/**
 * Keyboard isolation for Monaco inside the pipeline canvas.
 * Bubble-phase stopPropagation lets Monaco handle keys first, then blocks React Flow.
 */
export function configurePythonEditor(editor: MonacoEditorLike, monaco: MonacoApi): void {
  editor.updateOptions(PYTHON_EDITOR_OPTIONS);
  editor.getModel()?.updateOptions({
    insertSpaces: true,
    tabSize: 4,
    indentSize: 4,
  });

  const domNode = editor.getDomNode();
  if (domNode) {
    const stopBubble = (e: Event) => {
      e.stopPropagation();
    };
    domNode.addEventListener('keydown', stopBubble, false);
    domNode.addEventListener('keyup', stopBubble, false);
  }

  editor.onKeyDown((e) => {
    if (e.keyCode !== monaco.KeyCode.Tab) return;
    const browserEvent = e.browserEvent;
    if (!browserEvent) return;
    browserEvent.preventDefault();
    editor.trigger('keyboard', e.shiftKey ? 'outdent' : 'indent');
  });
}
