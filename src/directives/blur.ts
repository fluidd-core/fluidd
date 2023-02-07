import { FunctionDirective } from 'vue'

const blur: FunctionDirective<HTMLElement> = (el) => {
  el.onfocus = (ev) => {
    const target = ev.target as HTMLElement
    target.blur()
    // console.log('called blur', target)
  }
}

export default blur
