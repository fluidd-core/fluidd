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
const MESSAGE_COMMAND = /m11[78](?!\d)/

const MESSAGE = /(@messageCommand@override)(.*)$/

// Embedded, configparser has already stripped a whitespace-preceded `#`/`;`
// before Klipper sees the line, so the payload stops where INLINE_COMMENT
// would have started.
const MESSAGE_EMBEDDED = /(@messageCommand@override)((?:[^ \t]|[ \t]+(?![#;]))*)/

// configparser strips this from the raw line before Klipper or Jinja sees it,
// so the rule built from it heads every embedded state.
const INLINE_COMMENT = /([ \t]+)([#;].*)$/

const DECIMAL = /[-+]?(?:\d+\.?\d*|\d*\.\d+)/

const OVERRIDE = /(?:\.\d+)?/

type Tokenizer = monaco.languages.IMonarchLanguage['tokenizer']
type Rule = monaco.languages.IMonarchLanguageRule
type Action = monaco.languages.IMonarchLanguageAction
type ExpandedAction = monaco.languages.IExpandedMonarchLanguageAction

interface GcodeAttributes {
  messageCommand: RegExp;
  decimal: RegExp;
  override: RegExp;
}

export interface StandaloneGcodeRules {
  attributes: GcodeAttributes;

  states: Tokenizer;
}

export interface EmbeddedGcodeRules {
  /**
   * Host state deciding, at the start of every line, whether the value
   * continues. Generated states hand back to `@<checkState>.<indent>.<kind>`,
   * where `kind` records any Jinja region left open, so the host matches the
   * key indent as `$S2` and resumes with `resumeAction`.
   */
  checkState: string;

  /** Action for the host's key rule; `indent` is the capture holding it. */
  entryAction: (indent: string, token: string) => ExpandedAction;

  /** Action for the host's continuation rule. */
  resumeAction: Action;

  attributes: GcodeAttributes & { jinjaConstants: string[] };

  states: Tokenizer;
}

export function createGcodeRules (mode: 'standalone'): StandaloneGcodeRules
export function createGcodeRules (mode: 'embedded'): EmbeddedGcodeRules
export function createGcodeRules (mode: 'standalone' | 'embedded'): StandaloneGcodeRules | EmbeddedGcodeRules {
  const embedded = mode === 'embedded'

  // Unmatched text is an error in a .gcode file, but inside a config value it
  // is just more value.
  const fallback = embedded ? 'string' : 'invalid'

  const name = (suffix: string): string => embedded ? `gcode${upperFirst(suffix)}` : suffix

  const entryState = embedded ? name('value') : 'root'
  const paramsState = name('params')
  const argValueState = name('argValue')
  const stringState = name('string')
  const jinjaState = name('jinja')
  const checkState = name('check')

  const checkRef = (indent: string, kind = 'none'): string => `@${checkState}.${indent}.${kind}`
  const handBack = checkRef('$S2')

  const prologue: Rule[] = embedded
    ? [[INLINE_COMMENT, ['white', { token: 'comment', switchTo: handBack }]]]
    : []

  // Embedded, a line ending mid-macro must hand back to `checkState` or the
  // next line skips its continuation check — so the sub-machine moves with
  // `switchTo`, which keeps depth constant and strands no frame. Standalone
  // keeps push/pop and just resumes mid-macro on the next line.
  const goTo = (state: string): string => `@${state}.$S2`

  const enter = (state: string): ExpandedAction =>
    embedded ? { switchTo: goTo(state) } : { next: `@${state}` }

  const leaveTo = (state: string): ExpandedAction =>
    embedded ? { switchTo: goTo(state) } : { next: '@pop' }

  // A line ending part-way through a construct: embedded hands back, standalone
  // unwinds.
  const abandon = (standalone: '@pop' | '@popall'): ExpandedAction =>
    embedded ? { switchTo: handBack } : { next: standalone }

  // Records where to resume once the region closes. The tag must be lower
  // case and cannot be the state name: `$Sn` substitution runs through
  // `fixCase`, which `ignoreCase` makes destructive.
  const jinjaOpeners = (returnTag: 'value' | 'arg'): Rule[] => {
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
  // in that same rule's action or it fires a line late. `kind` names the Jinja
  // region, if any, to pick back up in.
  const eosSwitch = (token: string, kind?: string): ExpandedAction =>
    embedded
      ? {
          cases: {
            '@eos': { token, switchTo: checkRef('$S2', kind) },
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
              '@eos': { token: 'keyword.macro', ...abandon('@pop') },
              '@default': { token: 'keyword.macro', ...enter(paramsState) }
            }
          }
        : { token: 'keyword.macro', ...enter(paramsState) }
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
          '@eos': { token: 'operator', ...abandon('@pop') },
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
          '@eos': { token: 'invalid', ...abandon('@popall') },
          '@default': { token: 'string.quote', bracket: '@open', ...enter(stringState) }
        }
      }
    ],

    ...(embedded
      ? ([
          ...jinjaOpeners('arg'),

          // Stay put so a later `{…}` is Jinja too; whitespace ends the value.
          [/[^\s{]+/, eosSwitch('string')],

          [/\s+/, { token: '@rematch', switchTo: goTo(paramsState) }]
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
          '@eos': { token: 'invalid', ...abandon('@popall') },
          '@default': 'string'
        }
      }
    ],

    [
      /"/,
      {
        cases: {
          '@eos': { token: 'string.quote', bracket: '@close', ...abandon('@popall') },
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

  if (!embedded) {
    return {
      attributes: {
        messageCommand: MESSAGE_COMMAND,
        decimal: DECIMAL,
        override: OVERRIDE
      },
      states
    }
  }

  // A matched closer resumes G-code on the rest of the line, if any.
  const jinjaCloseEos = (token: string): Action => ({
    cases: {
      '@eos': { token, switchTo: handBack },
      '$S4==arg': { token, switchTo: goTo(argValueState) },
      '@default': { token, switchTo: goTo(entryState) }
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
      { token: '', switchTo: checkRef('$S2', '$S3.$S4') }
    ]
  ]

  return {
    checkState,
    entryAction: (indent, token) => ({
      cases: {
        '@eos': { token, next: checkRef(indent) },
        '@default': { token, next: `@${entryState}.${indent}` }
      }
    }),
    resumeAction: {
      cases: {
        '$S3==none': { token: 'white', switchTo: goTo(entryState) },
        '@default': { token: 'white', switchTo: `@${jinjaState}.$S2.$S3.$S4` }
      }
    },
    attributes: {
      messageCommand: MESSAGE_COMMAND,
      decimal: DECIMAL,
      override: OVERRIDE,
      jinjaConstants: JINJA_CONSTANTS
    },
    states
  }
}
