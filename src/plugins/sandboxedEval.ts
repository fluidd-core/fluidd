import {
  buildSandboxedEvalFrameSrcdoc,
  type SandboxedEvalFrameMessage,
  type SandboxedEvalWorkerRequestMessage,
  type SandboxedEvalWorkerResponseMessage
} from '@/workers/sandboxedEval'

export interface SandboxedEvalOptions {
  feature?: string;
  timeout?: number;
  context?: unknown;
}

type PendingRequest = {
  resolve: (value: unknown) => void,
  reject: (reason: unknown) => void
}

let frame: Promise<Window> | undefined
let nextId = 1
const ports = new Map<string, MessagePort>()
const pendingRequests = new Map<number, PendingRequest>()

const isWorkerResponseMessage = (data: unknown): data is SandboxedEvalWorkerResponseMessage => (
  data != null &&
  typeof data === 'object' &&
  'id' in data &&
  typeof data.id === 'number' &&
  'action' in data &&
  (
    data.action === 'result' ||
    data.action === 'error'
  )
)

// a frame the page's own CSP blocks never announces it is ready
const FRAME_LOAD_TIMEOUT = 5000

const getFrame = () => {
  frame ??= new Promise<Window>((resolve, reject) => {
    const iframe = document.createElement('iframe')

    // without allow-same-origin, the frame gets an opaque origin
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.tabIndex = -1
    iframe.style.display = 'none'
    iframe.srcdoc = buildSandboxedEvalFrameSrcdoc()

    const onMessage = (event: MessageEvent<unknown>) => {
      if (
        iframe.contentWindow &&
        event.source === iframe.contentWindow &&
        event.data === 'ready'
      ) {
        window.removeEventListener('message', onMessage)
        clearTimeout(timer)
        resolve(iframe.contentWindow)
      }
    }

    // the failure is kept, so every later call fails at once
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage)
      iframe.remove()
      reject(new Error('Sandboxed eval frame failed to load'))
    }, FRAME_LOAD_TIMEOUT)

    window.addEventListener('message', onMessage)
    document.body.appendChild(iframe)
  })

  return frame
}

// a frame failure is reported by sandboxedEval
const postToFrame = (message: SandboxedEvalFrameMessage, transfer: Transferable[] = []) => {
  getFrame().then(
    // an opaque origin cannot be targeted by name
    contentWindow => contentWindow.postMessage(message, '*', transfer),
    () => undefined
  )
}

const onWorkerMessage = (event: MessageEvent<unknown>) => {
  const message = event.data

  if (!isWorkerResponseMessage(message)) {
    return
  }

  const request = pendingRequests.get(message.id)

  pendingRequests.delete(message.id)

  if (message.action === 'result') {
    request?.resolve(message.result)
  } else {
    request?.reject(message.error)
  }
}

// messages posted to the port queue until the frame hands it to the worker
const getPort = (worker: string) => {
  let port = ports.get(worker)

  if (!port) {
    const channel = new MessageChannel()

    port = channel.port1
    port.onmessage = onWorkerMessage
    ports.set(worker, port)

    postToFrame(
      {
        action: 'create',
        worker
      },
      [
        channel.port2
      ]
    )
  }

  return port
}

const terminate = (worker: string) => {
  ports.get(worker)?.close()
  ports.delete(worker)

  postToFrame({
    action: 'terminate',
    worker
  })
}

const sandboxedEval = async (code: string, options: SandboxedEvalOptions = {}): Promise<unknown> => {
  const { feature, timeout = 800, context } = options

  const id = nextId++
  const worker = feature
    ? `feature:${feature}`
    : `request:${id}`

  const signal = AbortSignal.timeout(timeout)

  const result = new Promise<unknown>((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject })

    const fail = (reason: unknown) => {
      pendingRequests.delete(id)
      reject(reason)
    }

    signal.addEventListener('abort', () => fail(signal.reason), { once: true })
    getFrame().catch(fail)

    const message: SandboxedEvalWorkerRequestMessage = { code, context, id }

    try {
      getPort(worker).postMessage(message)
    } catch (error) {
      // the context could not be cloned
      fail(error)
    }
  })

  try {
    return await result
  } finally {
    if (
      !feature ||
      signal.aborted
    ) {
      terminate(worker)
    }
  }
}

export default sandboxedEval
