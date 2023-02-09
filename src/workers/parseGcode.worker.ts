import { Layer, Move, ParseGcodeWorkerClientMessage, ParseGcodeWorkerServerMessage } from '@/store/gcodePreview/types'
import parseGcode from './parseGcode'

const sendProgress = (filePosition: number) => {
  const message: ParseGcodeWorkerClientMessage = {
    action: 'progress',
    filePosition
  }

  self.postMessage(message)
}

const sendResult = (moves: Move[], layers: Layer[]) => {
  const message : ParseGcodeWorkerClientMessage = {
    action: 'result',
    moves,
    layers
  }

  self.postMessage(message)
}

self.onmessage = (e) => {
  const data: ParseGcodeWorkerServerMessage = e.data

  switch (data.action) {
    case 'parse': {
      const { moves, layers } = parseGcode(data.gcode, sendProgress)

      sendResult(moves, layers)

      break
    }
  }
}
