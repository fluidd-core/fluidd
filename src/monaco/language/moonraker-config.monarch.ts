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
      // Blank lines
      [/^\s*$/, ''],

      // Full-line comments — # or ; as first non-whitespace character
      [/^\s*[#;].*$/, 'comment'],

      // Section headers — section_r / SECTCRE are not end-anchored, so
      // everything after ] is silently discarded at runtime. Tokenise as comment.
      [
        /^(\s*)(\[)([^\]]+)(\])(.*)$/,
        ['', 'bracket', 'entity.name.section', 'bracket', 'comment'],
      ],

      // Key = value  or  key : value
      //
      // Safe key pattern: [^=:\s#;](?:[^=:]*[^=:\s])?
      //   - First char:  non-delimiter, non-whitespace, non-comment-sigil
      //   - Middle:      anything except = or :  (greedy, optional)
      //   - Last char:   non-delimiter, non-whitespace  (explicit, prevents
      //                  \s* from stealing trailing spaces via backtracking)
      //   - Single-char keys satisfy the outer group alone
      [
        /^\s*([^=:\s#;](?:[^=:]*[^=:\s])?)\s*(=|:)/,
        ['variable.name', 'delimiter'],
      ],

      // Value portion — delegate to moonrakerValue state
      { include: '@moonrakerValue' },

    ],

    moonrakerValue: [
      // Escaped comment sigil: " \#" or " \;"
      // Space + backslash + sigil — backslash is removed at runtime,
      // leaving a literal # or ; in the value.
      // Matched before the inline-comment rule so " \#" is never mistaken
      // for a space-preceded comment sigil.
      [/ \\[#;]/, 'constant.character.escape'],

      // Inline comment — one or more whitespace chars immediately before # or ;.
      // Monarch processes the remaining string left-to-right, so a lookbehind
      // on the sigil won't see spaces already consumed by earlier rules.
      // Instead we match the whitespace + sigil + rest as a unit, returning
      // two tokens so the space keeps the 'string' colour and only the
      // sigil onward gets 'comment'.
      [/([ \t]+)([#;].*)$/, ['string', 'comment']],

      // Boolean-like constants
      [/\b(true|false|yes|no|on|off)\b/i, 'constant.language'],

      // Plain value text (no interpolation)
      [/./, 'string'],
    ],
  },
}

// --- Monaco registration ---
// monaco.languages.register({ id: 'moonraker-config' })
// monaco.languages.setMonarchTokensProvider('moonraker-config', language)
// monaco.languages.setLanguageConfiguration('moonraker-config', conf)
