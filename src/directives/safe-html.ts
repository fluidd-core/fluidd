import type { FunctionDirective } from 'vue'
import DOMPurify from 'dompurify'
import { markTextNodes } from '@/util/mark-text-nodes'

DOMPurify.addHook('uponSanitizeAttribute', (currentNode, hookEvent) => {
  if (
    currentNode.tagName === 'A' &&
    hookEvent.attrName === 'target' &&
    hookEvent.attrValue === '_blank'
  ) {
    hookEvent.forceKeepAttr = true
  }
})

const safeHtml: FunctionDirective<HTMLElement> = (el, binding) => {
  if (binding.value === binding.oldValue && binding.arg === binding.oldArg) {
    return
  }

  const fragment = DOMPurify.sanitize(binding.value, { RETURN_DOM_FRAGMENT: true })

  if (binding.arg) {
    markTextNodes(fragment, binding.arg)
  }

  el.replaceChildren(fragment)
}

export default safeHtml
