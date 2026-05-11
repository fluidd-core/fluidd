import { consola } from 'consola'

const sleep = (ms: number, signal?: AbortSignal): Promise<void> => {
  const debug = (message: string, ...args: unknown[]) => consola.debug(`[sleep] ${message}`, ...args)

  const timeoutSignal = AbortSignal.timeout(ms)
  const combinedSignal = AbortSignal.any([
    timeoutSignal,
    ...(signal !== undefined ? [signal] : []),
  ])

  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      if (timeoutSignal.aborted) {
        debug('timed out')
        resolve()
      } else {
        debug('aborted')
        reject(combinedSignal.reason ?? new Error('AbortError'))
      }
    }

    if (combinedSignal.aborted) {
      onAbort()
      return
    }

    debug(`sleeping for ${ms}...`)

    combinedSignal.addEventListener('abort', onAbort, { once: true })
  })
}

export default sleep
