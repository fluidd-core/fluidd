import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JobCard from '../JobCard.vue'

const job = {
  key: 'parts/cube.gcode',
  path: 'parts/cube.gcode',
  filename: 'cube.gcode',
  title: 'Cube',
  facts: '12 min · 3 g',
  printing: false,
  printed: false
}

describe('JobCard accessibility', () => {
  it.each(['pictures', 'list'])('uses sibling native controls in %s view', view => {
    const wrapper = shallowMount(JobCard, {
      propsData: { job, row: view === 'list' },
      stubs: ['frame-icon']
    })

    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    const open = wrapper.get('[data-tid="job-open-parts/cube.gcode"]')
    expect(open.element.tagName).toBe('BUTTON')
    expect(open.element.querySelector('button, a, input, select, textarea')).toBeNull()
    expect(wrapper.get('.job__actions').element.parentElement).toBe(open.element.parentElement)
  })

  it.each(['Enter', ' '])('opens from the native title/preview button with %j', async key => {
    const wrapper = shallowMount(JobCard, { propsData: { job }, stubs: ['frame-icon'] })
    await wrapper.get('[data-tid="job-open-parts/cube.gcode"]').trigger('keydown', { key })
    expect(wrapper.emitted('open')).toHaveLength(1)
  })
})
