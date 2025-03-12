import type { GetterTree } from 'vuex'
import type { Filament, Spool, SpoolmanFilament, SpoolmanSpool, SpoolmanState, SpoolmanVendor, Vendor } from './types'
import type { RootState } from '../types'

const filamentWeightToLength = (weight: number, filament: SpoolmanFilament | Filament) => {
  // l[mm] = m[g]/D[g/cm³]/A[mm²]*(1000mm³/cm³)
  return weight / filament.density / (Math.PI / 4 * filament.diameter ** 2) * 1000
}

const spoolmanSpoolAsSpool = (spool: SpoolmanSpool): Spool => {
  const filament_name = [
    spool.filament.vendor?.name,
    spool.filament.name
  ].filter(x => x != null).join(' - ') || spool.id.toString()

  const filament = spoolmanFilamentAsFilament(spool.filament)

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
    price: spool.price ?? filament.price,
    initial_weight: spool.initial_weight ?? filament.weight,
    spool_weight: spool.spool_weight ?? filament.spool_weight,
    remaining_length: spool.remaining_length ?? (
      spool.remaining_weight != null
        ? filamentWeightToLength(spool.remaining_weight, filament)
        : undefined
    ),
    used_length: spool.used_length ?? (
      spool.used_weight != null
        ? filamentWeightToLength(spool.used_weight, filament)
        : undefined
    ),
    initial_length: spool.initial_weight
      ? filamentWeightToLength(spool.initial_weight, filament)
      : undefined,
    filament,
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

  const vendor = filament.vendor != null
    ? spoolmanVendorAsVendor(filament.vendor)
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
    spool_weight: filament.spool_weight ?? vendor?.empty_spool_weight,
    vendor
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
