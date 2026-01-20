import type * as Monaco from 'monaco-editor';

// CDL language definition
export const CDL_LANGUAGE_ID = 'cdl';

// Crystal systems
export const CRYSTAL_SYSTEMS = [
  'cubic',
  'hexagonal',
  'trigonal',
  'tetragonal',
  'orthorhombic',
  'monoclinic',
  'triclinic',
];

// Common point groups by system
export const POINT_GROUPS: Record<string, string[]> = {
  cubic: ['m3m', '432', '-43m', 'm3', '23'],
  hexagonal: ['6/mmm', '622', '6mm', '-62m', '6/m', '6', '-6'],
  trigonal: ['-3m', '32', '3m', '-3', '3'],
  tetragonal: ['4/mmm', '422', '4mm', '-42m', '4/m', '4', '-4'],
  orthorhombic: ['mmm', '222', 'mm2'],
  monoclinic: ['2/m', '2', 'm'],
  triclinic: ['-1', '1'],
};

// Common crystal forms
export const COMMON_FORMS = [
  { indices: '111', name: 'Octahedron' },
  { indices: '100', name: 'Cube' },
  { indices: '110', name: 'Dodecahedron' },
  { indices: '211', name: 'Trapezohedron' },
  { indices: '321', name: 'Hexoctahedron' },
  { indices: '10-10', name: 'Hexagonal prism' },
  { indices: '0001', name: 'Basal pinacoid' },
  { indices: '10-11', name: 'Rhombohedron' },
  { indices: '11-20', name: 'Second-order prism' },
];

// Monarch tokenizer for syntax highlighting
export const CDL_MONARCH_TOKENS: Monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.cdl',

  keywords: CRYSTAL_SYSTEMS,

  modifiers: ['twin', 'cleavage', 'elongate', 'flatten', 'rotate'],

  brackets: [
    { open: '[', close: ']', token: 'delimiter.bracket' },
    { open: '{', close: '}', token: 'delimiter.brace' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' },
  ],

  tokenizer: {
    root: [
      // Comments
      [/#.*$/, 'comment'],

      // Crystal systems
      [
        /\b(cubic|hexagonal|trigonal|tetragonal|orthorhombic|monoclinic|triclinic)\b/,
        'keyword',
      ],

      // Point groups in brackets
      [/\[[^\]]+\]/, 'type'],

      // Miller indices in braces
      [/\{-?\d+(?:,-?\d+){2,3}\}/, 'number'],

      // Distance values
      [/@\d+(?:\.\d+)?/, 'constant'],

      // Operators
      [/\+/, 'operator'],
      [/:/, 'delimiter'],

      // Twin and modification keywords
      [/\b(twin|cleavage|elongate|flatten|rotate)\b/, 'keyword.modifier'],

      // Twin law names
      [/twin:[a-z_]+/, 'annotation'],

      // Numbers
      [/\d+(?:\.\d+)?/, 'number'],

      // Strings
      [/"[^"]*"/, 'string'],

      // Whitespace
      [/\s+/, ''],
    ],
  },
};

// Language configuration
export const CDL_LANGUAGE_CONFIG: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['[', ']'],
    ['{', '}'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
  surroundingPairs: [
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
};

// Completion provider
export function createCDLCompletionProvider(): Monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: ['[', '{', ':', ' '],

    provideCompletionItems: (
      model: Monaco.editor.ITextModel,
      position: Monaco.Position
    ): Monaco.languages.ProviderResult<Monaco.languages.CompletionList> => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: Monaco.languages.CompletionItem[] = [];

      // Check context
      const lineText = model.getLineContent(position.lineNumber);
      const charBefore = lineText[position.column - 2] || '';

      // After '[' - suggest point groups
      if (charBefore === '[' || textUntilPosition.match(/\[\s*$/)) {
        const systemMatch = textUntilPosition.match(/\b(\w+)\s*\[$/);
        const system = systemMatch?.[1]?.toLowerCase();
        const groups = system && POINT_GROUPS[system] ? POINT_GROUPS[system] : Object.values(POINT_GROUPS).flat();

        groups.forEach((group, i) => {
          suggestions.push({
            label: group,
            kind: 12, // Value
            insertText: group,
            range,
            sortText: String(i).padStart(3, '0'),
          });
        });
      }
      // After '{' - suggest Miller indices
      else if (charBefore === '{' || textUntilPosition.match(/\{\s*$/)) {
        COMMON_FORMS.forEach((form, i) => {
          suggestions.push({
            label: `{${form.indices}}`,
            kind: 12, // Value
            insertText: form.indices,
            detail: form.name,
            range,
            sortText: String(i).padStart(3, '0'),
          });
        });
      }
      // At start of line or after whitespace - suggest systems
      else if (position.column <= 2 || lineText.trim() === '' || word.word === '') {
        CRYSTAL_SYSTEMS.forEach((system, i) => {
          suggestions.push({
            label: system,
            kind: 14, // Keyword
            insertText: `${system}[]:{}@1.0`,
            insertTextRules: 4, // InsertAsSnippet
            detail: 'Crystal system',
            range,
            sortText: String(i).padStart(3, '0'),
          });
        });
      }
      // After 'twin:' - suggest twin laws
      else if (textUntilPosition.match(/twin:\s*$/)) {
        const twinLaws = [
          'spinel_law',
          'japan',
          'brazil',
          'dauphine',
          'carlsbad',
          'manebach',
          'baveno',
          'albite',
          'pericline',
          'iron_cross',
          'staurolite_60',
          'staurolite_90',
          'fluorite',
          'gypsum_swallow',
          'chrysoberyl',
          'rutile_geniculated',
        ];

        twinLaws.forEach((law, i) => {
          suggestions.push({
            label: law,
            kind: 12, // Value
            insertText: law,
            detail: 'Twin law',
            range,
            sortText: String(i).padStart(3, '0'),
          });
        });
      }

      return { suggestions };
    },
  };
}

// Hover provider
export function createCDLHoverProvider(): Monaco.languages.HoverProvider {
  return {
    provideHover: (
      model: Monaco.editor.ITextModel,
      position: Monaco.Position
    ): Monaco.languages.ProviderResult<Monaco.languages.Hover> => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const text = word.word.toLowerCase();

      // System descriptions
      const systemDescriptions: Record<string, string> = {
        cubic: 'Cubic (isometric) system: a = b = c, α = β = γ = 90°',
        hexagonal: 'Hexagonal system: a = b ≠ c, α = β = 90°, γ = 120°',
        trigonal: 'Trigonal system: a = b = c, α = β = γ ≠ 90°',
        tetragonal: 'Tetragonal system: a = b ≠ c, α = β = γ = 90°',
        orthorhombic: 'Orthorhombic system: a ≠ b ≠ c, α = β = γ = 90°',
        monoclinic: 'Monoclinic system: a ≠ b ≠ c, α = γ = 90°, β ≠ 90°',
        triclinic: 'Triclinic system: a ≠ b ≠ c, α ≠ β ≠ γ ≠ 90°',
      };

      if (systemDescriptions[text]) {
        return {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endLineNumber: position.lineNumber,
            endColumn: word.endColumn,
          },
          contents: [
            { value: `**${text}**` },
            { value: systemDescriptions[text] },
          ],
        };
      }

      return null;
    },
  };
}

// Register CDL language with Monaco
export function registerCDLLanguage(monaco: typeof Monaco): void {
  // Register language
  monaco.languages.register({
    id: CDL_LANGUAGE_ID,
    extensions: ['.cdl'],
    aliases: ['CDL', 'Crystal Description Language'],
  });

  // Set language configuration
  monaco.languages.setLanguageConfiguration(CDL_LANGUAGE_ID, CDL_LANGUAGE_CONFIG);

  // Set tokenizer
  monaco.languages.setMonarchTokensProvider(CDL_LANGUAGE_ID, CDL_MONARCH_TOKENS);

  // Register completion provider
  monaco.languages.registerCompletionItemProvider(
    CDL_LANGUAGE_ID,
    createCDLCompletionProvider()
  );

  // Register hover provider
  monaco.languages.registerHoverProvider(CDL_LANGUAGE_ID, createCDLHoverProvider());
}

// CDL theme colors
export const CDL_THEME_RULES: Monaco.editor.ITokenThemeRule[] = [
  { token: 'keyword', foreground: '0ea5e9', fontStyle: 'bold' }, // crystal-500
  { token: 'type', foreground: 'f59e0b' }, // amber-500
  { token: 'number', foreground: '10b981' }, // emerald-500
  { token: 'constant', foreground: 'f97316' }, // orange-500
  { token: 'operator', foreground: '6b7280' }, // gray-500
  { token: 'annotation', foreground: '8b5cf6' }, // violet-500
  { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' }, // slate-400
  { token: 'string', foreground: 'ec4899' }, // pink-500
  { token: 'keyword.modifier', foreground: '14b8a6' }, // teal-500
];
