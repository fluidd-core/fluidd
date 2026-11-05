import type { FunctionDirective } from 'vue'
import { markTextNodes } from '@/util/mark-text-nodes'
import { sanitizeHtml } from '@/util/sanitize-html'

export type SafeHtmlValue = string | { html: string, search?: string | null } | null | undefined

const normalize = (value: SafeHtmlValue) => (
  (
    value != null &&
    typeof value === 'object'
  )
    ? {
        html: value.html,
        search: value.search || null
      }
    : {
        html: value ?? '',
        search: null
      }
)

const safeHtml: FunctionDirective<HTMLElement, SafeHtmlValue> = (el, binding) => {
  const { html, search } = normalize(binding.value)

  if (binding.oldValue !== undefined) {
    const old = normalize(binding.oldValue)

    if (
      html === old.html &&
      search === old.search
    ) {
      return
    }
  }

  const fragment = sanitizeHtml(html)

  if (search) {
    markTextNodes(fragment, search)
  }

  el.replaceChildren(fragment)
}

export default safeHtml
