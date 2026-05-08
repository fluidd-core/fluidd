import { conf, language } from '../klipper-config.monarch'
import { registerLanguage, type TokenLine, tokenBuilder, tokenizeLines } from './tokenize-helper'

const LANG = 'klipper-config'

const t = tokenBuilder(LANG)

const tokenize = (text: string) => tokenizeLines(text, LANG)

beforeAll(() => {
  registerLanguage(LANG, language, conf)
})

describe('klipper-config Monarch tokenizer', () => {
  describe('section headers', () => {
    it.each<[string, TokenLine[][]]>([
      [
        '[extruder]',
        [t(['bracket', '['], ['type.identifier', 'extruder'], ['bracket', ']'])]
      ],
      [
        '[heater_bed nozzle]',
        [t(['bracket', '['], ['type.identifier', 'heater_bed nozzle'], ['bracket', ']'])]
      ],
      // Canonical Klipper section-with-arg shape (`gcode_macro`,
      // `gcode_button`, `heater_generic`, etc.) — same regex path as
      // `[heater_bed nozzle]` but pinned because it's the most common form
      // a user will see.
      [
        '[gcode_macro MY_MACRO]',
        [t(['bracket', '['], ['type.identifier', 'gcode_macro MY_MACRO'], ['bracket', ']'])]
      ],
      // Klipper's `[include]` directive — slash and `*` are not in the
      // identifier exclusion set, so the whole `include …` argument lands
      // in a single `type.identifier` token.
      [
        '[include extras/*.cfg]',
        [t(['bracket', '['], ['type.identifier', 'include extras/*.cfg'], ['bracket', ']'])]
      ],
      // configparser's SECTCRE strips bracket-internal whitespace before
      // matching; the tokenizer keeps it verbatim. `[ ]` matches because
      // `[^\]]+` requires only one char, and a space qualifies.
      [
        '[ section ]',
        [t(['bracket', '['], ['type.identifier', ' section '], ['bracket', ']'])]
      ],
      [
        '[ ]',
        [t(['bracket', '['], ['type.identifier', ' '], ['bracket', ']'])]
      ],
      // configparser strips inline comments before parsing, so all four
      // variants below yield the same parsed header in real Klipper. The
      // tokenizer does not replicate that strip — assertions pin the actual
      // Monaco output (header tokens followed by a comment token).
      [
        '[extruder]#x',
        [t(['bracket', '['], ['type.identifier', 'extruder'], ['bracket', ']'], ['comment', '#x'])]
      ],
      [
        '[extruder] #x',
        [t(['bracket', '['], ['type.identifier', 'extruder'], ['bracket', ']'], ['white', ' '], ['comment', '#x'])]
      ],
      [
        '[extruder];x',
        [t(['bracket', '['], ['type.identifier', 'extruder'], ['bracket', ']'], ['comment', ';x'])]
      ],
      [
        '[extruder] ;x',
        [t(['bracket', '['], ['type.identifier', 'extruder'], ['bracket', ']'], ['white', ' '], ['comment', ';x'])]
      ]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })

    // Unclosed `[`: the section regex requires a literal `]`, the line has
    // no separator, and `[` is in `[^#;=: \t]+` so configparser-style key
    // detection also fails. The whole line falls through to the catch-all.
    it('tokenizes an unclosed [section as invalid', () => {
      expect(tokenize('[stepper_x')).toEqual([t(['invalid', '[stepper_x'])])
    })
  })

  describe('key/value lines', () => {
    it.each<[string, TokenLine[][]]>([
      [
        'key = value',
        [t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value'])]
      ],
      [
        'key=value',
        [t(['keyword', 'key'], ['separator', '='], ['string', 'value'])]
      ],
      [
        'key: value',
        [t(['keyword', 'key'], ['separator', ':'], ['white', ' '], ['string', 'value'])]
      ],
      [
        'my key with spaces = value',
        [t(['keyword', 'my key with spaces'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value'])]
      ],
      [
        '  key = value',
        [t(['white', '  '], ['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value'])]
      ],
      [
        '\tkey = val',
        [t(['white', '\t'], ['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'val'])]
      ]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })
  })

  describe('inline value comments (configparser whitespace rule)', () => {
    it.each<[string, TokenLine[][]]>([
      // No whitespace before sigil → part of the value.
      [
        'key = value;not-a-comment',
        [t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value;not-a-comment'])]
      ],
      [
        'key = value#not-a-comment',
        [t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value#not-a-comment'])]
      ],
      // Whitespace before sigil → comment is stripped.
      [
        'key = value ;comment',
        [t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value'], ['white', ' '], ['comment', ';comment'])]
      ],
      [
        'key = value #comment',
        [t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value'], ['white', ' '], ['comment', '#comment'])]
      ],
      [
        'key = value\t;comment',
        [t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value'], ['white', '\t'], ['comment', ';comment'])]
      ],
      // Values containing `:` or `=` — the value rule's `[^ \t]+` greedily
      // consumes both, so URLs and key-like fragments stay in one string
      // token.
      [
        'mqtt_address: mqtt://broker:1883/topic',
        [t(['keyword', 'mqtt_address'], ['separator', ':'], ['white', ' '], ['string', 'mqtt://broker:1883/topic'])]
      ],
      [
        'cmd = foo=bar',
        [t(['keyword', 'cmd'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'foo=bar'])]
      ],
      [
        'cmd: a=b c=d',
        [t(['keyword', 'cmd'], ['separator', ':'], ['white', ' '], ['string', 'a=b c=d'])]
      ],
      // `variable_*` keys typically hold quoted strings (Klipper passes the
      // raw value through `ast.literal_eval`). The tokenizer has no string
      // sub-state — quotes are kept inside the single `string` token.
      [
        'variable_msg: "hello world"',
        [t(['keyword', 'variable_msg'], ['separator', ':'], ['white', ' '], ['string', '"hello world"'])]
      ]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })

    // Trailing whitespace after the value: the value rule emits `string`,
    // then the empty-value rule's `[ \t]*` consumes the rest as `white`
    // and (on @eos) transitions to `@checkValue.$S2` so a continuation
    // can still follow on the next line.
    it('emits trailing whitespace after a value as a white token', () => {
      expect(tokenize('key = value   ')).toEqual([
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value'], ['white', '   '])
      ])
    })

    // Empty value with a trailing space at end of line — the `@value`
    // state's empty-value rule matches `[ \t]*` and, on @eos, transitions
    // to `@checkValue` so the next line can still continue the value.
    it('emits a trailing white token when the value is empty with whitespace', () => {
      expect(tokenize('key = ')).toEqual([
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '])
      ])
    })

    it('still accepts a continuation after an empty trailing-whitespace value', () => {
      expect(tokenize('key = \n  G28')).toEqual([
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' ']),
        t(['white', '  '], ['string', 'G28'])
      ])
    })
  })

  describe('multi-line continuations', () => {
    it('continues into more-indented lines (zero-indent key)', () => {
      expect(tokenize('gcode:\n  G28\n  G1 X0')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28']),
        t(['white', '  '], ['string', 'G1 X0'])
      ])
    })

    it('continues into deeper-indented lines (indented key, $S2 capture)', () => {
      expect(tokenize('  parent = v\n    child')).toEqual([
        t(['white', '  '], ['keyword', 'parent'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'v']),
        t(['white', '    '], ['string', 'child'])
      ])
    })

    it('returns to root when next line drops below key indent', () => {
      expect(tokenize('gcode:\n  G28\nother_key = 1')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28']),
        t(['keyword', 'other_key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', '1'])
      ])
    })

    it('treats equal-indent next line as a sibling, not a continuation', () => {
      expect(tokenize('  parent = v\n  sibling = w')).toEqual([
        t(['white', '  '], ['keyword', 'parent'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'v']),
        t(['white', '  '], ['keyword', 'sibling'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'w'])
      ])
    })

    it('skips blank lines while waiting for the continuation', () => {
      expect(tokenize('gcode:\n\n  G28')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(),
        t(['white', '  '], ['string', 'G28'])
      ])
    })

    it('skips full-line comments while waiting for the continuation', () => {
      expect(tokenize('gcode:\n# blank-ish\n  G28')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['comment', '# blank-ish']),
        t(['white', '  '], ['string', 'G28'])
      ])
    })

    it('also skips ; comment lines while waiting', () => {
      expect(tokenize('gcode:\n; mid\n  G28')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['comment', '; mid']),
        t(['white', '  '], ['string', 'G28'])
      ])
    })

    it('skips indented comment lines while waiting', () => {
      expect(tokenize('gcode:\n  # indented\n  G28')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['white', '  '], ['comment', '# indented']),
        t(['white', '  '], ['string', 'G28'])
      ])
    })

    it('skips whitespace-only lines while waiting', () => {
      expect(tokenize('gcode:\n   \n  G28')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['white', '   ']),
        t(['white', '  '], ['string', 'G28'])
      ])
    })

    // The `@value` state has its own inline-comment rule, so a `;` (or
    // `#`) preceded by whitespace inside a continuation body is stripped
    // the same way as on the original key=value line.
    it('strips inline comments inside a continuation body', () => {
      expect(tokenize('gcode:\n  G28 ; mid-comment')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28'], ['white', ' '], ['comment', '; mid-comment'])
      ])
    })

    // `$S2` is a literal byte-substitution: a key indented with two
    // spaces is *not* continued by a tab-indented next line, even though
    // they may render the same width.
    it('does not continue when next-line indent does not start with the key indent literally', () => {
      expect(tokenize('\tgcode:\n  G28')).toEqual([
        t(['white', '\t'], ['keyword', 'gcode'], ['separator', ':']),
        t(['white', '  '], ['invalid', 'G28'])
      ])
    })

    it('weaves blank lines and indented comments through a multi-line continuation', () => {
      expect(tokenize('gcode:\n  G28\n\n  ; reset\n  G1')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28']),
        t(),
        t(['white', '  '], ['comment', '; reset']),
        t(['white', '  '], ['string', 'G1'])
      ])
    })

    it('does not continue when the next line has no indent', () => {
      // `G28` with zero indent fails the continuation lookahead and falls
      // through to root, where the catch-all rule emits `invalid`.
      expect(tokenize('key:\nG28')).toEqual([
        t(['keyword', 'key'], ['separator', ':']),
        t(['invalid', 'G28'])
      ])
    })

    // A `[section]`-shaped line inside an active continuation is *not* a
    // section header — the tokenizer is in `@value` and the value rule
    // greedily consumes `[foo]` as a single `string` token. Pinning this
    // catches an accidental `^` anchor on the section regex bringing it
    // into root precedence over an active continuation.
    it('treats an indented [section] line as part of the continuation value', () => {
      expect(tokenize('gcode:\n  [foo]')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['white', '  '], ['string', '[foo]'])
      ])
    })
  })

  describe('SAVE_CONFIG marker (#*#)', () => {
    it('tokenizes #*# lines as comment.control.save-config', () => {
      expect(tokenize('#*# [stepper_x]')).toEqual([
        t(['comment.control.save-config', '#*# [stepper_x]'])
      ])
    })

    it('does not match a regular # comment', () => {
      expect(tokenize('# hello')).toEqual([t(['comment', '# hello'])])
    })

    // Klipper's `_read_config_file` strips the SAVE_CONFIG block by
    // `line.startswith('#*#')` (column 0 only). The tokenizer's rule has
    // a `^` anchor too, so an indented `#*#` is *not* save-config — it
    // falls through to the regular `[#;].*$` comment rule after the
    // whitespace prefix is consumed.
    it('does not match #*# preceded by whitespace (column 0 only)', () => {
      expect(tokenize('  #*# [stepper_x]')).toEqual([
        t(['white', '  '], ['comment', '#*# [stepper_x]'])
      ])
    })
  })

  describe('edge cases', () => {
    it.each<[string, TokenLine[][]]>([
      ['', [t()]],
      ['# hello', [t(['comment', '# hello'])]],
      ['; hello', [t(['comment', '; hello'])]],
      ['   ', [t(['white', '   '])]],
      ['???', [t(['invalid', '???'])]],
      // Empty section header — `[^\]]+` requires at least one inner char,
      // so `[]` falls through to the catch-all `.*$` rule.
      ['[]', [t(['invalid', '[]'])]],
      // Lines that start with a separator have no key, so the root rule
      // doesn't match and the whole line is consumed by the catch-all.
      ['=value', [t(['invalid', '=value'])]],
      [':foo', [t(['invalid', ':foo'])]]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })
  })
})
