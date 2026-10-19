/**
 * KAN-562: a tab left open across a deploy still runs the old build, whose lazy
 * chunks the new deploy deleted. Opening a printer then asks for one, gets a
 * 404, and the navigation fails silently -- "nothing happens". The cure is a
 * fresh load of the page, which fetches the new build.
 *
 * Once per short window, so a chunk that is genuinely missing from the current
 * build fails instead of reloading forever.
 */

const RELOADED_AT_KEY = 'muon:stale-build-reloaded-at'
const WINDOW_MS = 10_000

// Chrome, Safari and Firefox word the failed dynamic import differently; Vite's
// own preload helper adds the CSS case.
const STALE_CHUNK = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i

export function isStaleChunkError (error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return STALE_CHUNK.test(message)
}

export interface ReloadDeps {
  now: () => number
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  assign: (url: string) => void
  reload: () => void
}

const browserDeps = (): ReloadDeps => {
  let storage: ReloadDeps['storage'] = null
  try { storage = window.sessionStorage } catch { /* blocked: reloadForNewBuild then declines */ }
  return {
    now: () => Date.now(),
    storage,
    assign: (url) => window.location.assign(url),
    reload: () => window.location.reload()
  }
}

/**
 * Loads the page afresh, at `target` when known. False when it already did so
 * moments ago, or when it has nowhere to record that it did: without the
 * record, a chunk that is really missing (an offline service worker's cached
 * shell, say) would reload the page forever, which is worse than one failed
 * navigation.
 */
export function reloadForNewBuild (target?: string, deps: ReloadDeps = browserDeps()): boolean {
  if (!deps.storage) return false
  try {
    const last = Number(deps.storage.getItem(RELOADED_AT_KEY) ?? 0)
    if (deps.now() - last < WINDOW_MS) return false
    deps.storage.setItem(RELOADED_AT_KEY, String(deps.now()))
  } catch {
    return false
  }
  if (target) deps.assign(target)
  else deps.reload()
  return true
}
