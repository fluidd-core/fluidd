/**
 * @vitest-environment jsdom
 */
import { mount } from '@vue/test-utils'
import Vue from 'vue'
import Vuetify, { VSlider } from 'vuetify/lib'
import { installSliderDragGuard } from '../sliderDragGuard'

// Components are resolved at build time by unplugin-vue-components, so the spec
// registers the one it mounts instead of relying on the Vuetify preset.
Vue.use(Vuetify)
Vue.component('VSlider', VSlider)

const rect = (width: number) =>
  ({
    left: 0,
    right: width,
    width,
    top: 0,
    bottom: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON() {}
  }) as DOMRect

const mouseEvent = (type: string, buttons: number, clientX: number) =>
  new MouseEvent(type, { bubbles: true, buttons, clientX, cancelable: true })

/**
 * Mounts a slider under a [data-app] element, which is where VSlider listens for
 * the mouseup and mousemove events of a drag.
 */
const mountSlider = (value: number) => {
  document.body.innerHTML = '<div data-app id="app"><div id="host"></div></div>'

  const vuetify = new Vuetify()
  const wrapper = mount(
    Vue.extend({
      components: { VSlider },
      template: '<v-slider v-model="v" :min="0" :max="100" />',
      data: () => ({ v: value })
    }),
    { attachTo: document.querySelector('#host') as HTMLElement, vuetify }
  )

  // jsdom has no layout, so the slider cannot measure a real track.
  wrapper.find('.v-slider__track-container').element.getBoundingClientRect = () => rect(200)
  wrapper.find('.v-slider__thumb-container').element.getBoundingClientRect = () => rect(20)

  const slider = wrapper.find('.v-slider').element as HTMLElement

  return {
    wrapper,
    slider,
    // Events are dispatched on the slider so they bubble up to [data-app].
    moveTo: (clientX: number, buttons: number) =>
      slider.dispatchEvent(mouseEvent('mousemove', buttons, clientX))
  }
}

const value = (wrapper: { vm: unknown }) => (wrapper.vm as { v: number }).v

describe('slider drag released outside the window (#1992)', () => {
  let dispose: (() => void) | undefined

  afterEach(() => {
    dispose?.()
    dispose = undefined
    document.body.replaceChildren()
  })

  it('stops following the pointer once it re-enters the window', async () => {
    dispose = installSliderDragGuard()

    const { wrapper, slider, moveTo } = mountSlider(50)

    slider.dispatchEvent(mouseEvent('mousedown', 1, 100))
    moveTo(120, 1)
    await wrapper.vm.$nextTick()
    expect(value(wrapper)).toBe(60)

    // Released outside the window, so no mouseup is ever delivered. The first
    // move back inside the window is the only signal that the drag is over.
    moveTo(900, 0)
    await wrapper.vm.$nextTick()

    // 900px on a 200px track would otherwise drag the value to the max.
    expect(value(wrapper)).toBe(60)
  })

  it('keeps following the pointer without the guard, which is the bug', async () => {
    const { wrapper, slider, moveTo } = mountSlider(50)

    slider.dispatchEvent(mouseEvent('mousedown', 1, 100))
    moveTo(900, 0)
    await wrapper.vm.$nextTick()

    expect(value(wrapper)).toBe(100)
  })
})
