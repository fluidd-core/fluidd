import type { FunctionDirective } from 'vue'

const blur: FunctionDirective<HTMLElement> = (element) => {
  element.onfocus = (event) => {
    if (event.target instanceof HTMLElement) {
      event.target.blur()
    }
    // console.log('called blur', target)
  }
}

export default blur
