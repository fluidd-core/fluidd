import { consola } from 'consola'

const webSocketWrapper = (url: string, signal?: AbortSignal) => {
  return new Promise<boolean>((resolve) => {
    consola.debug(`[webSocketWrapper] open ${url}`)

    const connection = new WebSocket(url)

    const dispose = () => {
      signal?.removeEventListener('abort', abortHandler)

      connection.close()
    }

    const abortHandler = () => dispose()

    signal?.addEventListener('abort', abortHandler)

    connection.onopen = () => {
      consola.debug(`[webSocketWrapper] ${url} open`)

      resolve(true)

      dispose()
    }

    connection.onerror = () => {
      consola.debug(`[webSocketWrapper] ${url} error`)

      resolve(false)

      dispose()
    }

    connection.onclose = () => {
      consola.debug(`[webSocketWrapper] ${url} close`)
    }
  })
}

export default webSocketWrapper
