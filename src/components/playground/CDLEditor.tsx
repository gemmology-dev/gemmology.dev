import { useEffect, useRef, useCallback, useState, lazy, Suspense } from 'react';
import type { OnMount, OnChange } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { registerCDLLanguage, CDL_LANGUAGE_ID, CDL_THEME_RULES } from '../../lib/monaco-cdl';

// Lazy load Monaco Editor for SSR compatibility
const Editor = lazy(() => import('@monaco-editor/react').then(mod => ({ default: mod.Editor })));

interface CDLEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors?: Array<{ line: number; column: number; message: string }>;
  className?: string;
}

export function CDLEditor({ value, onChange, errors = [], className }: CDLEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  // Only render editor on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register CDL language
    registerCDLLanguage(monaco);

    // Define custom theme
    monaco.editor.defineTheme('cdl-theme', {
      base: 'vs',
      inherit: true,
      rules: CDL_THEME_RULES,
      colors: {
        'editor.background': '#f8fafc',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#475569',
      },
    });

    // Apply theme
    monaco.editor.setTheme('cdl-theme');

    // Focus editor
    editor.focus();
  }, []);

  const handleChange: OnChange = useCallback(
    (newValue) => {
      if (newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  // Update error markers
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const markers: Monaco.editor.IMarkerData[] = errors.map((error) => ({
      severity: monacoRef.current!.MarkerSeverity.Error,
      message: error.message,
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.line,
      endColumn: model.getLineMaxColumn(error.line),
    }));

    monacoRef.current.editor.setModelMarkers(model, 'cdl', markers);
  }, [errors]);

  const loadingPlaceholder = (
    <div className="flex items-center justify-center h-full bg-slate-50">
      <div className="text-slate-400">Loading editor...</div>
    </div>
  );

  if (!isClient) {
    return <div className={className}>{loadingPlaceholder}</div>;
  }

  return (
    <div className={className}>
      <Suspense fallback={loadingPlaceholder}>
        <Editor
          height="100%"
          language={CDL_LANGUAGE_ID}
          value={value}
          onMount={handleEditorDidMount}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            suggest: {
              showKeywords: true,
              showValues: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
          }}
          loading={loadingPlaceholder}
        />
      </Suspense>
    </div>
  );
}
