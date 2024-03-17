import type { FunctionDirective } from 'vue'

const blur: FunctionDirective<HTMLElement> = (element) => {
  element.onfocus = (event) => {
    if (event.target instanceof HTMLElement) {
      event.target.blur()
    }
  }
}

export default blur
