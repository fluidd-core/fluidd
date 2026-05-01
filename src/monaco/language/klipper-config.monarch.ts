import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

// Monarch language definition for Klipper printer.cfg
//
// Parser: configparser.RawConfigParser(
//   strict=False,
//   inline_comment_prefixes=(';', '#')
// )
//
// Inline comment detection (CPython configparser._read, line 36):
//   if index == 0 or (index > 0 and line[index-1].isspace()):
//       comment_start = min(comment_start, index)
//
// A # or ; is treated as a comment only when:
//   - it is the very first character on the line, OR
//   - the character immediately before it is whitespace (space or tab)
//
// Therefore for values:
//   key=value;comment   → ';comment' is part of the value  (letter before ;)
//   key=value#comment   → '#comment' is part of the value  (letter before #)
//   key=value ;comment  → ';comment' is stripped            (space before ;)
//   key=value #comment  → '#comment' is stripped            (space before #)
//
// Section headers: inline stripping runs on the raw line first, then the
// stripped `value` is matched against SECTCRE which is NOT end-anchored —
// anything remaining after the last ] is silently discarded.
// All four variants ([h]#, [h] #, [h];, [h] ;) silently produce 'header'.
//
// Other behaviours:
//   - No interpolation (RawConfigParser) — %(x)s / ${x} are plain text
//   - Duplicate sections/keys allowed (strict=False, last wins)
//   - #*# lines are Klipper's SAVE_CONFIG auto-written block marker

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

      // SAVE_CONFIG auto-generated block marker (#*#)
      [/^\s*#\*#.*$/, 'comment.control.save-config'],

      // Full-line comments — # or ; as first non-whitespace character
      [/^\s*[#;].*$/, 'comment'],

      // Section headers — SECTCRE is not end-anchored, so everything after
      // ] is silently discarded at runtime. Tokenise it as a comment.
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

      // Value portion — delegate to klipperValue state
      { include: '@klipperValue' },

    ],

    klipperValue: [
      // Inline comment — one or more whitespace chars immediately before # or ;.
      // Monarch processes the remaining string left-to-right, so a lookbehind
      // on the sigil won't see spaces already consumed by earlier rules.
      // Instead we match the whitespace + sigil + rest as a unit, returning
      // two tokens so the space keeps the 'string' colour and only the
      // sigil onward gets 'comment'.
      [/([ \t]+)([#;].*)$/, ['string', 'comment']],

      // Boolean-like constants Klipper recognises via getboolean()
      [/\b(true|false|yes|no|on|off)\b/i, 'constant.language'],

      // Plain value text (no interpolation)
      [/./, 'string'],
    ],
  },
}

// --- Monaco registration ---
// monaco.languages.register({ id: 'klipper-config' })
// monaco.languages.setMonarchTokensProvider('klipper-config', language)
// monaco.languages.setLanguageConfiguration('klipper-config', conf)
