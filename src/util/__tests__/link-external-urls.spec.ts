import linkExternalUrls from '../link-external-urls'

const anchor = (url: string) => `<a target="_blank" rel="noopener noreferrer" href="${url}">${url}</a>`

describe('linkExternalUrls', () => {
  it('wraps a plain URL in an anchor', () => {
    expect(linkExternalUrls('https://x.com'))
      .toBe(anchor('https://x.com'))
  })

  it('keeps wrapping quotes outside the link', () => {
    expect(linkExternalUrls('"https://x.com"'))
      .toBe(`"${anchor('https://x.com')}"`)
  })

  it('keeps a sentence-ending period as plain text', () => {
    expect(linkExternalUrls('see https://x.com.'))
      .toBe(`see ${anchor('https://x.com')}.`)
  })

  it('keeps a trailing comma in mid-sentence as plain text', () => {
    expect(linkExternalUrls('go to https://x.com, then stop'))
      .toBe(`go to ${anchor('https://x.com')}, then stop`)
  })

  it('keeps wrapping parentheses outside the link', () => {
    expect(linkExternalUrls('(https://x.com)'))
      .toBe(`(${anchor('https://x.com')})`)
  })

  it('preserves balanced parentheses inside the URL', () => {
    const url = 'https://en.wikipedia.org/wiki/Foo_(bar)'

    expect(linkExternalUrls(url))
      .toBe(anchor(url))
  })

  it('links multiple URLs in one string', () => {
    expect(linkExternalUrls('a https://x.com b https://y.com'))
      .toBe(`a ${anchor('https://x.com')} b ${anchor('https://y.com')}`)
  })

  it('returns text without a URL unchanged', () => {
    expect(linkExternalUrls('no link here'))
      .toBe('no link here')
  })
})
