import type * as monaco from 'monaco-editor/editor/editor.api'
import { createGcodeRules } from './gcode-rules'

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
//
// G-code values: Klipper renders any option named `gcode` or ending in
// `_gcode` as a template, and hands it to gcode-rules.ts. The match is a
// suffix, not a substring — `gcode_id`, `gcode_x_offset` and
// `gcode_load_sequence` merely start with `gcode` and are plain values.

export const conf: monaco.languages.LanguageConfiguration = {
  comments: { lineComment: '#' },
  brackets: [['[', ']']],
  autoClosingPairs: [{ open: '[', close: ']' }],
}

const gcode = createGcodeRules('embedded')

// Runs at the start of every physical line to decide whether it still belongs
// to the value being accumulated. `$S2` is the key's indent.
const continuationCheck = (onContinuation: monaco.languages.IMonarchLanguageAction): monaco.languages.IMonarchLanguageRule[] => [
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
    onContinuation
  ],

  // Anything else: not a continuation, return to content without consuming
  [
    '',
    { token: '@rematch', next: '@content' }
  ]
]

export const language: monaco.languages.IMonarchLanguage = {
  // RawConfigParser lower-cases option names, so `GCODE:` is valid. Must be
  // set at language level — Monarch drops per-rule regex flags.
  ignoreCase: true,

  ...gcode.attributes,

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
      // G-code template keys — `/^(.*_)?gcode$/`; see the module comment.
      [
        /^([ \t]*)((?:[^#;=: \t[]*_)?gcode)([ \t]*)(=|:)/,
        ['white', 'keyword', 'white', gcode.entryAction('$1', 'separator')]
      ],

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

    [gcode.checkState]: continuationCheck(gcode.resumeAction),

    ...gcode.states,

    checkValue: continuationCheck({ token: 'white', next: '@value.$S2' }),

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
