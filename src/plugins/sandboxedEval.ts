import abortControllerWithTimeout from '@/util/abort-controller-with-timeout'
import type { SandboxedEvalWorkerResponseMessage, SandboxedEvalWorkerRequestMessage } from '@/workers/sandboxedEval.worker'

import SandboxedEvalWorker from '@/workers/sandboxedEval.worker?ts?worker'

const workers: Record<string, Worker> = {}

const sandboxedEval = async<T>(code: string, feature?: string, timeout = 800): Promise<T> => {
  const id = Date.now()
  const worker = getWorker(feature)

  const abortController = abortControllerWithTimeout(timeout)
  const { signal } = abortController

  const workerPromise = new Promise<unknown>((resolve, reject) => {
    const cleanup = () => {
      worker.removeEventListener('message', messageHandler)
      signal.removeEventListener('abort', abortHandler)
    }

    const abortHandler = () => {
      cleanup()
      reject(signal.reason ?? new Error('Timeout'))
    }

    const messageHandler = (event: MessageEvent<SandboxedEvalWorkerResponseMessage>) => {
      const message = event.data

      if (message.id !== id) {
        return
      }

      cleanup()

      switch (message.action) {
        case 'result': {
          resolve(message.result)

          break
        }
        case 'error': {
          reject(message.error)

          break
        }
      }
    }

    worker.addEventListener('message', messageHandler)

    signal.addEventListener('abort', abortHandler, { once: true })
  })

  const message: SandboxedEvalWorkerRequestMessage = {
    code,
    id
  }

  worker.postMessage(message)

  try {
    const result = await workerPromise

    return result as T
  } finally {
    abortController.clear()

    if (feature && signal.aborted) {
      worker.terminate()
      delete workers[feature]
    } else if (!feature) {
      worker.terminate()
    }
  }
}

const getWorker = (feature?: string) => {
  if (feature) {
    if (workers[feature]) {
      return workers[feature]
    }

    const worker = workers[feature] = new SandboxedEvalWorker()

    return worker
  }

  return new SandboxedEvalWorker()
}

export default sandboxedEval
