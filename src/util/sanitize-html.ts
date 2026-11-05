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

const absoluteUrlRegExp = /^(?:https?:)?\/\//i

DOMPurify.addHook('afterSanitizeAttributes', (currentNode) => {
  if (currentNode.tagName !== 'A') {
    return
  }

  if (absoluteUrlRegExp.test(currentNode.getAttribute('href') ?? '')) {
    currentNode.setAttribute('target', '_blank')
  }

  if (currentNode.getAttribute('target') === '_blank') {
    const rel = new Set(
      (currentNode.getAttribute('rel') ?? '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    )

    // rel.add('noopener')
    rel.add('noreferrer')

    currentNode.setAttribute('rel', [...rel].join(' '))
  }
})

export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html, {
  RETURN_DOM_FRAGMENT: true
})

export const hasRenderableHtml = (text: string) => (
  /<[a-z]/i.test(text) &&
  sanitizeHtml(text).querySelector('*') !== null
)
