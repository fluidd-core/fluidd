/**
 * A printer's address in Fluidd: /boxwood-367a, /boxwood-367a/jobs (U1).
 *
 * The slug is the printer's name and a four-character suffix, so it is
 * readable, survives a move to a new IP address, and can never be mistaken
 * for one of Fluidd's own routes (/jobs, /link) or for a path the printer's
 * nginx sends to Moonraker (/printer…, /server…: see `RESERVED_PREFIX`).
 *
 * - A Muon3D printer: its name and serial suffix, from `/server/muon/identity`
 *   or the `.local` name built from them (`muon-boxwood-367a.local`).
 * - An account printer: the console's display name ("Boxwood · 367A"); one
 *   renamed there without its suffix keeps four characters of its EndpointId.
 * - Any other Klipper printer: its name and four characters of a hash of its
 *   address.
 */

/** The shape of every slug: words, then a hyphen and four letters or digits. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{4}$/

/**
 * The same shape for a route parameter. vue-router's path-to-regexp 1.x
 * takes no groups inside a parameter's pattern, so this one is a little
 * looser; `isPrinterSlug` is the exact test.
 */
export const ROUTE_SLUG_PATTERN = '[a-z0-9][a-z0-9-]*-[a-z0-9]{4}'
const HAS_SUFFIX = /-[a-z0-9]{4}$/

/**
 * Paths the printer's nginx proxies to Moonraker without a trailing slash
 * (`^/(printer|api|access|server|machine|websocket)`), so a page there would
 * never reach Fluidd. A slug that starts with one is prefixed with `p-`.
 */
const RESERVED_PREFIX = /^(?:printer|api|access|server|machine|websocket)/

const MAX_WORDS_LENGTH = 40

/** Lower-case words joined by hyphens: "Boxwood · 367A" is `boxwood-367a`. */
export function slugify (text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function finish (words: string, suffix: string): string {
  let head = slugify(words).slice(0, MAX_WORDS_LENGTH).replace(/-+$/, '') || 'm1'
  if (RESERVED_PREFIX.test(head)) head = `p-${head}`
  return `${head}-${suffix}`
}

/** Four letters or digits from any text, stable for the same text. */
export function hash4 (text: string): string {
  // FNV-1a, 32 bit: tiny, and stable across browsers.
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36).padStart(4, '0').slice(-4)
}

/** Whether `text` has the shape of a printer slug. */
export function isPrinterSlug (text: string): boolean {
  return SLUG.test(text)
}

/** The last four characters of a slug: the part a rename never changes. */
export function slugSuffix (slug: string): string {
  return slug.slice(-4)
}

interface Identity {
  name?: unknown
  derived_name?: unknown
  suffix?: unknown
}

/** A Muon3D printer's slug from `/server/muon/identity`, or null. */
export function slugForIdentity (identity: Identity | null | undefined): string | null {
  const suffix = typeof identity?.suffix === 'string' ? identity.suffix.trim().toLowerCase() : ''
  if (!/^[a-z0-9]{4}$/.test(suffix)) return null
  const name = typeof identity?.name === 'string' && identity.name.trim()
    ? identity.name
    : typeof identity?.derived_name === 'string' ? identity.derived_name : ''
  // A name that already ends in the suffix ("Boxwood 367A") isn't doubled.
  const words = slugify(name).replace(new RegExp(`-?${suffix}$`), '')
  return finish(words, suffix)
}

/** A slug from a printer's `.local` name, `muon-boxwood-367a.local`, or null. */
export function slugForMdnsHost (host: string | null | undefined): string | null {
  const match = /^muon-([a-z0-9-]+)-([a-z0-9]{4})\.local$/i.exec(host ?? '')
  return match ? finish(match[1], match[2].toLowerCase()) : null
}

/** An account printer's slug, from the console's display name and EndpointId. */
export function slugForCloudPrinter (printer: { id: string, name: string }): string {
  const words = slugify(printer.name)
  if (HAS_SUFFIX.test(words)) return finish(words.slice(0, -5), words.slice(-4))
  return finish(words, slugify(printer.id).slice(0, 4).padEnd(4, '0'))
}

/** A slug for any other printer: its name and a hash of its address. */
export function slugForAddress (name: string, apiUrl: string): string {
  let host = name
  if (!slugify(host) || /^fluidd$/i.test(host)) {
    try {
      host = new URL(apiUrl).hostname
    } catch {
      host = apiUrl
    }
  }
  return finish(host, hash4(apiUrl.replace(/\/+$/, '').toLowerCase()))
}
