import type { DataTableHeader } from 'vuetify'
import type { ConfiguredTableHeader } from '@/store/config/types'

/**
 * Vuetify table headers, extended with data so we can more easily save
 * and reference later.
 * configurable: if a user can toggle this header or not. Defaults to true if not defined.
 */

export interface AppDataTableHeader extends DataTableHeader, ConfiguredTableHeader {}
