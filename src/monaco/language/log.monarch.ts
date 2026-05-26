import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'

const logMonarchLanguage: Monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  ignoreCase: false,
  tokenPostfix: '',

  tokenizer: {
    root: [
      // Log levels - error/fatal (highest priority)
      [/\b(?:ALERT|CRITICAL|EMERGENCY|ERROR|FAILURE|FAIL|Fatal|Error)\b/, 'string.regexp'],
      [/\berror:/i, 'string.regexp'],
      [/\[(?:error|eror|err|er|e|fatal|fatl|ftl|fa|f)\]/i, 'string.regexp'],

      // Log levels - warning
      [/\b(?:WARNING|WARN|Warn)\b/, 'markup.deleted'],
      [/\bwarning:/i, 'markup.deleted'],
      [/\[(?:warning|warn|wrn|wn|w)\]/i, 'markup.deleted'],

      // Log levels - info
      [/\b(?:HINT|INFO|INFORMATION|Info|NOTICE)\b/, 'markup.inserted'],
      [/\b(?:info|information):/i, 'markup.inserted'],
      [/\[(?:information|info|inf|in|i)\]/i, 'markup.inserted'],

      // Log levels - debug
      [/\b(?:DEBUG|Debug|Trace)\b/, 'markup.changed'],
      [/\bdebug:/i, 'markup.changed'],
      [/\[(?:debug|dbug|dbg|de|d)\]/i, 'markup.changed'],

      // Dates and timestamps
      [/\b\d{4}-\d{2}-\d{2}(?:T|\b)/, 'comment'],
      [/\b\d{2}\W\d{2}\W\d{4}\b/, 'comment'],
      [/\d{2}:\d{2}(?::\d{2}(?:[.,]\d{3,})?)?(?:Z| ?[+-]\d{2}:\d{2})?\b/, 'comment'],

      // Exception names
      [/\b[a-zA-Z.]*Exception\b/, 'string.regexp'],

      // Stack traces
      [/^[\t ]*at.*$/, 'string.key'],

      // URLs
      [/\b(?:https?|ftp|file):\/\/\S+\b\/?/, 'constant.language'],

      // UUIDs
      [/[\da-f]{8}-?(?:[\da-f]{4}-?){3}[\da-f]{12}/i, 'constant.language'],

      // Git hashes
      [/\b(?:[\da-f]{40}|[\da-f]{10}|[\da-f]{7})\b/i, 'constant.language'],

      // Quoted strings
      [/"[^"]*"/, 'string'],
      [/(?:^|\W)'[^']*'/, 'string'],

      // Numbers, booleans, null
      [/\b(?:\d+|true|false|null)\b/, 'constant.language'],

      // Dotted identifiers
      [/\b(?:[\w-]+\.)+[\w-]+\b/, 'constant.language']
    ]
  }
}

export default logMonarchLanguage
