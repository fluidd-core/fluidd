import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VueI18n from 'vue-i18n'
import Vue from 'vue'
import messages from '@/locales/en.yaml'
import M3Confirm, { CLOSE_MS } from '../M3Confirm.vue'

Vue.use(VueI18n)

const i18n = new VueI18n({ locale: 'en', messages: { en: messages } })

/** Vuetify's dialog as a plain element. */
const stubs = {
  'v-dialog': { props: ['value'], template: '<div v-if="value" class="dialog"><slot /></div>' }
}

function ask (props: Record<string, unknown> = {}) {
  return mount(M3Confirm, {
    propsData: { message: 'It goes from Walnut. This can\'t be undone.', ...props },
    stubs,
    i18n,
    attachTo: document.body
  })
}

const tid = (wrapper: ReturnType<typeof ask>, id: string) => wrapper.find(`[data-tid="${id}"]`)

describe('M3Confirm', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('asks the question, says what happens, and labels the buttons with what they do', () => {
    const wrapper = ask({ title: 'Delete Benchy?', buttonTrueText: 'Delete', buttonFalseText: 'Keep it', danger: true })
    expect(wrapper.find('.m3-dlg__title').text()).toBe('Delete Benchy?')
    expect(tid(wrapper, 'confirm-message').text()).toBe('It goes from Walnut. This can\'t be undone.')
    expect(tid(wrapper, 'confirm-ok').text()).toBe('Delete')
    expect(tid(wrapper, 'confirm-ok').classes()).toContain('cbtn--danger')
    expect(tid(wrapper, 'confirm-cancel').text()).toBe('Keep it')
    wrapper.destroy()
  })

  it('says Continue and Cancel when a caller names no buttons, and its button is the accent one', () => {
    const wrapper = ask()
    expect(tid(wrapper, 'confirm-ok').text()).toBe('Continue')
    expect(tid(wrapper, 'confirm-ok').classes()).toContain('cbtn--primary')
    expect(tid(wrapper, 'confirm-cancel').text()).toBe('Cancel')
    wrapper.destroy()
  })

  it('shows the message as text, never HTML', () => {
    const wrapper = ask({ message: 'Delete <img src=x onerror=alert(1)>.gcode?' })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(tid(wrapper, 'confirm-message').text()).toBe('Delete <img src=x onerror=alert(1)>.gcode?')
    wrapper.destroy()
  })

  it('answers yes once it has closed, and only once', async () => {
    const wrapper = ask({ buttonTrueText: 'Delete' })
    await tid(wrapper, 'confirm-ok').trigger('click')
    // A second answer while it closes (Esc, a click outside) changes nothing.
    ;(wrapper.vm as any).choose(false)
    expect(wrapper.emitted('result')).toBeUndefined()
    vi.advanceTimersByTime(CLOSE_MS)
    expect(wrapper.emitted('result')).toEqual([[true]])
    wrapper.destroy()
  })

  it.each([
    ['Cancel', (w: ReturnType<typeof ask>) => tid(w, 'confirm-cancel').trigger('click')],
    ['its ✕', (w: ReturnType<typeof ask>) => tid(w, 'm3-dlg-close').trigger('click')],
    ['Esc or a click outside', (w: ReturnType<typeof ask>) => { w.findComponent({ name: 'M3Dialog' }).vm.$emit('close') }]
  ])('%s answers no', async (_how, close) => {
    const wrapper = ask()
    await close(wrapper)
    vi.advanceTimersByTime(CLOSE_MS)
    expect(wrapper.emitted('result')).toEqual([[false]])
    wrapper.destroy()
  })

  it('starts with the focus on the question, not on a button', async () => {
    const wrapper = ask({ title: 'Stop the printer now?' })
    await wrapper.vm.$nextTick()
    expect(document.activeElement?.classList.contains('m3-dlg__title')).toBe(true)
    wrapper.destroy()
  })

  it('with the plate check, keeps its button off until the plate is ticked clear', async () => {
    const wrapper = ask({ title: 'Print Benchy on Walnut?', buttonTrueText: 'Print now', plateCheck: true })
    const ok = tid(wrapper, 'confirm-ok')
    expect(wrapper.text()).toContain('The M1 prints upside down onto its plate')
    expect(ok.attributes('disabled')).toBe('disabled')
    ;(wrapper.vm as any).choose(true)
    vi.advanceTimersByTime(CLOSE_MS)
    expect(wrapper.emitted('result')).toBeUndefined()
    await wrapper.find('input[type="checkbox"]').setChecked(true)
    expect(ok.attributes('disabled')).toBeUndefined()
    await ok.trigger('click')
    vi.advanceTimersByTime(CLOSE_MS)
    expect(wrapper.emitted('result')).toEqual([[true]])
    wrapper.destroy()
  })

  it('without the plate check, never shows it', () => {
    const wrapper = ask()
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    wrapper.destroy()
  })
})
