import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VueI18n from 'vue-i18n'
import Vue from 'vue'
import messages from '@/locales/en.yaml'
import PrintConfirmDialog, { ARM_DELAY_MS, type LoadedMaterial, type PrintConfirmRequest } from '../PrintConfirmDialog.vue'

Vue.use(VueI18n)

const i18n = new VueI18n({ locale: 'en', messages: { en: messages } })

/** Vuetify's dialog as a plain element: the dialog's own behaviour is what is tested. */
const stubs = {
  'v-dialog': { props: ['value'], template: '<div v-if="value" class="dialog"><slot /></div>' }
}

const start = (patch: Partial<PrintConfirmRequest> = {}): PrintConfirmRequest =>
  ({ printer: 'Walnut', paths: ['Benchy_0.2mm_PLA_1h12m.gcode'], mode: 'start', plateClear: 'not-needed', ...patch })

function open (request: PrintConfirmRequest | null, loaded: LoadedMaterial | null = null) {
  return mount(PrintConfirmDialog, { propsData: { request, loaded }, stubs, i18n, attachTo: document.body })
}

/** The dialog as the person sees it once Print has turned on. */
async function armed (request: PrintConfirmRequest | null) {
  const wrapper = open(request)
  vi.advanceTimersByTime(ARM_DELAY_MS)
  await wrapper.vm.$nextTick()
  return wrapper
}

const text = (wrapper: ReturnType<typeof open>, test: string) => wrapper.find(`[data-test="${test}"]`)

describe('PrintConfirmDialog', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('asks "Print ‹part› on ‹printer›?", with the file, the printer and the plates queued after it', async () => {
    const wrapper = await armed(start({ paths: ['Benchy_0.2mm_PLA_1h12m.gcode', 'b.gcode', 'c.gcode'] }))
    expect(wrapper.find('#slicer-confirm-title').text()).toBe('Print Benchy on Walnut?')
    expect(text(wrapper, 'slicer-confirm-file').text()).toBe('Benchy_0.2mm_PLA_1h12m.gcode')
    expect(text(wrapper, 'slicer-confirm-printer').text()).toBe('Walnut')
    expect(text(wrapper, 'slicer-confirm-more').text()).toBe('then 2 more, queued after it')
    expect(text(wrapper, 'slicer-confirm-print').text()).toBe('Print now')
    expect(text(wrapper, 'slicer-confirm-upload').text()).toBe('Save to the printer')
    expect(text(wrapper, 'slicer-confirm-plate').exists()).toBe(false)
    expect(text(wrapper, 'slicer-confirm-plate-not-needed').text()).toContain('left nothing on the plate')
    await text(wrapper, 'slicer-confirm-print').trigger('click')
    expect(wrapper.emitted('answer')).toEqual([[{ choice: 'print', plateClear: false }]])
    wrapper.destroy()
  })

  it('in queue mode asks "Queue ‹part› on ‹printer›?" and never the plate check', () => {
    const wrapper = open(start({ mode: 'queue', paths: ['Benchy_0.2mm_PLA_1h12m.gcode', 'b.gcode'], plateClear: 'ask' }))
    expect(wrapper.find('#slicer-confirm-title').text()).toBe('Queue Benchy on Walnut?')
    expect(text(wrapper, 'slicer-confirm-more').text()).toBe('and 1 more after it')
    expect(text(wrapper, 'slicer-confirm-print').text()).toBe('Add to the queue')
    expect(text(wrapper, 'slicer-confirm-plate').exists()).toBe(false)
    expect(text(wrapper, 'slicer-confirm-plate-not-needed').exists()).toBe(false)
    wrapper.destroy()
  })

  it('keeps Print off until the plate check is ticked, when the host asks it, and says why', async () => {
    const wrapper = await armed(start({ plateClear: 'ask' }))
    const print = text(wrapper, 'slicer-confirm-print')
    expect(text(wrapper, 'slicer-confirm-plate').text()).toContain('The plate is clear')
    expect(wrapper.text()).toContain('The M1 prints upside down onto its plate')
    expect(wrapper.text()).toContain('the print crashes into it')
    expect(print.attributes('disabled')).toBe('disabled')
    ;(wrapper.vm as any).answer({ choice: 'print', plateClear: false })
    expect(wrapper.emitted('answer')).toBeUndefined()
    await wrapper.find('input[type="checkbox"]').setChecked(true)
    expect(print.attributes('disabled')).toBeUndefined()
    await print.trigger('click')
    expect(wrapper.emitted('answer')).toEqual([[{ choice: 'print', plateClear: true }]])
    wrapper.destroy()
  })

  it('turns Print off again when the plate check is unticked', async () => {
    const wrapper = await armed(start({ plateClear: 'ask' }))
    const print = text(wrapper, 'slicer-confirm-print')
    const box = wrapper.find('input[type="checkbox"]')
    await box.setChecked(true)
    expect(print.attributes('disabled')).toBeUndefined()
    await box.setChecked(false)
    expect(print.attributes('disabled')).toBe('disabled')
    await print.trigger('click')
    expect(wrapper.emitted('answer')).toBeUndefined()
    wrapper.destroy()
  })

  it.each([
    ['Save to the printer', (w: ReturnType<typeof open>) => text(w, 'slicer-confirm-upload').trigger('click')],
    ['its ✕', (w: ReturnType<typeof open>) => text(w, 'slicer-confirm-close').trigger('click')],
    ['Esc or a click outside (the dialog closes itself)', (w: ReturnType<typeof open>) => (w.vm as any).handleInput(false)]
  ])('%s answers Upload only, once', async (_how, close) => {
    const wrapper = await armed(start())
    await close(wrapper)
    await text(wrapper, 'slicer-confirm-print').trigger('click')
    expect(wrapper.emitted('answer')).toEqual([[{ choice: 'upload-only' }]])
    wrapper.destroy()
  })

  it('answers Upload only when Vuetify closes it (Esc, a click outside), through the shell', async () => {
    const wrapper = await armed(start({ plateClear: 'ask' }))
    wrapper.findComponent({ name: 'M3Dialog' }).vm.$emit('close')
    expect(wrapper.emitted('answer')).toEqual([[{ choice: 'upload-only' }]])
    wrapper.destroy()
  })

  it('starts with the focus on its title, never on Print, and a new request starts unticked', async () => {
    const wrapper = open(start({ plateClear: 'ask' }))
    await wrapper.vm.$nextTick()
    expect(document.activeElement?.id).toBe('slicer-confirm-title')
    expect(document.activeElement).not.toBe(text(wrapper, 'slicer-confirm-print').element)
    await wrapper.find('input[type="checkbox"]').setChecked(true)
    await wrapper.setProps({ request: start({ plateClear: 'ask', paths: ['next.gcode'] }) })
    expect((wrapper.vm as any).plateClear).toBe(false)
    expect((wrapper.find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(false)
    await wrapper.vm.$nextTick()
    expect(document.activeElement?.id).toBe('slicer-confirm-title')
    wrapper.destroy()
  })

  it('keeps Print off for a moment after it shows, after each new request and after the window regains the focus', async () => {
    const wrapper = open(start())
    const print = text(wrapper, 'slicer-confirm-print')
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBe('disabled')
    await print.trigger('click')
    ;(wrapper.vm as any).answer({ choice: 'print', plateClear: false })
    expect(wrapper.emitted('answer')).toBeUndefined()
    vi.advanceTimersByTime(ARM_DELAY_MS - 1)
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBe('disabled')
    vi.advanceTimersByTime(1)
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBeUndefined()

    // A new request starts the wait again.
    await wrapper.setProps({ request: start({ paths: ['next.gcode'] }) })
    expect(print.attributes('disabled')).toBe('disabled')
    vi.advanceTimersByTime(ARM_DELAY_MS)
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBeUndefined()

    // The window lost the focus (to another window, or the frame) and got it back: the wait starts again.
    window.dispatchEvent(new Event('blur'))
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBe('disabled')
    window.dispatchEvent(new Event('focus'))
    vi.advanceTimersByTime(ARM_DELAY_MS - 1)
    await print.trigger('click')
    expect(wrapper.emitted('answer')).toBeUndefined()
    vi.advanceTimersByTime(1)
    await wrapper.vm.$nextTick()
    await print.trigger('click')
    expect(wrapper.emitted('answer')).toEqual([[{ choice: 'print', plateClear: false }]])
    wrapper.destroy()
  })

  it('still waits out the moment after it shows when the plate check is ticked at once', async () => {
    const wrapper = open(start({ plateClear: 'ask' }))
    await wrapper.find('input[type="checkbox"]').setChecked(true)
    const print = text(wrapper, 'slicer-confirm-print')
    expect(print.attributes('disabled')).toBe('disabled')
    await print.trigger('click')
    expect(wrapper.emitted('answer')).toBeUndefined()
    vi.advanceTimersByTime(ARM_DELAY_MS)
    await wrapper.vm.$nextTick()
    expect(print.attributes('disabled')).toBeUndefined()
    wrapper.destroy()
  })

  it('shows what the printer has loaded, when Fluidd knows it', () => {
    const wrapper = open(start(), { name: 'PLA', colour: '#E8A53B' })
    expect(text(wrapper, 'slicer-confirm-loaded').text()).toBe('PLA')
    wrapper.destroy()
    const unknown = open(start())
    expect(text(unknown, 'slicer-confirm-loaded').exists()).toBe(false)
    unknown.destroy()
  })

  it('shows a file name as text', () => {
    const wrapper = open(start({ paths: ['<img src=x onerror=alert(1)>.gcode'] }))
    expect(wrapper.find('img').exists()).toBe(false)
    expect(text(wrapper, 'slicer-confirm-file').text()).toBe('<img src=x onerror=alert(1)>.gcode')
    expect(wrapper.find('#slicer-confirm-title').text()).toBe('Print <img src=x onerror=alert(1)> on Walnut?')
    wrapper.destroy()
  })

  it('shows nothing with no request', () => {
    const wrapper = open(null)
    expect(wrapper.find('.dialog').exists()).toBe(false)
    wrapper.destroy()
  })

  it('answers nothing once the request has gone, while it closes', async () => {
    const wrapper = await armed(start())
    await wrapper.setProps({ request: null })
    ;(wrapper.vm as any).answer({ choice: 'upload-only' })
    ;(wrapper.vm as any).answer({ choice: 'print', plateClear: true })
    expect(wrapper.emitted('answer')).toBeUndefined()
    wrapper.destroy()
  })
})
