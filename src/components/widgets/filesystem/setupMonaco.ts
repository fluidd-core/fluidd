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

import type { KlippyApp, SupportedKlipperServices } from '@/store/printer/types'
import gcodeMonarchLanguage from '@/monaco/language/gcode.monarch'
import klipperConfigMonarchLanguage from '@/monaco/language/klipper-config.monarch'
import logMonarchLanguage from '@/monaco/language/log.monarch'

import type { MonacoLanguageWorkerRequestMessage, MonacoLanguageWorkerResponseMessage } from '@/workers/monacoWorkerHelpers'

import type { MonacoFoldingRangesWorkerResponseMessage } from '@/workers/monacoFoldingRangesWorker'
import MonacoFoldingRangeWorker from '@/workers/monacoFoldingRangesWorker?worker'

import type { MonacoCodeLensWorkerResponseMessage } from '@/workers/monacoCodeLensWorker'
import MonacoCodeLensWorker from '@/workers/monacoCodeLensWorker?worker'

import type { MonacoDocumentSymbolsWorkerResponseMessage } from '@/workers/monacoDocumentSymbolsWorker'
import MonacoDocumentSymbolsWorker from '@/workers/monacoDocumentSymbolsWorker?worker'

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

type CodeLensSupportedService = 'klipper' | 'moonraker' | 'moonraker-telegram-bot' | 'crowsnest'

const isCodeLensSupportedService = (service: string): service is CodeLensSupportedService => [
  'klipper',
  'moonraker',
  'moonraker-telegram-bot',
  'crowsnest'
].includes(service)

type DocsSectionService = CodeLensSupportedService | SupportedKlipperServices

const monacoLanguageWorkerWrapper = <T extends MonacoLanguageWorkerResponseMessage<U>, U = Extract<T, { action: 'result' }>['result']>(WorkerConstructor: new () => Worker, language: string, content: string, token: monaco.CancellationToken): Promise<U | undefined> => {
  return new Promise<U | undefined>((resolve, reject) => {
    if (token.isCancellationRequested) {
      resolve(undefined)
      return
    }

    const worker = new WorkerConstructor()

    let tokenDispose: monaco.IDisposable | null = null

    const cleanup = () => {
      tokenDispose?.dispose()
      worker.onmessage = null
      worker.onerror = null
      worker.onmessageerror = null
      worker.terminate()
    }

    const safeResolve = (value: U | undefined) => {
      cleanup()
      resolve(value)
    }

    const safeReject = (error: unknown) => {
      cleanup()
      reject(error)
    }

    tokenDispose = token.onCancellationRequested(() => {
      safeResolve(undefined)
    })

    worker.onmessage = (event: MessageEvent<T>) => {
      const message = event.data

      switch (message.action) {
        case 'result':
          safeResolve(message.result)

          break

        case 'error':
          safeReject(message.error)

          break
      }
    }

    worker.onerror = (event) => {
      safeReject(new Error(event.message || 'Worker error'))
    }

    worker.onmessageerror = () => {
      safeReject(new Error('Worker message error'))
    }

    const message: MonacoLanguageWorkerRequestMessage = {
      language,
      content
    }

    if (!token.isCancellationRequested) {
      worker.postMessage(message)
    }
  })
}

const getDocsSectionHash = (service: DocsSectionService, sectionName: string) => {
  switch (service) {
    case 'klipper':
      if (sectionName.startsWith('stepper_')) {
        return 'stepper'
      }

      if (/^extruder\d{0,2}$/.test(sectionName)) {
        return 'extruder'
      }

      break

    case 'danger-klipper':
      if (sectionName === 'danger_options') {
        return 'danger-options'
      }

      return getDocsSectionHash('klipper', sectionName)

    case 'kalico':
      if (sectionName === 'danger_options') {
        return 'danger-options'
      }

      if (sectionName === 'constants') {
        return 'configuration-references'
      }

      return getDocsSectionHash('klipper', sectionName)

    case 'moonraker':
      if (sectionName.startsWith('include')) {
        return 'include-directives'
      }

      break
  }

  return sectionName
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

  monaco.languages.registerDocumentSymbolProvider('klipper-config', {
    provideDocumentSymbols: async (model, token) => {
      const result = await monacoLanguageWorkerWrapper<MonacoDocumentSymbolsWorkerResponseMessage>(MonacoDocumentSymbolsWorker, 'klipper-config', model.getValue(), token) ?? []

      return result.map(section => ({
        name: section.name,
        detail: section.name,
        kind: monaco.languages.SymbolKind.Namespace,
        range: section.range,
        selectionRange: section.range,
        tags: [],
        children: section.children.map(child => ({
          name: child.name,
          detail: child.name,
          kind: monaco.languages.SymbolKind.Property,
          range: child.range,
          selectionRange: child.range,
          tags: []
        }))
      }))
    }
  })

  monaco.languages.registerCodeLensProvider('klipper-config', {
    provideCodeLenses: async (model, token) => {
      const { service } = app.$typedGetters['server/getConfigMapByFilename'](model.uri.path.split('/').pop()!) ?? {}

      if (
        !service ||
        !isCodeLensSupportedService(service)
      ) {
        return null
      }

      const docsSectionService: DocsSectionService = service === 'klipper'
        ? klippyApp.name
        : service

      const result = await monacoLanguageWorkerWrapper<MonacoCodeLensWorkerResponseMessage>(MonacoCodeLensWorker, 'klipper-config', model.getValue(), token) ?? []

      return {
        lenses: result.map((section, index) => {
          const hash = getDocsSectionHash(docsSectionService, section.sectionName)

          return {
            range: section.range,
            id: `docs${index}`,
            command: {
              id: 'fluidd_open_docs',
              title: app.$t('app.file_system.label.view_section_documentation', { section: section.sectionName }).toString(),
              arguments: [service, hash]
            }
          }
        }),
        dispose: () => undefined
      }
    },
    resolveCodeLens: (_model, codeLens) => codeLens
  })

  const registerFoldingRangeProvider = (language: string) => monaco.languages.registerFoldingRangeProvider(language, {
    provideFoldingRanges: async (model, _context, token) => {
      const result = await monacoLanguageWorkerWrapper<MonacoFoldingRangesWorkerResponseMessage>(MonacoFoldingRangeWorker, language, model.getValue(), token) ?? []

      return result
        .map((range): monaco.languages.FoldingRange => {
          const kind = range.kind === 'comment'
            ? monaco.languages.FoldingRangeKind.Comment
            : monaco.languages.FoldingRangeKind.Region

          return {
            start: range.start,
            end: range.end,
            kind
          }
        })
    }
  })

  registerFoldingRangeProvider('klipper-config')
  registerFoldingRangeProvider('gcode')

  monaco.editor.defineTheme('dark-converted', themeDark as monaco.editor.IStandaloneThemeData)
  monaco.editor.defineTheme('light-converted', themeLight as monaco.editor.IStandaloneThemeData)

  return monaco
}

// Exporting a promise ensures that setupMonaco is run only once
const promise = setupMonaco()
export default promise
