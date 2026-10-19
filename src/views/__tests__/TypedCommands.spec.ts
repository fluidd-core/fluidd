import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Console from '../Console.vue'
import OverviewConsole from '@/components/overview/OverviewConsole.vue'
import { SocketActions } from '@/api/socketActions'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

vi.mock('@/api/socketActions', () => ({ SocketActions: { printerGcodeScript: vi.fn(), printerEmergencyStop: vi.fn() } }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'hazel-1234' }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { activePrinterId: null, printers: [] } }))

const configfile = {
  settings: {
    'filament_switch_sensor loader': { insert_gcode: 'INSERT_FILAMENT_SENSOR' },
    'filament_motion_sensor runout': { insert_gcode: '' }
  }
}

function show (component: typeof Console | typeof OverviewConsole, connected = true) {
  return shallowMount(component, {
    mocks: {
      $store: {
        state: { printer: { printer: { configfile } }, console: { console: [], commandHistory: [] }, config: { apiUrl: 'http://hazel.local', uiSettings: { general: {} } } },
        getters: { 'socket/getConnectionState': connected, 'socket/getApiConnected': connected, 'auth/getAuthenticated': true, 'printer/getKlippyReady': true, 'printer/getKlippyConnected': true, 'printer/getPrinterState': 'ready' },
        dispatch: vi.fn()
      },
      $vuetify: { breakpoint: { mdAndDown: false } },
      $confirm: vi.fn().mockResolvedValue(true)
    },
    stubs: { 'router-link': true, 'dynamic-scroller': { template: '<div />', methods: { scrollToBottom () {} } } }
  })
}

afterEach(() => {
  vi.clearAllMocks()
  cloudState.activePrinterId = null
  cloudState.printers = []
  printerTransportBinding.remote = false
})

describe.each([Console, OverviewConsole])('typed batch submission', component => {
  it.each([
    'SET_FILAMENT_SENSOR SENSOR=loader ENABLE=0',
    'M105\nset_filament_sensor sensor="loader" enable=0 ; do not send any line',
    'N12 SET_FILAMENT_SENSOR SENSOR=loader ENABLE="+00"*42',
    'SET_FILAMENT_SENSOR SENSOR=runout ENABLE=1 SENSOR=loader ENABLE=0',
    'SET_FILAMENT_SENSOR SENSOR=missing ENABLE=0',
    'SET_FILAMENT_SENSOR SENSOR=loader ENABLE='
  ])('refuses the whole unsafe batch and keeps it editable: %s', async command => {
    const wrapper = show(component)
    await wrapper.setData({ command })
    await (wrapper.vm as Console).send()
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    expect(SocketActions.printerEmergencyStop).not.toHaveBeenCalled()
    expect((wrapper.vm as Console).command).toBe(command)
    expect(wrapper.find('[role="alert"]').text()).toContain('Not sent.')
    wrapper.destroy()
  })

  it.each(['M105', 'QUERY_FILAMENT_SENSOR SENSOR=loader', 'SET_FILAMENT_SENSOR SENSOR=loader ENABLE=1', 'SET_FILAMENT_SENSOR SENSOR=runout ENABLE=0'])('sends a safe command exactly once: %s', async command => {
    const wrapper = show(component)
    await wrapper.setData({ command })
    await (wrapper.vm as Console).send()
    expect(SocketActions.printerGcodeScript).toHaveBeenCalledTimes(1)
    expect(SocketActions.printerGcodeScript).toHaveBeenCalledWith(command, undefined)
    expect((wrapper.vm as Console).command).toBe('')
    wrapper.destroy()
  })

  it('refuses disconnected invocation even when a ready value is stale', async () => {
    const wrapper = show(component, false)
    await wrapper.setData({ command: 'M105' })
    await (wrapper.vm as Console).send()
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    expect((wrapper.vm as Console).command).toBe('M105')
    wrapper.destroy()
  })

  it('keeps an unknown-config sensor armed but permits enabling it', async () => {
    const wrapper = show(component)
    wrapper.vm.$store.state.printer.printer.configfile = undefined
    await wrapper.setData({ command: 'SET_FILAMENT_SENSOR SENSOR=loader ENABLE=0' })
    await (wrapper.vm as Console).send()
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    await wrapper.setData({ command: 'SET_FILAMENT_SENSOR SENSOR=loader ENABLE=1' })
    await (wrapper.vm as Console).send()
    expect(SocketActions.printerGcodeScript).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })

  it.each(['viewer', undefined] as const)('refuses a cloud caller without control (%s)', async role => {
    const wrapper = show(component)
    wrapper.vm.$store.state.config.apiUrl = 'https://muon-cloud.invalid'
    cloudState.activePrinterId = 'hazel'
    cloudState.printers = [{ id: 'hazel', name: 'Hazel', model: 'M1', version: 'test', linked_at: 0, last_seen: 0, online_since: null, online: true, role }]
    printerTransportBinding.remote = true
    await wrapper.setData({ command: 'M105' })
    await (wrapper.vm as Console).send()
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toContain('control')
    wrapper.destroy()
  })

  it('refuses unauthenticated direct invocation', async () => {
    const wrapper = show(component)
    wrapper.vm.$store.getters['auth/getAuthenticated'] = false
    await wrapper.setData({ command: 'M105' })
    await (wrapper.vm as Console).send()
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it.each(['printing', 'paused', 'busy'])('refuses a typed restart while %s', async state => {
    const wrapper = show(component)
    wrapper.vm.$store.getters['printer/getPrinterState'] = state
    await wrapper.setData({ command: 'M105\nFIRMWARE_RESTART' })
    await (wrapper.vm as Console).send()
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    expect(wrapper.vm.$confirm).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toContain('busy')
    wrapper.destroy()
  })

  it('rechecks busy state after restart confirmation', async () => {
    const wrapper = show(component)
    wrapper.vm.$confirm = vi.fn().mockImplementation(async () => {
      wrapper.vm.$store.getters['printer/getPrinterState'] = 'printing'
      return true
    })
    await wrapper.setData({ command: 'RESTART' })
    await (wrapper.vm as Console).send()
    expect(wrapper.vm.$confirm).toHaveBeenCalledTimes(1)
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    expect((wrapper.vm as Console).command).toBe('RESTART')
    wrapper.destroy()
  })

  it('rechecks the Klipper connection after confirming a mixed batch', async () => {
    const wrapper = show(component)
    wrapper.vm.$confirm = vi.fn().mockImplementation(async () => {
      wrapper.vm.$store.getters['printer/getKlippyConnected'] = false
      return true
    })
    await wrapper.setData({ command: 'RESTART\nM105' })
    await (wrapper.vm as Console).send()
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    expect((wrapper.vm as Console).command).toBe('RESTART\nM105')
    wrapper.destroy()
  })

  it('keeps tuning available during a print', async () => {
    const wrapper = show(component)
    wrapper.vm.$store.getters['printer/getPrinterState'] = 'printing'
    await wrapper.setData({ command: 'M220 S90' })
    await (wrapper.vm as Console).send()
    expect(SocketActions.printerGcodeScript).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })
})
