import consola from 'consola'

export type WebSocketCheckResult =
  | { ok: true }
  | { ok: false; reason: 'timeout' | 'cancelled' | 'error'; message: string }

export interface CheckWebSocketOptions {
  timeout?: number;
  signal?: AbortSignal;
  protocols?: string | string[];
}

const webSocketWrapper = (url: string, options: CheckWebSocketOptions = {}): Promise<WebSocketCheckResult> => {
  const debug = (message: string, ...args: unknown[]) => consola.debug(`[webSocketWrapper] ${url} ${message}`, ...args)

  const { timeout, signal, protocols } = options

  const timeoutSignal = timeout !== undefined
    ? AbortSignal.timeout(timeout)
    : undefined

  const combinedSignal = AbortSignal.any(
    [timeoutSignal, signal]
      .filter(Boolean)
  )

  const getAbortResult = (): WebSocketCheckResult => {
    if (timeoutSignal?.aborted) {
      debug('timed out')

      return {
        ok: false,
        reason: 'timeout',
        message: combinedSignal.reason.message
      }
    }

    debug('aborted')

    return {
      ok: false,
      reason: 'cancelled',
      message: combinedSignal.reason instanceof Error
        ? combinedSignal.reason.message
        : 'Check was cancelled via AbortSignal.',
    }
  }

  if (combinedSignal.aborted) {
    return Promise.resolve(getAbortResult())
  }

  return new Promise<WebSocketCheckResult>((resolve) => {
    let settled = false

    const settle = (result: WebSocketCheckResult) => {
      if (settled) return

      settled = true

      combinedSignal.removeEventListener('abort', onAbort)

      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        // Use code 1000 (Normal Closure) so servers don't log warnings.
        try {
          ws.close(1000, 'probe complete')
        } catch {
          /* ignore */
        }
      }

      resolve(result)
    }

    let ws: WebSocket

    try {
      debug('opening...')

      ws = new WebSocket(url, protocols)
    } catch (err) {
      // `new WebSocket()` throws synchronously for an invalid URL scheme.
      resolve({
        ok: false,
        reason: 'error',
        message: err instanceof Error ? err.message : String(err),
      })

      return
    }

    ws.onopen = (event) => {
      debug('opened', event)

      settle({ ok: true })
    }

    ws.onerror = (event) => {
      debug('error', event)

      // The browser hides error details for security reasons; the close event
      // that always follows carries a (limited) code and reason.
    }

    ws.onclose = (event) => {
      debug('closed', event)

      settle({
        ok: false,
        reason: 'error',
        message: event.reason
          ? `Connection closed before opening: ${event.reason} (code ${event.code})`
          : `Connection closed before opening (code ${event.code}).`,
      })
    }

    const onAbort = (): void => {
      settle(getAbortResult())
    }

    combinedSignal.addEventListener('abort', onAbort, { once: true })
  })
}

export default webSocketWrapper
