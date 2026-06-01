import diagnoseHttpEndpoint from '../http-endpoint-diagnostics'

describe('diagnoseHttpEndpoint', () => {
  const originalLocation = window.location

  const setProtocol = (protocol: string) => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, protocol }
    })
  }

  afterEach(() => {
    vi.unstubAllGlobals()

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    })
  })

  it('returns mixed-content for an http target on an https page', async () => {
    setProtocol('https:')

    const result = await diagnoseHttpEndpoint('http://printer.local')

    expect(result).toEqual({ kind: 'mixed-content' })
  })

  it.each([200, 401, 404])('returns reachable when the cors fetch resolves (status %i)', async (status) => {
    setProtocol('http:')

    const fetchMock = vi.fn().mockResolvedValue({ status })
    vi.stubGlobal('fetch', fetchMock)

    const result = await diagnoseHttpEndpoint('http://printer.local')

    expect(result).toEqual({ kind: 'reachable', status })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns cors when the cors fetch fails but the no-cors fetch succeeds', async () => {
    setProtocol('http:')

    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ type: 'opaque' })
    vi.stubGlobal('fetch', fetchMock)

    const result = await diagnoseHttpEndpoint('http://printer.local')

    expect(result).toEqual({ kind: 'cors' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ mode: 'no-cors' })
  })

  it('returns unreachable when both fetches fail', async () => {
    setProtocol('http:')

    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await diagnoseHttpEndpoint('http://printer.local')

    expect(result).toEqual({ kind: 'unreachable' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns cancelled when the signal aborts before the cors fetch settles', async () => {
    setProtocol('http:')

    const controller = new AbortController()

    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts: RequestInit) =>
      new Promise((_resolve, reject) => {
        opts.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      })
    ))

    const promise = diagnoseHttpEndpoint('http://printer.local', { signal: controller.signal })

    controller.abort()

    const result = await promise

    expect(result).toEqual({ kind: 'cancelled' })
  })
})
