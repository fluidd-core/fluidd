import Vue from 'vue'
import VueRouter from 'vue-router'
import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrintHandoff from '../PrintHandoff.vue'

const mocks = vi.hoisted(() => ({
  rows: [] as any[],
  upload: vi.fn(async () => 'part.gcode'),
  download: vi.fn(async () => new Uint8Array([1, 2, 3])),
  start: vi.fn(async () => {})
}))

vi.mock('@/mixins/printer-rows', async () => {
  const { default: Vue } = await import('vue')
  return { default: Vue.extend({ computed: { rows: () => mocks.rows }, methods: { modelOf: () => 'Muon3D M1' } }) }
})
vi.mock('@/services/muon-cloud/state', async () => {
  const { default: Vue } = await import('vue')
  return { cloudState: Vue.observable({ account: { id: 'account' } }) }
})
vi.mock('@/services/library/print-on', () => ({
  downloadGcode: mocks.download,
  uploadGcode: mocks.upload,
  gcodeFileName: () => 'part.gcode',
  activePrinterFacts: () => ({ online: true, model: 'Muon3D M1', nozzleMm: 0.4, material: 'PLA' }),
  printingNow: () => null,
  START_ANSWER_MS: 150000
}))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: { post: mocks.start } }))
vi.mock('@/services/library/runs', () => ({ rememberLibraryFile: vi.fn() }))

const setup = { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA', file_id: 'file', print_seconds: 60, filament_g: 2 }
const row = (id: string, active: boolean) => ({ id, name: id, slug: `${id}-slug`, active, fit: { kind: 'ready', setup }, status: 'Ready', detail: '', note: '', action: 'print', reslice: '', tone: 'ok' })

function mount (query: Record<string, string> = {}) {
  const router = new VueRouter({ mode: 'abstract', routes: [{ path: '*', component: { render: (h: any) => h('div') } }] })
  router.push({ path: '/print', query }).catch(() => {})
  const push = vi.spyOn(router, 'push')
  const wrapper = shallowMount(PrintHandoff, {
    router,
    mocks: { $store: { state: { printer: { printer: {} } }, getters: {}, dispatch: vi.fn() } },
    stubs: { CloudAccountDialog: true }
  })
  const vm = wrapper.vm as any
  vm.item = { id: 'item', name: 'Part', setups: [setup] }
  vm.setup = setup
  return { wrapper, vm, router: { push } }
}

beforeEach(() => {
  mocks.rows = [row('active', true), row('other', false)]
  mocks.upload.mockClear(); mocks.download.mockClear(); mocks.start.mockClear()
})

describe('Print hand-off target safety', () => {
  it('disables upload and start for a non-active chosen printer', async () => {
    const { vm } = mount()
    vm.chosen = 'other'
    vm.uploadedPath = 'part.gcode'; vm.uploadedPrinterId = 'other'
    await Vue.nextTick()
    expect(vm.canUpload).toBe(false)
    expect(vm.canStart).toBe(false)
  })

  it('does not trust uploaded or printer query parameters and never starts on mount', async () => {
    const { vm } = mount({ uploaded: 'evil.gcode', printer: 'other' })
    await vm.load()
    expect(vm.uploadedPath).toBe('')
    expect(vm.canStart).toBe(false)
    expect(mocks.start).not.toHaveBeenCalled()
  })

  it('uploads and starts only while the chosen printer is active, and never starts after upload', async () => {
    const { vm } = mount()
    vm.chosen = 'active'
    await Vue.nextTick()
    await vm.upload()
    expect(mocks.upload).toHaveBeenCalledTimes(1)
    expect(mocks.start).not.toHaveBeenCalled()
    expect(vm.uploadedPrinterId).toBe('active')
    await vm.start()
    expect(mocks.start).toHaveBeenCalledWith('/printer/print/start', { filename: 'part.gcode' }, { timeout: 150000 })

    vm.chosen = 'other'
    await Vue.nextTick()
    await vm.upload()
    await vm.start()
    expect(mocks.upload).toHaveBeenCalledTimes(1)
    expect(mocks.start).toHaveBeenCalledTimes(1)
  })

  it('resets trusted upload state when the printer choice changes', async () => {
    const { vm } = mount()
    vm.chosen = 'active'; await Vue.nextTick()
    vm.uploadedPath = 'part.gcode'; vm.uploadedPrinterId = 'active'; vm.bytes = new Uint8Array([1])
    vm.chosen = 'other'; await Vue.nextTick()
    expect(vm.uploadedPath).toBe('')
    expect(vm.uploadedPrinterId).toBe('')
    expect(vm.bytes).toBeNull()
  })

  it('opens a non-active printer on the scoped hand-off with only hand-off identity state', async () => {
    const { vm, router } = mount({ library: 'item', version: '3', uploaded: 'evil.gcode' })
    vm.chosen = 'other'
    await vm.openSelected()
    expect(router.push).toHaveBeenCalledWith({ path: '/other-slug/print', query: { library: 'item', version: '3', printer: 'other' } })
  })
})
