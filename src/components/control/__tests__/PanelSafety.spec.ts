import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ControlMixin from '@/mixins/control'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { panelStore, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))

function show () {
  const store = panelStore()
  const wrapper = mount({ mixins: [ControlMixin], render: h => h('div') }, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } }, $confirm: vi.fn().mockResolvedValue(true) } })
  return { store, wrapper, vm: wrapper.vm as any }
}

describe('generated Control commands', () => {
  afterEach(() => { socket.printerGcodeScript.mockClear(); printerTransportBinding.remote = false; cloudState.activePrinterId = null })

  it.each(['printing', 'paused', 'busy'])('refuses motion, homing and motors off in %s state at invocation', state => {
    const s = show(); s.store.getters['printer/getPrinterState'] = state
    s.vm.home(); s.vm.motorsOff(); s.vm.moveTo({ X: 120 }); s.vm.moveBy('Z', 10)
    expect(socket.printerGcodeScript).not.toHaveBeenCalled(); s.wrapper.destroy()
  })

  it('refuses unhomed and invalid exact moves instead of moving part of the request', () => {
    const s = show(); s.store.state.printer.printer.toolhead.homed_axes = 'xy'
    s.vm.moveTo({ X: 120, Z: 40 }); s.vm.moveTo({ X: 201 }); s.vm.moveTo({ X: Infinity }); s.vm.moveBy('Z', 10)
    expect(socket.printerGcodeScript).not.toHaveBeenCalled(); s.wrapper.destroy()
  })

  it.each(['auth/getAuthenticated', 'socket/getConnectionState', 'socket/getApiConnected', 'printer/getKlippyReady'])('refuses heat and movement when %s is lost', getter => {
    const s = show(); s.store.getters[getter] = false
    s.vm.setHeater(s.vm.nozzle, 230); s.vm.home(); s.vm.moveBy('X', 10)
    expect(socket.printerGcodeScript).not.toHaveBeenCalled(); s.wrapper.destroy()
  })

  it('sends a homed move at the slower Z speed and a valid target exactly once each', () => {
    const s = show(); s.vm.moveTo({ X: 120, Z: 40 }); s.vm.setHeater(s.vm.nozzle, 230)
    expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG90\nG1 X120 Z40 F600\nRESTORE_GCODE_STATE NAME=_ui_movement', 'SET_HEATER_TEMPERATURE HEATER=extruder TARGET=230'])
    s.wrapper.destroy()
  })

  it('rejects invalid heater values rather than clamping a different target', () => {
    const s = show(); for (const n of [NaN, Infinity, -1, 266]) s.vm.setHeater(s.vm.nozzle, n)
    expect(socket.printerGcodeScript).not.toHaveBeenCalled(); s.wrapper.destroy()
  })
})
