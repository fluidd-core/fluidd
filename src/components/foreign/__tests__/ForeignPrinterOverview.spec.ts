import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import type { ForeignPrinterRecord } from '@/services/foreign-printers/types'
import { foreignRegistry, foreignSlug } from '@/services/foreign-printers/registry'
import { EventBus } from '@/eventBus'

const live = vi.hoisted(() => ({
  adapterFor: vi.fn(() => undefined),
  connectAll: vi.fn(async () => {}),
  forget: vi.fn(async () => {}),
  liveForeign: { records: [], status: {} }
}))

vi.mock('@/services/foreign-printers/live', () => live)

const { default: ForeignPrinterOverview } = await import('../ForeignPrinterOverview.vue')

const record: ForeignPrinterRecord = {
  id: 'test-printer',
  kind: 'octoprint',
  name: 'Garden Printer',
  host: '192.168.1.26',
  via: 'direct',
  formFactor: 'bed-slinger',
  credentialsRef: null,
  addedAt: 0
}

afterEach(() => {
  foreignRegistry.records.splice(0)
  live.forget.mockClear()
  live.connectAll.mockClear()
  live.liveForeign.status = {}
  vi.restoreAllMocks()
})

describe('ForeignPrinterOverview', () => {
  it('stops the printer that was confirmed even if selection changes while the dialog is open', async () => {
    const first = { stop: vi.fn(async () => {}) }
    const second = { stop: vi.fn(async () => {}) }
    let selected = first
    let approve!: (answer: boolean) => void
    const context = {
      get adapter () { return selected },
      $confirm: () => new Promise<boolean>(resolve => { approve = resolve }),
      runAction: async (action: () => Promise<void>) => action()
    }
    const stopped = (ForeignPrinterOverview as any).options.methods.stop.call(context)
    selected = second
    approve(true)
    await stopped
    expect(first.stop).toHaveBeenCalledOnce()
    expect(second.stop).not.toHaveBeenCalled()
  })

  it('forgets the confirmed printer even if another page opens during confirmation', async () => {
    let selected = record
    let approve!: (answer: boolean) => void
    const push = vi.fn(async () => {})
    const context = {
      get record () { return selected },
      $route: { params: { printer: foreignSlug(record) } },
      $router: { push },
      $confirm: () => new Promise<boolean>(resolve => { approve = resolve })
    }
    const forgotten = (ForeignPrinterOverview as any).options.methods.forgetPrinter.call(context)
    selected = { ...record, id: 'other', name: 'Other' }
    context.$route.params.printer = 'other-1234'
    approve(true)
    await forgotten
    expect(live.forget).toHaveBeenCalledWith(record.id)
    expect(push).not.toHaveBeenCalled()
  })

  it('asks before forgetting a saved printer and removes it after confirmation', async () => {
    foreignRegistry.records.push(record)
    const confirm = vi.fn(async () => true)
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter({
      mode: 'abstract',
      routes: [
        { path: '/', component: ForeignPrinterOverview },
        { path: '/:printer', component: ForeignPrinterOverview }
      ]
    })
    await router.push(`/${foreignSlug(record)}`)
    const wrapper = shallowMount(ForeignPrinterOverview, {
      localVue,
      router,
      mocks: { $confirm: confirm }
    })

    await wrapper.find('.cbtn--ghost').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(confirm).toHaveBeenCalledWith('Fluidd forgets this printer in this browser.', expect.objectContaining({
      title: 'Forget Garden Printer?',
      buttonTrueText: 'Forget'
    }))
    expect(live.forget).toHaveBeenCalledWith(record.id)
    expect(router.currentRoute.path).toBe('/')
    wrapper.destroy()
  })

  it('shows capability-based controls without an adapter and reports Not connected', async () => {
    foreignRegistry.records.push(record)
    Object.assign(live.liveForeign.status, {
      [record.id]: {
        state: 'printing',
        message: 'Printing',
        file: 'bracket.gcode',
        progress: 0.5,
        timeLeft: 60,
        temps: [],
        cameraUrl: null
      }
    })
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter({
      mode: 'abstract',
      routes: [
        { path: '/', component: ForeignPrinterOverview },
        { path: '/:printer', component: ForeignPrinterOverview }
      ]
    })
    await router.push(`/${foreignSlug(record)}`)
    const wrapper = shallowMount(ForeignPrinterOverview, {
      localVue,
      router,
      mocks: { $confirm: vi.fn(async () => true) }
    })
    const emit = vi.spyOn(EventBus, '$emit')

    expect(wrapper.text()).toContain('Pause')
    expect(wrapper.text()).toContain('Stop')
    await wrapper.find('.foreign-actions button').trigger('click')

    expect(emit).toHaveBeenCalledWith('Not connected', { type: 'error' })
    wrapper.destroy()
  })
})
