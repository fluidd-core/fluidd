import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import OverviewCards from '../OverviewCards.vue'

it('reorders selected cards, resets the personal override and explains unavailable cards', async () => {
  const wrapper = mount(OverviewCards, { propsData: { value: ['console', 'queue'], unavailable: { camera: 'No camera is configured.' } } })
  expect(wrapper.text()).toContain('M1 and this print')
  expect(wrapper.find('[data-card="stage"] input').exists()).toBe(false)
  expect(wrapper.find('[data-card="camera"] input').attributes('disabled')).toBeDefined()
  expect(wrapper.text()).toContain('No camera is configured.')
  await wrapper.find('[aria-label="Move Up next up"]').trigger('click')
  expect(wrapper.emitted('input')?.at(-1)).toEqual([['queue', 'console']])
  await wrapper.find('[data-card="bed"] input').setChecked(true)
  expect(wrapper.emitted('input')?.at(-1)).toEqual([['console', 'queue', 'bed']])
  await wrapper.find('[data-tid="overview-reset"]').trigger('click')
  expect(wrapper.emitted('input')?.at(-1)).toEqual([null])
  wrapper.destroy()
})
