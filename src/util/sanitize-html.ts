import DOMPurify from 'dompurify'

DOMPurify.addHook('uponSanitizeAttribute', (currentNode, hookEvent) => {
  if (
    currentNode.tagName === 'A' &&
    hookEvent.attrName === 'target' &&
    hookEvent.attrValue === '_blank'
  ) {
    hookEvent.forceKeepAttr = true
  }
})

export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html, {
  RETURN_DOM_FRAGMENT: true
})

export const hasRenderableHtml = (text: string) => (
  /<[a-z]/i.test(text) &&
  sanitizeHtml(text).querySelector('*') !== null
)
