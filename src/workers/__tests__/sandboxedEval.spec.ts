import {
  buildSandboxedEvalFrameSrcdoc,
  sandboxedEvalWorkerMain,
  type SandboxedEvalWorkerRequestMessage
} from '../sandboxedEval'

type WorkerScope = Parameters<typeof sandboxedEvalWorkerMain>[0]
type WorkerPort = Parameters<NonNullable<WorkerScope['onmessage']>>[0]['data']

// runs the serialized source, so a reference to anything outside the function fails here
const startWorker = (postMessage = vi.fn()) => {
  const scope: WorkerScope = { onmessage: null }
  const port: WorkerPort = { onmessage: null, postMessage }

  // eslint-disable-next-line no-new-func
  new Function('self', `(${sandboxedEvalWorkerMain.toString()})(self)`)(scope)

  scope.onmessage?.({ data: port })

  return {
    postMessage,
    send: (data: SandboxedEvalWorkerRequestMessage) => port.onmessage?.({ data })
  }
}

const getFrameScript = () => {
  const match = /<script>([\s\S]*)<\/script>$/.exec(buildSandboxedEvalFrameSrcdoc())

  if (!match) {
    throw new Error('frame script not found')
  }

  return match[1]
}

describe('sandboxedEvalWorkerMain', () => {
  it.each([
    ['returns the result, with the context', 'return context.a + context.b', { action: 'result', result: 3 }],
    ['passes null as self', 'return self', { action: 'result', result: null }],
    ['returns thrown errors', 'throw new Error("boom")', { action: 'error', error: new Error('boom') }]
  ])('%s', (_, code, expected) => {
    const { postMessage, send } = startWorker()

    send({ code, context: { a: 1, b: 2 }, id: 7 })

    expect(postMessage).toHaveBeenCalledWith({ ...expected, id: 7 })
  })

  it('returns an error when the result cannot be posted', () => {
    const { postMessage, send } = startWorker(vi.fn().mockImplementationOnce(() => {
      throw new Error('could not be cloned')
    }))

    send({ code: 'return () => 1', id: 3 })

    expect(postMessage).toHaveBeenLastCalledWith({ action: 'error', error: 'Error: could not be cloned', id: 3 })
  })
})

describe('sandboxedEvalFrameMain', () => {
  class FakeWorker {
    static instances: FakeWorker[] = []

    postMessage = vi.fn()
    terminate = vi.fn()

    constructor (readonly url: string) {
      FakeWorker.instances.push(this)
    }
  }

  const startFrame = () => {
    FakeWorker.instances = []

    let listener: ((event: { source: unknown, data: unknown, ports: unknown[] }) => void) | undefined
    const parent = { postMessage: vi.fn() }
    const fakeWindow = {
      parent,
      addEventListener: (_type: string, fn: typeof listener) => {
        listener = fn
      }
    }
    const fakeUrl = { createObjectURL: () => 'blob:worker' }

    // eslint-disable-next-line no-new-func
    new Function('window', 'URL', 'Worker', getFrameScript())(fakeWindow, fakeUrl, FakeWorker)

    const send = (data: unknown, ports: unknown[] = [], source: unknown = parent) => listener?.({ source, data, ports })

    return { parent, send }
  }

  it('announces it is ready', () => {
    const { parent } = startFrame()

    expect(parent.postMessage).toHaveBeenCalledWith('ready', '*')
  })

  it('hands each new worker its port', () => {
    const { send } = startFrame()
    const port = {}

    send({ action: 'create', worker: 'a' }, [port])

    expect(FakeWorker.instances).toHaveLength(1)
    expect(FakeWorker.instances[0].url).toBe('blob:worker')
    expect(FakeWorker.instances[0].postMessage).toHaveBeenCalledWith(port, [port])
  })

  it('terminates a worker', () => {
    const { send } = startFrame()

    send({ action: 'create', worker: 'a' }, [{}])
    send({ action: 'terminate', worker: 'a' })

    expect(FakeWorker.instances[0].terminate).toHaveBeenCalled()
  })

  it('ignores messages not sent by its parent', () => {
    const { send } = startFrame()

    send({ action: 'create', worker: 'a' }, [{}], {})

    expect(FakeWorker.instances).toHaveLength(0)
  })
})

describe('buildSandboxedEvalFrameSrcdoc', () => {
  it('sets a CSP that blocks every load but blob: workers', () => {
    const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(buildSandboxedEvalFrameSrcdoc())?.[1]

    expect(csp).toBe([
      "default-src 'none'",
      "script-src 'unsafe-inline' 'unsafe-eval' blob:",
      'worker-src blob:',
      'child-src blob:',
      "frame-src 'none'",
      "base-uri 'none'"
    ].join('; '))
  })

  it('closes its script element only once', () => {
    expect(buildSandboxedEvalFrameSrcdoc().match(/<\/script/gi)).toHaveLength(1)
  })
})
