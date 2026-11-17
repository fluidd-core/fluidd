/**
 * @vitest-environment jsdom
 */
type WorkerScope = Parameters<typeof import('@/workers/sandboxedEval').sandboxedEvalWorkerMain>[0]
type WorkerPort = Parameters<NonNullable<WorkerScope['onmessage']>>[0]['data']

// jsdom does not run the srcdoc script, so the frame only becomes ready when a test says so
const loadPlugin = async () => {
  vi.resetModules()

  const { default: sandboxedEval } = await import('../sandboxedEval')
  const { sandboxedEvalWorkerMain } = await import('@/workers/sandboxedEval')

  const getIframe = () => document.querySelector('iframe')

  // stands in for the frame: runs each worker in this thread, on its real MessagePort
  const announceReady = () => {
    const contentWindow = getIframe()?.contentWindow

    if (!contentWindow) {
      throw new Error('frame not created')
    }

    vi.spyOn(contentWindow, 'postMessage').mockImplementation((...args: unknown[]) => {
      const [message, , transfer] = args
      const port = Array.isArray(transfer) ? transfer[0] : undefined

      if (message && typeof message === 'object' && 'action' in message && message.action === 'create' && port instanceof MessagePort) {
        const scope: WorkerScope = { onmessage: null }
        const workerPort: WorkerPort = {
          onmessage: null,
          postMessage: response => port.postMessage(response)
        }

        port.onmessage = event => workerPort.onmessage?.(event)

        sandboxedEvalWorkerMain(scope)
        scope.onmessage?.({ data: workerPort })
      }
    })

    window.dispatchEvent(new MessageEvent('message', { data: 'ready', source: contentWindow }))
  }

  return { sandboxedEval, getIframe, announceReady }
}

describe('sandboxedEval', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.replaceChildren()
  })

  it('evaluates the code in the frame once it is ready', async () => {
    const { sandboxedEval, getIframe, announceReady } = await loadPlugin()

    const result = sandboxedEval('return context * 2', { context: 21 })

    expect(getIframe()?.getAttribute('sandbox')).toBe('allow-scripts')

    announceReady()

    await expect(result).resolves.toBe(42)
  })

  it('rejects a context that cannot be cloned, and terminates its worker', async () => {
    const { sandboxedEval, getIframe, announceReady } = await loadPlugin()

    const result = sandboxedEval('return 1', { context: () => 1 })

    announceReady()

    const postMessage = getIframe()?.contentWindow?.postMessage

    await expect(result).rejects.toThrow()
    await vi.waitFor(() => {
      expect(postMessage).toHaveBeenLastCalledWith({ action: 'terminate', worker: 'request:1' }, '*', [])
    })
  })

  it('fails when the frame never loads, and keeps failing at once', async () => {
    vi.useFakeTimers()

    const { sandboxedEval, getIframe } = await loadPlugin()

    const first = sandboxedEval('return 1', { timeout: 10_000 })
    const firstAssertion = expect(first).rejects.toThrow('Sandboxed eval frame failed to load')

    await vi.advanceTimersByTimeAsync(5000)
    await firstAssertion

    expect(getIframe()).toBeNull()

    const second = sandboxedEval('return 1', { timeout: 10_000 })
    const secondAssertion = expect(second).rejects.toThrow('Sandboxed eval frame failed to load')

    await vi.advanceTimersByTimeAsync(0)
    await secondAssertion

    expect(getIframe()).toBeNull()
  })
})
