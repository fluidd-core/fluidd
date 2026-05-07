import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { conf, language } from '../moonraker-config.monarch'

const LANG = 'moonraker-config'

interface TokenLine { type: string, value: string }

// Variadic line-builder. Each `[baseType, value]` tuple becomes one token;
// Monaco appends `.<langId>` to every Monarch token type.
const t = (...tokens: Array<[baseType: string, value: string]>): TokenLine[] =>
  tokens.map(([baseType, value]) => ({ type: `${baseType}.${LANG}`, value }))

const tokenize = (text: string): TokenLine[][] => {
  const lines = text.split('\n')
  return monaco.editor.tokenize(text, LANG).map((tokens, lineIdx) => {
    const line = lines[lineIdx] ?? ''
    return tokens.map((tok, i) => ({
      type: tok.type,
      value: line.slice(tok.offset, tokens[i + 1]?.offset ?? line.length)
    }))
  })
}

beforeAll(() => {
  monaco.languages.register({ id: LANG })
  monaco.languages.setMonarchTokensProvider(LANG, language)
  monaco.languages.setLanguageConfiguration(LANG, conf)
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
      ]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
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
      ['???', [t(['invalid', '???'])]]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })
  })
})
