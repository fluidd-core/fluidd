import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'

const gcodeMonarchLanguage: Monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  ignoreCase: true,
  tokenPostfix: '.gcode',

  tokenizer: {
    root: [
      // Comments
      [/\(.*?\)/, 'comment'],
      [/;.*$/, 'comment'],

      // Control keywords
      [/(?:GOTO|DO|END)\d+/, 'keyword.control'],
      [/\b(?:IF|EQ|NE|LT|GT|LE|GE|WHILE|WH|AND|OR|XOR)\b/, 'keyword.control'],

      // Special G-codes (work offsets, etc.) - before general G-code match
      [/G1?5[4-9](?:\.1)?(?:\s?P\d{1,3})?/, 'constant.numeric'],
      [/G1[12]\d/, 'constant.numeric'],
      [/G15(?:\s?H\d{1,2})?/, 'constant.numeric'],

      // General G-codes and M-codes
      [/G\d{1,3}(?:\.\d)?/, 'markup.bold'],
      [/M\d{1,3}/, 'keyword.operator.quantifier.regexp'],

      // Macro variables
      [/#\d+/, 'variable.other'],
      [/#\[/, 'variable.other', '@bracketVar'],

      // Line numbers and O-codes (start of line)
      [/^N\d+/, 'constant.numeric'],
      [/^O\d+/, 'string.regexp'],

      // P parameter
      [/P\s?-?\d*\.?\d+/, 'string.regexp'],
      [/P(?=\s?[#[])/, 'string.regexp'],

      // Speed/feed: S, E, F
      [/S\s?-?\d*\.?\d+/, 'constant.language'],
      [/S(?=\s?[#[])/, 'constant.language'],
      [/[EF]\s?-?\d*\.?\d+/, 'constant.language'],
      [/[EF](?=\.?[#[])/, 'constant.language'],

      // Coordinates: X, Y
      [/[XY]\s?-?\d*\.?\d+/, 'string'],
      [/[XY](?=-?\.?[#[])/, 'string'],

      // Coordinate: Z (highlighted as invalid/warning for visibility)
      [/Z\s?-?\d*\.?\d+/, 'invalid'],
      [/Z(?=-?\.?[#[])/, 'invalid'],

      // Coordinates: A, B, C
      [/[ABC]\s?-?\d*\.?\d+/, 'constant.character.escape'],
      [/[ABC](?=-?\.?[#[])/, 'constant.character.escape'],

      // Tools: D, H, T
      [/[DHT]\s?\d+\.?\d*/, 'constant.character'],
      [/[DHT](?=[#[])/, 'constant.character'],

      // Modifiers: I, J, K
      [/[IJK]-?\d*\.?\d+/, 'constant.character.escape'],
      [/[IJK](?=-?\.?[#[])/, 'constant.character.escape'],

      // Modifiers: Q, R, U, W
      [/[QRUW]-?\d*\.?\d+/, 'support.constant.math'],
      [/[QRUW](?=-?\.?[#[])/, 'support.constant.math'],

      // Math functions
      [/\b(?:SIN|COS|TAN|ASIN|ACOS|ATAN|FIX|FUP|LN|ROUND|SQRT|ABS|MOD)\b/, 'support.constant.math'],

      // Operators
      [/\*\*/, 'support.constant.math'],
      [/[+*/]/, 'support.constant.math'],
      [/-/, 'invalid'],

      // Percent sign
      [/%/, 'string'],

      // Bracket expressions
      [/\[/, 'delimiter.bracket', '@bracketExpr'],
      [/\]/, 'delimiter.bracket']
    ],

    bracketExpr: [
      [/\[/, 'delimiter.bracket', '@push'],
      [/\]/, 'delimiter.bracket', '@pop'],
      { include: '@root' }
    ],

    bracketVar: [
      [/\[/, 'variable.other', '@push'],
      [/\]/, 'variable.other', '@pop'],
      [/[^[\]]+/, 'variable.other']
    ]
  }
}

export default gcodeMonarchLanguage
