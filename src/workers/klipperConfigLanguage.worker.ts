import type { IRange } from 'monaco-editor/esm/vs/editor/editor.api'

type MutableRange = { -readonly [K in keyof IRange]: IRange[K] }

export type KlipperConfigLanguageWorkerServerMessage = {
  action: 'compute',
  content: string
}

export type KlipperConfigLanguageWorkerClientMessage = {
  action: 'result',
  folding: KlipperConfigFoldingRange[],
  symbols: KlipperConfigSymbol[],
  sections: KlipperConfigSection[]
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

const computeFolding = (lines: string[]): KlipperConfigFoldingRange[] => {
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

const computeSymbols = (lines: string[]): KlipperConfigSymbol[] => {
  type MutableSymbolChild = { name: string, range: MutableRange }
  type SymbolState = {
    name: string,
    range: MutableRange,
    children: { current?: MutableSymbolChild, result: MutableSymbolChild[] }
  }

  return lines
    .reduce<ReduceState<SymbolState>>((state, lineContent, index) => {
      const section = /^\[[^\]]+\]/.exec(lineContent)

      if (section) {
        const lineNumber = index + 1

        state.result.push(state.current = {
          name: section[0],
          range: {
            startLineNumber: lineNumber,
            startColumn: getFirstNonWhitespaceColumn(lineContent),
            endLineNumber: lineNumber,
            endColumn: getLastNonWhitespaceColumn(lineContent)
          },
          children: { result: [] }
        })
      } else {
        const isNotComment = /^\s*[^#;]/.test(lineContent)

        if (isNotComment && state.current) {
          const property = /^(\S+)\s*[:=]/.exec(lineContent)
          const lineNumber = index + 1
          const endColumn = getLastNonWhitespaceColumn(lineContent)

          if (property) {
            state.current.children.result.push(state.current.children.current = {
              name: property[1],
              range: {
                startLineNumber: lineNumber,
                startColumn: getFirstNonWhitespaceColumn(lineContent),
                endLineNumber: lineNumber,
                endColumn
              }
            })
          } else if (state.current.children.current) {
            state.current.children.current.range.endLineNumber = lineNumber
            state.current.children.current.range.endColumn = endColumn
          }

          state.current.range.endLineNumber = lineNumber
          state.current.range.endColumn = endColumn
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

const computeSections = (lines: string[]): KlipperConfigSection[] => {
  type MutableSection = { sectionName: string, range: MutableRange }

  return lines
    .reduce<ReduceState<MutableSection>>((state, lineContent, index) => {
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
          const lineNumber = index + 1
          const endColumn = getLastNonWhitespaceColumn(lineContent)
          state.current.range.endLineNumber = lineNumber
          state.current.range.endColumn = endColumn
        }
      }

      return state
    }, { result: [] })
    .result
}

addEventListener('message', (event: MessageEvent<KlipperConfigLanguageWorkerServerMessage>) => {
  const { data } = event

  if (data.action === 'compute') {
    const lines = data.content.split('\n')

    const message: KlipperConfigLanguageWorkerClientMessage = {
      action: 'result',
      folding: computeFolding(lines),
      symbols: computeSymbols(lines),
      sections: computeSections(lines)
    }

    postMessage(message)
  }
})
