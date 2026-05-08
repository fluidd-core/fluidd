import { conf, language } from '../gcode.monarch'
import { registerLanguage, type TokenLine, tokenBuilder, tokenizeLines } from './tokenize-helper'

const LANG = 'gcode'

const t = tokenBuilder(LANG)

const tokenize = (text: string) => tokenizeLines(text, LANG)

beforeAll(() => {
  registerLanguage(LANG, language, conf)
})

describe('gcode Monarch tokenizer', () => {
  describe('G/M/T commands', () => {
    it.each<[string, TokenLine[][]]>([
      ['G1', [t(['keyword.command.g', 'G1'])]],
      ['G28', [t(['keyword.command.g', 'G28'])]],
      // The `override` macro tolerates a trailing `.\d+` so commands like
      // G28.1, M204.1 still tokenize as a single command token.
      ['G28.1', [t(['keyword.command.g', 'G28.1'])]],
      ['M104', [t(['keyword.command.m', 'M104'])]],
      ['T0', [t(['keyword.command.t', 'T0'])]]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })
  })

  // `N` is handled by a dedicated `^(\s*)(n\d+)` rule that only fires at
  // the very start of a line. Mid-line `N` is excluded from both the
  // command rule (`[gmt]`) and the param rule (`[a-mo-z]`), so it falls
  // through to the catch-all `invalid` rule.
  describe('N line numbers (line-start only)', () => {
    it('matches at the very start of a line', () => {
      expect(tokenize('N5')).toEqual([t(['keyword.command.n', 'N5'])])
    })

    it('matches with leading whitespace', () => {
      expect(tokenize('  N5')).toEqual([t(['white', '  '], ['keyword.command.n', 'N5'])])
    })

    it('chains with subsequent commands and params on the same line', () => {
      expect(tokenize('N5 G1 X10')).toEqual([t(
        ['keyword.command.n', 'N5'],
        ['white', ' '],
        ['keyword.command.g', 'G1'],
        ['white', ' '],
        ['keyword.param.x', 'X10']
      )])
    })

    it('tokenizes mid-line N as invalid', () => {
      expect(tokenize('G1 N5')).toEqual([t(
        ['keyword.command.g', 'G1'],
        ['white', ' '],
        ['invalid', 'N5']
      )])
    })

    it('still applies ignoreCase to the line-start rule', () => {
      expect(tokenize('n5')).toEqual([t(['keyword.command.n', 'n5'])])
    })

    // The canonical USB-serial line: line number + command + params +
    // checksum, all in one line.
    it('tokenizes a full N + command + checksum line', () => {
      expect(tokenize('N5 G1 X10*123')).toEqual([t(
        ['keyword.command.n', 'N5'],
        ['white', ' '], ['keyword.command.g', 'G1'],
        ['white', ' '], ['keyword.param.x', 'X10'],
        ['tag', '*123']
      )])
    })
  })

  describe('parameter letter + decimal', () => {
    it.each<[string, TokenLine[][]]>([
      [
        'G1 X10',
        [t(['keyword.command.g', 'G1'], ['white', ' '], ['keyword.param.x', 'X10'])]
      ],
      [
        'G1 X10 Y-3.5 Z.5',
        [t(
          ['keyword.command.g', 'G1'],
          ['white', ' '], ['keyword.param.x', 'X10'],
          ['white', ' '], ['keyword.param.y', 'Y-3.5'],
          ['white', ' '], ['keyword.param.z', 'Z.5']
        )]
      ],
      // Multiple spaces between tokens collapse into a single white token.
      [
        'G1   X10  Y20',
        [t(
          ['keyword.command.g', 'G1'],
          ['white', '   '], ['keyword.param.x', 'X10'],
          ['white', '  '], ['keyword.param.y', 'Y20']
        )]
      ],
      // `decimal` accepts both `+` and `-` prefixes — Marlin's `strtof`
      // and Klipper's `float()` both accept either, so `S+200` etc.
      // should highlight as a normal param value, not invalid.
      [
        'G1 X+10',
        [t(['keyword.command.g', 'G1'], ['white', ' '], ['keyword.param.x', 'X+10'])]
      ],
      [
        'M104 S+200',
        [t(['keyword.command.m', 'M104'], ['white', ' '], ['keyword.param.s', 'S+200'])]
      ],
      [
        'G1 X+.5',
        [t(['keyword.command.g', 'G1'], ['white', ' '], ['keyword.param.x', 'X+.5'])]
      ],
      // The decimal regex's second alt `\d*\.\d+` matches `-.5` (sign +
      // leading-dot decimal).
      [
        'G1 X-.5',
        [t(['keyword.command.g', 'G1'], ['white', ' '], ['keyword.param.x', 'X-.5'])]
      ],
      // The param rule allows whitespace (`\s*`) between the letter and
      // the number — the whole `X 10` is one `keyword.param.x` token,
      // including the inner space. Marlin/Klipper parsers accept this
      // form too.
      [
        'M114 X 10',
        [t(['keyword.command.m', 'M114'], ['white', ' '], ['keyword.param.x', 'X 10'])]
      ],
      [
        'G1 X\t10',
        [t(['keyword.command.g', 'G1'], ['white', ' '], ['keyword.param.x', 'X\t10'])]
      ]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })
  })

  describe('case-insensitive matching (ignoreCase)', () => {
    it('lowercase command and param tokenize the same as uppercase', () => {
      expect(tokenize('g1 x10')).toEqual([t(
        ['keyword.command.g', 'g1'], ['white', ' '], ['keyword.param.x', 'x10']
      )])
    })
  })

  describe('comments', () => {
    it.each<[string, TokenLine[][]]>([
      ['; full line comment', [t(['comment', '; full line comment'])]],
      [
        'G1 X10 ; some comment',
        [t(
          ['keyword.command.g', 'G1'],
          ['white', ' '], ['keyword.param.x', 'X10'],
          ['white', ' '], ['comment', '; some comment']
        )]
      ]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })
  })

  describe('checksum tag (*N)', () => {
    it('captures a *NNN checksum after a value', () => {
      expect(tokenize('G1 X0*123')).toEqual([t(
        ['keyword.command.g', 'G1'],
        ['white', ' '], ['keyword.param.x', 'X0'],
        ['tag', '*123']
      )])
    })

    it('captures a standalone *NNN as a tag', () => {
      expect(tokenize('*123')).toEqual([t(['tag', '*123'])])
    })

    // The tag regex `\*\d+` requires digits after `*`, so non-digit
    // content like `*checksum` falls through to the catch-all `invalid`
    // rule rather than being treated as a tag.
    it('tokenizes *foo (non-digit) as invalid', () => {
      expect(tokenize('*checksum')).toEqual([t(['invalid', '*checksum'])])
    })

    it('tokenizes a lone * as invalid', () => {
      expect(tokenize('*')).toEqual([t(['invalid', '*'])])
    })

    // Realistic serial-protocol line: command + params + checksum +
    // trailing comment.
    it('tokenizes a command with both checksum and trailing comment', () => {
      expect(tokenize('G1 X10 Y10*123 ; comment')).toEqual([t(
        ['keyword.command.g', 'G1'],
        ['white', ' '], ['keyword.param.x', 'X10'],
        ['white', ' '], ['keyword.param.y', 'Y10'],
        ['tag', '*123'],
        ['white', ' '], ['comment', '; comment']
      )])
    })
  })

  describe('M117 / M118 string payload', () => {
    it('captures the rest of the line as a single string token', () => {
      expect(tokenize('M117 Hello World')).toEqual([t(
        ['keyword.command.m', 'M117'],
        ['string', ' Hello World']
      )])
    })

    it('also applies to M118', () => {
      expect(tokenize('M118 status: ok')).toEqual([t(
        ['keyword.command.m', 'M118'],
        ['string', ' status: ok']
      )])
    })

    it('emits no string token when the payload is empty', () => {
      expect(tokenize('M117')).toEqual([t(['keyword.command.m', 'M117'])])
    })

    // 4+ digit M-codes that start with `M117` or `M118` (custom-firmware
    // territory). The M117/M118 rule has a `(?!\d)` lookahead after
    // `m11[78]`, so it only fires when the next char is a non-digit
    // (space, `.`, EOL, etc.). For digit-suffixed codes the regex
    // backtracks and the generic `[gmt]\d+@override` rule catches the
    // whole code as a single command. The dot-suffix override form
    // (M117.5) is unaffected because `@override` matches `.\d+`.
    it('tokenizes M1170 as a single command (no M117 mis-match)', () => {
      expect(tokenize('M1170')).toEqual([t(['keyword.command.m', 'M1170'])])
    })

    it('tokenizes M1180 as a single command (no M118 mis-match)', () => {
      expect(tokenize('M1180')).toEqual([t(['keyword.command.m', 'M1180'])])
    })

    it('tokenizes longer M-codes that share the M117 prefix', () => {
      expect(tokenize('M11700')).toEqual([t(['keyword.command.m', 'M11700'])])
    })

    it('still tokenizes M117.5 as a single command via @override', () => {
      expect(tokenize('M117.5')).toEqual([t(['keyword.command.m', 'M117.5'])])
    })

    // The M117/M118 payload regex stops at `;`, so a trailing comment is
    // recognised — the leading whitespace is captured as part of the payload
    // string token, and the comment is tokenised normally.
    it('lets a trailing ; comment terminate the payload', () => {
      expect(tokenize('M117 ; not a comment')).toEqual([t(
        ['keyword.command.m', 'M117'],
        ['string', ' '],
        ['comment', '; not a comment']
      )])
    })

    // No space is required between the command and the payload — the
    // `(?!\d)` lookahead just blocks digit-suffixed M-codes, so any other
    // first char (letters, quotes, punctuation) is captured into the
    // string payload.
    it('captures a payload with no space after M117', () => {
      expect(tokenize('M117hello')).toEqual([t(
        ['keyword.command.m', 'M117'],
        ['string', 'hello']
      )])
    })

    it('captures a no-space payload up to a trailing ; comment', () => {
      expect(tokenize('M117hello;comment')).toEqual([t(
        ['keyword.command.m', 'M117'],
        ['string', 'hello'],
        ['comment', ';comment']
      )])
    })

    it('captures quote characters as part of a no-space M117 payload (root, not @string)', () => {
      // The M117/M118 special rule fires at root, so a `"` in the payload
      // is just a `string` character — @string state is not entered.
      expect(tokenize('M117"hello"')).toEqual([t(
        ['keyword.command.m', 'M117'],
        ['string', '"hello"']
      )])
    })
  })

  describe('macros and macro params', () => {
    it('tokenizes a bare macro identifier', () => {
      expect(tokenize('MY_MACRO')).toEqual([t(['keyword.macro', 'MY_MACRO'])])
    })

    it('tokenizes key=value macro params', () => {
      expect(tokenize('MY_MACRO X=1 Y=2')).toEqual([t(
        ['keyword.macro', 'MY_MACRO'],
        ['white', ' '], ['keyword.param', 'X'], ['operator', '='], ['string', '1'],
        ['white', ' '], ['keyword.param', 'Y'], ['operator', '='], ['string', '2']
      )])
    })

    it('tokenizes quoted-string macro params', () => {
      expect(tokenize('MY_MACRO MSG="hello world"')).toEqual([t(
        ['keyword.macro', 'MY_MACRO'],
        ['white', ' '],
        ['keyword.param', 'MSG'],
        ['operator', '='],
        ['string.quote', '"'],
        ['string', 'hello world'],
        ['string.quote', '"']
      )])
    })

    // Backslash-escaped quotes inside a quoted string are part of the string
    // body — the closing `"` is the unescaped one.
    it('preserves \\" sequences inside the quoted string body', () => {
      expect(tokenize('MY_MACRO MSG="he said \\"hi\\""')).toEqual([t(
        ['keyword.macro', 'MY_MACRO'],
        ['white', ' '],
        ['keyword.param', 'MSG'],
        ['operator', '='],
        ['string.quote', '"'],
        ['string', 'he said \\"hi\\"'],
        ['string.quote', '"']
      )])
    })

    it('lets a trailing ; comment terminate the param list', () => {
      expect(tokenize('MY_MACRO X=1 ; comment')).toEqual([t(
        ['keyword.macro', 'MY_MACRO'],
        ['white', ' '], ['keyword.param', 'X'], ['operator', '='], ['string', '1'],
        ['white', ' '], ['comment', '; comment']
      )])
    })

    // Empty / missing values. At end of line the `key=` rule branches via
    // `@eos`: the `=` is still emitted as `operator`, but the state pops
    // straight back to @params instead of entering @value, avoiding a
    // cross-line leak (see "state resets across lines").
    it('emits no string token when the value is empty (end of line)', () => {
      expect(tokenize('MY_MACRO X=')).toEqual([t(
        ['keyword.macro', 'MY_MACRO'],
        ['white', ' '], ['keyword.param', 'X'], ['operator', '=']
      )])
    })

    it('handles an empty value followed by another param', () => {
      expect(tokenize('MY_MACRO X= Y=2')).toEqual([t(
        ['keyword.macro', 'MY_MACRO'],
        ['white', ' '], ['keyword.param', 'X'], ['operator', '='],
        ['white', ' '], ['keyword.param', 'Y'], ['operator', '='], ['string', '2']
      )])
    })

    // Empty quoted string: the open and close quotes are both
    // `string.quote`, and Monaco's emit-time coalescing merges them into one
    // span "" — there is no inner string token because @string consumes
    // nothing before seeing the closing quote.
    it('handles an empty quoted value', () => {
      expect(tokenize('MY_MACRO X=""')).toEqual([t(
        ['keyword.macro', 'MY_MACRO'],
        ['white', ' '], ['keyword.param', 'X'], ['operator', '='],
        ['string.quote', '""']
      )])
    })

    // The @value state's `\S+` rule is greedy and stops only at whitespace,
    // `*`, or `;` — so `Y=2` after `X=` is consumed as the value of X, not
    // parsed as a new key=value pair.
    it('treats the next non-whitespace run as the value, even if it looks like a key=value', () => {
      expect(tokenize('MY_MACRO X=Y=2')).toEqual([t(
        ['keyword.macro', 'MY_MACRO'],
        ['white', ' '], ['keyword.param', 'X'], ['operator', '='],
        ['string', 'Y=2']
      )])
    })

    // Realistic Klipper command — multiple quoted-string params on the
    // same line. Verifies the @string → @value → @params → @value →
    // @string cycle works end-to-end.
    it('tokenizes multiple quoted macro params on one line', () => {
      expect(tokenize('RESPOND PREFIX="!" MSG="hello"')).toEqual([t(
        ['keyword.macro', 'RESPOND'],
        ['white', ' '], ['keyword.param', 'PREFIX'], ['operator', '='],
        ['string.quote', '"'], ['string', '!'], ['string.quote', '"'],
        ['white', ' '], ['keyword.param', 'MSG'], ['operator', '='],
        ['string.quote', '"'], ['string', 'hello'], ['string.quote', '"']
      )])
    })

    // ignoreCase is set globally — the macro rule matches any case mix.
    it('tokenizes mixed-case macro names', () => {
      expect(tokenize('My_Macro X=1')).toEqual([t(
        ['keyword.macro', 'My_Macro'],
        ['white', ' '], ['keyword.param', 'X'], ['operator', '='],
        ['string', '1']
      )])
    })

    it('tokenizes lowercase macro names', () => {
      expect(tokenize('set_pressure_advance ADVANCE=0.05')).toEqual([t(
        ['keyword.macro', 'set_pressure_advance'],
        ['white', ' '], ['keyword.param', 'ADVANCE'], ['operator', '='],
        ['string', '0.05']
      )])
    })
  })

  // Real G-code (and CNC-style parsers, including Klipper) accepts
  // multiple words packed onto one line without separators — the parser
  // re-tokenizes on letter boundaries. The Monarch rules match each
  // command/param separately, but Monaco coalesces adjacent tokens that
  // share the *same* type into one span at emit time. So `G28G1` (two
  // `keyword.command.g` tokens) renders as a single merged span, while
  // `G28T0` (different sub-types: g and t) stays as two distinct tokens.
  describe('chained commands without whitespace', () => {
    it('tokenizes a long no-space chain of commands and params', () => {
      expect(tokenize('G28G1X10Y2.2T0M106S200M140S50')).toEqual([t(
        ['keyword.command.g', 'G28G1'],
        ['keyword.param.x', 'X10'],
        ['keyword.param.y', 'Y2.2'],
        ['keyword.command.t', 'T0'],
        ['keyword.command.m', 'M106'],
        ['keyword.param.s', 'S200'],
        ['keyword.command.m', 'M140'],
        ['keyword.param.s', 'S50']
      )])
    })

    it('tokenizes command + param with no space', () => {
      expect(tokenize('G1X10')).toEqual([t(
        ['keyword.command.g', 'G1'], ['keyword.param.x', 'X10']
      )])
    })

    it('keeps adjacent params with different letters as separate tokens', () => {
      expect(tokenize('G1X10Y20')).toEqual([t(
        ['keyword.command.g', 'G1'],
        ['keyword.param.x', 'X10'],
        ['keyword.param.y', 'Y20']
      )])
    })

    it('keeps adjacent commands with different letters as separate tokens', () => {
      expect(tokenize('G28T0')).toEqual([t(
        ['keyword.command.g', 'G28'], ['keyword.command.t', 'T0']
      )])
    })

    it('merges adjacent same-letter commands into one span', () => {
      // G28 and G1 are both `keyword.command.g`; the override keeps merging
      // through G28.1 too.
      expect(tokenize('G28.1G1X10')).toEqual([t(
        ['keyword.command.g', 'G28.1G1'],
        ['keyword.param.x', 'X10']
      )])
    })

    it('captures a checksum tag even with no whitespace before it', () => {
      expect(tokenize('G1X10*123')).toEqual([t(
        ['keyword.command.g', 'G1'],
        ['keyword.param.x', 'X10'],
        ['tag', '*123']
      )])
    })
  })

  // Pinning a handful of realistic Marlin/Klipper lines as they appear
  // in slicer output and macros. Each individual rule is exercised
  // elsewhere; these check that the rules compose correctly on lines a
  // user would actually edit.
  describe('realistic Marlin/Klipper lines', () => {
    it('tokenizes a typical print move', () => {
      expect(tokenize('G1 X100 Y100 Z0.2 E5 F1500')).toEqual([t(
        ['keyword.command.g', 'G1'],
        ['white', ' '], ['keyword.param.x', 'X100'],
        ['white', ' '], ['keyword.param.y', 'Y100'],
        ['white', ' '], ['keyword.param.z', 'Z0.2'],
        ['white', ' '], ['keyword.param.e', 'E5'],
        ['white', ' '], ['keyword.param.f', 'F1500']
      )])
    })

    it('tokenizes a clockwise arc with I/J center offsets', () => {
      expect(tokenize('G2 X10 Y10 I5 J5')).toEqual([t(
        ['keyword.command.g', 'G2'],
        ['white', ' '], ['keyword.param.x', 'X10'],
        ['white', ' '], ['keyword.param.y', 'Y10'],
        ['white', ' '], ['keyword.param.i', 'I5'],
        ['white', ' '], ['keyword.param.j', 'J5']
      )])
    })

    // `T0` here is a tool selector argument to M104, but the Monarch
    // rules don't have semantic context — the command rule fires before
    // the param rule, so any `[gmt]\d+` run tokenizes as a command.
    it('tokenizes M-code with tool-selector argument (T as command, not param)', () => {
      expect(tokenize('M104 S200 T0')).toEqual([t(
        ['keyword.command.m', 'M104'],
        ['white', ' '], ['keyword.param.s', 'S200'],
        ['white', ' '], ['keyword.command.t', 'T0']
      )])
    })

    it('tokenizes Marlin print-progress (M73 P R)', () => {
      expect(tokenize('M73 P50 R5')).toEqual([t(
        ['keyword.command.m', 'M73'],
        ['white', ' '], ['keyword.param.p', 'P50'],
        ['white', ' '], ['keyword.param.r', 'R5']
      )])
    })

    it('tokenizes G92 set-position', () => {
      expect(tokenize('G92 X0 Y0 Z0 E0')).toEqual([t(
        ['keyword.command.g', 'G92'],
        ['white', ' '], ['keyword.param.x', 'X0'],
        ['white', ' '], ['keyword.param.y', 'Y0'],
        ['white', ' '], ['keyword.param.z', 'Z0'],
        ['white', ' '], ['keyword.param.e', 'E0']
      )])
    })

    it('tokenizes negative param values (M104 S-1 to disable a heater)', () => {
      expect(tokenize('M104 S-1')).toEqual([t(
        ['keyword.command.m', 'M104'],
        ['white', ' '], ['keyword.param.s', 'S-1']
      )])
    })
  })

  // Each line must tokenize independently — macro/param state must not leak
  // into the following line.
  describe('state resets across lines', () => {
    it('returns to root after a bare macro line', () => {
      expect(tokenize('MY_MACRO\nG28')).toEqual([
        t(['keyword.macro', 'MY_MACRO']),
        t(['keyword.command.g', 'G28'])
      ])
    })

    it('returns to root after a macro line with params', () => {
      expect(tokenize('MY_MACRO X=1\nG28')).toEqual([
        t(['keyword.macro', 'MY_MACRO'], ['white', ' '], ['keyword.param', 'X'], ['operator', '='], ['string', '1']),
        t(['keyword.command.g', 'G28'])
      ])
    })

    it('tokenizes a small program independently per line', () => {
      expect(tokenize('G28\nG1 X10\nM104 S200')).toEqual([
        t(['keyword.command.g', 'G28']),
        t(['keyword.command.g', 'G1'], ['white', ' '], ['keyword.param.x', 'X10']),
        t(['keyword.command.m', 'M104'], ['white', ' '], ['keyword.param.s', 'S200'])
      ])
    })

    // The `key=` rule's @eos branch pops back to @params at end of line
    // when there is no value, so the @value state never activates and the
    // next line tokenizes from root.
    it('does not leak state when a param value is empty at end of line', () => {
      expect(tokenize('MY_MACRO X=\nG28')).toEqual([
        t(['keyword.macro', 'MY_MACRO'], ['white', ' '], ['keyword.param', 'X'], ['operator', '=']),
        t(['keyword.command.g', 'G28'])
      ])
    })

    // An unclosed quote with content — `@string`'s content regex now has
    // an `@eos` branch that emits `invalid` and `@popall`s back to root,
    // so the next line tokenizes from root.
    it('marks unclosed-quote content as invalid and recovers on the next line', () => {
      expect(tokenize('MY_MACRO X="hello\nG28')).toEqual([
        t(
          ['keyword.macro', 'MY_MACRO'],
          ['white', ' '], ['keyword.param', 'X'], ['operator', '='],
          ['string.quote', '"'], ['invalid', 'hello']
        ),
        t(['keyword.command.g', 'G28'])
      ])
    })

    // A bare opening `"` at end of line — @value's `"` rule now has an
    // `@eos` branch that emits `invalid` and `@popall`s back to root.
    it('marks a bare opening " at end of line as invalid and recovers', () => {
      expect(tokenize('MY_MACRO X="\nG28')).toEqual([
        t(
          ['keyword.macro', 'MY_MACRO'],
          ['white', ' '], ['keyword.param', 'X'], ['operator', '='],
          ['invalid', '"']
        ),
        t(['keyword.command.g', 'G28'])
      ])
    })

    // A closing `"` on the last column of a line — @string's closing-`"`
    // rule's `@eos` branch uses `@popall` instead of `@pop`, going
    // straight to root so neither @value nor @params is left parked at
    // EOL.
    it('recovers when the closing " is at end of line', () => {
      expect(tokenize('MY_MACRO X="hello"\nG28')).toEqual([
        t(
          ['keyword.macro', 'MY_MACRO'],
          ['white', ' '], ['keyword.param', 'X'], ['operator', '='],
          ['string.quote', '"'], ['string', 'hello'], ['string.quote', '"']
        ),
        t(['keyword.command.g', 'G28'])
      ])
    })

    // A single trailing whitespace char after the closing `"` is enough
    // for @value to pop back through @params to root: the `\s+` rule in
    // @params consumes it, then the empty-regex pop fires.
    it('recovers when a closing " is followed by whitespace', () => {
      expect(tokenize('MY_MACRO X="hello" \nG28')).toEqual([
        t(
          ['keyword.macro', 'MY_MACRO'],
          ['white', ' '], ['keyword.param', 'X'], ['operator', '='],
          ['string.quote', '"'], ['string', 'hello'], ['string.quote', '"'],
          ['white', ' ']
        ),
        t(['keyword.command.g', 'G28'])
      ])
    })
  })

  describe('edge cases', () => {
    it.each<[string, TokenLine[][]]>([
      ['', [[]]],
      ['   ', [t(['white', '   '])]],
      // A standalone numeric literal at root has no rule to match it any
      // more (the `@decimal` → `'constant'` rule was removed) and falls
      // through to the catch-all `invalid` rule.
      ['42', [t(['invalid', '42'])]]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })
  })
})
