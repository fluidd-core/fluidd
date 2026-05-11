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
      [
        /^#\*#.*$/,
        'comment.control.save-config'
      ],

      [
        /^([ \t]*)(\[)([^\]]+)(\])/,
        ['white', 'bracket', 'type.identifier', { token: 'bracket', next: '@content' }]
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
      [
        /^#\*#/,
        { token: '@rematch', next: '@content' }
      ],

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
