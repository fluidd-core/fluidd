import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'

export const conf: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: ';'
  }
}

export const language: Monaco.languages.IMonarchLanguage = {
  ignoreCase: true,

  decimal: /[-+]?(?:\d+\.?\d*|\d*\.\d+)/,

  override: /(?:\.\d+)?/,

  tokenizer: {
    root: [
      [
        /^(\s*)(n\d+)/,
        ['white', 'keyword.command.n']
      ],

      [
        /;.*$/,
        'comment'
      ],

      [
        /\*\d+/,
        'tag'
      ],

      [
        // eslint-disable-next-line regexp/no-useless-assertions
        /(m11[78](?!\d)@override)([^;]*)/,
        ['keyword.command.m', 'string']
      ],

      [
        /([gmt])\d+@override/,
        { token: 'keyword.command.$1' }
      ],

      [
        /[a-z_]{2,}\d*/,
        { token: 'keyword.macro', next: '@params' }
      ],

      [
        /([a-mo-z])\s*@decimal/,
        { token: 'keyword.param.$1' }
      ],

      [
        /\s+/,
        'white'
      ],

      [
        '.*$',
        'invalid'
      ]
    ],

    params: [
      [
        /[*;]/,
        { token: '@rematch', next: '@pop' }
      ],

      [
        /([a-z_]+)(=)/,
        ['keyword.param', {
          cases: {
            '@eos': { token: 'operator', next: '@pop' },
            '@default': { token: 'operator', next: '@value' }
          }
        }]
      ],

      [
        /\s+/,
        'white'
      ],

      [
        '',
        { token: '', next: '@pop' }
      ]
    ],

    value: [
      [
        /[*;]/,
        { token: '@rematch', next: '@pop' }
      ],

      [
        /"/,
        {
          cases: {
            '@eos': { token: 'invalid', next: '@popall' },
            '@default': { token: 'string.quote', bracket: '@open', next: '@string' }
          }
        }
      ],

      [
        /\S+/,
        { token: 'string', next: '@pop' }
      ],

      [
        '',
        { token: '', next: '@pop' }
      ]
    ],

    string: [
      [
        /(\\"|[^"])+/,
        {
          cases: {
            '@eos': { token: 'invalid', next: '@popall' },
            '@default': 'string'
          }
        }
      ],

      [
        /"/,
        {
          cases: {
            '@eos': { token: 'string.quote', bracket: '@close', next: '@popall' },
            '@default': { token: 'string.quote', bracket: '@close', next: '@pop' }
          }
        }
      ]
    ]
  }
}
