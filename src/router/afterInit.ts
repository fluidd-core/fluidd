import type { Route } from 'vue-router'

export interface ActivePrinterSlug {
  /** The printer Fluidd is on now, or null with none. */
  slug: string | null
  /** Whether an address's slug names that printer (a rename keeps its suffix). */
  isActive: (slug: string) => boolean
}

/**
 * Where appInit sends the page once a printer is loaded, that is, after a
 * switch: a page that belongs to another printer becomes the same page of
 * the new one, so /boxwood-367a/jobs becomes /walnut-8987/jobs and the
 * address always names the printer shown. Printers, the account pages and
 * the first load (still at the router's start, `/`) stay. Null: stay.
 *
 * Not signed in to the new printer, the page still moves: its own guard then
 * sends it to the login.
 */
export function routeAfterInit (route: Pick<Route, 'fullPath' | 'params'>, active: ActivePrinterSlug): string | null {
  const shown = route.params?.printer
  if (!shown || !active.slug || active.isActive(shown)) return null
  return `/${active.slug}${route.fullPath.slice(shown.length + 1)}`
}
