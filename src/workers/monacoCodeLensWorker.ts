import { consola } from 'consola'
import type { IRange } from 'monaco-editor/esm/vs/editor/editor.api'
import { getFirstNonWhitespaceColumn, getLastNonWhitespaceColumn, type MonacoLanguageWorkerRequestMessage, type MonacoLanguageWorkerResponseMessage, type ReduceState } from './monacoWorkerHelpers'

export type MonacoCodeLensWorkerResponseMessage = MonacoLanguageWorkerResponseMessage<MonacoCodeLens[]>

export type MonacoCodeLens = {
  sectionName: string,
  range: IRange
}

const klipperConfigCodeLens = (lines: string[]): MonacoCodeLens[] => {
  return lines
    .reduce<ReduceState<MonacoCodeLens>>((state, lineContent, index) => {
      const section = /^\[([^\]]+)\]/.exec(lineContent)

      if (section) {
        const lineNumber = index + 1

        state.result.push(state.current = {
          sectionName: section[1].split(' ', 1)[0],
          range: {
            startLineNumber: lineNumber,
            startColumn: getFirstNonWhitespaceColumn(lineContent),
            endLineNumber: lineNumber,
            endColumn: getLastNonWhitespaceColumn(lineContent)
          }
        })
      } else {
        const isNotComment = /^\s*[^#;]/.test(lineContent)

        if (isNotComment && state.current) {
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
}

const sendResult = (result: MonacoCodeLens[]) => {
  const message: MonacoCodeLensWorkerResponseMessage = {
    action: 'result',
    result
  }

  self.postMessage(message)
}

const sendError = (error?: unknown) => {
  const message: MonacoCodeLensWorkerResponseMessage = {
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
        const codeLens = klipperConfigCodeLens(lines)

        sendResult(codeLens)

        break
      }

      default:
        throw new Error(`Unsupported language: ${message.language}`)
    }
  } catch (e) {
    consola.error('[MonacoCodeLens] error in worker', e)

    sendError(e)
  }
}
