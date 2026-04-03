import mjpegStream from './mjpegStream'
import { consola } from 'consola'

export type MjpegWorkerRequestMessage = {
  action: 'start',
  url: string
}

export type MjpegWorkerResponseMessage = {
  action: 'frame',
  data: Uint8Array<ArrayBuffer>
} | {
  action: 'done'
} | {
  action: 'error',
  error?: unknown
}

const sendFrame = (data: Uint8Array<ArrayBuffer>) => {
  const message: MjpegWorkerResponseMessage = {
    action: 'frame',
    data
  }

  self.postMessage(message, [data.buffer])
}

const sendDone = () => {
  const message: MjpegWorkerResponseMessage = {
    action: 'done'
  }

  self.postMessage(message)
}

const sendError = (error?: unknown) => {
  const message: MjpegWorkerResponseMessage = {
    action: 'error',
    error
  }

  self.postMessage(message)
}

self.onmessage = async (event: MessageEvent<MjpegWorkerRequestMessage>) => {
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
