import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VueI18n from 'vue-i18n'
import Vue from 'vue'
import messages from '@/locales/en.yaml'
import type { RunoutSensor } from '@/store/printer/types'
import { defaultState } from '@/store/printer/state'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))

const { default: RunoutSensorsCard } = await import('../RunoutSensorsCard.vue')

Vue.use(VueI18n)

const i18n = new VueI18n({ locale: 'en', messages: { en: messages } })

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

/** Fluidd's card shell and Vuetify's list as plain elements; the switch as a button that changes. */
const plain = { template: '<div><slot /></div>' }
const stubs = {
  CollapsableCard: { template: '<section><slot name="menu" /><slot /></section>' },
  AppBtn: true,
  'v-list': plain,
  'v-list-item': { template: '<div class="sensor"><slot /></div>' },
  'v-list-item-content': plain,
  'v-list-item-title': plain,
  'v-list-item-subtitle': plain,
  'v-list-item-icon': plain,
  'v-list-item-action': plain,
  'v-icon': true,
  'v-switch': {
    props: ['inputValue', 'disabled'],
    template: '<button role="switch" :aria-checked="String(!!inputValue)" :disabled="disabled" @click="$emit(\'change\', !inputValue)" />'
  }
}

/** `printer`: the store's printer object, Klipper's configfile in it. */
function show (sensors: Sensor[], printer: Record<string, unknown> = { configfile }) {
  return mount(RunoutSensorsCard, {
    stubs,
    i18n,
    mocks: {
      $store: {
        state: { printer: { printer } },
        getters: { 'printer/getRunoutSensors': sensors },
        dispatch: vi.fn()
      }
    }
  })
}

const row = (wrapper: ReturnType<typeof show>, name: string) =>
  wrapper.findAll('.sensor').filter(r => r.text().includes(name)).at(0)

type Card = { changeSensor (item: RunoutSensor, value: boolean): void }

const sent = () => socket.printerGcodeScript.mock.calls.map(c => c[0])

describe('RunoutSensorsCard', () => {
  afterEach(() => { socket.printerGcodeScript.mockClear() })

  it('shows a sensor that loads filament as always on, its switch unable to turn it off', () => {
    const wrapper = show([toolhead])
    const r = row(wrapper, 'Filament Sensor Toolhead')
    expect(r.text()).toContain('Loads filament automatically; always on')
    expect(r.find('[role="switch"]').attributes('disabled')).toBe('disabled')
    wrapper.destroy()
  })

  it('refuses to turn off a sensor that loads filament, even when its handler is called directly', () => {
    const wrapper = show([toolhead])
    ;(wrapper.vm as unknown as Card).changeSensor(toolhead, false)
    expect(sent()).toEqual([])
    wrapper.destroy()
  })

  it('turns a sensor that loads filament back on', async () => {
    const off = { ...toolhead, enabled: false }
    const wrapper = show([off])
    const r = row(wrapper, 'Filament Sensor Toolhead')
    expect(r.text()).toContain('Loads filament automatically; always on')
    const toggle = r.find('[role="switch"]')
    expect(toggle.attributes('disabled')).toBeUndefined()
    await toggle.trigger('click')
    ;(wrapper.vm as unknown as Card).changeSensor(off, true)
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
    const card = wrapper.vm as unknown as Card
    card.changeSensor(toolhead, false)
    card.changeSensor(runout, true)
    expect(sent()).toEqual(['SET_FILAMENT_SENSOR SENSOR=runout ENABLE=0', 'SET_FILAMENT_SENSOR SENSOR=runout ENABLE=1'])
    wrapper.destroy()
  })

  it('offers no off while the printer\'s settings are absent or loading', () => {
    // No configfile at all, and the store as it starts, before Klipper's configfile arrives.
    for (const printer of [{}, defaultState().printer]) {
      const wrapper = show([runout], printer)
      expect(row(wrapper, 'Runout').find('[role="switch"]').attributes('disabled')).toBe('disabled')
      ;(wrapper.vm as unknown as Card).changeSensor(runout, false)
      expect(sent()).toEqual([])
      wrapper.destroy()
    }
  })
})
