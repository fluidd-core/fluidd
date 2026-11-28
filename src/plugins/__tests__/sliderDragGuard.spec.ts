/**
 * @vitest-environment jsdom
 */
import { installSliderDragGuard } from '../sliderDragGuard'

const mouseEvent = (type: string, buttons: number) =>
  new MouseEvent(type, { bubbles: true, buttons, cancelable: true })

/** Mirrors how VSlider waits for the release of a drag it started. */
const listenForReleaseOnApp = () => {
  const app = document.createElement('div')

  app.dataset.app = ''
  document.body.append(app)

  const slider = document.createElement('div')

  slider.className = 'v-slider'
  app.append(slider)

  const released = vi.fn()

  app.addEventListener('mouseup', released, { once: true })

  return { slider, released }
}

describe('installSliderDragGuard', () => {
  let dispose: () => void

  beforeEach(() => {
    dispose = installSliderDragGuard()
  })

  afterEach(() => {
    dispose()
    document.body.replaceChildren()
  })

  it('ends a drag released outside the window', () => {
    const { slider, released } = listenForReleaseOnApp()

    slider.dispatchEvent(mouseEvent('mousedown', 1))
    // Dragged out of the window with the button still down: still a drag.
    document.dispatchEvent(mouseEvent('mousemove', 1))
    expect(released).not.toHaveBeenCalled()

    // Released outside the window: no mouseup reaches the page at all.
    // The first mousemove back inside reports no button held, so the drag is over.
    document.dispatchEvent(mouseEvent('mousemove', 0))
    expect(released).toHaveBeenCalledTimes(1)
  })

  it('ends the drag once only', () => {
    const { slider, released } = listenForReleaseOnApp()

    slider.dispatchEvent(mouseEvent('mousedown', 1))
    document.dispatchEvent(mouseEvent('mousemove', 0))
    document.dispatchEvent(mouseEvent('mousemove', 0))
    document.dispatchEvent(mouseEvent('mousemove', 0))

    expect(released).toHaveBeenCalledTimes(1)
  })

  it('leaves a release inside the window to the slider', () => {
    const { slider, released } = listenForReleaseOnApp()

    slider.dispatchEvent(mouseEvent('mousedown', 1))
    slider.dispatchEvent(mouseEvent('mouseup', 0))
    expect(released).toHaveBeenCalledTimes(1)

    document.dispatchEvent(mouseEvent('mousemove', 0))
    expect(released).toHaveBeenCalledTimes(1)
  })

  it('ignores mousemoves that did not start on a slider', () => {
    const { released } = listenForReleaseOnApp()

    document.body.dispatchEvent(mouseEvent('mousedown', 1))
    document.dispatchEvent(mouseEvent('mousemove', 0))

    expect(released).not.toHaveBeenCalled()
  })

  it('ignores a mousemove while the button is still held', () => {
    const { slider, released } = listenForReleaseOnApp()

    slider.dispatchEvent(mouseEvent('mousedown', 1))
    document.dispatchEvent(mouseEvent('mousemove', 1))

    expect(released).not.toHaveBeenCalled()
  })

  it('stops listening once disposed', () => {
    const { slider, released } = listenForReleaseOnApp()

    dispose()
    slider.dispatchEvent(mouseEvent('mousedown', 1))
    document.dispatchEvent(mouseEvent('mousemove', 0))

    expect(released).not.toHaveBeenCalled()
  })
})
