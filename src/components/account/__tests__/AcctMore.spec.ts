import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AcctMore from '../AcctMore.vue'

function open () {
  return mount(AcctMore, {
    propsData: { label: 'About recovery codes' },
    slots: { default: 'Each works once.' },
    stubs: { 'frame-icon': true },
    attachTo: document.body
  })
}

describe('the details behind a short label', () => {
  it('keeps the details one click away, named for screen readers', async () => {
    const w = open()
    const toggle = w.find('[data-tid="acct-more"]')
    expect(w.text()).not.toContain('Each works once.')
    expect(toggle.text()).toContain('About recovery codes')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(w.text()).toContain('Each works once.')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.attributes('aria-controls')).toBe(w.find('[role="note"]').attributes('id'))
    w.destroy()
  })

  it('closes on Escape and on a click anywhere else', async () => {
    const w = open()
    await w.find('[data-tid="acct-more"]').trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await w.vm.$nextTick()
    expect(w.find('[role="note"]').exists()).toBe(false)

    await w.find('[data-tid="acct-more"]').trigger('click')
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await w.vm.$nextTick()
    expect(w.find('[role="note"]').exists()).toBe(false)
    w.destroy()
  })

  it('closes when focus moves on to something else', async () => {
    const w = open()
    const elsewhere = document.createElement('button')
    document.body.appendChild(elsewhere)
    await w.find('[data-tid="acct-more"]').trigger('click')
    await w.find('[data-tid="acct-more"]').trigger('focusout', { relatedTarget: elsewhere })
    expect(w.find('[role="note"]').exists()).toBe(false)
    elsewhere.remove()
    w.destroy()
  })
})
