import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { loadWASM } from 'onigasm'
import { IGrammarDefinition, Registry } from 'monaco-textmate'
import { wireTmGrammars } from 'monaco-editor-textmate'
import themeDark from '@/monaco/theme/editor.dark.theme.json'
import themeLight from '@/monaco/theme/editor.light.theme.json'

async function setupMonaco () {
  const wasm = await require('onigasm/lib/onigasm.wasm')
  await loadWASM(wasm.default)

  // Register our custom TextMate languages.
  const registry = new Registry({
    getGrammarDefinition: async (scopeName): Promise<IGrammarDefinition> => {
      const fileName = scopeName.split('.').pop()
      return import(
                /* webpackChunkName: "grammar-[request]" */
                `@/monaco/language/${fileName}.tmLanguage.json`
      )
        .then(language => {
          return Promise.resolve({
            format: 'json',
            content: language.default
          })
        })
    }
  })

  // Load our grammars...
  const grammars = new Map()
  grammars.set('gcode', 'source.gcode')
  grammars.set('klipper-config', 'source.klipper-config')
  grammars.set('log', 'text.log')

  // ... and our languages
  monaco.languages.register({ id: 'gcode', extensions: ['gcode', 'g', 'gc', 'gco', 'ufp', 'nc'] })
  monaco.languages.register({ id: 'klipper-config', extensions: ['cfg', 'conf'] })
  monaco.languages.register({ id: 'log', extensions: ['log'] })

  // Define how commenting works.
  monaco.languages.setLanguageConfiguration('gcode', {
    comments: {
      lineComment: ';'
    }
  })
  monaco.languages.setLanguageConfiguration('klipper-config', {
    comments: {
      lineComment: '#'
    }
  })

  // Defined the themes.
  monaco.editor.defineTheme('dark-converted', themeDark as any)
  monaco.editor.defineTheme('light-converted', themeLight as any)

  // Wire it up.
  await wireTmGrammars(monaco, registry, grammars)

  return monaco
}

// Exporting a promise ensures that setupMonaco is run only once
const promise = setupMonaco()
export default promise
