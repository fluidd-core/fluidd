import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vue, { type CreateElement } from 'vue'
import VueRouter from 'vue-router'
import type { ForeignPrinterRecord } from '@/services/foreign-printers/types'
import store from '@/store'

const live = vi.hoisted(() => ({
  liveForeign: { records: [], status: {} },
  loadForeign: vi.fn(async () => {}),
  connectAll: vi.fn(async () => {}),
  forget: vi.fn(async () => {})
}))
vi.mock('@/services/foreign-printers/live', () => live)

const { default: Printers } = await import('../Printers.vue')

const record: ForeignPrinterRecord = {
  id: 'foreign-forget-test',
  kind: 'octoprint',
  name: 'Garden Printer',
  host: '192.168.1.26',
  via: 'direct',
  formFactor: 'bed-slinger',
  credentialsRef: null,
  addedAt: 0
}

afterEach(() => {
  live.forget.mockClear()
})

describe('Printers foreign cards', () => {
  it('forgets a printer from its card menu after confirmation', async () => {
    const confirm = vi.fn(async () => true)
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter({ mode: 'abstract', routes: [] })
    const tile = {
      key: `foreign:${record.id}`,
      name: record.name,
      label: 'Ready',
      tone: 'off',
      entry: { key: `foreign:${record.id}`, name: record.name, foreign: { record, status: null } }
    }
    const menuStub = {
      render (this: Vue, h: CreateElement) {
        return h('div', [
          this.$scopedSlots.activator?.({ attrs: {}, on: {} }),
          ...(this.$slots.default ?? [])
        ])
      }
    }
    const wrapper = shallowMount(Printers, {
      localVue,
      router,
      computed: {
        page: () => ({ welcome: false, other: [tile], offline: [], groups: [], found: [], cloud: [], local: [], printingNow: [], counts: { printers: 0, printing: 0, ready: 0, needsYou: 0, offline: 0, found: 0 } }),
        isMobileViewport: () => false,
        perRow: () => 2
      },
      mocks: { $confirm: confirm, $store: store, $vuetify: { breakpoint: { mobile: false } } },
      stubs: {
        'v-menu': menuStub,
        'v-list': { template: '<div><slot /></div>' },
        'v-list-item': {
          render (this: Vue, h: CreateElement) {
            return h('button', { on: { click: (event: Event) => this.$emit('click', event) } }, this.$slots.default)
          }
        },
        'v-list-item-title': { template: '<span><slot /></span>' }
      }
    })

    const forgetItem = wrapper.findAll('button').wrappers.find(button => button.text().trim() === 'Forget')
    expect(forgetItem).toBeDefined()
    await forgetItem!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(confirm).toHaveBeenCalled()
    expect(live.forget).toHaveBeenCalledWith(record.id)
    wrapper.destroy()
  })
})
