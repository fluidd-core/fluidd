import Vue from 'vue'
import { getters } from '../getters'

// Stub the prettyCase filter + colorset so assertions target the alias-override
// logic, not prettyCase formatting or colour resolution (covered elsewhere).
const originalFilters = Vue.$filters
const originalColorset = Vue.$colorset
beforeAll(() => {
  Vue.$filters = { prettyCase: (v: string) => `p:${v}` } as typeof Vue.$filters
  Vue.$colorset = { next: (_t: string, _k: string, c?: string) => c ?? '#000000' } as unknown as typeof Vue.$colorset
})
afterAll(() => {
  Vue.$filters = originalFilters
  Vue.$colorset = originalColorset
})

const gettersArg = {
  getNonCriticalDisconnectedMcusSet: new Set<string>(),
  getExtraSensorData: () => ({}),
} as any

const rootState = (aliases: Record<string, string> = {}) =>
  ({ config: { uiSettings: { dashboard: { aliases, sensorColors: {} } } } }) as any

const byKey = (list: any[], key: string) => list.find((o) => o.key === key)

// --- getOutputs (fans / output pins / LEDs) -------------------------------

const outputsState = () => ({
  printer: {
    fan: { speed: 0 }, // the part fan (type "fan", name "fan")
    'output_pin fan2': { value: 0 },
    configfile: { settings: {} },
  },
}) as any

const outputs = (aliases: Record<string, string> = {}) =>
  getters.getOutputs(outputsState(), gettersArg, rootState(aliases))()

describe('printer getters — getOutputs alias override', () => {
  it('falls back to the computed defaultPrettyName when no alias is set', () => {
    const row = byKey(outputs(), 'output_pin fan2')
    expect(row.prettyName).toBe('p:fan2')
    expect(row.defaultPrettyName).toBe('p:fan2')
  })

  it('overrides prettyName with the alias, leaving defaultPrettyName + raw identifiers intact', () => {
    const row = byKey(outputs({ 'output_pin fan2': 'Side Fan' }), 'output_pin fan2')
    expect(row.prettyName).toBe('Side Fan')
    expect(row.defaultPrettyName).toBe('p:fan2')
    // AC4 (display-only): the G-code path reads `name`/`key` — these MUST stay raw.
    expect(row.name).toBe('fan2')
    expect(row.key).toBe('output_pin fan2')
  })

  it('keeps the "Part Fan" special case as the default for the part fan', () => {
    const row = byKey(outputs(), 'fan')
    expect(row.prettyName).toBe('Part Fan')
    expect(row.defaultPrettyName).toBe('Part Fan')
  })

  it('lets an alias override the "Part Fan" special case', () => {
    const row = byKey(outputs({ fan: 'My Part Fan' }), 'fan')
    expect(row.prettyName).toBe('My Part Fan')
    expect(row.defaultPrettyName).toBe('Part Fan')
  })
})

// --- getHeaters (single-token keys: heater_bed / extruder) ------------------

const heatersState = () => ({
  printer: {
    heaters: { available_heaters: ['heater_bed', 'extruder'] },
    heater_bed: { temperature: 20 },
    extruder: { temperature: 200 },
    configfile: { settings: {} },
  },
}) as any

const heaters = (aliases: Record<string, string> = {}) =>
  getters.getHeaters(heatersState(), gettersArg, rootState(aliases))

describe('printer getters — getHeaters alias override', () => {
  it('resolves single-token heater keys and falls back to the default', () => {
    const row = byKey(heaters(), 'heater_bed')
    expect(row.key).toBe('heater_bed')
    expect(row.prettyName).toBe('p:heater_bed')
    expect(row.defaultPrettyName).toBe('p:heater_bed')
  })

  it('overrides a single-token heater with an alias, keeping name/key raw', () => {
    const row = byKey(heaters({ heater_bed: 'Bed' }), 'heater_bed')
    expect(row.prettyName).toBe('Bed')
    expect(row.defaultPrettyName).toBe('p:heater_bed')
    expect(row.name).toBe('heater_bed')
  })
})

// --- getSensors (tmc2240 special-case + temperature_sensor) -----------------

const sensorsState = () => ({
  printer: {
    'temperature_sensor chamber': { temperature: 25 },
    'tmc2240 stepper_x': { temperature: 40 },
    configfile: { settings: {} },
  },
}) as any

const sensors = (aliases: Record<string, string> = {}) =>
  getters.getSensors(sensorsState(), gettersArg, rootState(aliases))

describe('printer getters — getSensors alias override', () => {
  it('falls back to the computed default for a temperature sensor', () => {
    const row = byKey(sensors(), 'temperature_sensor chamber')
    expect(row.prettyName).toBe('p:chamber')
    expect(row.defaultPrettyName).toBe('p:chamber')
  })

  it('overrides the tmc2240 stepper_driver special-case with an alias', () => {
    const row = byKey(sensors({ 'tmc2240 stepper_x': 'Driver X' }), 'tmc2240 stepper_x')
    expect(row.prettyName).toBe('Driver X')
    // defaultPrettyName keeps the (non-obvious) stepper_driver default, whatever it renders to.
    expect(typeof row.defaultPrettyName).toBe('string')
    expect(row.defaultPrettyName.length).toBeGreaterThan(0)
    expect(row.defaultPrettyName).not.toBe('Driver X')
    expect(row.key).toBe('tmc2240 stepper_x')
  })
})
