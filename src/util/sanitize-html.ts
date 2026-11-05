import DOMPurify from 'dompurify'

DOMPurify.addHook('uponSanitizeAttribute', (currentNode, hookEvent) => {
  if (
    currentNode.localName === 'a' &&
    hookEvent.attrName === 'target' &&
    hookEvent.attrValue === '_blank'
  ) {
    hookEvent.forceKeepAttr = true
  }
})

const relativeBaseHost = 'relative.invalid'

const isAbsoluteHttpUrl = (href: string) => {
  try {
    const url = new URL(href, `http://${relativeBaseHost}/`)

    return (
      (
        url.protocol === 'http:' ||
        url.protocol === 'https:'
      ) &&
      url.host !== relativeBaseHost
    )
  } catch {
    return false
  }
}

DOMPurify.addHook('afterSanitizeAttributes', (currentNode) => {
  if (currentNode.localName !== 'a') {
    return
  }

  const href = currentNode.getAttribute('href') ?? currentNode.getAttribute('xlink:href')

  if (
    href != null &&
    isAbsoluteHttpUrl(href)
  ) {
    currentNode.setAttribute('target', '_blank')
  }

  if (currentNode.getAttribute('target') === '_blank') {
    const rel = new Set(
      (currentNode.getAttribute('rel') ?? '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    )

    rel.add('noopener')
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
