import { DataTableHeader } from 'vuetify'

/**
 * Vuetify table headers, extended with data so we can more easily save
 * and reference later.
 * key: Used to override the lookup key if required.
 * configurable: if a user can toggle this header or not. Defaults to true if not defined.
 */
export interface AppTablePartialHeader {
  value: string;
  key?: string;
  configurable?: boolean;
  visible?: boolean;
}

export interface AppTableHeader extends DataTableHeader, AppTablePartialHeader {}
