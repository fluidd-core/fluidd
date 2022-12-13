import 'monaco-editor/esm/vs/editor/editor.all.js'

// full list of features on 'monaco-editor/esm/metadata.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js'

import 'monaco-editor/esm/vs/language/css/monaco.contribution'
import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution'

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { loadWASM } from 'onigasm'
import onigasmWasm from 'onigasm/lib/onigasm.wasm?url'

import { IGrammarDefinition, Registry } from 'monaco-textmate'
import { wireTmGrammars } from 'monaco-editor-textmate'
import getVueApp from '@/util/get-vue-app'
import themeDark from '@/monaco/theme/editor.dark.theme.json'
import themeLight from '@/monaco/theme/editor.light.theme.json'

import { MonacoLanguageImports } from '@/dynamicImports'

type CodeLensSupportedService = 'klipper' | 'moonraker' | 'moonraker-telegram-bot'

const isCodeLensSupportedService = (service: string) : service is CodeLensSupportedService => [
  'klipper',
  'moonraker',
  'moonraker-telegram-bot'
].includes(service)

const getDocsSection = (service: CodeLensSupportedService, sectionName: string) => {
  switch (service) {
    case 'klipper':
      if (sectionName.startsWith('stepper_')) {
        return 'stepper'
      }

      if (/^extruder\d{0,2}$/.test(sectionName)) {
        return 'extruder'
      }

      break

    case 'moonraker':
      if (sectionName.startsWith('include')) {
        return 'include-directives'
      }

      break
  }

  return sectionName
}

async function setupMonaco () {
  await loadWASM(onigasmWasm)

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

  const app = getVueApp()

  monaco.editor.registerCommand('fluidd_open_docs', (_, service: CodeLensSupportedService, hash: string) => {
    const serviceKey = service.replace(/-/g, '_')
    const url = app.$t(`app.file_system.url.${serviceKey}_config`, { hash }).toString()

    window.open(url)
  })

  monaco.languages.registerCodeLensProvider('klipper-config', {
    provideCodeLenses: (model) => {
      const { service } = app.$store.getters['server/getConfigMapByFilename'](model.uri.path.split('/').pop())

      if (!isCodeLensSupportedService(service)) {
        return null
      }

      const linesContent = model.getLinesContent()

      const sections = linesContent.reduce((ranges, lineContent, index) => {
        const section = /^\[([^\]]+)\]/.exec(lineContent)
        if (section) {
          const [sectionName] = section[1].split(' ')

          const referenceSection = getDocsSection(service, sectionName)

          return ranges.concat({
            referenceSection,
            range: {
              startLineNumber: index + 1,
              startColumn: model.getLineFirstNonWhitespaceColumn(index + 1),
              endLineNumber: index + 1,
              endColumn: model.getLineLastNonWhitespaceColumn(index + 1)
            }
          })
        }
        return ranges
      }, [] as { referenceSection: string, range: monaco.IRange }[])

      return {
        lenses: sections.map((section, index) =>
          ({
            range: section.range,
            id: `docs${index}`,
            command: {
              id: 'fluidd_open_docs',
              title: app.$t('app.file_system.label.view_section_documentation', { section: section.referenceSection }).toString(),
              arguments: [service, section.referenceSection]
            }
          })
        ),
        dispose: () => undefined
      }
    },
    resolveCodeLens: (_model, codeLens) => codeLens
  })

  monaco.languages.registerFoldingRangeProvider('klipper-config', {
    provideFoldingRanges: (model) => {
      const linesContent = model.getLinesContent()

      const sectionBlocks = linesContent.reduce((sectionBlocks, lineContent, index) => {
        const isSection = /^\[([^\]]+)\]/.test(lineContent)

        if (isSection) {
          return sectionBlocks.concat({
            start: index + 1,
            end: index + 1
          })
        }

        const isNotComment = /^\s*[^#;]/.test(lineContent)

        if (isNotComment && sectionBlocks.length > 0) {
          sectionBlocks[sectionBlocks.length - 1].end = index + 1
        }

        return sectionBlocks
      }, [] as Array<{ start: number, end: number }>)

      const commentBlocks = linesContent.reduce((commentBlocks, lineContent, index) => {
        lineContent = lineContent.trim()

        if (lineContent.length > 0) {
          const isComment = ['#', ';'].includes(lineContent[0])

          const lastCommentBlock = commentBlocks.length > 0 ? commentBlocks[commentBlocks.length - 1] : undefined

          if (isComment) {
            if (lastCommentBlock && !lastCommentBlock.complete) {
              lastCommentBlock.end = index + 1
            } else {
              return commentBlocks.concat({
                start: index + 1,
                end: index + 1,
                complete: false
              })
            }
          } else if (lastCommentBlock) {
            lastCommentBlock.complete = true
          }
        }

        return commentBlocks
      }, [] as Array<{start: number, end: number, complete: boolean}>)

      return [
        ...sectionBlocks.map(section => ({
          start: section.start,
          end: section.end,
          kind: monaco.languages.FoldingRangeKind.Region
        })),
        ...commentBlocks.map(section => ({
          start: section.start,
          end: section.end,
          kind: monaco.languages.FoldingRangeKind.Comment
        }))
      ]
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
