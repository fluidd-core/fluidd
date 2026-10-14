// The router needs the current printer's slug to send an old address
// (/jobs) to that printer's page (/boxwood-367a/jobs), but importing the
// printer services would close an import cycle (router → printer services →
// activate → init → router). The printer services register a source here
// instead (services/printer-pages), and the router asks it.

let source: () => string | null = () => null
let foreignSource: (slug: string | undefined) => boolean = () => false

export function setActiveSlugSource (fn: () => string | null): void {
  source = fn
}

/** The current printer's slug, or null before any printer is known. */
export function activeSlugNow (): string | null {
  return source()
}

export function setForeignSlugSource (fn: (slug: string | undefined) => boolean): void {
  foreignSource = fn
}

export function foreignSlugNow (slug: string | undefined): boolean {
  return foreignSource(slug)
}
