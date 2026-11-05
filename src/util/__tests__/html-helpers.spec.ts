import { escapeHtml, linkExternalUrls, urlToAnchor } from '../html-helpers'

const anchor = (url: string) => `<a target="_blank" rel="noopener noreferrer" href="${url}">${url}</a>`

describe('escapeHtml', () => {
  it('escapes tag delimiters and ampersands', () => {
    expect(escapeHtml('<b>a & b</b>'))
      .toBe('&lt;b&gt;a &amp; b&lt;/b&gt;')
  })

  it('escapes ampersands in existing entities', () => {
    expect(escapeHtml('&lt;'))
      .toBe('&amp;lt;')
  })

  it('escapes quotes', () => {
    expect(escapeHtml('"a" \'b\''))
      .toBe('&quot;a&quot; &#39;b&#39;')
  })
})

describe('urlToAnchor', () => {
  it('builds an anchor that opens in a new tab', () => {
    expect(urlToAnchor('https://x.com'))
      .toBe('<a target="_blank" rel="noopener noreferrer" href="https://x.com">https://x.com</a>')
  })

  it('escapes the URL in both the href and the label', () => {
    expect(urlToAnchor('https://x.com?a=1&b=2'))
      .toBe('<a target="_blank" rel="noopener noreferrer" href="https://x.com?a=1&amp;b=2">https://x.com?a=1&amp;b=2</a>')
  })
})

describe('linkExternalUrls', () => {
  it('wraps a plain URL in an anchor', () => {
    expect(linkExternalUrls('https://x.com'))
      .toBe(anchor('https://x.com'))
  })

  it('keeps wrapping quotes outside the link', () => {
    expect(linkExternalUrls('"https://x.com"'))
      .toBe(`&quot;${anchor('https://x.com')}&quot;`)
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

  it('escapes tag-like text', () => {
    expect(linkExternalUrls('expected <value>, got <min'))
      .toBe('expected &lt;value&gt;, got &lt;min')
  })

  it('escapes tag-like text around a URL', () => {
    expect(linkExternalUrls('<a> https://x.com <b>'))
      .toBe(`&lt;a&gt; ${anchor('https://x.com')} &lt;b&gt;`)
  })

  it('escapes ampersands in text and URLs', () => {
    expect(linkExternalUrls('a & b https://x.com?a=1&b=2'))
      .toBe(`a &amp; b ${anchor('https://x.com?a=1&amp;b=2')}`)
  })

  it('keeps newlines around a URL', () => {
    expect(linkExternalUrls('a\nhttps://x.com\nb'))
      .toBe(`a\n${anchor('https://x.com')}\nb`)
  })

  it('stops a URL at a tag-like delimiter', () => {
    expect(linkExternalUrls('https://x.com<br>'))
      .toBe(`${anchor('https://x.com')}&lt;br&gt;`)
  })
})
