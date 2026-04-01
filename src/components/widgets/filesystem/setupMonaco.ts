import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import getVueApp from '@/util/get-vue-app'
import themeDark from '@/monaco/theme/editor.dark.theme.json'
import themeLight from '@/monaco/theme/editor.light.theme.json'

import type { KlippyApp, SupportedKlipperServices } from '@/store/printer/types'
import gcodeMonarchLanguage from '@/monaco/language/gcode.monarch'
import klipperConfigMonarchLanguage from '@/monaco/language/klipper-config.monarch'
import logMonarchLanguage from '@/monaco/language/log.monarch'

import type { GcodeLanguageWorkerClientMessage, GcodeLanguageWorkerServerMessage, GcodeLanguageRangeKind } from '@/workers/gcodeLanguage.worker'
import GcodeLanguageWorker from '@/workers/gcodeLanguage.worker.ts?worker'

import type { KlipperConfigLanguageWorkerClientMessage, KlipperConfigLanguageWorkerServerMessage, KlipperConfigFoldingRangeKind } from '@/workers/klipperConfigLanguage.worker'
import KlipperConfigLanguageWorker from '@/workers/klipperConfigLanguage.worker.ts?worker'

type CodeLensSupportedService = 'klipper' | 'moonraker' | 'moonraker-telegram-bot' | 'crowsnest'

const isCodeLensSupportedService = (service: string): service is CodeLensSupportedService => [
  'klipper',
  'moonraker',
  'moonraker-telegram-bot',
  'crowsnest'
].includes(service)

type DocsSectionService = CodeLensSupportedService | SupportedKlipperServices

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

const foldingRangeKindMap: Record<GcodeLanguageRangeKind | KlipperConfigFoldingRangeKind, monaco.languages.FoldingRangeKind> = {
  comment: monaco.languages.FoldingRangeKind.Comment,
  region: monaco.languages.FoldingRangeKind.Region
}

async function setupMonaco () {
  await import('./setupMonaco.features')

  // Register languages
  monaco.languages.register({ id: 'gcode', extensions: ['gcode', 'g', 'gc', 'gco', 'ufp', 'nc'] })
  monaco.languages.register({ id: 'klipper-config', extensions: ['cfg', 'conf'] })
  monaco.languages.register({ id: 'log', extensions: ['log'] })

  // Define how commenting works
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

  // Register Monarch tokenizers
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

  // Klipper-config: worker-based document symbol provider
  monaco.languages.registerDocumentSymbolProvider('klipper-config', {
    provideDocumentSymbols: (model, token) => {
      return new Promise<monaco.languages.DocumentSymbol[]>((resolve) => {
        const worker = new KlipperConfigLanguageWorker()

        token.onCancellationRequested(() => {
          worker.terminate()
          resolve([])
        })

        const message: KlipperConfigLanguageWorkerServerMessage = {
          action: 'compute',
          content: model.getValue()
        }

        worker.postMessage(message)

        worker.addEventListener('message', (event: MessageEvent<KlipperConfigLanguageWorkerClientMessage>) => {
          resolve(event.data.symbols.map(section => ({
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

          worker.terminate()
        })
      })
    }
  })

  // Klipper-config: worker-based CodeLens provider
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

      return new Promise<monaco.languages.CodeLensList>((resolve) => {
        const worker = new KlipperConfigLanguageWorker()

        token.onCancellationRequested(() => {
          worker.terminate()
          resolve({ lenses: [], dispose: () => undefined })
        })

        const message: KlipperConfigLanguageWorkerServerMessage = {
          action: 'compute',
          content: model.getValue()
        }

        worker.postMessage(message)

        worker.addEventListener('message', (event: MessageEvent<KlipperConfigLanguageWorkerClientMessage>) => {
          resolve({
            lenses: event.data.sections.map((section, index) => {
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

          worker.terminate()
        })
      })
    },
    resolveCodeLens: (_model, codeLens) => codeLens
  })

  // Klipper-config: worker-based folding range provider
  monaco.languages.registerFoldingRangeProvider('klipper-config', {
    provideFoldingRanges: (model, _context, token) => {
      return new Promise<monaco.languages.FoldingRange[]>((resolve) => {
        const worker = new KlipperConfigLanguageWorker()

        token.onCancellationRequested(() => {
          worker.terminate()
          resolve([])
        })

        const message: KlipperConfigLanguageWorkerServerMessage = {
          action: 'compute',
          content: model.getValue()
        }

        worker.postMessage(message)

        worker.addEventListener('message', (event: MessageEvent<KlipperConfigLanguageWorkerClientMessage>) => {
          resolve(event.data.folding.map(range => ({
            kind: foldingRangeKindMap[range.kind],
            start: range.start,
            end: range.end
          })))

          worker.terminate()
        })
      })
    }
  })

  // Gcode: worker-based folding range provider
  monaco.languages.registerFoldingRangeProvider('gcode', {
    provideFoldingRanges: (model, _context, token) => {
      return new Promise<monaco.languages.FoldingRange[]>((resolve) => {
        const worker = new GcodeLanguageWorker()

        token.onCancellationRequested(() => {
          worker.terminate()
          resolve([])
        })

        const message: GcodeLanguageWorkerServerMessage = {
          action: 'compute',
          content: model.getValue()
        }

        worker.postMessage(message)

        worker.addEventListener('message', (event: MessageEvent<GcodeLanguageWorkerClientMessage>) => {
          resolve(event.data.ranges.map(range => ({
            kind: foldingRangeKindMap[range.kind],
            start: range.start,
            end: range.end
          })))

          worker.terminate()
        })
      })
    }
  })

  // Define the themes
  monaco.editor.defineTheme('dark-converted', themeDark as monaco.editor.IStandaloneThemeData)
  monaco.editor.defineTheme('light-converted', themeLight as monaco.editor.IStandaloneThemeData)

  return monaco
}

// Exporting a promise ensures that setupMonaco is run only once
const promise = setupMonaco()
export default promise
