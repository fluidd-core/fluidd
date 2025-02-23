import type { ConfiguredTableHeader } from '@/store/config/types'
import type { DataTableHeader } from 'vuetify'

/**
 * Vuetify table headers, extended with data so we can more easily save
 * and reference later.
 * configurable: if a user can toggle this header or not. Defaults to true if not defined.
 */

export interface AppDataTableHeader extends DataTableHeader, ConfiguredTableHeader {
}
