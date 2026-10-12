import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import type { ForeignPrinterRecord } from '@/services/foreign-printers/types'
import { foreignRegistry, foreignSlug } from '@/services/foreign-printers/registry'

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
})

describe('ForeignPrinterOverview', () => {
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

    await wrapper.find('.btn--ghost').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(confirm).toHaveBeenCalledWith('Fluidd forgets this printer in this browser.', expect.objectContaining({
      title: 'Forget Garden Printer?',
      buttonTrueText: 'Forget'
    }))
    expect(live.forget).toHaveBeenCalledWith(record.id)
    expect(router.currentRoute.path).toBe('/')
    wrapper.destroy()
  })
})
