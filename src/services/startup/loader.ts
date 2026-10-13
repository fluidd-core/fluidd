/**
 * The loading screen in index.html (#muon-loader): it paints before any
 * JavaScript and leaves once the app can show something (KAN-525).
 *
 * Progress marks: 0.15 at the first frame and 0.5 when the CSS has loaded
 * (the build's inline bootstrap), 0.8 once the entry module has been
 * evaluated (main.ts), 1 as it goes.
 */

export const THEME_KEY = 'muon3d.theme'
export const LOADER_ID = 'muon-loader'

/** Set before App mounts (step: cached state); the loader may hold then. */
export const startupState = {
  cachedShown: false
}

/** The theme for next time's loader, in its own tiny key so index.html reads it fast. */
export function rememberTheme (isDark: boolean): void {
  try {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  } catch {}
}

export function setLoaderProgress (p: number, doc: Document = document): void {
  doc.getElementById(LOADER_ID)?.style.setProperty('--muon-loader-progress', String(p))
}

const removals = new WeakMap<Document, Promise<void>>()

/** Fades the loader out and takes it from the DOM; safe to call again while it goes. */
export function removeLoader (doc: Document = document): Promise<void> {
  const el = doc.getElementById(LOADER_ID)
  if (!el) return Promise.resolve()
  let pending = removals.get(doc)
  if (!pending) {
    setLoaderProgress(1, doc)
    el.classList.add('muon-loader--gone')
    pending = new Promise<void>(resolve => {
      const done = () => {
        el.remove()
        resolve()
      }
      const timer = setTimeout(done, 120)
      el.addEventListener('transitionend', () => {
        clearTimeout(timer)
        done()
      }, { once: true })
    }).finally(() => removals.delete(doc))
    removals.set(doc, pending)
  }
  return pending
}

/**
 * Whether the loader can go: the first route has resolved, and — while the
 * loader shows the cached last state — the connecting screen isn't held
 * against the socket for more than 6 s.
 */
export function loaderCanGo (o: { routerReady: boolean; screen: string | null; cachedShown: boolean; msSinceMount: number }): boolean {
  return o.routerReady && (!o.cachedShown || o.screen !== 'connecting' || o.msSinceMount >= 6000)
}
