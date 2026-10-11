// Fluidd used to route by hash: /#/jobs, /#/settings#auth, /#/link?code=.
// Those addresses live on in bookmarks, printed QR codes, account e-mails, a
// home-screen app's shortcuts, and the printer's own /setup redirect. Before
// the router reads the address, turn such a hash route into the path it now
// is, keeping its query and any fragment of its own.
//
// Fluidd is served from the root of its host (Vite `base: '/'`), so the path
// is the hash route itself, whatever path the old address was opened at.

interface EntryLocation {
  pathname: string
  search: string
  hash: string
}

/** The path a legacy hash address now lives at, or null when it isn't one. */
export function pathForLegacyHash (location: EntryLocation): string | null {
  if (!location.hash.startsWith('#/')) return null

  // `#/settings#auth` keeps `#auth`; `#/link?code=1` keeps `?code=1`.
  const route = location.hash.slice(1)
  const fragmentAt = route.indexOf('#')
  const beforeFragment = fragmentAt === -1 ? route : route.slice(0, fragmentAt)
  const fragment = fragmentAt === -1 ? '' : route.slice(fragmentAt)
  const queryAt = beforeFragment.indexOf('?')
  let path = queryAt === -1 ? beforeFragment : beforeFragment.slice(0, queryAt)
  let query = queryAt === -1 ? '' : beforeFragment.slice(queryAt)

  // A query before the hash (`/?code=…&state=…#/`, a sign-in coming back to
  // an older page) is kept when the route has none of its own.
  if (!query && location.search) query = location.search

  // Never a protocol-relative address: `#//evil.example` is the page root.
  path = '/' + path.replace(/^\/+/, '')

  return `${path}${query}${fragment}`
}

export function applyLegacyHash (): void {
  const path = pathForLegacyHash(window.location)
  if (path !== null) window.history.replaceState(window.history.state, '', path)
}
