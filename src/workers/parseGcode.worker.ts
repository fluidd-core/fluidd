import type { BBox, Layer, Move, Part } from '@/store/gcodePreview/types'
import parseGcode from './parseGcode'
import { consola } from 'consola'

export type ParseGcodeWorkerRequestMessage = {
  action: 'parse',
  gcode: ArrayBuffer
}

export type ParseGcodeWorkerResponseMessage = {
  action: 'progress',
  filePosition: number
} | {
  action: 'result',
  moves: Move[],
  layers: Layer[],
  parts: Part[],
  tools: number[],
  bounds: BBox | null
} | {
  action: 'error',
  error?: unknown
}

const sendProgress = (filePosition: number) => {
  const message: ParseGcodeWorkerResponseMessage = {
    action: 'progress',
    filePosition
  }

  self.postMessage(message)
}

const sendResult = (moves: Move[], layers: Layer[], parts: Part[], tools: number[], bounds: BBox | null) => {
  const message : ParseGcodeWorkerResponseMessage = {
    action: 'result',
    moves,
    layers,
    parts,
    tools,
    bounds
  }

  self.postMessage(message)
}

const sendError = (error?: unknown) => {
  const message: ParseGcodeWorkerResponseMessage = {
    action: 'error',
    error
  }

  self.postMessage(message)
}

self.onmessage = (event: MessageEvent<ParseGcodeWorkerRequestMessage>) => {
  const message = event.data

  try {
    switch (message.action) {
      case 'parse': {
        const gcode = new TextDecoder().decode(message.gcode)

        const { moves, layers, parts, tools, bounds } = parseGcode(gcode, sendProgress)

        sendResult(moves, layers, parts, tools, bounds)

        break
      }
    }
  } catch (e) {
    consola.error('[ParseGcode] error in worker', e)

    sendError(e)
  }
}
