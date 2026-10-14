import { describe, expect, it } from 'vitest'
import {
  accessoriesFrom,
  autoLoadFromPrompt,
  liveAccessories,
  sameAccessories,
  type Accessories,
  type PromptFacts
} from '../accessories'
import {
  AccessoryMotion,
  AUTOLOAD_SETTLE_MS,
  FILAMENT_LOAD_MS,
  FILAMENT_UNLOAD_MS,
  PLATE_REMOVE_MS,
  PLATE_RETURN_EMPTY_MS,
  PLATE_RETURN_PRINT_MS,
  TUBE_ATTACH_MS,
  TUBE_DETACH_MS
} from '../accessory-motion'
import { LiveSync } from '../live-sync'

const signals = (overrides: Partial<Accessories> = {}): Accessories => ({
  plateOn: true,
  tubeAttached: true,
  tubeUnlocking: false,
  filamentLoaded: false,
  autoLoad: 'idle',
  spoolMounted: true,
  ...overrides
})

describe('accessory signals from Klipper status', () => {
  it('reads the exact plate, umbilical and filament objects', () => {
    const printer = {
      bed_removal_detector: { bedRemoved: true, restoreTarget: 0 },
      'mcu toolhead': { non_critical_disconnected: true, mcu_version: 'v0.12.0' },
      'gcode_button toolhead_umbilical_unlock_button': { state: 'PRESSED' },
      'filament_switch_sensor filament_sensor_toolhead': { filament_detected: true, enabled: true }
    }
    expect(accessoriesFrom(printer, null)).toEqual({
      plateOn: false,
      tubeAttached: false,
      tubeUnlocking: false,
      filamentLoaded: true,
      autoLoad: 'idle',
      spoolMounted: true
    })

    printer['mcu toolhead'].non_critical_disconnected = false
    expect(accessoriesFrom(printer, null).tubeUnlocking).toBe(true)
    printer['gcode_button toolhead_umbilical_unlock_button'].state = 'RELEASED'
    expect(accessoriesFrom(printer, null).tubeUnlocking).toBe(false)
    printer['filament_switch_sensor filament_sensor_toolhead'].enabled = false
    expect(accessoriesFrom(printer, null).filamentLoaded).toBe(false)
  })

  it('uses safe defaults when objects are absent', () => {
    expect(accessoriesFrom({}, null)).toEqual({
      plateOn: true,
      tubeAttached: true,
      tubeUnlocking: false,
      filamentLoaded: false,
      autoLoad: 'idle',
      spoolMounted: true
    })
  })

  it('maps the open macro prompt titles to auto-load states', () => {
    expect(autoLoadFromPrompt({ open: true, title: 'Filament Load' })).toBe('loading')
    expect(autoLoadFromPrompt({ open: true, title: 'Load Mode' })).toBe('grabbed')
    expect(autoLoadFromPrompt({ open: true, title: 'Filament Load Failed' })).toBe('failed')
    expect(autoLoadFromPrompt({ open: true, title: 'Other prompt' })).toBe('idle')
    expect(autoLoadFromPrompt({ open: false, title: 'Filament Load' })).toBe('idle')
    expect(autoLoadFromPrompt(undefined)).toBe('idle')
  })

  it('compares every accessory signal', () => {
    const a = signals()
    expect(sameAccessories(a, { ...a })).toBe(true)
    expect(sameAccessories(null, a)).toBe(false)
    expect(sameAccessories(a, { ...a, tubeUnlocking: true })).toBe(false)
    expect(sameAccessories(a, { ...a, autoLoad: 'failed' })).toBe(false)
  })
})

describe('the per-printer accessory timeline', () => {
  it('runs the mocked M1 sequence through live status signals', () => {
    const sync = new LiveSync()
    const printer: Record<string, any> = {
      bed_removal_detector: { bedRemoved: false, restoreTarget: 0 },
      'mcu toolhead': { non_critical_disconnected: false, mcu_version: 'v0.12.0' },
      'gcode_button toolhead_umbilical_unlock_button': { state: 'RELEASED' },
      'filament_switch_sensor filament_sensor_toolhead': { filament_detected: false, enabled: true }
    }
    let prompt: PromptFacts = { open: false }
    const set = (now: number, hasPart = true) => {
      sync.setAccessories(accessoriesFrom(printer, prompt), now, hasPart)
      return sync.frame(now)
    }

    expect(set(0).accessories.plate.clip).toBeNull()
    printer.bed_removal_detector.bedRemoved = true
    expect(set(100).accessories.plate).toMatchObject({ clip: 'remove', t: 0, carriesPrint: true })
    expect(sync.frame(100 + PLATE_REMOVE_MS / 2).accessories.plate.t).toBeCloseTo(0.5)
    expect(sync.frame(101 + PLATE_REMOVE_MS).accessories.plate).toMatchObject({ clip: null, t: 1 })

    printer.bed_removal_detector.bedRemoved = false
    expect(set(2000).accessories.plate).toMatchObject({ clip: 'return-print', t: 0 })
    expect(sync.partGone).toBe(true)
    expect(sync.frame(2000 + PLATE_RETURN_PRINT_MS / 2).accessories.plate.t).toBeCloseTo(0.5)
    expect(sync.frame(2001 + PLATE_RETURN_PRINT_MS).accessories.plate.clip).toBeNull()
    sync.newPrint()
    expect(sync.partGone).toBe(false)

    printer.bed_removal_detector.bedRemoved = true
    expect(set(4500, false).accessories.plate).toMatchObject({ clip: 'remove', t: 0, carriesPrint: false })
    printer.bed_removal_detector.bedRemoved = false
    expect(set(6400, false).accessories.plate).toMatchObject({ clip: 'return-empty', t: 0 })
    expect(sync.frame(6400 + PLATE_RETURN_EMPTY_MS / 2).accessories.plate.t).toBeCloseTo(0.5)
    expect(sync.frame(6401 + PLATE_RETURN_EMPTY_MS).accessories.plate.clip).toBeNull()
    expect(sync.partGone).toBe(true)

    printer['gcode_button toolhead_umbilical_unlock_button'].state = 'PRESSED'
    expect(set(8000).accessories.tube).toMatchObject({ attached: true, unlocking: true, clip: null })
    printer['mcu toolhead'].non_critical_disconnected = true
    expect(set(8100).accessories.tube).toMatchObject({ attached: false, clip: 'detach', t: 0 })
    expect(sync.frame(8100 + TUBE_DETACH_MS / 2).accessories.tube.t).toBeCloseTo(0.5)
    expect(sync.frame(8101 + TUBE_DETACH_MS).accessories.tube.clip).toBeNull()
    printer['mcu toolhead'].non_critical_disconnected = false
    printer['gcode_button toolhead_umbilical_unlock_button'].state = 'RELEASED'
    expect(set(9400).accessories.tube).toMatchObject({ attached: true, clip: 'attach', t: 0 })
    expect(sync.frame(9400 + TUBE_ATTACH_MS / 2).accessories.tube.t).toBeCloseTo(0.5)
    expect(sync.frame(9401 + TUBE_ATTACH_MS).accessories.tube.clip).toBeNull()

    printer['filament_switch_sensor filament_sensor_toolhead'].filament_detected = true
    prompt = { open: true, title: 'Filament Load' }
    expect(set(10500).accessories.filament).toMatchObject({ loaded: true, clip: 'load', t: 0, autoLoad: 'loading' })
    prompt = { open: true, title: 'Load Mode' }
    expect(set(10700).accessories.filament.autoLoad).toBe('grabbed')
    prompt = { open: false }
    expect(set(10900).accessories.filament.autoLoad).toBe('idle')
    expect(sync.frame(10500 + FILAMENT_LOAD_MS / 2).accessories.filament.t).toBeCloseTo(0.5)
    expect(sync.frame(10600 + FILAMENT_LOAD_MS).accessories.filament.clip).toBeNull()

    printer['filament_switch_sensor filament_sensor_toolhead'].filament_detected = false
    expect(set(14000).accessories.filament).toMatchObject({ loaded: false, clip: 'unload', t: 0 })
    expect(sync.frame(14000 + FILAMENT_UNLOAD_MS / 2).accessories.filament.t).toBeCloseTo(0.5)
    expect(sync.frame(14001 + FILAMENT_UNLOAD_MS).accessories.filament.clip).toBeNull()
  })

  it('reverses each channel from the complementary old progress', () => {
    const plate = new AccessoryMotion()
    plate.set(signals(), 0, true)
    plate.set(signals({ plateOn: false }), 10, true)
    const plateReverseAt = 10 + PLATE_REMOVE_MS / 4
    plate.set(signals(), plateReverseAt, true)
    expect(plate.frame(plateReverseAt).plate).toMatchObject({ clip: 'return-print', t: 0.75 })

    const tube = new AccessoryMotion()
    tube.set(signals(), 0, false)
    tube.set(signals({ tubeAttached: false }), 10, false)
    const tubeReverseAt = 10 + TUBE_DETACH_MS / 4
    tube.set(signals(), tubeReverseAt, false)
    expect(tube.frame(tubeReverseAt).tube).toMatchObject({ clip: 'attach', t: 0.75 })

    const filament = new AccessoryMotion()
    filament.set(signals(), 0, false)
    filament.set(signals({ filamentLoaded: true }), 10, false)
    const filamentReverseAt = 10 + FILAMENT_LOAD_MS / 4
    filament.set(signals(), filamentReverseAt, false)
    expect(filament.frame(filamentReverseAt).filament).toMatchObject({ clip: 'unload', t: 0.75 })
  })

  it('snaps on the first set and ignores same-direction repeats', () => {
    const motion = new AccessoryMotion()
    motion.set(signals(), 0, false)
    expect(motion.frame(0)).toMatchObject({ crossfade: 0, animating: false })
    motion.set(signals({ filamentLoaded: true }), 100, false)
    motion.set(signals({ filamentLoaded: true }), 300, false)
    expect(motion.frame(300).filament).toMatchObject({ clip: 'load', t: expect.closeTo(200 / FILAMENT_LOAD_MS) })
  })

  it('settles visibility changes immediately under reduced motion', () => {
    const motion = new AccessoryMotion()
    motion.reducedMotion = true
    motion.set(signals(), 0, false)
    expect(motion.frame(0).crossfade).toBe(0)
    motion.set(signals({ plateOn: false, tubeAttached: false, filamentLoaded: true, autoLoad: 'loading' }), 10, false)
    expect(motion.frame(10)).toMatchObject({
      plate: { on: false, clip: null, t: 1 },
      tube: { attached: false, clip: null, t: 1 },
      filament: { loaded: true, clip: null, t: 1, autoLoad: 'loading' },
      crossfade: 1,
      animating: false
    })
    motion.set(signals({ plateOn: false, tubeAttached: false, filamentLoaded: true, autoLoad: 'loading' }), 20, false)
    expect(motion.frame(20).crossfade).toBe(1)
    motion.set(signals({ plateOn: false, tubeAttached: false, filamentLoaded: false }), 30, false)
    expect(motion.frame(30).crossfade).toBe(2)
  })

  it('keeps auto-load activity through loading and its settle window', () => {
    const motion = new AccessoryMotion()
    motion.set(signals(), 0, false)
    expect(motion.frame(100).filament.autoLoadAge).toBeGreaterThan(1_000_000)
    motion.set(signals({ autoLoad: 'loading' }), 100, false)
    expect(motion.frame(100).animating).toBe(true)
    motion.set(signals({ autoLoad: 'grabbed' }), 1000, false)
    expect(motion.frame(1000)).toMatchObject({ animating: true, filament: { autoLoadAge: 0 } })
    expect(motion.frame(1000 + AUTOLOAD_SETTLE_MS - 1).animating).toBe(true)
    expect(motion.frame(1000 + AUTOLOAD_SETTLE_MS).animating).toBe(false)
  })
})

describe('opening the page on a printer that already has filament in', () => {
  // Before the first status lands, the store has no filament sensor, so the
  // filament reads as unloaded. Bench, 13 Oct: boxwood played a load on every
  // page open with filament already in.
  const loaded = {
    bed_removal_detector: { bedRemoved: false },
    'mcu toolhead': { non_critical_disconnected: false },
    'filament_switch_sensor filament_sensor_toolhead': { filament_detected: true, enabled: true }
  }

  it('reads nothing until the first status has arrived', () => {
    expect(liveAccessories({}, null, false)).toBeNull()
    expect(liveAccessories(loaded, null, false)).toBeNull()
    expect(liveAccessories(loaded, null, true)).toEqual(signals({ filamentLoaded: true }))
  })

  it('snaps to the loaded filament instead of animating a load', () => {
    const sync = new LiveSync()
    const before = liveAccessories({}, null, false)
    if (before) sync.setAccessories(before, 0, false)
    const after = liveAccessories(loaded, null, true)
    if (after) sync.setAccessories(after, 1300, false)
    expect(sync.accessories.frame(1300).filament).toMatchObject({ loaded: true, clip: null })
  })

  it('animates a load when the store defaults are taken as the first state', () => {
    const sync = new LiveSync()
    sync.setAccessories(accessoriesFrom({}, null), 0, false)
    sync.setAccessories(accessoriesFrom(loaded, null), 1300, false)
    expect(sync.accessories.frame(1300).filament.clip).toBe('load')
  })

  it('still animates the first real change after a status with nothing to change', () => {
    const sync = new LiveSync()
    const empty = { ...loaded, 'filament_switch_sensor filament_sensor_toolhead': { filament_detected: false, enabled: true } }
    sync.setAccessories(liveAccessories(empty, null, true)!, 0, false)
    sync.setAccessories(liveAccessories(loaded, null, true)!, 5000, false)
    expect(sync.accessories.frame(5000).filament.clip).toBe('load')
  })
})
