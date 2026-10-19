import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TaskFold from '../TaskFold.vue'

describe('task folds', () => {
  it('names its task, connects the button to its hidden panel and updates its live summary', async () => {
    const w = mount(TaskFold, { propsData: { foldId: 'heat-extra', title: 'Other temperatures', summary: 'CPU 52 degrees' } })
    const button = w.find('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe('heat-extra')
    expect(w.find('#heat-extra').isVisible()).toBe(false)
    expect(button.text()).toContain('Other temperatures')
    expect(button.text()).toContain('CPU 52 degrees')
    await w.setProps({ summary: 'CPU 54 degrees' })
    expect(button.text()).toContain('CPU 54 degrees')
    await button.trigger('click')
    expect(w.emitted('input')).toEqual([[true]])
    await w.setProps({ value: true })
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(w.find('#heat-extra').isVisible()).toBe(true)
    expect(w.find('#heat-extra').attributes('aria-labelledby')).toBe(button.attributes('id'))
    w.destroy()
  })

  it('operates two folds independently and returns focus to the trigger when a focused panel closes', async () => {
    const Host = Vue.extend({
      data: () => ({ heat: false, fans: false }),
      render (h) {
        return h('div', [
          h(TaskFold, { props: { foldId: 'heat', title: 'Other temperatures', summary: '5 sensors', value: this.heat }, on: { input: (open: boolean) => { this.heat = open } } }, [h('input')]),
          h(TaskFold, { props: { foldId: 'fans', title: 'All fans', summary: '3 running', value: this.fans }, on: { input: (open: boolean) => { this.fans = open } } })
        ])
      }
    })
    const w = mount(Host, { attachTo: document.body })
    await w.findAll('button').at(0).trigger('click')
    expect(w.findAll('button').at(0).attributes('aria-expanded')).toBe('true')
    expect(w.findAll('button').at(1).attributes('aria-expanded')).toBe('false')
    const input = w.find('input').element as HTMLInputElement
    input.focus()
    await w.setData({ heat: false })
    expect(document.activeElement).toBe(w.findAll('button').at(0).element)
    w.destroy()
  })
})
