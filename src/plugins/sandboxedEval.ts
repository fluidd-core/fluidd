import type { SandboxedEvalWorkerClientMessage, SandboxedEvalWorkerServerMessage } from '@/workers/sandboxedEval.worker'

import SandboxedEvalWorker from '@/workers/eval.worker?ts?worker'

const workers: Record<string, Worker> = {}

const sandboxedEval = async<T>(code: string, feature?: string, timeout = 800): Promise<T> => {
  const id = Date.now()
  const worker = getWorker(feature)

  const workerPromise = new Promise<unknown>((resolve, reject) => {
    const messageHandler = (event: MessageEvent<SandboxedEvalWorkerClientMessage>) => {
      const message = event.data

      if (message.id !== id) {
        return
      }

      worker.removeEventListener('message', messageHandler)

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
  })

  const message: SandboxedEvalWorkerServerMessage = {
    code,
    id
  }

  worker.postMessage(message)

  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Timeout')), timeout)
  })

  try {
    const result = await Promise.race([
      workerPromise,
      timeoutPromise
    ])

    return result as T
  } finally {
    if (!feature) {
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
