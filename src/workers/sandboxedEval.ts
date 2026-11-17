// Runs in a blob: Worker inside an <iframe sandbox="allow-scripts" srcdoc>: the frame's opaque
// origin and CSP, inherited by the Worker, keep the evaluated code off the network and away
// from Fluidd's storage. Both main functions are serialized with toString, so they must stay
// self-contained and this file import-free.

export type SandboxedEvalWorkerRequestMessage = {
  code: string,
  context?: unknown,
  id: number
}

export type SandboxedEvalWorkerResponseMessage = ({
  action: 'result',
  result: unknown
} | {
  action: 'error',
  error?: unknown
}) & {
  id: number
}

// a 'create' message transfers the worker's MessagePort
export type SandboxedEvalFrameMessage = {
  action: 'create' | 'terminate',
  worker: string
}

type SandboxedEvalWorkerPort = {
  onmessage: ((event: { data: SandboxedEvalWorkerRequestMessage }) => void) | null,
  postMessage: (message: SandboxedEvalWorkerResponseMessage) => void
}

type SandboxedEvalWorkerScope = {
  onmessage: ((event: { data: SandboxedEvalWorkerPort }) => void) | null
}

export const sandboxedEvalWorkerMain = (scope: SandboxedEvalWorkerScope) => {
  scope.onmessage = ({ data: port }) => {
    scope.onmessage = null

    port.onmessage = ({ data: { code, context, id } }) => {
      let response: SandboxedEvalWorkerResponseMessage

      try {
        // eslint-disable-next-line no-eval
        const fn = (0, eval)(`(function (self, context) { ${code} })`)

        response = {
          action: 'result',
          result: fn(null, context),
          id
        }
      } catch (error) {
        response = {
          action: 'error',
          error,
          id
        }
      }

      try {
        port.postMessage(response)
      } catch (error) {
        // the result could not be cloned
        port.postMessage({
          action: 'error',
          error: String(error),
          id
        })
      }
    }
  }
}

export const sandboxedEvalFrameMain = (workerSource: string) => {
  const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }))
  const workers = new Map<string, Worker>()

  window.addEventListener('message', (event: MessageEvent<SandboxedEvalFrameMessage>) => {
    if (event.source !== window.parent) {
      return
    }

    const { action, worker } = event.data

    workers.get(worker)?.terminate()
    workers.delete(worker)

    if (action === 'create') {
      const port = event.ports[0]
      const instance = new Worker(workerUrl)

      instance.postMessage(port, [port])
      workers.set(worker, instance)
    }
  })

  // the frame cannot name Fluidd's origin
  window.parent.postMessage('ready', '*')
}

const SANDBOXED_EVAL_FRAME_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' blob:",
  'worker-src blob:',
  // worker-src fallback for Safari < 15.5
  'child-src blob:',
  // keeps child-src from allowing blob: frames
  "frame-src 'none'",
  "base-uri 'none'"
].join('; ')

// escaping `<` keeps a `</script>` in the payload from closing the script element
const toScriptLiteral = (value: string) => JSON.stringify(value).replace(/</g, '\\u003c')

export const buildSandboxedEvalFrameSrcdoc = () => {
  const workerSource = `(${sandboxedEvalWorkerMain.toString()})(self)`
  const frameSource = `(${sandboxedEvalFrameMain.toString()})(${toScriptLiteral(workerSource)})`

  return [
    '<!doctype html>',
    `<meta http-equiv="Content-Security-Policy" content="${SANDBOXED_EVAL_FRAME_CSP}">`,
    `<script>${frameSource}</script>`
  ].join('')
}
