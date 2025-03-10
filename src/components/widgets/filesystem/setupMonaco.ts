import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { loadWASM } from 'onigasm'
import onigasmWasm from 'onigasm/lib/onigasm.wasm?url'

import { Registry, type IGrammarDefinition } from 'monaco-textmate'
import { wireTmGrammars } from 'monaco-editor-textmate'
import getVueApp from '@/util/get-vue-app'
import themeDark from '@/monaco/theme/editor.dark.theme.json'
import themeLight from '@/monaco/theme/editor.light.theme.json'

import { MonacoLanguageImports } from '@/dynamicImports'
import type { KlippyApp, SupportedKlipperServices } from '@/store/printer/types'

type ReduceState<T> = {
  current?: T,
  result: T[]
}

type StackReduceState<U, T> = {
  stack: U[],
  result: T[]
}

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

async function setupMonaco () {
  await Promise.all([
    loadWASM(onigasmWasm),
    import('./setupMonaco.features')
  ])

  // Register our custom TextMate languages.
  const registry = new Registry({
    getGrammarDefinition: async (scopeName): Promise<IGrammarDefinition> => {
      const languageName = scopeName.split('.').pop() ?? ''
      const language = await MonacoLanguageImports[languageName]()
      return {
        format: 'json',
        content: language
      }
    }
  })

  // Load our grammars...
  const grammars = new Map([
    ['gcode', 'source.gcode'],
    ['klipper-config', 'source.klipper-config'],
    ['log', 'text.log']
  ])

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

  const app = getVueApp()
  const klippyApp: KlippyApp = app.$store.getters['printer/getKlippyApp']

  monaco.editor.registerCommand('fluidd_open_docs', (_, service: CodeLensSupportedService, hash: string) => {
    const serviceKey = service.replace(/-/g, '_')

    const url = app.$t(`app.file_system.url.${serviceKey}_config`, {
      hash,
      klipperDomain: klippyApp.domain
    }).toString()

    window.open(url)
  })

  monaco.languages.registerCodeLensProvider('klipper-config', {
    provideCodeLenses: (model) => {
      const { service } = app.$store.getters['server/getConfigMapByFilename'](model.uri.path.split('/').pop())

      if (!isCodeLensSupportedService(service)) {
        return null
      }

      const docsSectionService: DocsSectionService = service === 'klipper'
        ? klippyApp.name
        : service

      const linesContent = model.getLinesContent()

      const sectionBlocks = linesContent
        .reduce<ReduceState<{ sectionName: string, hash: string, range: monaco.IRange }>>((state, lineContent, index) => {
          const section = /^\[([^\]]+)\]/.exec(lineContent)

          if (section) {
            const [sectionName] = section[1].split(' ', 1)

            const hash = getDocsSectionHash(docsSectionService, sectionName)

            state.result.push(state.current = {
              sectionName,
              hash,
              range: {
                startLineNumber: index + 1,
                startColumn: model.getLineFirstNonWhitespaceColumn(index + 1),
                endLineNumber: index + 1,
                endColumn: model.getLineLastNonWhitespaceColumn(index + 1)
              }
            })
          } else {
            const isNotComment = /^\s*[^#;]/.test(lineContent)

            if (isNotComment && state.current) {
              state.current.range = {
                ...state.current.range,
                endLineNumber: index + 1,
                endColumn: model.getLineLastNonWhitespaceColumn(index + 1)
              }
            }
          }

          return state
        }, { result: [] })
        .result

      return {
        lenses: sectionBlocks
          .map((section, index) => ({
            range: section.range,
            id: `docs${index}`,
            command: {
              id: 'fluidd_open_docs',
              title: app.$t('app.file_system.label.view_section_documentation', { section: section.sectionName }).toString(),
              arguments: [service, section.hash]
            }
          })),
        dispose: () => undefined
      }
    },
    resolveCodeLens: (_model, codeLens) => codeLens
  })

  monaco.languages.registerFoldingRangeProvider('klipper-config', {
    provideFoldingRanges: (model) => {
      const linesContent = model.getLinesContent()

      const sectionBlocks = linesContent
        .reduce<ReduceState<monaco.languages.FoldingRange>>((state, lineContent, index) => {
          const isSection = /^\[[^\]]+\]/.test(lineContent)

          if (isSection) {
            state.result.push(state.current = {
              kind: monaco.languages.FoldingRangeKind.Region,
              start: index + 1,
              end: index + 1
            })
          } else {
            const isNotComment = /^\s*[^#;]/.test(lineContent)

            if (isNotComment && state.current) {
              state.current.end = index + 1
            }
          }

          return state
        }, { result: [] })
        .result

      const regionBlocks = linesContent
        .reduce<StackReduceState<number, monaco.languages.FoldingRange>>((state, lineContent, index) => {
          lineContent = lineContent.trim()

          if (lineContent.length > 0) {
            const isRegion = /^#region\b/.test(lineContent)

            if (isRegion) {
              state.stack.push(index + 1)
            } else {
              const isEndRegion = /^#endregion\b/.test(lineContent)

              if (isEndRegion && state.stack.length > 0) {
                state.result.push({
                  kind: monaco.languages.FoldingRangeKind.Region,
                  start: state.stack.pop() ?? 0,
                  end: index + 1
                })
              }
            }
          }

          return state
        }, { stack: [], result: [] })
        .result

      const commentBlocks = linesContent
        .reduce<ReduceState<monaco.languages.FoldingRange>>((state, lineContent, index) => {
          lineContent = lineContent.trim()

          if (lineContent.length > 0) {
            const isComment = /^;|#(?!(?:region|endregion)\b)/.test(lineContent)

            if (isComment) {
              if (state.current) {
                state.current.end = index + 1
              } else {
                state.result.push(state.current = {
                  kind: monaco.languages.FoldingRangeKind.Comment,
                  start: index + 1,
                  end: index + 1
                })
              }
            } else {
              state.current = undefined
            }
          }

          return state
        }, { result: [] })
        .result

      return [
        ...sectionBlocks,
        ...regionBlocks,
        ...commentBlocks
      ]
    }
  })

  monaco.languages.registerFoldingRangeProvider('gcode', {
    provideFoldingRanges: (model) => {
      const linesContent = model.getLinesContent()

      const layerBlocks = linesContent
        .reduce<ReduceState<monaco.languages.FoldingRange>>((state, lineContent, index) => {
          const isLayer = /^\s*SET_PRINT_STATS_INFO .*CURRENT_LAYER=/i.test(lineContent)

          if (isLayer) {
            state.result.push(state.current = {
              kind: monaco.languages.FoldingRangeKind.Region,
              start: index + 1,
              end: index + 1
            })
          } else {
            const isNotComment = /^\s*[^;]/.test(lineContent)

            if (isNotComment && state.current) {
              state.current.end = index + 1
            }
          }

          return state
        }, { result: [] })
        .result

      const objectBlocks = linesContent
        .reduce<ReduceState<monaco.languages.FoldingRange>>((state, lineContent, index) => {
          lineContent = lineContent.trim()

          if (lineContent.length > 0) {
            const isObject = /^\s*EXCLUDE_OBJECT_(START|END) /i.exec(lineContent)

            if (isObject) {
              switch (isObject[1].toUpperCase()) {
                case 'START':
                  state.result.push(state.current = {
                    kind: monaco.languages.FoldingRangeKind.Region,
                    start: index + 1,
                    end: index + 1
                  })
                  break

                case 'END':
                  state.current = undefined
                  break
              }
            } else {
              if (state.current) {
                state.current.end = index + 1
              }
            }
          }

          return state
        }, { result: [] })
        .result

      const thumbnailBlocks = linesContent
        .reduce<ReduceState<monaco.languages.FoldingRange>>((state, lineContent, index) => {
          if (lineContent.startsWith('; thumbnail')) {
            const type = lineContent.substring(11).split(' ')[1]

            switch (type) {
              case 'begin':
                state.result.push(state.current = {
                  kind: monaco.languages.FoldingRangeKind.Comment,
                  start: index + 1,
                  end: index + 1
                })
                break

              case 'end':
                if (state.current && state.current.start === state.current.end) {
                  state.current.end = index
                }
                break
            }
          }

          return state
        }, { result: [] })
        .result

      const commentBlocks = linesContent
        .reduce<ReduceState<monaco.languages.FoldingRange>>((state, lineContent, index) => {
          lineContent = lineContent.trim()

          if (lineContent.length > 0) {
            const isComment = lineContent.startsWith(';')

            if (isComment) {
              if (state.current) {
                state.current.end = index + 1
              } else {
                state.result.push(state.current = {
                  kind: monaco.languages.FoldingRangeKind.Comment,
                  start: index + 1,
                  end: index + 1
                })
              }
            } else {
              state.current = undefined
            }
          }

          return state
        }, { result: [] })
        .result

      return [
        ...layerBlocks,
        ...objectBlocks,
        ...commentBlocks,
        ...thumbnailBlocks
      ]
    }
  })

  // Defined the themes.
  monaco.editor.defineTheme('dark-converted', themeDark as monaco.editor.IStandaloneThemeData)
  monaco.editor.defineTheme('light-converted', themeLight as monaco.editor.IStandaloneThemeData)

  // Wire it up.
  await wireTmGrammars(monaco, registry, grammars)

  return monaco
}

// Exporting a promise ensures that setupMonaco is run only once
const promise = setupMonaco()
export default promise
