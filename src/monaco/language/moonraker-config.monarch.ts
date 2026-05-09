import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

// Monarch language definition for Moonraker moonraker.conf
//
// Parser: configparser.ConfigParser(interpolation=None)
//   wrapped by FileSourceWrapper._parse_file() which pre-processes
//   each line before handing it to configparser.
//
// Pre-processing rules (from confighelper.py _parse_file):
//
//   1. Full-line comments:
//        if not line.strip() or line.lstrip()[0] in "#;": continue
//      → # or ; as first non-whitespace drops the whole line.
//
//   2. Inline comments:
//        line = line.expandtabs(tabsize=4)          ← runs FIRST
//        cmt_match = re.search(r" +[#;]", line)
//        if cmt_match: line = line[:cmt_match.start()]
//      → expandtabs() converts tabs to spaces before the regex runs,
//        so tabs before # or ; also trigger inline comment stripping.
//        The regex requires one or more spaces (post-expansion) before
//        the sigil. The cut point is cmt_match.start(), so the leading
//        whitespace is also removed. No whitespace → kept in value.
//        key=value#comment  → '#comment' kept   (no whitespace before #)
//        key=value;comment  → ';comment' kept   (no whitespace before ;)
//        key=value #comment → ' #comment' cut   (space before #)
//        key=value\t#comment → '\t#comment' cut  (tab expanded to spaces)
//
//   3. Backslash escape:
//        line = re.sub(r" \\(#|;)", r" \1", line)
//      → " \#" or " \;" (space + backslash + sigil) removes the backslash,
//        leaving a literal # or ; in the value.
//      → Only works when the backslash is itself preceded by a space.
//
//   4. Section headers:
//        section_r = re.compile(r"\s*\[([^]]+)\]")
//      The inline stripper (step 2) runs first. Then section_r, like
//      configparser's own SECTCRE, is not end-anchored — anything remaining
//      after ] is silently discarded. All four variants work:
//        [header]#comment   → no space before #, not stripped; section_r ignores rest
//        [header] #comment  → space before #, stripped to '[header]'
//        [header];comment   → no space before ;, not stripped; section_r ignores rest
//        [header] ;comment  → space before ;, stripped to '[header]'
//
//   5. No interpolation (interpolation=None) — %(x)s / ${x} are plain text.
//
//   6. Strict mode (default): duplicate sections or options within
//      the same file raise ConfigError.

export const conf: monaco.languages.LanguageConfiguration = {
  comments: { lineComment: '#' },
  brackets: [['[', ']']],
  autoClosingPairs: [{ open: '[', close: ']' }],
}

export const language: monaco.languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [
        /^([ \t]*)(\[)([^\]]+)(\])/,
        ['white', 'bracket', 'type.identifier', { token: 'bracket', next: 'content' }]
      ],

      [
        /[#;].*$/,
        'comment'
      ],

      [
        /[ \t]+/,
        'white'
      ],

      [
        /.*$/,
        'invalid'
      ]
    ],

    content: [
      [
        /^([ \t]*)([^#;=: \t[]+(?:[ \t]+[^#;=: \t]+)*)([ \t]*)(=|:)/,
        ['white', 'keyword', 'white', {
          cases: {
            '@eos': { token: 'separator', next: '@checkValue.$1' },
            '@default': { token: 'separator', next: '@value.$1' }
          }
        }]
      ],

      { include: '@root' }
    ],

    checkValue: [
      // Blank line or comment: stay and keep waiting
      [
        /^([ \t]*)((?:[#;].*)?)$/,
        ['white', 'comment']
      ],

      // Continuation: strictly more indented than the key (indent = $S2)
      [
        '^$S2(?=[ \t]+[^ \t])',
        { token: 'white', next: '@value.$S2' }
      ],

      // Anything else: not a continuation, return to content without consuming
      [
        '',
        { token: '@rematch', next: '@content' }
      ]
    ],

    value: [
      // Comment
      [
        /([ \t]+)([#;].*)$/,
        ['white', { token: 'comment', next: '@checkValue.$S2' }]
      ],

      // Value
      [
        /[^ \t]+(?:[ \t]+[^ \t#;][^ \t]*)*/,
        {
          cases: {
            '@eos': { token: 'string', next: '@checkValue.$S2' },
            '@default': 'string'
          }
        }
      ],

      // Empty value
      [
        /[ \t]*/,
        {
          cases: {
            '@eos': { token: 'white', next: '@checkValue.$S2' },
            '@default': 'white'
          }
        }
      ]
    ]
  },
}
