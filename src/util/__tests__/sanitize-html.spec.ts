/**
 * @vitest-environment jsdom
 */
import { hasRenderableHtml, sanitizeHtml } from '../sanitize-html'

const serialize = (fragment: DocumentFragment) => {
  const container = document.createElement('div')

  container.append(fragment)

  return container.innerHTML
}

describe('sanitizeHtml', () => {
  it('removes scripts and event handlers', () => {
    expect(serialize(sanitizeHtml('<img src="a.png" onerror="x()"><script>x()</script>')))
      .toBe('<img src="a.png">')
  })

  it('keeps target="_blank" and rel on links', () => {
    expect(serialize(sanitizeHtml('<a href="https://x.com" target="_blank" rel="noopener noreferrer">x</a>')))
      .toBe('<a href="https://x.com" target="_blank" rel="noopener noreferrer">x</a>')
  })

  it('drops any other target', () => {
    expect(serialize(sanitizeHtml('<a href="https://x.com" target="other">x</a>')))
      .toBe('<a href="https://x.com">x</a>')
  })
})

describe('hasRenderableHtml', () => {
  it.each([
    'plain text',
    '<none>',
    '<x>',
    '<y>',
    '<z>',
    'M163 [P<factor>] [S<index>]',
    'bed_mesh: Unknown algorithm <foo>',
    '<script>x()</script>',
    '<custom-element>a</custom-element>',
    '</b>',
    '<!-- comment -->',
    'a < b',
    'value <min'
  ])('is false for %s', (text) => {
    expect(hasRenderableHtml(text)).toBe(false)
  })

  it.each([
    '<b>a</b>',
    '<br>',
    '<img src="a.png">',
    '<a>G28</a>',
    '<B>a</B>',
    '<b>Z</b> [P<factor>]',
    'a<b and c>d'
  ])('is true for %s', (text) => {
    expect(hasRenderableHtml(text)).toBe(true)
  })
})
