import type * as Monaco from 'monaco-editor/editor/editor.api'
import { createGcodeRules } from './gcode-rules'

export const conf: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: ';'
  }
}

const { attributes, states } = createGcodeRules('standalone')

export const language: Monaco.languages.IMonarchLanguage = {
  ignoreCase: true,

  ...attributes,

  tokenizer: states
}
