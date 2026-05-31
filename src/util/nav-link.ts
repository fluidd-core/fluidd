// Shared helpers for custom navigation links.
//
// The custom-link record (`CustomNavLink`) is persisted to the Moonraker database at
// namespace `fluidd`, key `uiSettings.navigation.customLinks`, and is therefore a de-facto
// contract that external tools (e.g. installers that self-register a sidebar link) write
// against. The helpers below centralise the rules that protect that contract.

/**
 * Prefix used for the synthetic IDs of theme/preset-provided links. These links are generated
 * in-memory from the active theme preset and are NOT stored in `customLinks`. The sidebar uses
 * this prefix to tell preset links apart from user/database links, so it is reserved: a stored
 * link must never use it (see `isReservedNavLinkId`).
 */
export const THEME_LINK_ID_PREFIX = 'preset-'

export type NavLinkTarget = 'same-tab' | 'new-tab'

/** Max length of a base64 data URI accepted for an icon/image on import (~256 KB). */
export const MAX_NAV_LINK_DATA_URI_LENGTH = 256 * 1024

// Schemes that can execute script or smuggle markup when used as a link target.
const UNSAFE_NAV_LINK_URL_SCHEME = /^\s*(?:javascript|data|vbscript):/i

/** True when `id` collides with the reserved theme-link prefix. */
export const isReservedNavLinkId = (id?: string): boolean =>
  typeof id === 'string' && id.startsWith(THEME_LINK_ID_PREFIX)

/** True when `url` is safe to use as a link target (non-empty, no script-capable scheme). */
export const isSafeNavLinkUrl = (url?: string | null): boolean =>
  typeof url === 'string' && url.trim().length > 0 && !UNSAFE_NAV_LINK_URL_SCHEME.test(url)

/** True when `value` is absent or a string within the data-URI size limit. */
export const isWithinNavLinkDataUriLimit = (value?: unknown): boolean =>
  typeof value !== 'string' || value.length <= MAX_NAV_LINK_DATA_URI_LENGTH

/**
 * Resolve whether a link should open in a new tab from its per-item `target`. Links open in a
 * new tab by default; only an explicit `'same-tab'` keeps navigation in the current tab.
 */
export const resolveNavLinkNewTab = (target?: NavLinkTarget): boolean =>
  target !== 'same-tab'
