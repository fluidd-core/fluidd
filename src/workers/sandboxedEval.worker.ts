import { consola } from 'consola'

export type SandboxedEvalWorkerClientMessage = ({
  action: 'result',
  result: unknown
} | {
  action: 'error',
  error?: unknown
}) & {
  id?: unknown
}

export type SandboxedEvalWorkerServerMessage = {
  code: string,
  id?: unknown
}

const disableProperty = (propertyKey: PropertyKey, value?: unknown) => {
  try {
    Object.defineProperty(globalThis, propertyKey, {
      configurable: false,
      writable: false,
      value
    })
  } catch {
  }
}

disableProperty('fetch', () => Promise.reject(new Error('fetch disabled in this worker')))

const networkError = () => {
  throw new Error('network disabled in this worker')
}

const XHRStub = function () {
  networkError()
}

XHRStub.prototype = {}

disableProperty('XMLHttpRequest', XHRStub)

disableProperty('importScripts', networkError)

disableProperty('WebSocket')

disableProperty('WebTransport')

disableProperty('RTCPeerConnection')

const sendResult = (result: unknown, id?: unknown) => {
  const message : SandboxedEvalWorkerClientMessage = {
    action: 'result',
    result,
    id
  }

  self.postMessage(message)
}

const sendError = (error?: unknown, id?: unknown) => {
  const message: SandboxedEvalWorkerClientMessage = {
    action: 'error',
    error,
    id
  }

  self.postMessage(message)
}

self.onmessage = async (event: MessageEvent<SandboxedEvalWorkerServerMessage>) => {
  const message = event.data

  try {
    // eslint-disable-next-line no-eval
    const result = eval(`(function (self) { ${message.code} })(null)`)

    sendResult(result, message.id)
  } catch (e) {
    consola.error('[SandboxedEval] error in worker', e)

    sendError(e, message.id)
  }
}
