import type { GetterTree } from 'vuex'
import type { Filament, Spool, SpoolmanFilament, SpoolmanSpool, SpoolmanState, SpoolmanVendor, Vendor } from './types'
import type { RootState } from '../types'

const spoolmanSpoolAsSpool = (spool: SpoolmanSpool): Spool => {
  const filament_name = spool.filament.vendor
    ? `${spool.filament.vendor.name} - ${spool.filament.name}`
    : spool.filament.name ?? spool.id.toString()

  return ({
    ...spool,
    filament_name,
    registered: new Date(spool.registered),
    first_used: spool.first_used
      ? new Date(spool.first_used)
      : undefined,
    last_used: spool.last_used
      ? new Date(spool.last_used)
      : undefined,
    filament: spoolmanFilamentAsFilament(spool.filament),
  })
}

const spoolmanFilamentAsFilament = (filament: SpoolmanFilament): Filament => {
  const color_hex = filament.color_hex
    ? `#${filament.color_hex}`
    : undefined

  const multi_color_hexes = filament.multi_color_hexes
    ? filament.multi_color_hexes
      .split(',')
      .map(x => `#${x}`)
    : undefined

  return ({
    ...filament,
    color_hex,
    multi_color_hexes,
    colors: multi_color_hexes != null && multi_color_hexes.length > 0
      ? multi_color_hexes
      : color_hex
        ? [color_hex]
        : undefined,
    registered: new Date(filament.registered),
    vendor: filament.vendor != null
      ? spoolmanVendorAsVendor(filament.vendor)
      : undefined
  })
}

const spoolmanVendorAsVendor = (vendor: SpoolmanVendor): Vendor => ({
  ...vendor,
  registered: new Date(vendor.registered)
})

export const getters: GetterTree<SpoolmanState, RootState> = {
  getAvailableSpools: (state) => {
    return state.spools
      .map(spoolmanSpoolAsSpool)
  },

  getActiveSpool: (state, getters): Spool | undefined => {
    return state.activeSpool == null
      ? undefined
      : getters.getSpoolById(state.activeSpool)
  },

  getSpoolById: (state, getters) => (id: number): Spool | undefined => {
    const spools: Spool[] = getters.getAvailableSpools

    return spools.find(spool => spool.id === id)
  },

  getAvailable: (state) => {
    return (
      state.connected &&
      state.spools.length > 0
    )
  }
}
