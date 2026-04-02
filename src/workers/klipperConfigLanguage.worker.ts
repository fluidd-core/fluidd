import type { IRange } from 'monaco-editor/esm/vs/editor/editor.api'

export type KlipperConfigLanguageWorkerServerMessage = {
  action: 'getFoldingRanges' | 'getDocumentSymbols' | 'getCodeLens',
  content: string
}

export type KlipperConfigLanguageWorkerClientMessage = {
  action: 'resultFoldingRanges',
  result: KlipperConfigFoldingRange[]
} | {
  action: 'resultDocumentSymbols',
  result: KlipperConfigSymbol[]
} | {
  action: 'resultCodeLens',
  result: KlipperConfigSection[]
} | {
  action: 'error',
  error?: unknown
}

export type KlipperConfigFoldingRangeKind = 'comment' | 'region'

export type KlipperConfigFoldingRange = {
  kind: KlipperConfigFoldingRangeKind,
  start: number,
  end: number
}

export type KlipperConfigSymbol = {
  name: string,
  range: IRange,
  children: KlipperConfigSymbolChild[]
}

export type KlipperConfigSymbolChild = {
  name: string,
  range: IRange
}

export type KlipperConfigSection = {
  sectionName: string,
  range: IRange
}

type ReduceState<T> = {
  current?: T,
  result: T[]
}

type StackReduceState<U, T> = {
  stack: U[],
  result: T[]
}

const getFirstNonWhitespaceColumn = (line: string): number => {
  const match = /\S/.exec(line)
  return match ? match.index + 1 : 1
}

const getLastNonWhitespaceColumn = (line: string): number => {
  const match = /\S\s*$/.exec(line)
  return match ? match.index + 2 : 1
}

const getFoldingRanges = (lines: string[]): KlipperConfigFoldingRange[] => {
  const sectionBlocks = lines
    .reduce<ReduceState<KlipperConfigFoldingRange>>((state, lineContent, index) => {
      const isSection = /^\[[^\]]+\]/.test(lineContent)

      if (isSection) {
        state.result.push(state.current = {
          kind: 'region',
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

  const regionBlocks = lines
    .reduce<StackReduceState<number, KlipperConfigFoldingRange>>((state, lineContent, index) => {
      lineContent = lineContent.trim()

      if (lineContent.length > 0) {
        const isRegion = /^#region\b/.test(lineContent)

        if (isRegion) {
          state.stack.push(index + 1)
        } else {
          const isEndRegion = /^#endregion\b/.test(lineContent)

          if (isEndRegion && state.stack.length > 0) {
            state.result.push({
              kind: 'region',
              start: state.stack.pop() ?? 0,
              end: index + 1
            })
          }
        }
      }

      return state
    }, { stack: [], result: [] })
    .result

  const commentBlocks = lines
    .reduce<ReduceState<KlipperConfigFoldingRange>>((state, lineContent, index) => {
      lineContent = lineContent.trim()

      if (lineContent.length > 0) {
        const isComment = /^;|#(?!(?:region|endregion)\b)/.test(lineContent)

        if (isComment) {
          if (state.current) {
            state.current.end = index + 1
          } else {
            state.result.push(state.current = {
              kind: 'comment',
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

const getDocumentSymbols = (lines: string[]): KlipperConfigSymbol[] => {
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

            state.current.range = {
              ...state.current.range,
              endLineNumber: index + 1,
              endColumn: getLastNonWhitespaceColumn(lineContent)
            }
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

const getCodeLens = (lines: string[]): KlipperConfigSection[] => {
  return lines
    .reduce<ReduceState<KlipperConfigSection>>((state, lineContent, index) => {
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

const sendFoldingRanges = (result: KlipperConfigFoldingRange[]) => {
  const message: KlipperConfigLanguageWorkerClientMessage = {
    action: 'resultFoldingRanges',
    result
  }

  self.postMessage(message)
}

const sendDocumentSymbols = (result: KlipperConfigSymbol[]) => {
  const message: KlipperConfigLanguageWorkerClientMessage = {
    action: 'resultDocumentSymbols',
    result
  }

  self.postMessage(message)
}

const sendCodeLens = (result: KlipperConfigSection[]) => {
  const message: KlipperConfigLanguageWorkerClientMessage = {
    action: 'resultCodeLens',
    result
  }

  self.postMessage(message)
}

const sendError = (error?: unknown) => {
  const message: KlipperConfigLanguageWorkerClientMessage = {
    action: 'error',
    error
  }

  self.postMessage(message)
}

addEventListener('message', (event: MessageEvent<KlipperConfigLanguageWorkerServerMessage>) => {
  const message = event.data

  try {
    const lines = message.content.split('\n')

    switch (message.action) {
      case 'getFoldingRanges': {
        const foldingRanges = getFoldingRanges(lines)

        sendFoldingRanges(foldingRanges)

        break
      }

      case 'getDocumentSymbols': {
        const documentSymbols = getDocumentSymbols(lines)

        sendDocumentSymbols(documentSymbols)

        break
      }

      case 'getCodeLens': {
        const codeLens = getCodeLens(lines)

        sendCodeLens(codeLens)

        break
      }
    }
  } catch (error) {
    sendError(error)
  }
})
