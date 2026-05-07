import { conf, language } from '../moonraker-config.monarch'
import { registerLanguage, type TokenLine, tokenBuilder, tokenizeLines } from './tokenize-helper'

const LANG = 'moonraker-config'

const t = tokenBuilder(LANG)

const tokenize = (text: string) => tokenizeLines(text, LANG)

beforeAll(() => {
  registerLanguage(LANG, language, conf)
})

describe('moonraker-config Monarch tokenizer', () => {
  describe('section headers', () => {
    it.each<[string, TokenLine[][]]>([
      [
        '[server]',
        [t(['bracket', '['], ['type.identifier', 'server'], ['bracket', ']'])]
      ],
      [
        '[machine name]',
        [t(['bracket', '['], ['type.identifier', 'machine name'], ['bracket', ']'])]
      ],
      // The Moonraker pre-processor strips inline comments before configparser
      // sees the line; the tokenizer does not replicate the strip — these
      // assertions pin the actual Monaco output.
      [
        '[server]#x',
        [t(['bracket', '['], ['type.identifier', 'server'], ['bracket', ']'], ['comment', '#x'])]
      ],
      [
        '[server] #x',
        [t(['bracket', '['], ['type.identifier', 'server'], ['bracket', ']'], ['white', ' '], ['comment', '#x'])]
      ],
      [
        '[server];x',
        [t(['bracket', '['], ['type.identifier', 'server'], ['bracket', ']'], ['comment', ';x'])]
      ],
      [
        '[server] ;x',
        [t(['bracket', '['], ['type.identifier', 'server'], ['bracket', ']'], ['white', ' '], ['comment', ';x'])]
      ]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
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

  describe('inline value comments (whitespace-before-sigil rule)', () => {
    it.each<[string, TokenLine[][]]>([
      [
        'key = value;not-a-comment',
        [t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value;not-a-comment'])]
      ],
      [
        'key = value#not-a-comment',
        [t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value#not-a-comment'])]
      ],
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
      ]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
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

    // The Moonraker pre-processor (see top-of-file comments in
    // moonraker-config.monarch.ts) treats ` \#` / ` \;` as an escape that
    // resolves to a literal sigil in the value. The tokenizer does not
    // implement this — the backslash makes the next char non-sigil, so the
    // value rule's `[^ \t#;]` lookahead succeeds and the whole tail is
    // swallowed into a single string token. Pin the current behaviour.
    it('does not implement the backslash escape (whole tail becomes one string)', () => {
      expect(tokenize('key = value \\;literal')).toEqual([
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value \\;literal'])
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
      expect(tokenize('key:\nG28')).toEqual([
        t(['keyword', 'key'], ['separator', ':']),
        t(['invalid', 'G28'])
      ])
    })
  })

  // Klipper has a dedicated `#*#` SAVE_CONFIG token; Moonraker does not.
  // This block pins the negative case so an accidental copy from
  // klipper-config.monarch.ts would be caught.
  describe('SAVE_CONFIG marker is klipper-only', () => {
    it('tokenizes #*# lines as a plain comment', () => {
      expect(tokenize('#*# [stepper_x]')).toEqual([t(['comment', '#*# [stepper_x]'])])
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
