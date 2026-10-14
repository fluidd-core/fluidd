import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ForeignCamera from '../ForeignCamera.vue'

describe('published camera URLs', () => {
  it('keeps the published URL available when a browser stream fails', async () => {
    const url = 'http://127.0.0.1/webcam/stream'
    const wrapper = shallowMount(ForeignCamera, { propsData: { url } })
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('a').exists()).toBe(true)
    expect(wrapper.find('a').attributes('href')).toBe(url)
    wrapper.destroy()
  })

  it('shows a local RTSP URL for a camera player without trying to load it as an image', () => {
    const url = 'rtsp://192.168.1.25:8554/live'
    const wrapper = shallowMount(ForeignCamera, { propsData: { url } })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('a').attributes('href')).toBe(url)
    expect(wrapper.text()).toContain('camera player')
    wrapper.destroy()
  })
})
