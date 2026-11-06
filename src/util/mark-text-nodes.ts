import { escapeRegExp } from 'lodash-es'

export const markTextNodes = (root: DocumentFragment, term: string) => {
  const doc = root.ownerDocument
  const termRegExp = new RegExp(escapeRegExp(term), 'gi')
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []

  while (walker.nextNode()) {
    const node = walker.currentNode as Text

    if (!node.parentElement?.closest('style')) {
      nodes.push(node)
    }
  }

  for (const node of nodes) {
    const text = node.data
    const parts = doc.createDocumentFragment()
    let lastIndex = 0

    for (const match of text.matchAll(termRegExp)) {
      const mark = doc.createElement('mark')

      mark.textContent = match[0]
      parts.append(text.slice(lastIndex, match.index), mark)
      lastIndex = match.index + match[0].length
    }

    if (lastIndex > 0) {
      parts.append(text.slice(lastIndex))
      node.replaceWith(parts)
    }
  }
}
