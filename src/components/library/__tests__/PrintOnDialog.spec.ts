import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import VueI18n from 'vue-i18n'
import Vue from 'vue'
import messages from '@/locales/en.yaml'
import PrintOnDialog from '../PrintOnDialog.vue'
import type { TargetRow } from '@/services/library/print-targets'
import type { ItemSetup } from '@/services/library/api'

const sendToPrinter = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/services/library/print-on', async (actual) => ({ ...(await actual() as object), sendToPrinter }))

Vue.use(VueI18n)
const i18n = new VueI18n({ locale: 'en', messages: { en: messages } })

const setup: ItemSetup = { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA', print_seconds: 600, filament_g: 3, file_id: 'f' }

function row (over: Partial<TargetRow>): TargetRow {
  return {
    id: 'h',
    name: 'Hazel',
    slug: 'hazel-52be',
    active: true,
    fit: { kind: 'ready', setup },
    status: 'Ready',
    detail: 'PLA loaded · 0.4 mm nozzle. Sliced for exactly this.',
    note: '10m · 3 g',
    action: 'print',
    reslice: '',
    tone: 'ok',
    ...over
  }
}

function open (rows: TargetRow[]) {
  return mount(PrintOnDialog, {
    propsData: { item: { id: 'item-1', name: 'Hinge bracket', setups: [setup], versioned: true, version: 1 } },
    computed: { rows: () => rows },
    mocks: {
      $store: { state: { config: { apiUrl: '', instances: [] }, printer: { printer: {} } }, getters: {} }
    },
    stubs: {
      'v-dialog': { props: ['value'], template: '<div v-if="value" class="dialog"><slot /></div>' },
      'printer-thumb': true,
      'v-progress-circular': true
    },
    i18n,
    attachTo: document.body
  })
}

const tid = (wrapper: ReturnType<typeof open>, id: string) => wrapper.find(`[data-tid="${id}"]`)

describe('Print on…', () => {
  it('starts nothing until the plate check is ticked, then prints on the chosen printer', async () => {
    const wrapper = open([row({})])
    const print = tid(wrapper, 'print-on-print')
    expect(print.text()).toBe('Print now')
    expect(print.attributes('disabled')).toBe('disabled')
    await print.trigger('click')
    expect(sendToPrinter).not.toHaveBeenCalled()

    await wrapper.find('[data-tid="print-on-plate"] input').setChecked(true)
    expect(tid(wrapper, 'print-on-print').attributes('disabled')).toBeUndefined()
    await tid(wrapper, 'print-on-print').trigger('click')
    expect(sendToPrinter).toHaveBeenCalledWith(expect.objectContaining({ mode: 'print', setup, target: expect.objectContaining({ id: 'h' }) }))
    wrapper.destroy()
  })

  it('queues on a busy printer without the plate check: its queue waits for a clear plate', async () => {
    sendToPrinter.mockClear()
    const wrapper = open([row({ action: 'queue', status: 'Queue', tone: 'run' })])
    expect(tid(wrapper, 'print-on-plate').exists()).toBe(false)
    expect(tid(wrapper, 'print-on-print').text()).toBe('Add to queue')
    await tid(wrapper, 'print-on-print').trigger('click')
    expect(sendToPrinter).toHaveBeenCalledWith(expect.objectContaining({ mode: 'queue' }))
    wrapper.destroy()
  })

  it('chooses no printer the print does not fit, and offers Re-slice there instead', async () => {
    sendToPrinter.mockClear()
    const wrapper = open([row({ fit: { kind: 'material', setup, loaded: 'PETG' }, action: 'reslice', reslice: 'Re-slice for PETG', tone: 'warn', status: '' })])
    const reslice = vi.fn()
    ;(wrapper.vm as any).reslice = reslice
    expect(tid(wrapper, 'print-on-print').attributes('disabled')).toBe('disabled')
    expect(tid(wrapper, 'print-on-save').attributes('disabled')).toBe('disabled')
    await tid(wrapper, 'print-on-reslice').trigger('click')
    expect(reslice).toHaveBeenCalledWith(expect.objectContaining({ slug: 'hazel-52be', reslice: 'Re-slice for PETG' }))
    expect(sendToPrinter).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('saves to the printer without asking the plate check: nothing starts', async () => {
    sendToPrinter.mockClear()
    const wrapper = open([row({})])
    await tid(wrapper, 'print-on-save').trigger('click')
    expect(sendToPrinter).toHaveBeenCalledWith(expect.objectContaining({ mode: 'save' }))
    wrapper.destroy()
  })
})
