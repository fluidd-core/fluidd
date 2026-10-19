import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlOutputs from '../ControlOutputs.vue'
import ControlTuning from '../ControlTuning.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn(), printerQueryEndstops: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear(); socket.printerQueryEndstops.mockClear() })

it('keeps diagnosis visible but refuses actions after control is lost', () => {
  const store = panelStore()
  store.getters['auth/getAuthenticated'] = false
  const options = { mocks: { $store: store, $waits: waits }, stubs: panelStubs }
  const outputs = mount(ControlOutputs, options)
  const tuning = mount(ControlTuning, options)
  ;(outputs.vm as any).setSensor('loader', true)
  ;(outputs.vm as any).checkEndstops()
  ;(tuning.vm as any).readShaper()
  ;(tuning.vm as any).setShaper('x', { type: 'mzv', freq: 50 })
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(socket.printerQueryEndstops).not.toHaveBeenCalled()
  outputs.destroy(); tuning.destroy()
})
