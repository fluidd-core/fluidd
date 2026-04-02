import type { MonacoEditorFoldingRange, MonacoEditorLanguageWorkerClientMessage, MonacoEditorLanguageWorkerServerMessage, ReduceState } from './monacoEditorLanguageWorkerHelpers'

const computeFoldingRanges = (lines: string[]): MonacoEditorFoldingRange[] => {
  const layerBlocks = lines
    .reduce<ReduceState<MonacoEditorFoldingRange>>((state, lineContent, index) => {
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
    .reduce<ReduceState<MonacoEditorFoldingRange>>((state, lineContent, index) => {
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
    .reduce<ReduceState<MonacoEditorFoldingRange>>((state, lineContent, index) => {
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
    .reduce<ReduceState<MonacoEditorFoldingRange>>((state, lineContent, index) => {
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

const sendFoldingRanges = (result: MonacoEditorFoldingRange[]) => {
  const message: MonacoEditorLanguageWorkerClientMessage = {
    action: 'resultFoldingRanges',
    result
  }

  self.postMessage(message)
}

const sendError = (error?: unknown) => {
  const message: MonacoEditorLanguageWorkerClientMessage = {
    action: 'error',
    error
  }

  self.postMessage(message)
}

addEventListener('message', (event: MessageEvent<MonacoEditorLanguageWorkerServerMessage>) => {
  const message = event.data

  try {
    const lines = message.content.split('\n')

    switch (message.action) {
      case 'getFoldingRanges': {
        const ranges = computeFoldingRanges(lines)

        sendFoldingRanges(ranges)

        break
      }

      default:
        throw new Error(`Unknown action: ${message.action}`)
    }
  } catch (error) {
    sendError(error)
  }
})
