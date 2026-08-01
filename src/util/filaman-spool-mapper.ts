const DEFAULT_DENSITY_G_CM3 = 1.24
const DEFAULT_DIAMETER_MM = 1.75

const isFilamanPaginatedResponse = (value: unknown): value is Moonraker.Spoolman.FilamanPaginatedResponse => {
  return (
    value != null &&
    typeof value === 'object' &&
    'items' in value &&
    Array.isArray(value.items)
  )
}

const numberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  return undefined
}

const normalizedColorHex = (hex: string): string => {
  return hex.startsWith('#')
    ? hex.slice(1)
    : hex
}

/**
 * Maps a FilaMan spool onto the Spoolman spool shape the rest of the app expects.
 */
export const mapFilamanSpoolToSpoolmanSpool = (spool: Moonraker.Spoolman.FilamanSpool): Moonraker.Spoolman.Spool => {
  const registered = spool.created_at ?? spool.last_used_at ?? '1970-01-01T00:00:00.000Z'
  const filament = spool.filament
  const manufacturer = filament?.manufacturer

  const density = numberOrUndefined(filament?.density_g_cm3) ?? DEFAULT_DENSITY_G_CM3
  const diameter = numberOrUndefined(filament?.diameter_mm) ?? DEFAULT_DIAMETER_MM

  const initialTotalWeight = numberOrUndefined(spool.initial_total_weight_g)
  const spoolWeight = numberOrUndefined(spool.empty_spool_weight_g)
  const fallbackFilamentWeight = numberOrUndefined(filament?.raw_material_weight_g)

  let initialWeight: number | undefined = fallbackFilamentWeight
  if (initialTotalWeight != null && spoolWeight != null) {
    initialWeight = Math.max(initialTotalWeight - spoolWeight, 0)
  }

  const remainingWeight = numberOrUndefined(spool.remaining_weight_g)
  const usedWeight = (
    initialWeight != null &&
    remainingWeight != null
  )
    ? Math.max(initialWeight - remainingWeight, 0)
    : undefined

  const colors = (filament?.colors ?? [])
    .map(entry => entry.color?.hex_code)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map(normalizedColorHex)

  const primaryColor = colors[0]
  const multiColorHexes = colors.length > 1
    ? colors.join(',')
    : undefined

  const vendor: Moonraker.Spoolman.Vendor | undefined = manufacturer?.name
    ? {
        id: numberOrUndefined(manufacturer.id) ?? 0,
        registered,
        name: manufacturer.name,
        empty_spool_weight: numberOrUndefined(manufacturer.empty_spool_weight_g)
      }
    : undefined

  return {
    id: spool.id,
    registered,
    filament: {
      id: filament?.id ?? 0,
      registered,
      density,
      diameter,
      name: filament?.designation ?? undefined,
      vendor,
      material: filament?.material_type ?? undefined,
      price: numberOrUndefined(filament?.price),
      weight: fallbackFilamentWeight,
      spool_weight: numberOrUndefined(filament?.default_spool_weight_g),
      color_hex: primaryColor,
      multi_color_hexes: multiColorHexes,
    },
    last_used: spool.last_used_at ?? undefined,
    price: numberOrUndefined(spool.purchase_price),
    remaining_weight: remainingWeight,
    initial_weight: initialWeight,
    spool_weight: spoolWeight,
    used_weight: usedWeight,
    lot_nr: spool.lot_number ?? undefined,
    location: spool.location_id != null
      ? `#${spool.location_id}`
      : undefined,
    archived: false,
    extra: spool.custom_fields ?? undefined
  }
}

/**
 * Accepts either a plain Spoolman spool list or a FilaMan paginated response and
 * always returns Spoolman spools.
 */
export const normalizeSpoolList = (
  payload: Moonraker.Spoolman.Spool[] | Moonraker.Spoolman.FilamanPaginatedResponse
): Moonraker.Spoolman.Spool[] => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (isFilamanPaginatedResponse(payload)) {
    return payload.items?.map(mapFilamanSpoolToSpoolmanSpool) ?? []
  }

  return []
}
