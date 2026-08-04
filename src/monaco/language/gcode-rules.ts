import { upperFirst } from 'lodash-es'
import type * as monaco from 'monaco-editor/editor/editor.api'

// Shared G-code tokenizer rules, used by the standalone `gcode` language and
// embedded in `klipper-config` values (`gcode`, `*_gcode`).
//
// Klipper's Jinja env uses non-standard delimiters — single-brace expressions,
// not `{{ }}` (klippy/extras/gcode_macro.py) — so these rules are not reusable
// for standard Jinja. Both hosts must set `ignoreCase: true`.

const JINJA_KEYWORDS = [
  'if', 'elif', 'else', 'endif',
  'for', 'endfor', 'in',
  'is', 'not', 'and', 'or',
  'set', 'block', 'endblock',
  'macro', 'endmacro', 'call', 'endcall',
  'filter', 'endfilter',
  'with', 'endwith', 'without', 'context',
  'include', 'import', 'from', 'as',
  'do', 'break', 'continue',
  'raw', 'endraw'
]

const JINJA_CONSTANTS = ['true', 'false', 'none']

// M117/M118 read the raw command line (`get_raw_command_parameters` in
// klippy/gcode.py), so `;` does not start a comment in their payload.
// eslint-disable-next-line regexp/no-useless-assertions
const MESSAGE = /(m11[78](?!\d)@override)(.*)$/

// Embedded, configparser has already stripped a whitespace-preceded `#`/`;`
// before Klipper sees the line, so the payload stops there instead.
// eslint-disable-next-line regexp/no-useless-assertions
const MESSAGE_EMBEDDED = /(m11[78](?!\d)@override)((?:[^ \t]|[ \t]+(?![#;]))*)/

const DECIMAL = /[-+]?(?:\d+\.?\d*|\d*\.\d+)/

const OVERRIDE = /(?:\.\d+)?/

type Tokenizer = monaco.languages.IMonarchLanguage['tokenizer']
type Rule = monaco.languages.IMonarchLanguageRule
type Action = monaco.languages.IMonarchLanguageAction
type ExpandedAction = monaco.languages.IExpandedMonarchLanguageAction

export interface StandaloneGcodeRulesOptions {
  mode: 'standalone';

  /** Token for text matching none of the G-code rules. */
  fallback: string;
}

export interface EmbeddedGcodeRulesOptions {
  mode: 'embedded';

  /** Prepended to every generated state name, to avoid host collisions. */
  prefix: string;

  fallback: string;

  /**
   * Host state governing multi-line continuation. At end of line the
   * generated states hand back to `@<checkState>.<indent>.<kind>`, where
   * `kind` records any Jinja region left open; the host resumes with the
   * returned `resumeAction`.
   */
  checkState: string;

  /**
   * Inline comment pattern, capturing (1) leading whitespace and (2) the
   * comment. configparser strips these from the raw line before Klipper or
   * Jinja sees it, so the rule built from it wins in every generated state.
   */
  inlineComment: RegExp;
}

export type GcodeRulesOptions = StandaloneGcodeRulesOptions | EmbeddedGcodeRulesOptions

export interface GcodeRules {
  entryState: string;

  /** Action for the host's continuation rule. Embedded mode only. */
  resumeAction: Action;

  attributes: {
    decimal: RegExp;
    override: RegExp;
    jinjaConstants?: string[];
  };

  states: Tokenizer;
}

export function createGcodeRules (options: GcodeRulesOptions): GcodeRules {
  const { fallback } = options
  const embedded = options.mode === 'embedded'
  const prefix = options.mode === 'embedded' ? options.prefix : ''
  const checkState = options.mode === 'embedded' ? options.checkState : ''

  const name = (suffix: string): string => prefix ? prefix + upperFirst(suffix) : suffix

  const entryState = embedded ? name('value') : 'root'
  const paramsState = name('params')
  const argValueState = name('argValue')
  const stringState = name('string')
  const jinjaState = name('jinja')

  const prologue: Rule[] = options.mode === 'embedded'
    ? [[options.inlineComment, ['white', { token: 'comment', next: `@${checkState}.$S2.none` }]]]
    : []

  const abandon = '@popall'

  // Embedded, a line ending mid-macro must hand back to `checkState` or the
  // next line skips its continuation check — so the sub-machine moves with
  // `switchTo`, which keeps depth constant and strands no frame. Standalone
  // keeps push/pop and just resumes mid-macro on the next line.
  const enter = (state: string): ExpandedAction =>
    embedded ? { switchTo: `@${state}.$S2` } : { next: `@${state}` }

  const leaveTo = (state: string): ExpandedAction =>
    embedded ? { switchTo: `@${state}.$S2` } : { next: '@pop' }

  const handBack = `@${checkState}.$S2.none`

  // Records where to resume once the region closes. The tag must be lower
  // case and cannot be the state name: `$Sn` substitution runs through
  // `fixCase`, which `ignoreCase` makes destructive.
  const jinjaOpeners = (returnTag: 'value' | 'params' | 'arg'): Rule[] => {
    const open = (kind: string) =>
      ({ token: 'delimiter.jinja', switchTo: `@${jinjaState}.$S2.${kind}.${returnTag}` })

    return [
      [/\{%/, open('stmt')],
      [/\{#/, open('comment')],
      [/\{/, open('expr')]
    ]
  }

  // Monarch only re-evaluates rules while `pos < line.length`, so a rule
  // consuming to end of line gets no further pass — the state change has to be
  // in that same rule's action or it fires a line late. `resume` names the
  // Jinja region, if any, to pick back up in.
  const eosSwitch = (token: string, resume = 'none'): ExpandedAction =>
    embedded
      ? {
          cases: {
            '@eos': { token, switchTo: `@${checkState}.$S2.${resume}` },
            '@default': { token }
          }
        }
      : { token }

  const entryRules: Rule[] = [
    ...prologue,

    [
      /^(\s*)(n\d+)/,
      ['white', eosSwitch('keyword.command.n')]
    ],

    [
      /;.*$/,
      eosSwitch('comment')
    ],

    [
      /\*\d+/,
      eosSwitch('tag')
    ],

    [
      embedded ? MESSAGE_EMBEDDED : MESSAGE,
      ['keyword.command.m', eosSwitch('string')]
    ],

    [
      /([gmt])\d+@override/,
      eosSwitch('keyword.command.$1')
    ],

    [
      /[a-z_]{2,}\d*/,
      embedded
        ? {
            cases: {
              '@eos': { token: 'keyword.macro', switchTo: handBack },
              '@default': { token: 'keyword.macro', switchTo: `@${paramsState}.$S2` }
            }
          }
        : { token: 'keyword.macro', next: `@${paramsState}` }
    ],

    [
      /([a-mo-z])\s*@decimal/,
      eosSwitch('keyword.param.$1')
    ],

    ...(embedded
      ? ([
          // `G1 X{x}` — the rule above requires a literal decimal.
          [/([a-mo-z])(?=\{)/, { token: 'keyword.param.$1' }],

          ...jinjaOpeners('value')
        ] satisfies Rule[])
      : []),

    [
      /\s+/,
      eosSwitch('white')
    ],

    [
      /.*$/,
      eosSwitch(fallback)
    ]
  ]

  const paramsRules: Rule[] = [
    ...prologue,

    [
      /[*;]/,
      { token: '@rematch', ...leaveTo(entryState) }
    ],

    [
      /([a-z_]+)(=)/,
      ['keyword.param', {
        cases: {
          '@eos': embedded
            ? { token: 'operator', switchTo: handBack }
            : { token: 'operator', next: '@pop' },
          '@default': { token: 'operator', ...enter(argValueState) }
        }
      }]
    ],

    [
      /\s+/,
      eosSwitch('white')
    ],

    [
      '',
      { token: '', ...leaveTo(entryState) }
    ]
  ]

  const argValueRules: Rule[] = [
    ...prologue,

    [
      /[*;]/,
      { token: '@rematch', ...leaveTo(paramsState) }
    ],

    [
      /"/,
      {
        cases: {
          '@eos': embedded
            ? { token: 'invalid', switchTo: handBack }
            : { token: 'invalid', next: abandon },
          '@default': { token: 'string.quote', bracket: '@open', ...enter(stringState) }
        }
      }
    ],

    ...(embedded
      ? ([
          ...jinjaOpeners('arg'),

          // Stay put so a later `{…}` is Jinja too; whitespace ends the value.
          [/[^\s{]+/, eosSwitch('string')],

          [/\s+/, { token: '@rematch', switchTo: `@${paramsState}.$S2` }]
        ] satisfies Rule[])
      : ([
          [/\S+/, { token: 'string', next: '@pop' }]
        ] satisfies Rule[])),

    [
      '',
      { token: '', ...leaveTo(paramsState) }
    ]
  ]

  const stringRules: Rule[] = [
    ...prologue,

    [
      /(\\"|[^"])+/,
      {
        cases: {
          '@eos': embedded
            ? { token: 'invalid', switchTo: handBack }
            : { token: 'invalid', next: abandon },
          '@default': 'string'
        }
      }
    ],

    [
      /"/,
      {
        cases: {
          '@eos': embedded
            ? { token: 'string.quote', bracket: '@close', switchTo: handBack }
            : { token: 'string.quote', bracket: '@close', next: abandon },
          '@default': { token: 'string.quote', bracket: '@close', ...leaveTo(argValueState) }
        }
      }
    ]
  ]

  const states: Tokenizer = {
    [entryState]: entryRules,
    [paramsState]: paramsRules,
    [argValueState]: argValueRules,
    [stringState]: stringRules
  }

  if (embedded) {
    // A matched closer resumes G-code on the rest of the line, if any.
    const jinjaCloseEos = (token: string): Action => ({
      cases: {
        '@eos': { token, switchTo: `@${checkState}.$S2.none` },
        '$S4==params': { token, switchTo: `@${paramsState}.$S2` },
        '$S4==arg': { token, switchTo: `@${argValueState}.$S2` },
        '@default': { token, switchTo: `@${entryState}.$S2` }
      }
    })

    // Keeps $S3 across the line break so a continuation resumes this region.
    const stay = (token: string): ExpandedAction => eosSwitch(token, '$S3.$S4')

    // `ignoreCase` lowercases words before an `@list` lookup, making `MACRO` a
    // keyword. `$0==` matches the lower-case spelling only. Constants keep the
    // `@list` form — Jinja accepts `True`/`False`/`None` too.
    const wordCases: Record<string, ExpandedAction> = {
      ...Object.fromEntries(JINJA_KEYWORDS.map(word => [`$0==${word}`, stay('keyword.control.jinja')])),
      '@jinjaConstants': stay('constant.language.jinja'),
      '@default': stay('variable.jinja')
    }

    // Entered as `@<jinjaState>.<indent>.<kind>`; `kind` is the closer this
    // region waits on.
    states[jinjaState] = [
      ...prologue,

      [
        /%\}/,
        { cases: { '$S3==stmt': jinjaCloseEos('delimiter.jinja'), '@default': stay('operator') } }
      ],

      [
        /#\}/,
        { cases: { '$S3==comment': jinjaCloseEos('delimiter.jinja'), '@default': stay('comment') } }
      ],

      [
        /\}/,
        { cases: { '$S3==expr': jinjaCloseEos('delimiter.jinja'), '@default': stay('operator') } }
      ],

      [
        /"(?:\\.|[^"\\])*"/,
        stay('string.jinja')
      ],

      [
        /'(?:\\.|[^'\\])*'/,
        stay('string.jinja')
      ],

      [
        /@decimal/,
        stay('number.jinja')
      ],

      // Attribute access — the name is never a keyword, so this precedes the
      // identifier rule.
      [
        /(\.)([a-z_]\w*)/,
        ['operator', stay('variable.jinja')]
      ],

      [
        /[a-z_]\w*/,
        { cases: wordCases }
      ],

      [
        /[.,|()[\]]/,
        stay('operator')
      ],

      [
        /[=!<>]=|[-+*/%~<>=]/,
        stay('operator')
      ],

      [
        /[ \t]+/,
        stay('white')
      ],

      [
        /./,
        stay('invalid')
      ],

      // Defensive: only reachable against an already-empty remainder.
      [
        '',
        { token: '', switchTo: `@${checkState}.$S2.$S3.$S4` }
      ]
    ]
  }

  return {
    entryState,
    resumeAction: {
      cases: {
        '$S3==none': { token: 'white', switchTo: `@${entryState}.$S2` },
        '@default': { token: 'white', switchTo: `@${jinjaState}.$S2.$S3.$S4` }
      }
    },
    attributes: {
      decimal: DECIMAL,
      override: OVERRIDE,
      ...(embedded ? { jinjaConstants: JINJA_CONSTANTS } : {})
    },
    states
  }
}
