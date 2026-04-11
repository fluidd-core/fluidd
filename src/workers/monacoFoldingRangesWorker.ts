import { consola } from 'consola'
import type { MonacoLanguageWorkerRequestMessage, MonacoLanguageWorkerResponseMessage, ReduceState, StackReduceState } from './monacoWorkerHelpers'

export type MonacoFoldingRangesWorkerResponseMessage = MonacoLanguageWorkerResponseMessage<MonacoFoldingRange[]>

export type MonacoFoldingRangeKind = 'comment' | 'region'

export type MonacoFoldingRange = {
  kind: MonacoFoldingRangeKind,
  start: number,
  end: number
}

const gcodeFoldingRanges = (lines: string[]): MonacoFoldingRange[] => {
  const layerBlocks = lines
    .reduce<ReduceState<MonacoFoldingRange>>((state, lineContent, index) => {
      const isLayer = /^\s*SET_PRINT_STATS_INFO .*CURRENT_LAYER=/i.test(lineContent)

      if (isLayer) {
        state.result.push(state.current = {
          kind: 'region',
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

  const objectBlocks = lines
    .reduce<ReduceState<MonacoFoldingRange>>((state, lineContent, index) => {
      lineContent = lineContent.trim()

      if (lineContent.length > 0) {
        const isObject = /^\s*EXCLUDE_OBJECT_(START|END) /i.exec(lineContent)

        if (isObject) {
          switch (isObject[1].toUpperCase()) {
            case 'START':
              state.result.push(state.current = {
                kind: 'region',
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

  const thumbnailBlocks = lines
    .reduce<ReduceState<MonacoFoldingRange>>((state, lineContent, index) => {
      if (lineContent.startsWith('; thumbnail')) {
        const type = lineContent.substring(11).split(' ')[1]

        switch (type) {
          case 'begin':
            state.result.push(state.current = {
              kind: 'comment',
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

  const commentBlocks = lines
    .reduce<ReduceState<MonacoFoldingRange>>((state, lineContent, index) => {
      lineContent = lineContent.trim()

      if (lineContent.length > 0) {
        const isComment = lineContent.startsWith(';')

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
    ...layerBlocks,
    ...objectBlocks,
    ...commentBlocks,
    ...thumbnailBlocks
  ]
}

const klipperConfigFoldingRanges = (lines: string[]): MonacoFoldingRange[] => {
  const sectionBlocks = lines
    .reduce<ReduceState<MonacoFoldingRange>>((state, lineContent, index) => {
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
    .reduce<StackReduceState<number, MonacoFoldingRange>>((state, lineContent, index) => {
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
    .reduce<ReduceState<MonacoFoldingRange>>((state, lineContent, index) => {
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

const sendResult = (result: MonacoFoldingRange[]) => {
  const message: MonacoFoldingRangesWorkerResponseMessage = {
    action: 'result',
    result
  }

  self.postMessage(message)
}

const sendError = (error?: unknown) => {
  const message: MonacoFoldingRangesWorkerResponseMessage = {
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
      case 'gcode': {
        const foldingRanges = gcodeFoldingRanges(lines)

        sendResult(foldingRanges)

        break
      }

      case 'klipper-config': {
        const foldingRanges = klipperConfigFoldingRanges(lines)

        sendResult(foldingRanges)

        break
      }

      default:
        throw new Error(`Unsupported language: ${message.language}`)
    }
  } catch (e) {
    consola.error('[MonacoFoldingRanges] error in worker', e)

    sendError(e)
  }
}
