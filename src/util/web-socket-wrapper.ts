import { consola } from 'consola'

const webSocketWrapper = (url: string, signal?: AbortSignal) => {
  const debug = (message: string, ...args: unknown[]) => consola.debug(`[webSocketWrapper] ${url} ${message}`, ...args)

  return new Promise((resolve, reject) => {
    debug('opening...')

    const dispose = () => {
      signal?.removeEventListener('abort', abortHandler)

      connection.close()
    }

    const abortHandler = () => {
      debug('aborted')

      dispose()

      reject(new Error('AbortError'))
    }

    signal?.addEventListener('abort', abortHandler)

    const connection = new WebSocket(url)

    connection.onopen = (event) => {
      debug('opened', event)

      dispose()

      resolve(null)
    }

    connection.onerror = (event) => {
      debug('error', event)

      dispose()

      reject(event)
    }

    connection.onclose = (event) => {
      debug('closed', event)
    }
  })
}

export default webSocketWrapper
