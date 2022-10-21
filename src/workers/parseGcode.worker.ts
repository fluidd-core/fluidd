import { Move, ParseGcodeWorkerClientMessage, ParseGcodeWorkerServerMessage } from '@/store/gcodePreview/types'
import parseGcode from './parseGcode'

const sendProgress = (filePosition: number) => {
  const message: ParseGcodeWorkerClientMessage = {
    action: 'progress',
    filePosition
  }

  self.postMessage(message)
}

const sendMoves = (moves: Move[]) => {
  const message : ParseGcodeWorkerClientMessage = {
    action: 'moves',
    moves
  }

  self.postMessage(message)
}

self.onmessage = (e) => {
  const data: ParseGcodeWorkerServerMessage = e.data

  switch (data.action) {
    case 'parse': {
      const moves = parseGcode(data.gcode, sendProgress)

      sendMoves(moves)

      break
    }
  }
}
