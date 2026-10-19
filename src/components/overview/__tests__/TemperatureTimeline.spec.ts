import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import TemperatureTimeline from '../TemperatureTimeline.vue'

it('scrubs real history by keyboard, phone input and pointer with exact readings and visible gaps', async () => {
  const wrapper = mount(TemperatureTimeline, { propsData: { points: [{ date: new Date(8000), extruder: 214.85, extruderTarget: 215 }, { date: new Date(9000), extruder: 215.1, extruderTarget: 215 }], sensors: [{ key: 'extruder', label: 'Nozzle', color: '#ff8c42' }], now: 10000, start: 1000, events: [{ at: 9000, label: 'Paused' }], eventStart: 7000 } })
  expect(wrapper.text()).toContain('Recorded history starts')
  const marker = wrapper.find('[data-marker="Paused"]')
  expect(marker.exists()).toBe(true)
  expect(Number(marker.attributes('x1'))).toBeCloseTo(533.333, 2)
  const range = wrapper.find('input[type="range"]')
  await range.setValue('1000')
  expect(wrapper.text()).toContain('No recorded sample')
  await range.trigger('keydown', { key: 'End' })
  await range.trigger('keydown', { key: 'ArrowLeft' })
  expect(wrapper.text()).toContain('215.1°')
  await range.setValue('8000')
  expect(wrapper.text()).toContain('214.85°')
  expect(wrapper.text()).toContain('target 215.0°')
  const chart = wrapper.find('svg')
  Object.defineProperty(chart.element, 'getBoundingClientRect', { value: () => ({ left: 0, width: 100 }) })
  await chart.trigger('pointerdown', { clientX: 0, pointerId: 1 })
  expect(wrapper.text()).toContain('No recorded sample')
  await wrapper.find('[data-event="Paused"]').trigger('click')
  expect(wrapper.text()).toContain('215.1°')
  expect(wrapper.text()).toContain('approximate')
  wrapper.destroy()
})

it('keeps the second recorded decimal in an exact temperature reading', async () => {
  const wrapper = mount(TemperatureTimeline, { propsData: { points: [{ date: new Date(8000), extruder: 214.85 }], sensors: [{ key: 'extruder', label: 'Nozzle', color: '#ff8c42' }], now: 10000, start: 1000 } })
  await wrapper.find('input[type="range"]').setValue('8000')
  expect(wrapper.text()).toContain('214.85°')
  wrapper.destroy()
})

it('reports a non-finite hovered reading as missing and never puts it in an SVG path', async () => {
  const wrapper = mount(TemperatureTimeline, { propsData: { points: [{ date: new Date(7000), extruder: 214 }, { date: new Date(8000), extruder: NaN, extruderTarget: 215 }, { date: new Date(9000), extruder: Infinity }, { date: new Date(10000), extruder: null }], sensors: [{ key: 'extruder', label: 'Nozzle', color: '#ff8c42' }], now: 10000, start: 1000 } })

  await wrapper.find('input[type="range"]').setValue('8000')
  expect(wrapper.text()).toContain('Nozzle unrecorded')
  expect(wrapper.text()).not.toContain('NaN')
  expect(wrapper.findAll('path').wrappers.every(path => !/NaN|Infinity/.test(path.attributes('d') ?? ''))).toBe(true)
  wrapper.destroy()
})

it('shows the graph around older retained history selected with the phone time control', async () => {
  const wrapper = mount(TemperatureTimeline, { propsData: { points: [{ date: new Date(6300000), extruder: 200 }, { date: new Date(7200000), extruder: 201 }], sensors: [{ key: 'extruder', label: 'Nozzle', color: '#ff8c42' }], now: 7200000, start: 0, windowSeconds: 300 } })
  await wrapper.find('input[type="range"]').setValue('6300000')
  expect(wrapper.find('path').attributes('d')).toMatch(/^M300\.0 /)
  expect(wrapper.text()).toContain('200.0°')
  wrapper.destroy()
})

it('renders an accessible track segment for a gap in the middle of history', () => {
  const wrapper = mount(TemperatureTimeline, { propsData: { points: [{ date: new Date(1000), extruder: 200 }, { date: new Date(2000), extruder: 201 }, { date: new Date(6000), extruder: 202 }], sensors: [{ key: 'extruder', label: 'Nozzle', color: '#ff8c42' }], now: 7000, start: 0 } })
  const gaps = wrapper.findAll('[data-gap]')
  expect((wrapper.vm as any).gaps).toEqual([{ from: 0, to: 500 }, { from: 2500, to: 5500 }])
  expect(gaps.length).toBe(2)
  expect(gaps.wrappers.some(gap => gap.attributes('aria-label')?.includes('missing'))).toBe(true)
  wrapper.destroy()
})
