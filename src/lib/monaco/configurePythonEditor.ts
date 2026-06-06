'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { PYTHON_EDITOR_OPTIONS } from '@/lib/monaco/pythonEditorOptions';

type MonacoEditorLike = {
  getContainerDomNode: () => HTMLElement;
  focus: () => void;
  trigger: (source: string, handlerId: string) => void;
  updateOptions: (options: typeof PYTHON_EDITOR_OPTIONS) => void;
  getModel: () => { updateOptions: (options: Record<string, unknown>) => void } | null;
  onDidFocusEditorWidget: (listener: () => void) => void;
  onDidDispose: (listener: () => void) => void;
};

export function useMonacoKeyboardGuard(editorRef: RefObject<MonacoEditorLike | null>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const editor = editorRef.current;
      if (!editor) return;

      const root = editor.getContainerDomNode();
      const target = e.target as Node | null;
      if (!target || !root.contains(target)) return;

      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        editor.focus();
        editor.trigger('keyboard', e.shiftKey ? 'outdent' : 'indent');
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [editorRef]);
}

export function configurePythonEditor(editor: MonacoEditorLike): void {
  editor.updateOptions(PYTHON_EDITOR_OPTIONS);
  editor.getModel()?.updateOptions({
    insertSpaces: true,
    tabSize: 4,
    indentSize: 4,
  });

  const focusText = () => {
    editor.focus();
  };

  editor.onDidFocusEditorWidget(focusText);

  const container = editor.getContainerDomNode();
  container.addEventListener('mousedown', focusText);
  editor.onDidDispose(() => {
    container.removeEventListener('mousedown', focusText);
  });
}
