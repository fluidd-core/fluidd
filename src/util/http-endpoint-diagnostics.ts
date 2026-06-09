import consola from 'consola'

export type HttpDiagnosticResult =
  | { kind: 'mixed-content' }
  | { kind: 'cors' }
  | { kind: 'reachable'; status: number }
  | { kind: 'unreachable' }
  | { kind: 'cancelled' }

export interface DiagnoseOptions {
  timeout?: number;
  signal?: AbortSignal;
}

const diagnoseHttpEndpoint = async (apiUrl: string, options: DiagnoseOptions = {}): Promise<HttpDiagnosticResult> => {
  const debug = (message: string, ...args: unknown[]) => consola.debug(`[diagnoseHttpEndpoint] ${apiUrl} ${message}`, ...args)

  const { timeout, signal } = options

  // A secure page can't open an insecure connection; detected before any request.
  if (window.location.protocol === 'https:' && apiUrl.startsWith('http://')) {
    debug('mixed content')

    return {
      kind: 'mixed-content'
    }
  }

  const timeoutSignal = timeout !== undefined
    ? AbortSignal.timeout(timeout)
    : undefined

  const combinedSignal = AbortSignal.any(
    [timeoutSignal, signal]
      .filter(Boolean)
  )

  const probeUrl = `${apiUrl}/server/info?t=${Date.now()}`

  try {
    const response = await fetch(probeUrl, {
      signal: combinedSignal,
      cache: 'no-cache'
    })

    // A resolved response (any status) means the server is reachable with CORS
    // headers, so the WebSocket failure is likely a reverse-proxy/path issue.
    debug('reachable', response.status)

    return {
      kind: 'reachable',
      status: response.status
    }
  } catch (error) {
    if (combinedSignal.aborted && !timeoutSignal?.aborted) {
      debug('cancelled')

      return {
        kind: 'cancelled'
      }
    }

    debug('cors fetch failed', error)

    // If a no-cors re-probe succeeds, the host is reachable and the earlier
    // failure was the CORS policy rather than an unreachable host.
    try {
      await fetch(probeUrl, {
        signal: combinedSignal,
        mode: 'no-cors',
        cache: 'no-cache'
      })

      debug('cors')

      return {
        kind: 'cors'
      }
    } catch (noCorsError) {
      if (combinedSignal.aborted && !timeoutSignal?.aborted) {
        debug('cancelled')

        return {
          kind: 'cancelled'
        }
      }

      debug('unreachable', noCorsError)

      return {
        kind: 'unreachable'
      }
    }
  }
}

export default diagnoseHttpEndpoint
