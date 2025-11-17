import mjpegStream from './mjpegStream'
import { consola } from 'consola'

export type MjpegWorkerClientMessage = {
  action: 'frame',
  data: Uint8Array<ArrayBuffer>
} | {
  action: 'done'
} | {
  action: 'error',
  error?: unknown
}

export type MjpegWorkerServerMessage = {
  action: 'start',
  url: string
}

const sendFrame = (data: Uint8Array<ArrayBuffer>) => {
  const message: MjpegWorkerClientMessage = {
    action: 'frame',
    data
  }

  self.postMessage(message, [data.buffer])
}

const sendDone = () => {
  const message: MjpegWorkerClientMessage = {
    action: 'done'
  }

  self.postMessage(message)
}

const sendError = (error?: unknown) => {
  const message: MjpegWorkerClientMessage = {
    action: 'error',
    error
  }

  self.postMessage(message)
}

self.onmessage = async (event: MessageEvent<MjpegWorkerServerMessage>) => {
  const message = event.data

  try {
    switch (message.action) {
      case 'start': {
        await mjpegStream(message.url, sendFrame)

        sendDone()

        break
      }
    }
  } catch (e) {
    consola.error('[MjpegStream] error in worker', e)

    sendError(e)
  }
}
