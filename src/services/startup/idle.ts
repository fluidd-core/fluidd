/**
 * Work for after the first useful frame (KAN-525): prefetching the printer
 * pages' chunks must not race the first paint.
 */

/** Runs fn after two frames, in idle time where the browser offers it. */
export function afterFirstPaint (fn: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback
      if (ric) ric(fn, { timeout: 3000 })
      else setTimeout(fn, 200)
    })
  })
}

/**
 * The printer pages' chunks, fetched ahead in idle time. Slice, Camera,
 * GcodePreview and Configure are too heavy to fetch for a page the person
 * may never open.
 */
export function prefetchRoutes (): void {
  // A page that mounts without the app (/setup, /sign-in) gets nothing ahead.
  if (/^\/(?:setup|sign-in)(?:\/|$)/.test(window.location.pathname)) return
  const pages = [
    () => import('@/views/Overview.vue'),
    () => import('@/views/Jobs.vue'),
    () => import('@/views/Control.vue'),
    () => import('@/views/Console.vue'),
    () => import('@/views/Settings.vue'),
    () => import('@/views/Maintenance.vue'),
    () => import('@/views/Tune.vue')
  ]
  for (const load of pages) load().catch(() => {})
}
