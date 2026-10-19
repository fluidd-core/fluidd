import { mount, shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import JobDetail from '@/components/jobs/JobDetail.vue'
import OverviewLiveTune from '@/components/overview/OverviewLiveTune.vue'
import RangeSlider from '../RangeSlider.vue'
import rangeSliderSource from '../RangeSlider.vue?raw'
import ControlFans from '../ControlFans.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

describe('RangeSlider accessibility', () => {
  it('uses the caller formatter for its human-facing value', async () => {
    const wrapper = mount(RangeSlider, {
      propsData: { value: 50, valueTextFormatter: (value: number) => `${value} percent` }
    })
    expect(wrapper.attributes('aria-valuetext')).toBe('50 percent')
    await wrapper.find('input').setValue('75')
    expect(wrapper.attributes('aria-valuetext')).toBe('75 percent')
    wrapper.destroy()
  })

  it('mounts with a 24px interactive box and 24px thumbs while retaining a 4px track', () => {
    const wrapper = mount(RangeSlider, { attachTo: document.body })
    const input = wrapper.element as HTMLInputElement
    expect(getComputedStyle(input).height).toBe('24px')
    expect(rangeSliderSource).toMatch(/background-size:\s*100% 4px/)
    expect(rangeSliderSource.match(/(?:-webkit-slider-thumb|-moz-range-thumb)[^{]*\{[^}]*width:\s*24px;[^}]*height:\s*24px;/g)).toHaveLength(2)
    wrapper.destroy()
  })
})

describe('RangeSlider callers', () => {
  it('announces fan and light values as percentages', async () => {
    const store = panelStore()
    store.getters['printer/getAllFans'] = [{ key: 'fan', name: 'fan', prettyName: 'Part fan', type: 'fan', speed: 0.5 }]
    store.getters['printer/getPins'] = [{ key: 'output_pin caselight', name: 'caselight', prettyName: 'Lights', controllable: true, pwm: true, value: 0.25 }]
    const wrapper = mount(ControlFans, { mocks: { $store: store, $waits: waits }, stubs: panelStubs })
    await wrapper.find('#fans\\.all-trigger').trigger('click')
    const values = wrapper.findAll('input[type="range"]').wrappers.map(slider => slider.attributes('aria-valuetext'))
    expect(values).toEqual(['50 percent', '25 percent'])
    wrapper.destroy()
  })

  it('announces the live-tune fan as a percentage', () => {
    const store = panelStore()
    store.getters['printer/getAllFans'] = [{ key: 'fan', name: 'fan', prettyName: 'Part fan', type: 'fan', speed: 0.5 }]
    const wrapper = shallowMount(OverviewLiveTune, {
      mocks: { $store: store, $waits: waits },
      stubs: { RangeSlider }
    })
    expect(wrapper.find('input[type="range"]').attributes('aria-valuetext')).toBe('50 percent')
    wrapper.destroy()
  })

  it('announces one-based job layers and their total', () => {
    const wrapper = shallowMount(JobDetail, {
      propsData: { job: { filename: 'cube.gcode', path: 'cube.gcode' } },
      data: () => ({ view: 'layers', layer: 0 }),
      computed: { layerCount: () => 120, parsing: () => false, previewLoaded: () => true, isMobileViewport: () => false },
      mocks: { $store: { state: { gcodePreview: {} }, getters: {} } },
      stubs: { RangeSlider }
    })
    expect(wrapper.find('input[type="range"]').attributes('aria-valuetext')).toBe('Layer 1 of 120')
    wrapper.destroy()
  })
})
