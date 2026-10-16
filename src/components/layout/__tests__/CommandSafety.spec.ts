import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import CommandBar from '../CommandBar.vue'
import { SocketActions } from '@/api/socketActions'
import { setProMode } from '@/services/pro-mode'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

vi.mock('@/api/socketActions', () => ({ SocketActions: { printerGcodeScript: vi.fn(), printerPrintPause: vi.fn(), printerPrintResume: vi.fn(), printerPrintCancel: vi.fn(), printerPrintStart: vi.fn(), printerEmergencyStop: vi.fn(), printerRestart: vi.fn(), printerFirmwareRestart: vi.fn(), machineReboot: vi.fn(), machineShutdown: vi.fn() } }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'hazel-1234', isForeignSlug: () => false, knownPrinters: () => [], printerHomePath: () => '/hazel-1234' }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { activePrinterId: null, printers: [], account: null } }))
// Discovery reaches application startup (and installs router/Vuetify globally).
vi.mock('@/services/muon-cloud/directory', () => ({ savedName: () => 'Hazel' }))
vi.mock('@/services/slicer-bridge/slicerUrl', () => ({ slicerPresence: { state: 'absent' } }))

function show () {
  return shallowMount(CommandBar, {
    computed: { isMobileViewport: () => false, sectionContext: () => ({ pro: false, foreign: false, camera: null }) },
    mocks: {
      $store: {
        state: { printer: { printer: { configfile: { settings: { 'filament_switch_sensor loader': { insert_gcode: 'LOAD' } } } } }, config: { apiUrl: 'http://hazel.local', uiSettings: { general: { enableKeyboardShortcuts: true, confirmOnEstop: false }, spoolman: { autoSpoolSelectionDialog: false } } }, history: { jobs: [] } },
        getters: { 'socket/getConnectionState': true, 'socket/getApiConnected': true, 'auth/getAuthenticated': true, 'printer/getKlippyReady': true, 'printer/getKlippyConnected': true, 'printer/getKlippyState': 'Ready', 'printer/getPrinterState': 'ready', 'config/getDisplayName': 'Hazel', 'config/getTempPresets': [{ id: 'pla', name: 'PLA', extruder: 210, heater_bed: 60 }], 'files/getRootFiles': () => [{ path: 'part.gcode', modified: 1 }], 'macros/getVisibleMacros': [{ id: 'main', name: null, macros: [{ name: 'PURGE', config: {} }] }], 'spoolman/getAvailable': false },
        dispatch: vi.fn(),
        commit: vi.fn()
      },
      $route: { params: { printer: 'hazel-1234' }, fullPath: '/hazel-1234', meta: {} },
      $vuetify: { breakpoint: { mdAndDown: false } },
      $confirm: vi.fn().mockResolvedValue(true)
    },
    stubs: { 'v-dialog': { props: ['value'], template: '<div v-if="value"><slot /></div>' } }
  })
}

afterEach(() => {
  vi.clearAllMocks()
  setProMode(false)
  cloudState.activePrinterId = null
  cloudState.printers = []
  printerTransportBinding.remote = false
})

describe('palette command safety', () => {
  const paletteActions = [
    ['pause', 'printing'],
    ['resume', 'paused'],
    ['cancel', 'printing'],
    ['home', 'ready'],
    ['preheat-pla', 'ready'],
    ['cool-down', 'ready'],
    ['estop', 'ready'],
    ['job-part.gcode', 'ready'],
    ['macro-PURGE', 'ready']
  ] as const

  function command (wrapper: ReturnType<typeof show>, id: string, state: string) {
    wrapper.vm.$store.getters['printer/getPrinterState'] = state
    return (wrapper.vm as CommandBar).commands.find(item => item.id === id)
  }

  it.each(paletteActions)('does not offer %s to a cloud viewer', (id, state) => {
    const wrapper = show()
    wrapper.vm.$store.state.config.apiUrl = 'https://muon-cloud.invalid'
    cloudState.activePrinterId = 'hazel'
    cloudState.printers = [{ id: 'hazel', name: 'Hazel', model: 'M1', version: 'test', linked_at: 0, last_seen: 0, online_since: null, online: true, role: 'viewer' }]
    printerTransportBinding.remote = true
    expect(command(wrapper, id, state)).toBeUndefined()
    wrapper.destroy()
  })

  it.each(paletteActions)('does not offer %s while disconnected', (id, state) => {
    const wrapper = show()
    wrapper.vm.$store.getters['socket/getConnectionState'] = false
    expect(command(wrapper, id, state)).toBeUndefined()
    wrapper.destroy()
  })

  it.each(paletteActions)('refuses stale %s after the printer target changes', async (id, state) => {
    const wrapper = show()
    const stale = command(wrapper, id, state)!
    wrapper.vm.$store.state.config.apiUrl = 'http://oak.local'
    await stale.run()
    expect(Object.values(SocketActions).every(mock => !(mock as ReturnType<typeof vi.fn>).mock.calls.length)).toBe(true)
    wrapper.destroy()
  })

  it('refuses cool down when the printer changes during confirmation', async () => {
    const wrapper = show()
    const coolDown = command(wrapper, 'cool-down', 'printing')!
    wrapper.vm.$confirm = vi.fn().mockImplementation(async () => {
      wrapper.vm.$store.state.config.apiUrl = 'http://oak.local'
      return true
    })
    await coolDown.run()
    expect(wrapper.vm.$confirm).toHaveBeenCalledTimes(1)
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('sends typed G-code with Pro off exactly once', async () => {
    setProMode(false)
    const wrapper = show()
    await wrapper.setData({ open: true, query: '> M105' })
    await (wrapper.vm as CommandBar).runAt(0)
    expect(SocketActions.printerGcodeScript).toHaveBeenCalledTimes(1)
    expect(SocketActions.printerGcodeScript).toHaveBeenCalledWith('M105', undefined)
    expect((wrapper.vm as CommandBar).open).toBe(false)
    wrapper.destroy()
  })

  it('keeps a refused batch open and editable with a visible explanation', async () => {
    setProMode(true)
    const wrapper = show()
    const query = '> M105\nSET_FILAMENT_SENSOR SENSOR=loader ENABLE=0'
    await wrapper.setData({ open: true, query })
    await (wrapper.vm as CommandBar).runAt(0)
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    expect((wrapper.vm as CommandBar).open).toBe(true)
    expect((wrapper.vm as CommandBar).query).toBe(query)
    expect(wrapper.find('[role="alert"]').text()).toContain('Not sent.')
    wrapper.destroy()
  })

  it.each(['restart-klipper', 'firmware-restart'])('offers and confirms %s in a Klipper error with Pro off', async id => {
    setProMode(false)
    const wrapper = show()
    wrapper.vm.$store.getters['printer/getKlippyReady'] = false
    wrapper.vm.$store.getters['printer/getKlippyConnected'] = false
    wrapper.vm.$store.getters['printer/getKlippyState'] = 'Error'
    wrapper.vm.$store.getters['printer/getPrinterState'] = 'loading'
    const command = (wrapper.vm as CommandBar).doCommands.find(c => c.id === id)
    expect(command).toBeDefined()
    await command!.run()
    expect(wrapper.vm.$confirm).toHaveBeenCalledTimes(1)
    expect(id === 'restart-klipper' ? SocketActions.printerRestart : SocketActions.printerFirmwareRestart).toHaveBeenCalledTimes(1)
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it.each(['printing', 'paused', 'busy'])('hides restarts and refuses a stale action while %s', async state => {
    setProMode(true)
    const wrapper = show()
    const stale = (wrapper.vm as CommandBar).doCommands.find(c => c.id === 'restart-klipper')!
    wrapper.vm.$store.getters['printer/getPrinterState'] = state
    expect((wrapper.vm as CommandBar).doCommands.some(c => c.id === 'restart-klipper')).toBe(false)
    await stale.run()
    expect(wrapper.vm.$confirm).not.toHaveBeenCalled()
    expect(SocketActions.printerRestart).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it.each(['cancel', 'printing', 'disconnect', 'viewer', 'printer-switch', 'route-switch'])('refuses after confirmation changes: %s', async change => {
    setProMode(true)
    const wrapper = show()
    wrapper.vm.$confirm = vi.fn().mockImplementation(async () => {
      if (change === 'printing') wrapper.vm.$store.getters['printer/getPrinterState'] = 'printing'
      if (change === 'disconnect') wrapper.vm.$store.getters['socket/getConnectionState'] = false
      if (change === 'printer-switch') wrapper.vm.$store.state.config.apiUrl = 'http://oak.local'
      if (change === 'route-switch') wrapper.vm.$route.params.printer = 'foreign-printer'
      if (change === 'viewer') {
        wrapper.vm.$store.state.config.apiUrl = 'https://muon-cloud.invalid'
        cloudState.activePrinterId = 'hazel'
        cloudState.printers = [{ id: 'hazel', name: 'Hazel', model: 'M1', version: 'test', linked_at: 0, last_seen: 0, online_since: null, online: true, role: 'viewer' }]
        printerTransportBinding.remote = true
      }
      return change !== 'cancel'
    })
    await wrapper.setData({ open: true, query: 'Restart Klipper' })
    const vm = wrapper.vm as CommandBar
    await vm.runAt(vm.results.findIndex(c => c.id === 'restart-klipper'))
    expect(wrapper.vm.$confirm).toHaveBeenCalledTimes(1)
    expect(SocketActions.printerRestart).not.toHaveBeenCalled()
    expect(vm.open).toBe(true)
    wrapper.destroy()
  })

  it('offers no raw commands or restarts to a cloud viewer', async () => {
    const wrapper = show()
    wrapper.vm.$store.state.config.apiUrl = 'https://muon-cloud.invalid'
    cloudState.activePrinterId = 'hazel'
    cloudState.printers = [{ id: 'hazel', name: 'Hazel', model: 'M1', version: 'test', linked_at: 0, last_seen: 0, online_since: null, online: true, role: 'viewer' }]
    printerTransportBinding.remote = true
    await wrapper.setData({ query: '> M105' })
    const vm = wrapper.vm as CommandBar
    expect(vm.gcodeCommands).toEqual([])
    expect(vm.doCommands.some(c => c.id === 'restart-klipper')).toBe(false)
    wrapper.destroy()
  })

  it.each(['reboot', 'shutdown'] as const)('rechecks a computer %s after confirmation', async what => {
    const wrapper = show()
    wrapper.vm.$confirm = vi.fn().mockImplementation(async () => {
      wrapper.vm.$store.getters['printer/getPrinterState'] = 'paused'
      return true
    })
    await (wrapper.vm as CommandBar).hostCommand(what)
    expect(wrapper.vm.$confirm).toHaveBeenCalledTimes(1)
    expect(SocketActions.machineReboot).not.toHaveBeenCalled()
    expect(SocketActions.machineShutdown).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
