import type * as monaco from 'monaco-editor'

/**
 * Fields that, if present in a LanguageConfiguration, must be a RegExp object
 * rather than a string literal.
 */
const REGEXP_PROPERTIES = [
  // indentation
  'indentationRules.decreaseIndentPattern',
  'indentationRules.increaseIndentPattern',
  'indentationRules.indentNextLinePattern',
  'indentationRules.unIndentedLinePattern',

  // code folding
  'folding.markers.start',
  'folding.markers.end',

  // language's "word definition"
  'wordPattern'
]

function getProp (obj: {string: any}, selector: string): any {
  const components = selector.split('.')
  /* eslint-disable @typescript-eslint/ban-ts-ignore */
  // @ts-ignore
  return components.reduce((acc, cur) => (acc != null ? acc[cur] : null), obj)
  /* eslint-enable @typescript-eslint/ban-ts-ignore */
}

function setProp (obj: {string: any}, selector: string, value: RegExp): void {
  const components = selector.split('.')
  const indexToSet = components.length - 1
  components.reduce((acc, cur, index) => {
    if (acc == null) {
      return acc
    }

    if (index === indexToSet) {
      /* eslint-disable @typescript-eslint/ban-ts-ignore */
      // @ts-ignore
      acc[cur] = value
      return null
    } else {
      // @ts-ignore
      return acc[cur]
      /* eslint-enable @typescript-eslint/ban-ts-ignore */
    }
  }, obj)
}

/**
 * Configuration data is read from JSON and JSONC files, which cannot contain
 * regular expression literals. Although Monarch grammars will often accept
 * either the source of a RegExp as a string OR a RegExp object, certain Monaco
 * APIs accept only a RegExp object, so we must "rehydrate" those, as appropriate.
 *
 * It would probably save everyone a lot of trouble if we updated the APIs to
 * accept a RegExp or a string literal. Possibly a small struct if flags need
 * to be specified to the RegExp constructor.
 */
export function rehydrateRegexps (rawConfiguration: string): monaco.languages.LanguageConfiguration {
  const out = JSON.parse(rawConfiguration)
  for (const property of REGEXP_PROPERTIES) {
    const value = getProp(out, property)
    if (typeof value === 'string') {
      setProp(out, property, new RegExp(value))
    }
  }
  return out
}
