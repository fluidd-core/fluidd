// A Vuetify slider ends a drag on the `mouseup` it listens for on the [data-app]
// element. Releasing the button outside the window never delivers that event, so
// the slider stays active and keeps following the pointer once it re-enters
// (#1992). A mousemove with no buttons pressed can only arrive after such a
// release, so it is used to hand the slider the mouseup it is waiting for.

const SLIDER_SELECTOR = '.v-slider'
const APP_SELECTOR = '[data-app]'

export function installSliderDragGuard(): () => void {
  let dragging = false

  const onMouseDown = (event: MouseEvent) => {
    const target = event.target

    dragging = target instanceof Element && target.closest(SLIDER_SELECTOR) !== null
  }

  const onMouseUp = () => {
    dragging = false
  }

  const onMouseMove = (event: MouseEvent) => {
    if (!dragging || event.buttons !== 0) {
      return
    }

    dragging = false

    document
      .querySelector(APP_SELECTOR)
      ?.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }))
  }

  document.addEventListener('mousedown', onMouseDown, true)
  document.addEventListener('mouseup', onMouseUp, true)
  document.addEventListener('mousemove', onMouseMove, true)

  return () => {
    document.removeEventListener('mousedown', onMouseDown, true)
    document.removeEventListener('mouseup', onMouseUp, true)
    document.removeEventListener('mousemove', onMouseMove, true)
  }
}
