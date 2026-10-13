/**
 * Work for after the first useful frame (KAN-525): prefetching the printer
 * pages' chunks must not race the first paint. A rAF is no proof a frame
 * was presented, so the gate is the loader actually leaving the DOM —
 * removeLoader only runs once the app is up.
 */

import { loaderGone } from './loader'

const idle = (fn: () => void): void => {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback
  if (ric) ric(fn, { timeout: 3000 })
  else setTimeout(fn, 200)
}

/** Resolves after the loader is gone and two frames have run. */
export function appPainted (): Promise<void> {
  return loaderGone.then(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
}

/** Runs fn once the app has painted, in idle time where the browser offers it. */
export function afterFirstPaint (fn: () => void): void {
  appPainted().then(() => idle(fn))
}

/**
 * The printer pages' chunks, fetched ahead in idle time. Slice, Camera,
 * GcodePreview and Configure are too heavy to fetch for a page the person
 * may never open.
 */
/** Pages that mount without the app (/setup, /sign-in) get nothing ahead. */
export const NO_PREFETCH_PATHS = /^\/(?:setup|sign-in)(?:\/|$)/

export function prefetchRoutes (): void {
  if (NO_PREFETCH_PATHS.test(window.location.pathname)) return
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
