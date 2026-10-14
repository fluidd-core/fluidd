/**
 * The pages that belong to one printer. Each lives at /<printer>/<page>
 * (/boxwood-367a/jobs); the bare path (/jobs) is an old address that goes to
 * the same page of the printer Fluidd is on.
 */
export const PRINTER_PAGE_PATHS = [
  '/console', '/jobs', '/control', '/tune', '/diagnostics', '/timelapse', '/history', '/wifi',
  '/system', '/configure', '/settings', '/camera', '/preview', '/slice'
]

/** Whether `path` is one of a printer's pages, without the printer. */
export function isPrinterPagePath (path: string): boolean {
  return PRINTER_PAGE_PATHS.some(page => path === page || path.startsWith(`${page}/`) || path.startsWith(`${page}#`) || path.startsWith(`${page}?`))
}

/**
 * A link written without the printer, for the printer Fluidd is on: `/` is
 * its own page, `/jobs` its Jobs. Anything else (Printers' pages, the
 * account's) is left as it is, and so is everything with no printer.
 */
export function scopedPath (path: string, slug: string | null): string {
  if (!slug) return path
  if (path === '/') return `/${slug}`
  return isPrinterPagePath(path) ? `/${slug}${path}` : path
}

/**
 * A printer page's path without its printer: /boxwood-367a/jobs is /jobs and
 * /boxwood-367a is /. Any other page's path is its own (/fleet).
 */
export function pageOfRoute (route: { path: string, params?: Record<string, string> }): string {
  const slug = route.params?.printer
  if (!slug) return route.path
  return route.path.slice(slug.length + 1) || '/'
}
