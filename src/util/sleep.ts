import { consola } from 'consola'

const sleep = (ms: number, signal?: AbortSignal): Promise<void> => {
  const debug = (message: string, ...args: unknown[]) => consola.debug(`[sleep] ${message}`, ...args)

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(signal.reason ?? new Error('AbortError'))
    }

    debug(`sleeping for ${ms}...`)

    const abortHandler = () => {
      debug('aborted')

      clearTimeout(timeoutId)

      reject(signal!.reason ?? new Error('AbortError'))
    }

    const timeoutId = setTimeout(() => {
      debug('timed out')

      signal?.removeEventListener('abort', abortHandler)

      resolve()
    }, ms)

    signal?.addEventListener('abort', abortHandler, { once: true })
  })
}

export default sleep
