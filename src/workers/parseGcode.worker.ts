import type { Layer, Move, Part } from '@/store/gcodePreview/types'
import parseGcode from './parseGcode'
import { consola } from 'consola'

export type ParseGcodeWorkerClientMessage = {
  action: 'progress',
  filePosition: number
} | {
  action: 'result',
  moves: Move[],
  layers: Layer[],
  parts: Part[]
} | {
  action: 'error',
  error?: unknown
}

export type ParseGcodeWorkerServerMessage = {
  action: 'parse',
  gcode: ArrayBuffer
}

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

const sendError = (error?: unknown) => {
  const message: ParseGcodeWorkerClientMessage = {
    action: 'error',
    error
  }

  self.postMessage(message)
}

self.onmessage = (event: MessageEvent<ParseGcodeWorkerServerMessage>) => {
  const message = event.data

  try {
    switch (message.action) {
      case 'parse': {
        const gcode = new TextDecoder().decode(message.gcode)

        const { moves, layers, parts } = parseGcode(gcode, sendProgress)

        sendResult(moves, layers, parts)

        break
      }
    }
  } catch (e) {
    consola.error('[ParseGcode] error in worker', e)

    sendError(e)
  }
}
