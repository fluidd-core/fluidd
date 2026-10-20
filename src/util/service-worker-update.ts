/** Refresh the worker before recovering a stale chunk; never hold navigation forever. */
export function refreshServiceWorker (
  container: Pick<ServiceWorkerContainer, 'getRegistration'> | null = typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? navigator.serviceWorker : null,
  timeoutMs = 5000
): Promise<void> {
  if (!container) return Promise.resolve()
  return new Promise(resolve => {
    let finished = false
    let unlisten = () => {}
    const finish = () => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      unlisten()
      resolve()
    }
    const timer = setTimeout(finish, timeoutMs)
    ;(async () => {
      const registration = await container.getRegistration()
      if (finished) return
      if (!registration) return finish()
      await registration.update()
      if (finished) return
      const worker = registration.waiting ?? registration.installing
      if (!worker) return finish()
      let requested = false
      const changed = () => {
        if (worker.state === 'activated' || worker.state === 'redundant') return finish()
        if (worker.state === 'installed' && !requested) {
          requested = true
          worker.postMessage({ type: 'SKIP_WAITING' })
        }
      }
      worker.addEventListener('statechange', changed)
      unlisten = () => worker.removeEventListener('statechange', changed)
      changed()
    })().catch(finish)
  })
}
