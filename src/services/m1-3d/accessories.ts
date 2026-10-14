export type AutoLoad = 'idle' | 'loading' | 'grabbed' | 'failed'

export interface Accessories {
  plateOn: boolean;
  tubeAttached: boolean;
  tubeUnlocking: boolean;
  filamentLoaded: boolean;
  autoLoad: AutoLoad;
  spoolMounted: boolean;
}

export interface PromptFacts {
  open: boolean;
  title?: string;
}

/**
 * STUB (KAN-526): Klipper and Moonraker publish no status object for the
 * insert flow. These prompt titles come from FILAMENT_INSERT_SENSORLESS_LOAD,
 * FILAMENT_INSERT_MODE_PROMPT and FILAMENT_INSERT_LOAD_FAILED_PROMPT in
 * Muon3D_Klipper core/M1/macros/filament.cfg. Replace this inference when the
 * firmware publishes an insert-flow status object.
 */
export function autoLoadFromPrompt (prompt: PromptFacts | null | undefined): AutoLoad {
  if (!prompt?.open) return 'idle'
  if (prompt.title === 'Filament Load') return 'loading'
  if (prompt.title === 'Load Mode') return 'grabbed'
  if (prompt.title === 'Filament Load Failed') return 'failed'
  return 'idle'
}

/**
 * STUB (KAN-526): There is no sensor on the spool holder, so the spool is
 * assumed mounted until the firmware publishes a spool status object.
 */
export function accessoriesFrom (
  printer: Record<string, any>,
  prompt: PromptFacts | null | undefined
): Accessories {
  const bed = printer.bed_removal_detector
  const toolheadMcu = printer['mcu toolhead']
  const unlockButton = printer['gcode_button toolhead_umbilical_unlock_button']
  const filamentSensor = printer['filament_switch_sensor filament_sensor_toolhead']

  // A failed bed thermistor reads as a removed plate (KAN-112).
  const plateOn = bed ? !bed.bedRemoved : true
  const tubeAttached = toolheadMcu ? !toolheadMcu.non_critical_disconnected : true
  const tubeUnlocking = tubeAttached && unlockButton?.state === 'PRESSED'
  // KAN-232: gpio3 can float and read "detected" on some units.
  const filamentLoaded = filamentSensor?.enabled !== false && !!filamentSensor?.filament_detected

  return {
    plateOn,
    tubeAttached,
    tubeUnlocking,
    filamentLoaded,
    autoLoad: autoLoadFromPrompt(prompt),
    spoolMounted: true
  }
}

/**
 * The accessories once the printer's first status has arrived; null before.
 * Until then the store has no sensor objects, so the filament reads as
 * unloaded and the plate as on. Taking that as the first state turned the
 * real status into a change: a page opened with filament in played a load,
 * and one opened with the plate off played a removal.
 */
export function liveAccessories (
  printer: Record<string, any>,
  prompt: PromptFacts | null | undefined,
  statusArrived: boolean
): Accessories | null {
  return statusArrived ? accessoriesFrom(printer, prompt) : null
}

export function sameAccessories (a: Accessories | null, b: Accessories): boolean {
  return a !== null &&
    a.plateOn === b.plateOn &&
    a.tubeAttached === b.tubeAttached &&
    a.tubeUnlocking === b.tubeUnlocking &&
    a.filamentLoaded === b.filamentLoaded &&
    a.autoLoad === b.autoLoad &&
    a.spoolMounted === b.spoolMounted
}
