import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import M3Toast from '../M3Toast.vue'

function toast (props: Record<string, unknown> = {}) {
  return mount(M3Toast, {
    propsData: { value: true, ...props },
    slots: { default: 'Benchy is uploaded to Jobs' },
    stubs: { transition: false }
  })
}

describe('M3Toast', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('says its message, with the tone and ✕', () => {
    const wrapper = toast({ tone: 'error' })
    expect(wrapper.text()).toContain('Benchy is uploaded to Jobs')
    expect(wrapper.classes()).toContain('m3-toast--error')
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.find('[data-tid="toast-close"]').exists()).toBe(true)
  })

  it('closes itself after its time, and ✕ closes it at once', async () => {
    const wrapper = toast({ timeout: 4000 })
    vi.advanceTimersByTime(3999)
    expect(wrapper.emitted('input')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(wrapper.emitted('input')).toEqual([[false]])
    const other = toast()
    await other.find('[data-tid="toast-close"]').trigger('click')
    expect(other.emitted('input')).toEqual([[false]])
  })

  it('waits to be closed with no time, and starts the time again for a new message', async () => {
    const stays = toast({ timeout: -1 })
    vi.advanceTimersByTime(60_000)
    expect(stays.emitted('input')).toBeUndefined()

    const wrapper = toast({ timeout: 4000, stamp: 'first' })
    vi.advanceTimersByTime(3000)
    await wrapper.setProps({ stamp: 'second' })
    vi.advanceTimersByTime(3000)
    expect(wrapper.emitted('input')).toBeUndefined()
    vi.advanceTimersByTime(1000)
    expect(wrapper.emitted('input')).toEqual([[false]])
  })

  it('shows nothing while closed', () => {
    const wrapper = toast({ value: false })
    expect(wrapper.find('.m3-toast').exists()).toBe(false)
  })
})
