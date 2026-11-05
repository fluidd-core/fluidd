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

  it.each([
    ['without rel', '', 'noopener noreferrer'],
    ['with other rel tokens', ' rel="nofollow"', 'nofollow noopener noreferrer'],
    ['with part of rel', ' rel="NoOpener"', 'noopener noreferrer']
  ])('adds noopener and noreferrer to target="_blank" links %s', (_, rel, expected) => {
    expect(serialize(sanitizeHtml(`<a href="https://x.com" target="_blank"${rel}>x</a>`)))
      .toBe(`<a href="https://x.com" target="_blank" rel="${expected}">x</a>`)
  })

  it.each([
    'https://x.com',
    'http://x.com',
    'HTTPS://x.com',
    '//x.com'
  ])('opens %s in a new tab', (href) => {
    expect(serialize(sanitizeHtml(`<a href="${href}">x</a>`)))
      .toBe(`<a href="${href}" target="_blank" rel="noopener noreferrer">x</a>`)
  })

  it.each([
    ['backslashes', '\\\\x.com'],
    ['a slash and a backslash', '/\\x.com'],
    ['a backslash and a slash', '\\/x.com'],
    ['a scheme without slashes', 'https:x.com'],
    ['a scheme with one slash', 'https:/x.com'],
    ['a tab between the slashes', '/\t/x.com'],
    ['a tab in the scheme', 'ht\ttps://x.com']
  ])('opens a link with %s in a new tab', (_, href) => {
    expect(serialize(sanitizeHtml(`<a href="${href}">x</a>`)))
      .toBe(`<a href="${href}" target="_blank" rel="noopener noreferrer">x</a>`)
  })

  it('opens an absolute SVG link in a new tab', () => {
    expect(serialize(sanitizeHtml('<svg><a href="https://x.com"><text>x</text></a></svg>')))
      .toBe('<svg><a href="https://x.com" target="_blank" rel="noopener noreferrer"><text>x</text></a></svg>')
  })

  it('opens an absolute SVG xlink:href link in a new tab', () => {
    expect(serialize(sanitizeHtml('<svg><a xlink:href="https://x.com"><text>x</text></a></svg>')))
      .toBe('<svg><a xlink:href="https://x.com" target="_blank" rel="noopener noreferrer"><text>x</text></a></svg>')
  })

  it('keeps an explicit target="_blank" on relative SVG links', () => {
    expect(serialize(sanitizeHtml('<svg><a href="/a" target="_blank"><text>x</text></a></svg>')))
      .toBe('<svg><a href="/a" target="_blank" rel="noopener noreferrer"><text>x</text></a></svg>')
  })

  it('trims the href before checking it', () => {
    expect(serialize(sanitizeHtml('<a href=" https://x.com">x</a>')))
      .toBe('<a href="https://x.com" target="_blank" rel="noopener noreferrer">x</a>')
  })

  it('replaces any other target on absolute links', () => {
    expect(serialize(sanitizeHtml('<a href="https://x.com" target="_self" rel="nofollow">x</a>')))
      .toBe('<a href="https://x.com" rel="nofollow noopener noreferrer" target="_blank">x</a>')
  })

  it.each([
    ['without href', '<a>G28</a>'],
    ['with a hash route', '<a href="#/console">x</a>'],
    ['with a relative path', '<a href="server/files/a.gcode">x</a>'],
    ['with a root path', '<a href="/server/files/a.gcode">x</a>'],
    ['with mailto', '<a href="mailto:a@x.com">x</a>'],
    ['with tel', '<a href="tel:123">x</a>']
  ])('leaves links %s unchanged', (_, html) => {
    expect(serialize(sanitizeHtml(html))).toBe(html)
  })

  it('leaves rel alone on links that stay in the same tab', () => {
    expect(serialize(sanitizeHtml('<a href="/a" rel="nofollow">x</a>')))
      .toBe('<a href="/a" rel="nofollow">x</a>')
  })

  it('drops any other target on relative links', () => {
    expect(serialize(sanitizeHtml('<a href="/a" target="other">x</a>')))
      .toBe('<a href="/a">x</a>')
  })

  it('keeps an explicit target="_blank" on relative links', () => {
    expect(serialize(sanitizeHtml('<a href="/a" target="_blank">x</a>')))
      .toBe('<a href="/a" target="_blank" rel="noopener noreferrer">x</a>')
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
