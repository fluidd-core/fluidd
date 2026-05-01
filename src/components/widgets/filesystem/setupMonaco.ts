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

import type { KlippyApp } from '@/store/printer/types'

import gcodeMonarchLanguage from '@/monaco/language/gcode.monarch'
import * as klipperConfigMonarchLanguage from '@/monaco/language/klipper-config.monarch'
import * as moonrakerConfigMonarchLanguage from '@/monaco/language/moonraker-config.monarch'
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
  monaco.languages.register({ id: 'klipper-config', extensions: ['cfg'] })
  monaco.languages.register({ id: 'moonraker-config', extensions: ['conf'] })
  monaco.languages.register({ id: 'log', extensions: ['log'] })

  monaco.languages.setLanguageConfiguration('gcode', {
    comments: {
      lineComment: ';'
    }
  })
  monaco.languages.setLanguageConfiguration('klipper-config', klipperConfigMonarchLanguage.conf)
  monaco.languages.setLanguageConfiguration('moonraker-config', moonrakerConfigMonarchLanguage.conf)

  monaco.languages.setMonarchTokensProvider('gcode', gcodeMonarchLanguage)
  monaco.languages.setMonarchTokensProvider('klipper-config', klipperConfigMonarchLanguage.language)
  monaco.languages.setMonarchTokensProvider('moonraker-config', moonrakerConfigMonarchLanguage.language)
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

  monaco.languages.registerDocumentSymbolProvider(['klipper-config', 'moonraker-config'], new MonacoDocumentSymbolProvider())

  monaco.languages.registerCodeLensProvider(['klipper-config', 'moonraker-config'], new MonacoCodeLensProvider())

  monaco.languages.registerFoldingRangeProvider(['klipper-config', 'moonraker-config', 'gcode'], new MonacoFoldingRangeProvider())

  monaco.editor.defineTheme('light-converted', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment.control.save-config', foreground: '7b2fbe', fontStyle: 'italic' },
      { token: 'entity.name.section', foreground: '267f99', fontStyle: 'bold' },
      { token: 'variable.name', foreground: '0070c1' },
      { token: 'delimiter', foreground: '666666' },
      { token: 'constant.language', foreground: '0000ff' },
      { token: 'string', foreground: 'a31515' },
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
    ],
    colors: {},
  })
  monaco.editor.defineTheme('dark-converted', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment.control.save-config', foreground: 'c586c0', fontStyle: 'italic' },
      { token: 'entity.name.section', foreground: '4ec9b0', fontStyle: 'bold' },
      { token: 'variable.name', foreground: '9cdcfe' },
      { token: 'delimiter', foreground: '808080' },
      { token: 'constant.language', foreground: '569cd6' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': '#28282b',
      'editor.lineHighlightBackground': '#3a3a3e',
      'minimap.background': '#28282b'
    },
  })

  return monaco
}

// Exporting a promise ensures that setupMonaco is run only once
const promise = setupMonaco()
export default promise
