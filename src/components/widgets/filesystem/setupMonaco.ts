import 'monaco-editor/esm/vs/editor/editor.all.js'

// full list of features on 'monaco-editor/esm/metadata.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js'

import 'monaco-editor/esm/vs/language/css/monaco.contribution'
import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution'

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import getVueApp from '@/util/get-vue-app'
import themeDark from '@/monaco/theme/editor.dark.theme.json'
import themeLight from '@/monaco/theme/editor.light.theme.json'

import type { KlippyApp } from '@/store/printer/types'

import gcodeMonarchLanguage from '@/monaco/language/gcode.monarch'
import klipperConfigMonarchLanguage from '@/monaco/language/klipper-config.monarch'
import logMonarchLanguage from '@/monaco/language/log.monarch'
import { type CodeLensSupportedService, MonacoCodeLensProvider, MonacoDocumentSymbolProvider, MonacoFoldingRangeProvider } from './monacoProviders'

self.MonacoEnvironment = {
  getWorker (_: string, label: string) {
    switch (label) {
      case 'json':
        return new JsonWorker()
      case 'css':
      case 'scss':
      case 'less':
        return new CssWorker()
      default:
        return new EditorWorker()
    }
  }
}

async function setupMonaco () {
  monaco.languages.register({ id: 'gcode', extensions: ['gcode', 'g', 'gc', 'gco', 'ufp', 'nc'] })
  monaco.languages.register({ id: 'klipper-config', extensions: ['cfg', 'conf'] })
  monaco.languages.register({ id: 'log', extensions: ['log'] })

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

  monaco.languages.setMonarchTokensProvider('gcode', gcodeMonarchLanguage)
  monaco.languages.setMonarchTokensProvider('klipper-config', klipperConfigMonarchLanguage)
  monaco.languages.setMonarchTokensProvider('log', logMonarchLanguage)

  const app = getVueApp()
  const klippyApp: KlippyApp = app.$typedGetters['printer/getKlippyApp']

  monaco.editor.registerCommand('fluidd_open_docs', (_, service: CodeLensSupportedService, hash: string) => {
    const serviceKey = service.replace(/-/g, '_')

    const url = app.$t(`app.file_system.url.${serviceKey}_config`, {
      hash,
      klipperDomain: klippyApp.domain
    }).toString()

    window.open(url)
  })

  monaco.languages.registerDocumentSymbolProvider('klipper-config', new MonacoDocumentSymbolProvider())

  monaco.languages.registerCodeLensProvider('klipper-config', new MonacoCodeLensProvider())

  monaco.languages.registerFoldingRangeProvider(['klipper-config', 'gcode'], new MonacoFoldingRangeProvider())

  monaco.editor.defineTheme('dark-converted', themeDark as monaco.editor.IStandaloneThemeData)
  monaco.editor.defineTheme('light-converted', themeLight as monaco.editor.IStandaloneThemeData)

  return monaco
}

// Exporting a promise ensures that setupMonaco is run only once
const promise = setupMonaco()
export default promise
