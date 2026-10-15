/**
 * A printer's live state for its card, from one `printer.objects.query`.
 *
 * The same query and the same reading serve a printer reached through Muon3D
 * (`state.ts`, over its Iroh connection) and one on this network
 * (`discovery.ts`, over plain HTTP), so both cards show the same things: the
 * job, its progress and layer, both temperatures and what's loaded. A
 * printer found on the network used to show only a word ("Printing") until
 * it was opened (14 Oct 2026).
 *
 * Imports nothing, so both callers can use it without a cycle.
 */

/** A printer's live state. `reachable` and `error` say how the read went. */
export interface PrinterStatus {
  reachable: boolean;
  error?: string;
  state?: string;
  message?: string;
  filename?: string;
  progress?: number;
  printDuration?: number;
  totalDuration?: number;
  filamentUsed?: number;
  extruder?: { temperature: number, target: number };
  bed?: { temperature: number, target: number };
  position?: number[];
  speedFactor?: number;
  extrudeFactor?: number;
  layer?: number;
  totalLayers?: number;
  filePosition?: number;
  fileSize?: number;
  /** What the printer says is loaded (save_variables), when anyone has said. */
  material?: LoadedRecord;
  updatedAt: number;
}

/** The loaded filament as the printer keeps it: `muon_material` and its colour. */
export interface LoadedRecord {
  name: string | null;
  /** `#RRGGBB`, or null when nobody has said. */
  colour: string | null;
}

/** The objects a card needs, in Moonraker's query form. Allowed to every remote role (muon-link policy: /printer/objects/query). */
export const STATUS_OBJECTS = [
  'print_stats',
  'display_status',
  'virtual_sdcard',
  'extruder=temperature,target',
  'heater_bed=temperature,target',
  'toolhead=position,homed_axes',
  'gcode_move=speed_factor,extrude_factor',
  'webhooks',
  'save_variables'
].join('&')

export const STATUS_QUERY = `/printer/objects/query?${STATUS_OBJECTS}`

function hexColour (value: unknown): string | null {
  if (typeof value !== 'string') return null
  const hex = value.trim().replace(/^["']+|["']+$/g, '').replace(/^#/, '')
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null
}

/**
 * What save_variables says is loaded. The colour is `muon_material_colour`
 * (KAN-516), or `muon_material_color` as Fluidd #57 wrote it.
 */
export function loadedRecord (variables: unknown): LoadedRecord | undefined {
  if (!variables || typeof variables !== 'object') return undefined
  const v = variables as Record<string, unknown>
  const raw = typeof v.muon_material === 'string' ? v.muon_material.replace(/^"+|"+$/g, '').trim() : ''
  const colour = 'muon_material_colour' in v ? hexColour(v.muon_material_colour) : hexColour(v.muon_material_color)
  if (!raw && !colour) return undefined
  return { name: raw || null, colour }
}

/** The card's state from Moonraker's `result.status`. */
export function statusFrom (s: Record<string, any>): Omit<PrinterStatus, 'reachable' | 'error' | 'updatedAt'> {
  const info = s.print_stats?.info ?? {}
  return {
    state: s.webhooks?.state === 'ready' ? s.print_stats?.state : `klipper ${s.webhooks?.state ?? 'unknown'}`,
    message: s.display_status?.message ?? undefined,
    filename: s.print_stats?.filename || undefined,
    progress: s.virtual_sdcard?.progress ?? s.display_status?.progress,
    printDuration: s.print_stats?.print_duration,
    totalDuration: s.print_stats?.total_duration,
    filamentUsed: s.print_stats?.filament_used,
    extruder: s.extruder,
    bed: s.heater_bed,
    position: s.toolhead?.position,
    speedFactor: s.gcode_move?.speed_factor,
    extrudeFactor: s.gcode_move?.extrude_factor,
    layer: info.current_layer ?? undefined,
    totalLayers: info.total_layer ?? undefined,
    filePosition: s.virtual_sdcard?.file_position,
    fileSize: s.virtual_sdcard?.file_size,
    material: loadedRecord(s.save_variables?.variables)
  }
}
