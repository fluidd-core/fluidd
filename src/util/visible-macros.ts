import type { Macro } from '@/store/macros/types'

/** A category of macros, as `macros/getVisibleMacros` gives them. */
export interface MacroGroup {
  id: string;
  name: string | null;
  macros: Macro[];
}

/**
 * The macros the dashboard shows, in their categories' order. The store's
 * `getVisibleMacros` gives categories, each with its macros, not macros.
 */
export function visibleMacros (groups: MacroGroup[] | undefined): Macro[] {
  return (groups ?? []).flatMap(g => g.macros ?? [])
}
