import { consola } from 'consola'

const webSocketWrapper = (url: string, signal?: AbortSignal) => {
  const debug = (message: string) => consola.debug(`[webSocketWrapper] ${url} ${message}`)

  return new Promise((resolve, reject) => {
    debug('opening...')

    const connection = new WebSocket(url)

    const dispose = () => {
      signal?.removeEventListener('abort', abortHandler)

      connection.close()
    }

    const abortHandler = () => {
      debug('aborted')

      reject(new Error('AbortError'))

      dispose()
    }

    signal?.addEventListener('abort', abortHandler)

    connection.onopen = () => {
      debug('opened')

      resolve(null)

      dispose()
    }

    connection.onerror = (event) => {
      debug('error')

      reject(event)

      dispose()
    }

    connection.onclose = () => {
      debug('closed')
    }
  })
}

export default webSocketWrapper
