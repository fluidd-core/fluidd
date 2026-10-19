import type { HostMaterial, HostSetup } from './vendor/printer-client/bridge/protocol'
import { PANEL_MATERIALS, type MaterialChoice } from '@/services/control/model'

/** Spoolman's active spool, as much of it as the slicer needs. */
export interface ActiveSpool {
  remaining_weight?: number | null;
  filament?: {
    name?: string | null;
    material?: string | null;
    color_hex?: string | null;
    settings_extruder_temp?: number | null;
    settings_bed_temp?: number | null;
  } | null;
}

const isType = (name: string) => PANEL_MATERIALS.some(p => p.name.toUpperCase() === name.trim().toUpperCase())

function tableEntry (choice: MaterialChoice): HostMaterial {
  return {
    name: choice.name,
    type: isType(choice.name) ? choice.name.toUpperCase() : null,
    colour: choice.colour ? choice.colour.toUpperCase() : null,
    nozzle: choice.nozzle,
    bed: choice.bed,
    source: 'table'
  }
}

/**
 * What the selected printer has loaded, for the slicer (printer.setup,
 * docs/fluidd-integration.md in muon3d-slicer). The first that answers:
 * What the printer was told is loaded (save_variables muon_material), then
 * Spoolman's active spool, then the material the heaters are set to.
 * With it, Fluidd's material table. See docs/loaded-filament.md.
 *
 * The loaded material carries a colour only when one was given: a spool's,
 * or the one someone set for what's loaded (save_variables
 * muon_material_colour, KAN-516). The slicer writes it into the G-code as the
 * filament's colour, and a material type's swatch isn't that.
 */
export function hostSetup (input: {
  spool: ActiveSpool | null;
  loaded: MaterialChoice | null;
  /** The colour set for what's loaded, "#RRGGBB", or null. */
  loadedColour?: string | null;
  heated: MaterialChoice | null;
  choices: MaterialChoice[];
}): HostSetup {
  const materials = input.choices.slice(0, 32).map(tableEntry)
  const byType = (type: string | null | undefined) => (type ? input.choices.find(c => c.name.toUpperCase() === type.toUpperCase()) : undefined)
  let material: HostMaterial | null = null
  const f = input.spool?.filament
  if (input.loaded) {
    material = { ...tableEntry(input.loaded), colour: input.loadedColour ? input.loadedColour.toUpperCase() : null, source: 'loaded' }
  } else if (f && (f.material || f.name)) {
    const type = f.material?.trim() || null
    const entry = byType(type)
    const hex = f.color_hex?.replace(/^#/, '')
    material = {
      name: [type, f.name?.trim()].filter(Boolean).join(' ').slice(0, 64) || 'Spool',
      type,
      colour: hex && /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null,
      nozzle: f.settings_extruder_temp ?? entry?.nozzle ?? null,
      bed: f.settings_bed_temp ?? entry?.bed ?? null,
      source: 'spool',
      remaining: input.spool?.remaining_weight ?? null
    }
  } else if (input.heated) {
    material = { ...tableEntry(input.heated), colour: null, source: 'heaters' }
  }
  return { material, materials }
}
