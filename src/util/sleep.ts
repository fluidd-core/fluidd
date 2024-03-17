import consola from 'consola'

const sleep = (ms: number, signal?: AbortSignal) => {
  const debug = (message: string, ...args: unknown[]) => consola.debug(`[sleep] ${message}`, ...args)

  return new Promise((resolve, reject) => {
    debug(`sleeping for ${ms}...`)

    const dispose = () => {
      signal?.removeEventListener('abort', abortHandler)

      clearTimeout(timeoutId)
    }

    const abortHandler = () => {
      debug('aborted')

      dispose()

      reject(new Error('AbortError'))
    }

    const timeoutHandler = () => {
      debug('timed out')

      dispose()

      resolve(null)
    }

    signal?.addEventListener('abort', abortHandler)

    const timeoutId = setTimeout(timeoutHandler, ms)
  })
}

export default sleep
