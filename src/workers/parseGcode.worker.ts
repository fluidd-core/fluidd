import type { Layer, Move, ParseGcodeWorkerClientMessage, ParseGcodeWorkerServerMessage, Part } from '@/store/gcodePreview/types'
import parseGcode from './parseGcode'

const sendProgress = (filePosition: number) => {
  const message: ParseGcodeWorkerClientMessage = {
    action: 'progress',
    filePosition
  }

  self.postMessage(message)
}

const sendResult = (moves: Move[], layers: Layer[], parts: Part[]) => {
  const message : ParseGcodeWorkerClientMessage = {
    action: 'result',
    moves,
    layers,
    parts
  }

  self.postMessage(message)
}

self.onmessage = (e) => {
  const data: ParseGcodeWorkerServerMessage = e.data

  switch (data.action) {
    case 'parse': {
      const { moves, layers, parts } = parseGcode(data.gcode, sendProgress)

      sendResult(moves, layers, parts)

      break
    }
  }
}
