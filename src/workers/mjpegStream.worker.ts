import mjpegStream from './mjpegStream'
import { consola } from 'consola'

export type MjpegWorkerClientMessage = {
  action: 'frame',
  data: Uint8Array<ArrayBuffer>
} | {
  action: 'done'
} | {
  action: 'error',
  error?: string
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

const sendError = (error?: string) => {
  const message: MjpegWorkerClientMessage = {
    action: 'error',
    error
  }

  self.postMessage(message)
}

self.onmessage = async (event) => {
  try {
    const data: MjpegWorkerServerMessage = event.data

    switch (data.action) {
      case 'start': {
        await mjpegStream(data.url, sendFrame)

        sendDone()

        break
      }
    }
  } catch (e) {
    consola.error('[MjpegStream] error in worker', e)

    const error = e != null
      ? e instanceof Error
        ? e.message
        : e.toString()
      : undefined

    sendError(error)
  }
}
