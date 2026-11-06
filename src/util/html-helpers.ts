const externalUrlRegExp = /https?:\/\/[^\s<>"'`]+/gi

const trailingPunctuationRegExp = /[?!.,:*_~]+$/

// Trim trailing punctuation and unmatched closing parens (GFM autolink rules).
const trimUrl = (url: string): string => {
  let result = url.replace(trailingPunctuationRegExp, '')

  while (
    result.endsWith(')') &&
    (result.match(/\)/g)?.length ?? 0) > (result.match(/\(/g)?.length ?? 0)
  ) {
    result = result.slice(0, -1).replace(trailingPunctuationRegExp, '')
  }

  return result
}

export const escapeHtml = (text: string) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

export const urlToAnchor = (url: string) => {
  const escapedUrl = escapeHtml(url)

  return `<a target="_blank" rel="noopener noreferrer" href="${escapedUrl}">${escapedUrl}</a>`
}

export const linkExternalUrls = (text: string) => {
  let result = ''
  let lastIndex = 0

  for (const match of text.matchAll(externalUrlRegExp)) {
    const url = trimUrl(match[0])

    result += escapeHtml(text.slice(lastIndex, match.index)) + urlToAnchor(url)
    lastIndex = match.index + url.length
  }

  return result + escapeHtml(text.slice(lastIndex))
}
