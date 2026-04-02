import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import getVueApp from '@/util/get-vue-app'
import themeDark from '@/monaco/theme/editor.dark.theme.json'
import themeLight from '@/monaco/theme/editor.light.theme.json'

import type { KlippyApp, SupportedKlipperServices } from '@/store/printer/types'
import gcodeMonarchLanguage from '@/monaco/language/gcode.monarch'
import klipperConfigMonarchLanguage from '@/monaco/language/klipper-config.monarch'
import logMonarchLanguage from '@/monaco/language/log.monarch'

import type { MonacoEditorLanguageWorkerClientMessage, MonacoEditorLanguageWorkerServerMessage } from '@/workers/monacoEditorLanguageWorkerHelpers'

import GcodeLanguageWorker from '@/workers/gcodeLanguage.worker.ts?worker'
import KlipperConfigLanguageWorker from '@/workers/klipperConfigLanguage.worker.ts?worker'

type CodeLensSupportedService = 'klipper' | 'moonraker' | 'moonraker-telegram-bot' | 'crowsnest'

const isCodeLensSupportedService = (service: string): service is CodeLensSupportedService => [
  'klipper',
  'moonraker',
  'moonraker-telegram-bot',
  'crowsnest'
].includes(service)

type DocsSectionService = CodeLensSupportedService | SupportedKlipperServices

const foldingRangesProvider = (WorkerConstructor: new () => Worker): monaco.languages.FoldingRangeProvider => ({
  provideFoldingRanges: (model, _context, token) => {
    return new Promise<monaco.languages.FoldingRange[]>((resolve, reject) => {
      const worker = new WorkerConstructor()

      token.onCancellationRequested(() => {
        worker.terminate()

        resolve([])
      })

      worker.onmessage = (event: MessageEvent<MonacoEditorLanguageWorkerClientMessage>) => {
        const message = event.data

        switch (message.action) {
          case 'resultFoldingRanges':
            resolve(message.result.map((range): monaco.languages.FoldingRange => {
              const kind = range.kind === 'comment'
                ? monaco.languages.FoldingRangeKind.Comment
                : monaco.languages.FoldingRangeKind.Region

              return {
                start: range.start,
                end: range.end,
                kind
              }
            }))

            break

          case 'error':
            reject(message.error)

            break
        }

        worker.terminate()
      }

      const message: MonacoEditorLanguageWorkerServerMessage = {
        action: 'getFoldingRanges',
        content: model.getValue()
      }

      worker.postMessage(message)
    })
  }
})

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
  await import('./setupMonaco.features')

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
    provideDocumentSymbols: (model, token) => {
      return new Promise<monaco.languages.DocumentSymbol[]>((resolve, reject) => {
        const worker = new KlipperConfigLanguageWorker()

        token.onCancellationRequested(() => {
          worker.terminate()

          resolve([])
        })

        worker.onmessage = (event: MessageEvent<MonacoEditorLanguageWorkerClientMessage>) => {
          const message = event.data

          switch (message.action) {
            case 'resultDocumentSymbols':
              resolve(message.result.map(section => ({
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
              })))

              break

            case 'error':
              reject(message.error)

              break
          }

          worker.terminate()
        }

        const message: MonacoEditorLanguageWorkerServerMessage = {
          action: 'getDocumentSymbols',
          content: model.getValue()
        }

        worker.postMessage(message)
      })
    }
  })

  monaco.languages.registerCodeLensProvider('klipper-config', {
    provideCodeLenses: (model, token) => {
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

      return new Promise<monaco.languages.CodeLensList>((resolve, reject) => {
        const worker = new KlipperConfigLanguageWorker()

        token.onCancellationRequested(() => {
          worker.terminate()

          resolve({
            lenses: [],
            dispose: () => undefined
          })
        })

        worker.onmessage = (event: MessageEvent<MonacoEditorLanguageWorkerClientMessage>) => {
          const message = event.data

          switch (message.action) {
            case 'resultCodeLens':
              resolve({
                lenses: message.result.map((section, index) => {
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
              })

              break

            case 'error':
              reject(message.error)

              break
          }

          worker.terminate()
        }

        const message: MonacoEditorLanguageWorkerServerMessage = {
          action: 'getCodeLens',
          content: model.getValue()
        }

        worker.postMessage(message)
      })
    },
    resolveCodeLens: (_model, codeLens) => codeLens
  })

  monaco.languages.registerFoldingRangeProvider('klipper-config', foldingRangesProvider(KlipperConfigLanguageWorker))

  monaco.languages.registerFoldingRangeProvider('gcode', foldingRangesProvider(GcodeLanguageWorker))

  monaco.editor.defineTheme('dark-converted', themeDark as monaco.editor.IStandaloneThemeData)
  monaco.editor.defineTheme('light-converted', themeLight as monaco.editor.IStandaloneThemeData)

  return monaco
}

// Exporting a promise ensures that setupMonaco is run only once
const promise = setupMonaco()
export default promise
