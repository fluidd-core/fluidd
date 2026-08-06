import type { BBox, Layer, MoveStore, Part } from '@/store/gcodePreview/types'
import parseGcode from './parseGcode'
import { consola } from 'consola'

export type ParseGcodeWorkerRequestMessage = {
  action: 'parse',
  url: string,
  fileSize: number
}

export type ParseGcodeWorkerResultMessage = {
  action: 'result',
  moves: MoveStore,
  layers: Layer[],
  parts: Part[],
  tools: number[],
  bounds: BBox | null,
  truncated: boolean
}

export type ParseGcodeWorkerResponseMessage = {
  action: 'progress',
  filePosition: number
} | ParseGcodeWorkerResultMessage | {
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

const sendResult = (result: Omit<ParseGcodeWorkerResultMessage, 'action'>) => {
  const message: ParseGcodeWorkerResponseMessage = {
    action: 'result',
    ...result
  }

  self.postMessage(
    message,
    Object.values(result.moves)
      .filter(ArrayBuffer.isView)
      .map(v => v.buffer)
  )
}

const sendError = (error?: unknown) => {
  const message: ParseGcodeWorkerResponseMessage = {
    action: 'error',
    error
  }

  self.postMessage(message)
}

self.onmessage = async (event: MessageEvent<ParseGcodeWorkerRequestMessage>) => {
  const message = event.data

  try {
    switch (message.action) {
      case 'parse': {
        const result = await parseGcode(message.url, message.fileSize, sendProgress)

        sendResult(result)

        break
      }
    }
  } catch (e) {
    consola.error('[ParseGcode] error in worker', e)

    sendError(e)
  }
}
