import Editor, { type Monaco } from "@monaco-editor/react";
import { useCallback, useRef, useEffect } from "react";
import type { editor } from "monaco-editor";
import { useGameStore } from "../../stores/gameStore";
import { usePartySocket } from "../../hooks/usePartySocket";
import { MessageType } from "../../types/game";
import type { CursorPosition } from "../../types/game";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  isSaboteur?: boolean;
}

// Custom dark space theme definition
const VOID_THEME: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "e0e0f0", background: "080820" },
    { token: "comment", foreground: "4a4a7a", fontStyle: "italic" },
    { token: "keyword", foreground: "00f0ff" },
    { token: "keyword.control", foreground: "00f0ff" },
    { token: "keyword.operator", foreground: "00f0ff" },
    { token: "string", foreground: "ff9500" },
    { token: "string.escape", foreground: "ffb84d" },
    { token: "number", foreground: "6bcb77" },
    { token: "type", foreground: "4d96ff" },
    { token: "type.identifier", foreground: "4d96ff" },
    { token: "class", foreground: "4d96ff" },
    { token: "function", foreground: "60fdff" },
    { token: "variable", foreground: "e0e0f0" },
    { token: "constant", foreground: "ff6bff" },
    { token: "operator", foreground: "00f0ff" },
    { token: "delimiter", foreground: "4a4a7a" },
    { token: "delimiter.bracket", foreground: "e0e0f0" },
    { token: "tag", foreground: "ff2d55" },
    { token: "attribute.name", foreground: "00f0ff" },
    { token: "attribute.value", foreground: "ff9500" },
    { token: "invalid", foreground: "ff2d55" },
    // Python-specific
    { token: "keyword.python", foreground: "00f0ff" },
    { token: "identifier.python", foreground: "e0e0f0" },
    { token: "delimiter.python", foreground: "4a4a7a" },
    { token: "number.python", foreground: "6bcb77" },
    { token: "string.python", foreground: "ff9500" },
    { token: "predefined.python", foreground: "ff6bff" },
  ],
  colors: {
    "editor.background": "#080820",
    "editor.foreground": "#e0e0f0",
    "editor.lineHighlightBackground": "#0f1133",
    "editor.lineHighlightBorder": "#1a1a3e50",
    "editor.selectionBackground": "#00f0ff25",
    "editor.selectionHighlightBackground": "#00f0ff15",
    "editor.inactiveSelectionBackground": "#00f0ff10",
    "editorCursor.foreground": "#00f0ff",
    "editorWhitespace.foreground": "#1a1a3e",
    "editorIndentGuide.background": "#1a1a3e",
    "editorIndentGuide.activeBackground": "#2a2a5e",
    "editorLineNumber.foreground": "#2a2a5e",
    "editorLineNumber.activeForeground": "#00f0ff80",
    "editorBracketMatch.background": "#00f0ff20",
    "editorBracketMatch.border": "#00f0ff40",
    "editor.wordHighlightBackground": "#00f0ff15",
    "scrollbar.shadow": "#00000000",
    "scrollbarSlider.background": "#1a1a3e80",
    "scrollbarSlider.hoverBackground": "#2a2a5ea0",
    "scrollbarSlider.activeBackground": "#00f0ff40",
    "editorGutter.background": "#080820",
    "editorOverviewRuler.border": "#00000000",
  },
};

// Decoration tracking for remote cursors and edit attribution
let cursorDecorations: string[] = [];
let editDecorations: string[] = [];

function createCursorCSS(cursor: CursorPosition): string {
  const className = `remote-cursor-${cursor.playerId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const labelClass = `${className}-label`;

  // Inject CSS if it doesn't exist
  if (!document.getElementById(className)) {
    const style = document.createElement("style");
    style.id = className;
    style.textContent = `
      .${className} {
        border-left: 2px solid ${cursor.color};
        margin-left: -1px;
      }
      .${labelClass} {
        background: ${cursor.color};
        color: #080820;
        font-size: 10px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        padding: 1px 5px;
        border-radius: 3px 3px 3px 0;
        position: relative;
        top: -1.4em;
        white-space: nowrap;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  return className;
}

export function CodeEditor({
  code,
  onChange,
  readOnly = false,
  height = "400px",
  isSaboteur = false,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const { sendMessage } = usePartySocket();
  const playerId = useGameStore((s) => s.playerId);
  const playerName = useGameStore((s) => s.playerName);
  const remoteCursors = useGameStore((s) => s.remoteCursors);
  const editHistory = useGameStore((s) => s.editHistory);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    monaco.editor.defineTheme("void-space", VOID_THEME);
  }, []);

  const handleMount = useCallback(
    (ed: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editorRef.current = ed;
      monacoRef.current = monaco;
      ed.focus();

      // Send cursor position on cursor change
      ed.onDidChangeCursorPosition((e) => {
        if (!playerId) return;
        sendMessage({
          type: MessageType.CURSOR_UPDATE,
          playerId,
          playerName: playerName || "Unknown",
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
      });
    },
    [playerId, playerName, sendMessage]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        onChange(value);
      }
    },
    [onChange]
  );

  // Render remote cursors as decorations
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;

    const decorations: editor.IModelDeltaDecoration[] = [];

    for (const cursor of remoteCursors) {
      // Don't show our own cursor
      if (cursor.playerId === playerId) continue;

      const className = createCursorCSS(cursor);
      const labelClass = `${className}-label`;

      decorations.push(
        // Cursor line
        {
          range: new monaco.Range(
            cursor.lineNumber,
            cursor.column,
            cursor.lineNumber,
            cursor.column
          ),
          options: {
            className,
            stickiness:
              monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        },
        // Name label
        {
          range: new monaco.Range(
            cursor.lineNumber,
            cursor.column,
            cursor.lineNumber,
            cursor.column
          ),
          options: {
            after: {
              content: ` ${cursor.playerName}`,
              inlineClassName: labelClass,
            },
            stickiness:
              monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        }
      );
    }

    cursorDecorations = ed.deltaDecorations(cursorDecorations, decorations);
  }, [remoteCursors, playerId]);

  // Render per-line edit attribution gutter marks
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;

    const decs: editor.IModelDeltaDecoration[] = [];
    const lineCount = ed.getModel()?.getLineCount() ?? 0;

    for (let lineNum = 1; lineNum <= lineCount; lineNum++) {
      const edit = editHistory[lineNum];
      if (!edit) continue;

      // Inject a CSS class for this player's gutter color if needed
      const safeId = edit.playerId.replace(/[^a-zA-Z0-9]/g, "");
      const gutterClass = `edit-gutter-${safeId}`;
      if (!document.getElementById(gutterClass)) {
        const players = useGameStore.getState().gameState.players;
        const idx = players.findIndex((p) => p.id === edit.playerId);
        const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff", "#ff9500"];
        const color = colors[idx % colors.length] ?? "#4a4a7a";
        const style = document.createElement("style");
        style.id = gutterClass;
        style.textContent = `.${gutterClass} { border-left: 3px solid ${color}; margin-left: 2px; }`;
        document.head.appendChild(style);
      }

      decs.push({
        range: new monaco.Range(lineNum, 1, lineNum, 1),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: gutterClass,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
    }

    editDecorations = ed.deltaDecorations(editDecorations, decs);
  }, [editHistory]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border editor-scanlines ${isSaboteur ? "border-saboteur/30 shadow-[inset_0_0_30px_rgba(255,45,85,0.05)]" : "border-void-border"}`}
      role="region"
      aria-label="Code editor"
    >
      {/* Editor header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-void-surface border-b border-void-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-void-danger/60" />
          <div className="w-3 h-3 rounded-full bg-void-warning/60" />
          <div className="w-3 h-3 rounded-full bg-void-success/60" />
        </div>
        <span className="text-xs text-void-muted ml-2 font-medium">
          solution.py
        </span>
        {readOnly && (
          <span className="text-[10px] uppercase tracking-wider text-void-muted bg-void-border px-2 py-0.5 rounded-full ml-auto">
            Read Only
          </span>
        )}
      </div>
      {/* Monaco instance */}
      <Editor
        height={height}
        defaultLanguage="python"
        value={code}
        onChange={handleChange}
        onMount={handleMount}
        beforeMount={handleBeforeMount}
        theme="void-space"
        options={{
          readOnly,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 14,
          lineHeight: 1.6,
          padding: { top: 16 },
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          contextmenu: false,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          roundedSelection: true,
          automaticLayout: true,
          wordWrap: "on",
          lineNumbers: "on",
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}
