import { conf, language } from '../klipper-config.monarch'
import { registerLanguage, type TokenLine, tokenBuilder, tokenizeLines } from './tokenize-helper'

const LANG = 'klipper-config'

const t = tokenBuilder(LANG)

const tokenize = (text: string) => tokenizeLines(text, LANG)

// The tokenizer starts in `@root`, which has no key/value rule —
// configparser raises `MissingSectionHeaderError` for keys before any
// `[section]`. Most tests below describe behavior *inside* a section, so
// we prepend a section header and slice it off the result.
const tokenizeInSection = (text: string) => tokenize(`[s]\n${text}`).slice(1)

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
      // Indented section header — the rule's `^([ \t]*)` prefix captures
      // leading whitespace as `white`. configparser's SECTCRE allows the
      // same: section headers do not need to start at column 0.
      [
        '  [extruder]',
        [t(['white', '  '], ['bracket', '['], ['type.identifier', 'extruder'], ['bracket', ']'])]
      ],
      [
        '\t[extruder]',
        [t(['white', '\t'], ['bracket', '['], ['type.identifier', 'extruder'], ['bracket', ']'])]
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
      expect(tokenizeInSection(input)).toEqual(expected)
    })

    // The keyword char class `[^#;=: \t[]+` excludes `[` from the *first*
    // run of key chars, so a key starting with `key[` cannot reach the
    // `=` separator and the whole line falls through to the catch-all.
    it('rejects keys whose first run contains [ (key[0] = v)', () => {
      expect(tokenizeInSection('key[0] = v')).toEqual([t(['invalid', 'key[0] = v'])])
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
      expect(tokenizeInSection(input)).toEqual(expected)
    })

    // Trailing whitespace after the value: the value rule emits `string`,
    // then the empty-value rule's `[ \t]*` consumes the rest as `white`
    // and (on @eos) transitions to `@checkValue.$S2` so a continuation
    // can still follow on the next line.
    it('emits trailing whitespace after a value as a white token', () => {
      expect(tokenizeInSection('key = value   ')).toEqual([
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value'], ['white', '   '])
      ])
    })

    // Empty value with a trailing space at end of line — the `@value`
    // state's empty-value rule matches `[ \t]*` and, on @eos, transitions
    // to `@checkValue` so the next line can still continue the value.
    it('emits a trailing white token when the value is empty with whitespace', () => {
      expect(tokenizeInSection('key = ')).toEqual([
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '])
      ])
    })

    it('still accepts a continuation after an empty trailing-whitespace value', () => {
      expect(tokenizeInSection('key = \n  G28')).toEqual([
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' ']),
        t(['white', '  '], ['string', 'G28'])
      ])
    })
  })

  describe('multi-line continuations', () => {
    // `description` is deliberately not a G-code key, so this block pins the
    // generic continuation machinery rather than the G-code path below.
    it('continues into more-indented lines (zero-indent key)', () => {
      expect(tokenizeInSection('description:\n  G28\n  G1 X0')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28']),
        t(['white', '  '], ['string', 'G1 X0'])
      ])
    })

    it('continues into deeper-indented lines (indented key, $S2 capture)', () => {
      expect(tokenizeInSection('  parent = v\n    child')).toEqual([
        t(['white', '  '], ['keyword', 'parent'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'v']),
        t(['white', '    '], ['string', 'child'])
      ])
    })

    it('returns to root when next line drops below key indent', () => {
      expect(tokenizeInSection('description:\n  G28\nother_key = 1')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28']),
        t(['keyword', 'other_key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', '1'])
      ])
    })

    it('treats equal-indent next line as a sibling, not a continuation', () => {
      expect(tokenizeInSection('  parent = v\n  sibling = w')).toEqual([
        t(['white', '  '], ['keyword', 'parent'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'v']),
        t(['white', '  '], ['keyword', 'sibling'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'w'])
      ])
    })

    it('skips blank lines while waiting for the continuation', () => {
      expect(tokenizeInSection('description:\n\n  G28')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(),
        t(['white', '  '], ['string', 'G28'])
      ])
    })

    it('skips full-line comments while waiting for the continuation', () => {
      expect(tokenizeInSection('description:\n# blank-ish\n  G28')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['comment', '# blank-ish']),
        t(['white', '  '], ['string', 'G28'])
      ])
    })

    it('also skips ; comment lines while waiting', () => {
      expect(tokenizeInSection('description:\n; mid\n  G28')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['comment', '; mid']),
        t(['white', '  '], ['string', 'G28'])
      ])
    })

    it('skips indented comment lines while waiting', () => {
      expect(tokenizeInSection('description:\n  # indented\n  G28')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['white', '  '], ['comment', '# indented']),
        t(['white', '  '], ['string', 'G28'])
      ])
    })

    it('skips whitespace-only lines while waiting', () => {
      expect(tokenizeInSection('description:\n   \n  G28')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['white', '   ']),
        t(['white', '  '], ['string', 'G28'])
      ])
    })

    // The `@value` state has its own inline-comment rule, so a `;` (or
    // `#`) preceded by whitespace inside a continuation body is stripped
    // the same way as on the original key=value line.
    it('strips inline comments inside a continuation body', () => {
      expect(tokenizeInSection('description:\n  G28 ; mid-comment')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28'], ['white', ' '], ['comment', '; mid-comment'])
      ])
    })

    // `$S2` is a literal byte-substitution: a key indented with two
    // spaces is *not* continued by a tab-indented next line, even though
    // they may render the same width.
    it('does not continue when next-line indent does not start with the key indent literally', () => {
      expect(tokenizeInSection('\tdescription:\n  G28')).toEqual([
        t(['white', '\t'], ['keyword', 'description'], ['separator', ':']),
        t(['white', '  '], ['invalid', 'G28'])
      ])
    })

    it('weaves blank lines and indented comments through a multi-line continuation', () => {
      expect(tokenizeInSection('description:\n  G28\n\n  ; reset\n  G1')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28']),
        t(),
        t(['white', '  '], ['comment', '; reset']),
        t(['white', '  '], ['string', 'G1'])
      ])
    })

    it('does not continue when the next line has no indent', () => {
      // `G28` with zero indent fails the continuation lookahead and falls
      // through to root, where the catch-all rule emits `invalid`.
      expect(tokenizeInSection('key:\nG28')).toEqual([
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
      expect(tokenizeInSection('description:\n  [foo]')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['white', '  '], ['string', '[foo]'])
      ])
    })

    // `checkValue` has a dedicated `^#\*#` rematch rule that aborts the
    // continuation and re-runs the line via `@content`. Without this, the
    // SAVE_CONFIG block at the end of a printer.cfg could be mis-tokenized
    // as a continuation of the previous value.
    it('aborts the continuation when a #*# save-config line appears', () => {
      expect(tokenizeInSection('description:\n  G28\n#*# [stepper_x]')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28']),
        t(['comment.control.save-config', '#*# [stepper_x]'])
      ])
    })

    // The `''` empty-rematch fallback in `checkValue` defers a zero-indent
    // line back to `@content`, where `@root`'s section regex matches.
    it('aborts the continuation when a zero-indent [section] header appears', () => {
      expect(tokenizeInSection('description:\n  G28\n[other_section]')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28']),
        t(['bracket', '['], ['type.identifier', 'other_section'], ['bracket', ']'])
      ])
    })

    // The `^#\*#` rematch in `checkValue` is column-0 only; an indented
    // `#*#` falls to the `^([ \t]*)((?:[#;].*)?)$` blank-or-comment rule
    // and tokenizes as a regular comment. Klipper's `_read_config_file`
    // also uses `line.startswith('#*#')` (column 0).
    it('treats an indented #*# inside a continuation as a plain comment', () => {
      expect(tokenizeInSection('description:\n  G28\n  #*# foo')).toEqual([
        t(['keyword', 'description'], ['separator', ':']),
        t(['white', '  '], ['string', 'G28']),
        t(['white', '  '], ['comment', '#*# foo'])
      ])
    })
  })

  describe('G-code values', () => {
    it.each<[string, TokenLine[][]]>([
      [
        'gcode: G28',
        [t(['keyword', 'gcode'], ['separator', ':'], ['white', ' '], ['keyword.command.g', 'G28'])]
      ],
      [
        'activate_gcode: G28',
        [t(['keyword', 'activate_gcode'], ['separator', ':'], ['white', ' '], ['keyword.command.g', 'G28'])]
      ],
      [
        'pre_unload_gcode: G28',
        [t(['keyword', 'pre_unload_gcode'], ['separator', ':'], ['white', ' '], ['keyword.command.g', 'G28'])]
      ],
      // RawConfigParser lower-cases option names.
      [
        'GCODE: G28',
        [t(['keyword', 'GCODE'], ['separator', ':'], ['white', ' '], ['keyword.command.g', 'G28'])]
      ],
      // Merely *starts* with `gcode` — a plain value, not a template.
      [
        'gcode_id: C',
        [t(['keyword', 'gcode_id'], ['separator', ':'], ['white', ' '], ['string', 'C'])]
      ],
      [
        'gcode_x_offset: 1.5',
        [t(['keyword', 'gcode_x_offset'], ['separator', ':'], ['white', ' '], ['string', '1.5'])]
      ],
      [
        'gcode_load_sequence: manual',
        [t(['keyword', 'gcode_load_sequence'], ['separator', ':'], ['white', ' '], ['string', 'manual'])]
      ]
    ])('tokenizes %j', (input, expected) => {
      expect(tokenizeInSection(input)).toEqual(expected)
    })

    it('tokenizes a G-code command and its params', () => {
      expect(tokenizeInSection('gcode:\n  G1 X10 Y20 F6000')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(
          ['white', '  '],
          ['keyword.command.g', 'G1'], ['white', ' '],
          ['keyword.param.x', 'X10'], ['white', ' '],
          ['keyword.param.y', 'Y20'], ['white', ' '],
          ['keyword.param.f', 'F6000']
        )
      ])
    })

    it('tokenizes a macro call with named params', () => {
      expect(tokenizeInSection('gcode:\n  SET_PIN PIN=my_led VALUE=1')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(
          ['white', '  '],
          ['keyword.macro', 'SET_PIN'], ['white', ' '],
          ['keyword.param', 'PIN'], ['operator', '='], ['string', 'my_led'], ['white', ' '],
          ['keyword.param', 'VALUE'], ['operator', '='], ['string', '1']
        )
      ])
    })

    it('resumes G-code parsing on the next continuation line', () => {
      expect(tokenizeInSection('gcode:\n  G28\n  G1 X0')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['white', '  '], ['keyword.command.g', 'G28']),
        t(['white', '  '], ['keyword.command.g', 'G1'], ['white', ' '], ['keyword.param.x', 'X0'])
      ])
    })

    // configparser strips these from the raw line before Klipper or Jinja
    // sees it, so they win over G-code/Jinja tokenizing.
    it.each<[string, TokenLine[][]]>([
      [
        'gcode:\n  G28 ; note',
        [
          t(['keyword', 'gcode'], ['separator', ':']),
          t(['white', '  '], ['keyword.command.g', 'G28'], ['white', ' '], ['comment', '; note'])
        ]
      ],
      [
        'gcode:\n  {% set x = 1 %} ; note',
        [
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['delimiter.jinja', '{%'], ['white', ' '],
            ['keyword.control.jinja', 'set'], ['white', ' '],
            ['variable.jinja', 'x'], ['white', ' '],
            ['operator', '='], ['white', ' '],
            ['number.jinja', '1'], ['white', ' '],
            ['delimiter.jinja', '%}'], ['white', ' '],
            ['comment', '; note']
          )
        ]
      ]
    ])('strips a whitespace-preceded comment inside a G-code value: %j', (input, expected) => {
      expect(tokenizeInSection(input)).toEqual(expected)
    })

    // configparser keeps `;note` in the value, then Klipper's G-code parser
    // strips it — so unlike a plain value, this is a comment.
    it.each<[string, TokenLine[][]]>([
      [
        'gcode:\n  G28;note',
        [
          t(['keyword', 'gcode'], ['separator', ':']),
          t(['white', '  '], ['keyword.command.g', 'G28'], ['comment', ';note'])
        ]
      ],
      // M117/M118 read the raw line, so `;` stays — but configparser has
      // already cut ` ;tail`.
      [
        'gcode:\n  M117 Hello;World ;tail',
        [
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['keyword.command.m', 'M117'], ['string', ' Hello;World'],
            ['white', ' '], ['comment', ';tail']
          )
        ]
      ],
      [
        'gcode:\n  M117 test #test',
        [
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['keyword.command.m', 'M117'], ['string', ' test'],
            ['white', ' '], ['comment', '#test']
          )
        ]
      ],
      [
        'gcode:\n  M118 test ;test',
        [
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['keyword.command.m', 'M118'], ['string', ' test'],
            ['white', ' '], ['comment', ';test']
          )
        ]
      ]
    ])('applies Klipper G-code comment rules, not configparser ones: %j', (input, expected) => {
      expect(tokenizeInSection(input)).toEqual(expected)
    })

    // The macro-params sub-state is pushed mid-line and must carry the key
    // indent ($S2), or the continuation check swallows the next sibling key.
    it('keeps the key indent when a comment ends a macro call', () => {
      expect(tokenizeInSection('  gcode:\n    MY_MACRO ; note\n  other = 1')).toEqual([
        t(['white', '  '], ['keyword', 'gcode'], ['separator', ':']),
        t(['white', '    '], ['keyword.macro', 'MY_MACRO'], ['white', ' '], ['comment', '; note']),
        t(['white', '  '], ['keyword', 'other'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', '1'])
      ])
    })

    describe('Jinja2 templates', () => {
      // Klipper's Jinja env uses single-brace expressions, not `{{ }}`.
      it('tokenizes a {% set %} statement', () => {
        expect(tokenizeInSection('gcode:\n  {% set x = params.X|default(10) %}')).toEqual([
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['delimiter.jinja', '{%'], ['white', ' '],
            ['keyword.control.jinja', 'set'], ['white', ' '],
            ['variable.jinja', 'x'], ['white', ' '],
            ['operator', '='], ['white', ' '],
            ['variable.jinja', 'params'], ['operator', '.'], ['variable.jinja', 'X'],
            ['operator', '|'], ['variable.jinja', 'default'], ['operator', '('], ['number.jinja', '10'], ['operator', ')'],
            ['white', ' '],
            ['delimiter.jinja', '%}']
          )
        ])
      })

      // `MACRO` and `.call` are variables, not keywords.
      it('does not treat upper-case names or attributes as keywords', () => {
        expect(tokenizeInSection('gcode:\n  {% set MACRO = params.MACRO | default(layer.call, True) %}')).toEqual([
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['delimiter.jinja', '{%'], ['white', ' '],
            ['keyword.control.jinja', 'set'], ['white', ' '],
            ['variable.jinja', 'MACRO'], ['white', ' '],
            ['operator', '='], ['white', ' '],
            ['variable.jinja', 'params'], ['operator', '.'], ['variable.jinja', 'MACRO'], ['white', ' '],
            ['operator', '|'], ['white', ' '],
            ['variable.jinja', 'default'], ['operator', '('],
            ['variable.jinja', 'layer'], ['operator', '.'], ['variable.jinja', 'call'],
            ['operator', ','], ['white', ' '],
            ['constant.language.jinja', 'True'], ['operator', ')'], ['white', ' '],
            ['delimiter.jinja', '%}']
          )
        ])
      })

      // Must close back into the params state, or `MOVE=1` reads as a macro.
      it('tokenizes a Jinja expression in a macro argument value', () => {
        expect(tokenizeInSection('gcode:\n  SET_GCODE_OFFSET Z={params.Z|float} MOVE=1')).toEqual([
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['keyword.macro', 'SET_GCODE_OFFSET'], ['white', ' '],
            ['keyword.param', 'Z'], ['operator', '='],
            ['delimiter.jinja', '{'],
            ['variable.jinja', 'params'], ['operator', '.'], ['variable.jinja', 'Z'],
            ['operator', '|'], ['variable.jinja', 'float'],
            ['delimiter.jinja', '}'], ['white', ' '],
            ['keyword.param', 'MOVE'], ['operator', '='], ['string', '1']
          )
        ])
      })

      // A region that is only a prefix of the argument must close back into it.
      it('tokenizes a compound argument value', () => {
        expect(tokenizeInSection('gcode:\n  SET_X V={% if 1 %}1{% endif %} MOVE=1')).toEqual([
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['keyword.macro', 'SET_X'], ['white', ' '],
            ['keyword.param', 'V'], ['operator', '='],
            ['delimiter.jinja', '{%'], ['white', ' '],
            ['keyword.control.jinja', 'if'], ['white', ' '],
            ['number.jinja', '1'], ['white', ' '], ['delimiter.jinja', '%}'],
            ['string', '1'],
            ['delimiter.jinja', '{%'], ['white', ' '],
            ['keyword.control.jinja', 'endif'], ['white', ' '], ['delimiter.jinja', '%}'],
            ['white', ' '],
            ['keyword.param', 'MOVE'], ['operator', '='], ['string', '1']
          )
        ])
      })

      // A param letter before `{` is a Jinja expression, not a decimal.
      it('tokenizes a param value substituted from a Jinja expression', () => {
        expect(tokenizeInSection('gcode:\n  G1 X{x} Y10')).toEqual([
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['keyword.command.g', 'G1'], ['white', ' '],
            ['keyword.param.x', 'X'],
            ['delimiter.jinja', '{'], ['variable.jinja', 'x'], ['delimiter.jinja', '}'],
            ['white', ' '],
            ['keyword.param.y', 'Y10']
          )
        ])
      })

      // An open `{% if %}` stays open across a continuation line.
      it('keeps a Jinja statement open across a wrapped continuation line', () => {
        expect(tokenizeInSection('gcode:\n  {% if printer.toolhead.homed_axes\n      != "xyz" %}\n    G28\n  {% endif %}')).toEqual([
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['delimiter.jinja', '{%'], ['white', ' '],
            ['keyword.control.jinja', 'if'], ['white', ' '],
            ['variable.jinja', 'printer'], ['operator', '.'], ['variable.jinja', 'toolhead'], ['operator', '.'], ['variable.jinja', 'homed_axes']
          ),
          t(
            ['white', '      '],
            ['operator', '!='], ['white', ' '],
            ['string.jinja', '"xyz"'], ['white', ' '],
            ['delimiter.jinja', '%}']
          ),
          t(['white', '    '], ['keyword.command.g', 'G28']),
          t(['white', '  '], ['delimiter.jinja', '{%'], ['white', ' '], ['keyword.control.jinja', 'endif'], ['white', ' '], ['delimiter.jinja', '%}'])
        ])
      })
    })

    // Dedenting out of a G-code value must cleanly hand control back to
    // `@content` — a sibling key and a new `[section]` header both need to
    // tokenize normally afterward, not get swallowed as more G-code.
    // Must still reach the continuation check, or the rest of the file is
    // read as part of the value.
    it.each<[string, TokenLine[][]]>([
      [
        'gcode:\n  MY_MACRO\n[next_section]',
        [
          t(['keyword', 'gcode'], ['separator', ':']),
          t(['white', '  '], ['keyword.macro', 'MY_MACRO']),
          t(['bracket', '['], ['type.identifier', 'next_section'], ['bracket', ']'])
        ]
      ],
      [
        'gcode:\n  SET_PIN PIN=x\nother = 1',
        [
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['keyword.macro', 'SET_PIN'], ['white', ' '],
            ['keyword.param', 'PIN'], ['operator', '='], ['string', 'x']
          ),
          t(['keyword', 'other'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', '1'])
        ]
      ],
      // Unterminated quote recovery must not strand the sub-machine either.
      [
        'gcode:\n  SET_PIN PIN="a\nother = 1',
        [
          t(['keyword', 'gcode'], ['separator', ':']),
          t(
            ['white', '  '],
            ['keyword.macro', 'SET_PIN'], ['white', ' '],
            ['keyword.param', 'PIN'], ['operator', '='],
            ['string.quote', '"'], ['invalid', 'a']
          ),
          t(['keyword', 'other'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', '1'])
        ]
      ]
    ])('ends the value when a line ends inside a macro call: %j', (input, expected) => {
      expect(tokenizeInSection(input)).toEqual(expected)
    })

    it('returns to normal tokenizing after dedenting out of a G-code value', () => {
      expect(tokenizeInSection('gcode:\n  G28\nother_key = 1')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['white', '  '], ['keyword.command.g', 'G28']),
        t(['keyword', 'other_key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', '1'])
      ])
    })

    it('aborts a G-code continuation when a #*# save-config line appears', () => {
      expect(tokenizeInSection('gcode:\n  G28\n#*# [stepper_x]')).toEqual([
        t(['keyword', 'gcode'], ['separator', ':']),
        t(['white', '  '], ['keyword.command.g', 'G28']),
        t(['comment.control.save-config', '#*# [stepper_x]'])
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

    // The `^#\*#.*$` rule's `.*$` greedily consumes the rest of the line,
    // so save-config lines that *look* like key=value (the typical content
    // of an auto-saved block — `#*# position_endstop = 224.000`) are still
    // a single save-config token. Pinning this catches a regression where
    // the rule's right side is tightened or split.
    it.each<[string, TokenLine[][]]>([
      ['#*# position_endstop = 224.000', [t(['comment.control.save-config', '#*# position_endstop = 224.000'])]],
      ['#*# foo: bar', [t(['comment.control.save-config', '#*# foo: bar'])]],
      ['#*#', [t(['comment.control.save-config', '#*#'])]]
    ])('greedily captures %j as a single save-config token', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })
  })

  // Klipper's configparser raises `MissingSectionHeaderError` when a
  // key=value line appears before any [section]. The tokenizer mirrors
  // this by starting in `@root`, which has no key/value rule —
  // bare lines fall through to the catch-all.
  describe('top-of-file (root — pre-section)', () => {
    it.each<[string, TokenLine[][]]>([
      ['key = value', [t(['invalid', 'key = value'])]],
      ['key: value', [t(['invalid', 'key: value'])]],
      ['gcode:', [t(['invalid', 'gcode:'])]],
      // The catch-all has no `^` anchor, so the leading whitespace rule
      // consumes the indent first and the rest goes to invalid.
      ['  key = value', [t(['white', '  '], ['invalid', 'key = value'])]]
    ])('tokenizes %j as invalid before any section', (input, expected) => {
      expect(tokenize(input)).toEqual(expected)
    })

    // A `[section]` header (matched by `@root`) transitions to
    // `@content`, where the key/value rule is enabled. Subsequent sections
    // and key/value lines all run through `@content`.
    it('transitions to @content after a [section] header', () => {
      expect(tokenize('[server]\nkey = value')).toEqual([
        t(['bracket', '['], ['type.identifier', 'server'], ['bracket', ']']),
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'value'])
      ])
    })

    // `@root` includes the `[#;].*$` comment rule, so leading-file
    // comments (license headers, hand-written notes above the first
    // section) tokenize correctly even before any `[section]` opens.
    it('tokenizes comments before any section header, then continues to @content', () => {
      expect(tokenize('# hello\n[server]\nkey = v')).toEqual([
        t(['comment', '# hello']),
        t(['bracket', '['], ['type.identifier', 'server'], ['bracket', ']']),
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'v'])
      ])
    })

    // `@content` is sticky: a second `[section]` header (matched via the
    // `@root` include) keeps `next: 'content'`, so subsequent
    // key/value lines remain enabled.
    it('keeps key/value enabled across multiple sections', () => {
      expect(tokenize('[a]\nkey = v\n[b]\nkey = v')).toEqual([
        t(['bracket', '['], ['type.identifier', 'a'], ['bracket', ']']),
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'v']),
        t(['bracket', '['], ['type.identifier', 'b'], ['bracket', ']']),
        t(['keyword', 'key'], ['white', ' '], ['separator', '='], ['white', ' '], ['string', 'v'])
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

  // End-to-end tokenization of a realistic printer.cfg tail — section,
  // key/value, blank line, then the contiguous `#*#` SAVE_CONFIG block
  // Klipper auto-writes. Catches regressions in the interaction between
  // `@root`, `@content`, `@checkValue`, and the `#*#` rule that
  // unit tests above only exercise individually.
  describe('realistic printer.cfg snippet', () => {
    it('tokenizes a section + SAVE_CONFIG block end-to-end', () => {
      const input = [
        '[stepper_x]',
        'step_pin: PE2',
        '',
        '#*# <---------------------- SAVE_CONFIG ---------------------->',
        '#*# DO NOT EDIT THIS BLOCK OR BELOW. The contents are auto-generated.',
        '#*#',
        '#*# [stepper_x]',
        '#*# position_endstop = 224.000'
      ].join('\n')
      expect(tokenize(input)).toEqual([
        t(['bracket', '['], ['type.identifier', 'stepper_x'], ['bracket', ']']),
        t(['keyword', 'step_pin'], ['separator', ':'], ['white', ' '], ['string', 'PE2']),
        t(),
        t(['comment.control.save-config', '#*# <---------------------- SAVE_CONFIG ---------------------->']),
        t(['comment.control.save-config', '#*# DO NOT EDIT THIS BLOCK OR BELOW. The contents are auto-generated.']),
        t(['comment.control.save-config', '#*#']),
        t(['comment.control.save-config', '#*# [stepper_x]']),
        t(['comment.control.save-config', '#*# position_endstop = 224.000'])
      ])
    })
  })
})
