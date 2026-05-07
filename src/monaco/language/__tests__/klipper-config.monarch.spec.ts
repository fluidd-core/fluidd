import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { conf, language } from '../klipper-config.monarch'

const LANG = 'klipper-config'

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
      ]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
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
      // `G28` with zero indent fails the continuation lookahead and falls
      // through to root, where the catch-all rule emits `invalid`.
      expect(tokenize('key:\nG28')).toEqual([
        t(['keyword', 'key'], ['separator', ':']),
        t(['invalid', 'G28'])
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
