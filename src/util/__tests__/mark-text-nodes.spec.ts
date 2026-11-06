/**
 * @vitest-environment jsdom
 */
import { markTextNodes } from '../mark-text-nodes'

const mark = (html: string, term: string) => {
  const template = document.createElement('template')
  const container = document.createElement('div')

  template.innerHTML = html
  markTextNodes(template.content, term)
  container.append(template.content)

  return container.innerHTML
}

describe('markTextNodes', () => {
  it('marks every match, keeping the original casing', () => {
    expect(mark('Foo foo', 'foo'))
      .toBe('<mark>Foo</mark> <mark>foo</mark>')
  })

  it('keeps the text around a match', () => {
    expect(mark('a foo b', 'foo'))
      .toBe('a <mark>foo</mark> b')
  })

  it('leaves text without a match untouched', () => {
    expect(mark('<b>bar</b>', 'foo'))
      .toBe('<b>bar</b>')
  })

  it('matches displayed characters, not their entities', () => {
    expect(mark('a &lt; b', '<'))
      .toBe('a <mark>&lt;</mark> b')

    expect(mark('&gt; gt', 'gt'))
      .toBe('&gt; <mark>gt</mark>')
  })

  it.each([
    ['it\'s', '<b>it\'s</b>', '<b><mark>it\'s</mark></b>'],
    ['it\'s', '<b>it&#39;s</b>', '<b><mark>it\'s</mark></b>'],
    ['"a"', '<b>"a"</b>', '<b><mark>"a"</mark></b>'],
    ['a & b', '<b>a & b</b>', '<b><mark>a &amp; b</mark></b>'],
    ['a & b', '<b>a &amp; b</b>', '<b><mark>a &amp; b</mark></b>']
  ])('finds %s in %s', (term, html, expected) => {
    expect(mark(html, term)).toBe(expected)
  })

  it('does not touch tags or attributes', () => {
    expect(mark('<a class="a" title="a>a">ab</a>', 'a'))
      .toBe('<a class="a" title="a>a"><mark>a</mark>b</a>')
  })

  it('marks text inside nested elements', () => {
    expect(mark('foo <b>foo <i>foo</i></b>', 'foo'))
      .toBe('<mark>foo</mark> <b><mark>foo</mark> <i><mark>foo</mark></i></b>')
  })

  it('skips style contents', () => {
    expect(mark('<style>.foo {}</style>foo', 'foo'))
      .toBe('<style>.foo {}</style><mark>foo</mark>')
  })

  it('treats regular expression characters literally', () => {
    expect(mark('abc a.c', 'a.c'))
      .toBe('abc <mark>a.c</mark>')
  })

  it('does not match across elements', () => {
    expect(mark('<b>fo</b>o', 'foo'))
      .toBe('<b>fo</b>o')
  })
})
