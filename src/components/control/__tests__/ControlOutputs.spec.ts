import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RunoutSensor } from '@/store/printer/types'
import { defaultState } from '@/store/printer/state'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn(), printerQueryEndstops: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))

const { default: ControlOutputs } = await import('../ControlOutputs.vue')

type Sensor = RunoutSensor & { prettyName: string }

const toolhead: Sensor = { name: 'filament_sensor_toolhead', prettyName: 'Filament Sensor Toolhead', enabled: true, filament_detected: false }
const runout: Sensor = { name: 'runout', prettyName: 'Runout', enabled: true, filament_detected: true }

/** Klipper's configfile on an M1 with a second, runout-only sensor. */
const configfile = {
  settings: {
    'filament_switch_sensor filament_sensor_toolhead': { pause_on_runout: false, insert_gcode: 'INSERT_FILAMENT_SENSOR', switch_pin: '!toolhead:gpio3' },
    'filament_switch_sensor runout': { pause_on_runout: true, runout_gcode: '', switch_pin: '^PG12' }
  },
  config: {
    'filament_switch_sensor filament_sensor_toolhead': { pause_on_runout: 'False', insert_gcode: 'INSERT_FILAMENT_SENSOR', switch_pin: '!toolhead:gpio3' },
    'filament_switch_sensor runout': { switch_pin: '^PG12' }
  }
}

/** `printer`: the store's printer object, Klipper's configfile in it. */
function show (sensors: Sensor[], printer: Record<string, unknown> = { configfile }) {
  const getters: Record<string, unknown> = {
    'printer/getKlippyReady': true,
    'socket/getConnectionState': true,
    'printer/getPins': [],
    'printer/getAllLeds': [],
    'printer/getRunoutSensors': sensors,
    'printer/getEndstops': [],
    'printer/getProbe': undefined
  }
  return mount(ControlOutputs, {
    mocks: {
      $store: {
        state: { printer: { printer } },
        getters,
        dispatch: vi.fn(),
        commit: vi.fn()
      },
      $waits: {}
    }
  })
}

const row = (wrapper: ReturnType<typeof show>, name: string) =>
  wrapper.findAll('[data-tid="control-sensors"] .crow').filter(r => r.text().includes(name)).at(0)

const sent = () => socket.printerGcodeScript.mock.calls.map(c => c[0])

describe('ControlOutputs: filament sensors', () => {
  afterEach(() => { socket.printerGcodeScript.mockClear() })

  it('shows a sensor that loads filament as always on, with no switch to turn it off', () => {
    const wrapper = show([toolhead])
    const r = row(wrapper, 'Filament Sensor Toolhead')
    expect(r.find('[role="switch"]').exists()).toBe(false)
    expect(r.text()).toContain('Loads filament automatically; always on')
    wrapper.destroy()
  })

  it('refuses to turn off a sensor that loads filament, even when its handler is called directly', () => {
    const wrapper = show([toolhead])
    ;(wrapper.vm as unknown as { setSensor (name: string, enabled: boolean): void }).setSensor('filament_sensor_toolhead', false)
    expect(sent().some(g => /ENABLE=0/.test(g))).toBe(false)
    expect(sent()).toEqual([])
    wrapper.destroy()
  })

  it('turns a sensor that loads filament back on', async () => {
    const wrapper = show([{ ...toolhead, enabled: false }])
    const r = row(wrapper, 'Filament Sensor Toolhead')
    expect(r.text()).toContain('Loads filament automatically; always on')
    await r.find('[role="switch"]').trigger('click')
    ;(wrapper.vm as unknown as { setSensor (name: string, enabled: boolean): void }).setSensor('filament_sensor_toolhead', true)
    expect(sent()).toEqual([
      'SET_FILAMENT_SENSOR SENSOR=filament_sensor_toolhead ENABLE=1',
      'SET_FILAMENT_SENSOR SENSOR=filament_sensor_toolhead ENABLE=1'
    ])
    wrapper.destroy()
  })

  it('keeps the on/off of a runout-only sensor, beside one that loads filament', async () => {
    const wrapper = show([toolhead, runout])
    const r = row(wrapper, 'Runout')
    expect(r.text()).not.toContain('always on')
    const toggle = r.find('[role="switch"]')
    expect(toggle.attributes('disabled')).toBeUndefined()
    await toggle.trigger('click')
    const vm = wrapper.vm as unknown as { setSensor (name: string, enabled: boolean): void }
    vm.setSensor('filament_sensor_toolhead', false)
    vm.setSensor('runout', true)
    expect(sent()).toEqual(['SET_FILAMENT_SENSOR SENSOR=runout ENABLE=0', 'SET_FILAMENT_SENSOR SENSOR=runout ENABLE=1'])
    wrapper.destroy()
  })

  it('offers no off while the printer\'s settings are absent or loading', async () => {
    // No configfile at all, and the store as it starts, before Klipper's configfile arrives.
    for (const printer of [{}, defaultState().printer]) {
      const wrapper = show([runout], printer)
      const toggle = row(wrapper, 'Runout').find('[role="switch"]')
      expect(toggle.attributes('disabled')).toBe('disabled')
      ;(wrapper.vm as unknown as { setSensor (name: string, enabled: boolean): void }).setSensor('runout', false)
      expect(sent()).toEqual([])
      wrapper.destroy()
    }
  })
})
