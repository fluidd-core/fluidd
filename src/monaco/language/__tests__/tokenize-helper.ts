import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

export interface TokenLine {
  type: string;
  value: string;
}

export const registerLanguage = (
  langId: string,
  language: monaco.languages.IMonarchLanguage,
  conf?: monaco.languages.LanguageConfiguration
) => {
  monaco.languages.register({ id: langId })
  monaco.languages.setMonarchTokensProvider(langId, language)

  if (conf) {
    monaco.languages.setLanguageConfiguration(langId, conf)
  }
}

export const tokenizeLines = (text: string, langId: string): TokenLine[][] => {
  const lines = text.split('\n')

  return monaco.editor.tokenize(text, langId).map((tokens, lineIdx) => {
    const line = lines[lineIdx] ?? ''

    return tokens
      .map((tok, i) => ({
        type: tok.type,
        value: line.slice(tok.offset, tokens[i + 1]?.offset ?? line.length)
      }))
  })
}

// Variadic line-builder factory bound to a language id. Each `[baseType,
// value]` tuple becomes one token; Monaco appends `.<langId>` to every
// Monarch token type, so this keeps the per-case expectations readable.
export const tokenBuilder = (langId: string) =>
  (...tokens: Array<[baseType: string, value: string]>): TokenLine[] =>
    tokens
      .map(([baseType, value]) => ({
        type: `${baseType}.${langId}`,
        value
      }))
