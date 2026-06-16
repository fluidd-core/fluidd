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

const linkExternalUrls = (text: string) => text.replace(externalUrlRegExp, (match) => {
  const url = trimUrl(match)

  const trailing = match.slice(url.length)

  return `<a target="_blank" rel="noopener noreferrer" href="${url}">${url}</a>${trailing}`
})

export default linkExternalUrls
