import { consola } from 'consola'
import { getFirstNonWhitespaceColumn, getLastNonWhitespaceColumn, type MonacoLanguageWorkerRequestMessage, type MonacoLanguageWorkerResponseMessage, type ReduceState } from './monacoWorkerHelpers'
import type { IRange } from 'monaco-editor/esm/vs/editor/editor.api'

export type MonacoDocumentSymbolsWorkerResponseMessage = MonacoLanguageWorkerResponseMessage<MonacoSymbol[]>

export type MonacoSymbol = {
  name: string,
  range: IRange,
  children: MonacoSymbolChild[]
}

export type MonacoSymbolChild = {
  name: string,
  range: IRange
}

const klipperConfigDocumentSymbols = (lines: string[]): MonacoSymbol[] => {
  return lines
    .reduce<ReduceState<{ name: string, children: ReduceState<{ name: string, range: IRange }>, range: IRange }>>((state, lineContent, index) => {
      const section = /^\[[^\]]+\]/.exec(lineContent)

      if (section) {
        state.result.push(state.current = {
          name: section[0],
          range: {
            startLineNumber: index + 1,
            startColumn: getFirstNonWhitespaceColumn(lineContent),
            endLineNumber: index + 1,
            endColumn: getLastNonWhitespaceColumn(lineContent)
          },
          children: { result: [] }
        })
      } else {
        const isNotComment = /^\s*[^#;]/.test(lineContent)

        if (isNotComment && state.current) {
          const property = /^(\S+)\s*[:=]/.exec(lineContent)

          if (property) {
            state.current.children.result.push(state.current.children.current = {
              name: property[1],
              range: {
                startLineNumber: index + 1,
                startColumn: getFirstNonWhitespaceColumn(lineContent),
                endLineNumber: index + 1,
                endColumn: getLastNonWhitespaceColumn(lineContent)
              }
            })
          } else if (state.current.children.current) {
            state.current.children.current.range = {
              ...state.current.children.current.range,
              endLineNumber: index + 1,
              endColumn: getLastNonWhitespaceColumn(lineContent)
            }
          }

          state.current.range = {
            ...state.current.range,
            endLineNumber: index + 1,
            endColumn: getLastNonWhitespaceColumn(lineContent)
          }
        }
      }

      return state
    }, { result: [] })
    .result
    .map(section => ({
      name: section.name,
      range: section.range,
      children: section.children.result
    }))
}

const sendResult = (result: MonacoSymbol[]) => {
  const message: MonacoDocumentSymbolsWorkerResponseMessage = {
    action: 'result',
    result
  }

  self.postMessage(message)
}

const sendError = (error?: unknown) => {
  const message: MonacoDocumentSymbolsWorkerResponseMessage = {
    action: 'error',
    error
  }

  self.postMessage(message)
}

self.onmessage = (event: MessageEvent<MonacoLanguageWorkerRequestMessage>) => {
  const message = event.data

  try {
    const lines = message.content.split('\n')

    switch (message.language) {
      case 'klipper-config': {
        const documentSymbols = klipperConfigDocumentSymbols(lines)

        sendResult(documentSymbols)

        break
      }

      default:
        throw new Error(`Unsupported language: ${message.language}`)
    }
  } catch (e) {
    consola.error('[MonacoDocumentSymbols] error in worker', e)

    sendError(e)
  }
}
