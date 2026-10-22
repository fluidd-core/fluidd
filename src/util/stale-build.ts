/**
 * KAN-562: a tab left open across a deploy still runs the old build, whose lazy
 * chunks the new deploy deleted. Opening a printer then asks for one, gets a
 * 404, and the navigation fails silently -- "nothing happens". The cure is a
 * fresh load of the page, which fetches the new build.
 *
 * Once per build in this tab, so an offline worker serving the same old shell
 * cannot reload forever. A later build gets its own recovery attempt.
 */

import { refreshServiceWorker } from './service-worker-update'

const RELOADED_BUILD_KEY = 'muon:stale-build-reloaded-build'

// Chrome, Safari and Firefox word the failed dynamic import differently; Vite's
// own preload helper adds the CSS case.
const STALE_CHUNK = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i

export function isStaleChunkError (error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return STALE_CHUNK.test(message)
}

export interface ReloadDeps {
  now: () => number
  buildId?: string
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  assign: (url: string) => void
  reload: () => void
  prepareReload?: () => Promise<void>
}

const browserDeps = (): ReloadDeps => {
  let storage: ReloadDeps['storage'] = null
  try { storage = window.sessionStorage } catch { /* blocked: reloadForNewBuild then declines */ }
  return {
    now: () => Date.now(),
    buildId: import.meta.env.HASH?.trim() || 'development',
    storage,
    assign: (url) => window.location.assign(url),
    reload: () => window.location.reload(),
    prepareReload: () => refreshServiceWorker()
  }
}

/**
 * Loads the page afresh, at `target` when known. False when it already did so
 * for this build, or when it has nowhere to record that it did: without the
 * record, a chunk that is really missing (an offline service worker's cached
 * shell, say) would reload the page forever, which is worse than one failed
 * navigation.
 */
export function reloadForNewBuild (target?: string, deps: ReloadDeps = browserDeps()): boolean {
  if (!deps.storage) return false
  try {
    const buildId = deps.buildId ?? 'unknown'
    if (deps.storage.getItem(RELOADED_BUILD_KEY) === buildId) return false
    deps.storage.setItem(RELOADED_BUILD_KEY, buildId)
  } catch {
    return false
  }
  const navigate = () => {
    if (target) deps.assign(target)
    else deps.reload()
  }
  // The old worker can otherwise answer the reload with its old precached
  // shell. Record the guard before awaiting: Vite and the router can report
  // the same import failure. A failed update still gets one network reload.
  if (deps.prepareReload) {
    try { deps.prepareReload().then(navigate, navigate) } catch { navigate() }
  } else navigate()
  return true
}
