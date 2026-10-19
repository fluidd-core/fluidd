import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ControlOutputs from '../ControlOutputs.vue'
import ControlTuning from '../ControlTuning.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn(), printerQueryEndstops: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))

const deferred = <T, >() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(_resolve => { resolve = _resolve })
  return { promise, resolve }
}

const options = (store: ReturnType<typeof panelStore>) => ({
  mocks: { $store: store, $waits: waits },
  stubs: panelStubs
})

describe('maintenance result freshness', () => {
  it('keeps endstops unknown when an older query resolves before the latest query', async () => {
    const store = panelStore()
    const first = deferred<Record<string, string>>()
    const second = deferred<Record<string, string>>()
    socket.printerQueryEndstops.mockReset()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const wrapper = mount(ControlOutputs, options(store))

    ;(wrapper.vm as any).checkEndstops()
    ;(wrapper.vm as any).checkEndstops()
    first.resolve({ x: 'TRIGGERED' })
    await Vue.nextTick(); await Vue.nextTick()
    expect((wrapper.vm as any).endstops).toEqual([])

    second.resolve({ x: 'open' })
    await Vue.nextTick(); await Vue.nextTick()
    expect((wrapper.vm as any).endstops).toEqual([{ name: 'X', state: 'open' }])
    wrapper.destroy()
  })

  it('keeps endstops unknown when the selected printer changes during a query', async () => {
    const store = panelStore()
    const query = deferred<Record<string, string>>()
    socket.printerQueryEndstops.mockReset().mockReturnValueOnce(query.promise)
    const wrapper = mount(ControlOutputs, options(store))

    ;(wrapper.vm as any).checkEndstops()
    store.state.config.apiUrl = 'http://printer-b.local'
    await Vue.nextTick()
    query.resolve({ x: 'TRIGGERED' })
    await Vue.nextTick(); await Vue.nextTick()
    expect((wrapper.vm as any).endstops).toEqual([])
    wrapper.destroy()
  })

  it('drops another printer\'s shaper report and edits from the selected printer config', async () => {
    const store = panelStore()
    store.state.printer.printer.configfile.settings.input_shaper = {
      shaper_type_x: 'ei', shaper_freq_x: 41, shaper_type_y: 'mzv', shaper_freq_y: 35
    }
    store.state.console.console.push({ type: 'response', message: 'shaper_type_x:2hump_ei shaper_freq_x:62 shaper_type_y:3hump_ei shaper_freq_y:57' })
    const wrapper = mount(ControlTuning, options(store))

    ;(wrapper.vm as any).readShaper()
    store.state.console.console.push({ type: 'response', message: 'shaper_type_x:2hump_ei shaper_freq_x:63 shaper_type_y:3hump_ei shaper_freq_y:58' })
    await Vue.nextTick()
    expect((wrapper.vm as any).shaper('x')).toEqual({ type: '2hump_ei', freq: 63 })

    store.state.config.apiUrl = 'http://printer-b.local'
    store.state.printer.printer.configfile = {
      settings: {
        input_shaper: { shaper_type_x: 'zv', shaper_freq_x: 29, shaper_type_y: 'ei', shaper_freq_y: 31 }
      },
      config: {}
    }
    await Vue.nextTick()
    expect((wrapper.vm as any).shaper('x')).toEqual({ type: 'zv', freq: 29 })

    socket.printerGcodeScript.mockClear()
    ;(wrapper.vm as any).setShaper('x', { freq: 30 })
    expect(socket.printerGcodeScript.mock.calls.at(-1)?.[0]).toBe('SET_INPUT_SHAPER SHAPER_TYPE_X=zv SHAPER_FREQ_X=30')
    wrapper.destroy()
  })
})
