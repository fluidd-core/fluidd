/**
 * @vitest-environment jsdom
 */
import type { VNode } from 'vue'
import safeHtml, { type SafeHtmlValue } from '../safe-html'

const vnode = {} as VNode

const update = (el: HTMLElement, value: SafeHtmlValue, oldValue?: SafeHtmlValue) => {
  safeHtml(el, { name: 'safe-html', modifiers: {}, value, oldValue }, vnode, vnode)
}

describe('safeHtml', () => {
  it('sanitizes a string', () => {
    const el = document.createElement('span')

    update(el, '<b onclick="x()">a</b><script>x()</script>')

    expect(el.innerHTML).toBe('<b>a</b>')
  })

  it.each([undefined, null])('renders nothing for %s', (value) => {
    const el = document.createElement('span')

    el.innerHTML = 'old'
    update(el, value, 'old')

    expect(el.innerHTML).toBe('')
  })

  it('renders an undefined value on the first render', () => {
    const el = document.createElement('span')

    el.innerHTML = 'old'
    update(el, undefined)

    expect(el.innerHTML).toBe('')
  })

  it('sanitizes and marks with a search term', () => {
    const el = document.createElement('span')

    update(el, { html: '<b onclick="x()">it\'s</b><script>it\'s</script>', search: 'it\'s' })

    expect(el.innerHTML).toBe('<b><mark>it\'s</mark></b>')
  })

  it.each([undefined, null, ''])('does not mark for a %s search term', (search) => {
    const el = document.createElement('span')

    update(el, { html: 'a', search })

    expect(el.innerHTML).toBe('a')
  })

  it('replaces previous content', () => {
    const el = document.createElement('span')

    el.innerHTML = 'old'
    update(el, { html: 'new', search: 'new' })

    expect(el.innerHTML).toBe('<mark>new</mark>')
  })

  it('updates when only the search term changes', () => {
    const el = document.createElement('span')

    update(el, { html: 'a b', search: 'a' })
    update(el, { html: 'a b', search: 'b' }, { html: 'a b', search: 'a' })

    expect(el.innerHTML).toBe('a <mark>b</mark>')
  })

  it('removes marks when the search term is cleared', () => {
    const el = document.createElement('span')

    update(el, { html: 'a', search: 'a' })
    update(el, { html: 'a', search: null }, { html: 'a', search: 'a' })

    expect(el.innerHTML).toBe('a')
  })

  it.each([
    ['a string', 'a', 'a'],
    ['an equal new object', { html: 'a', search: 'a' }, { html: 'a', search: 'a' }],
    ['a string and an object without search', 'a', { html: 'a' }]
  ])('skips the update for %s', (_, value, oldValue) => {
    const el = document.createElement('span')

    el.innerHTML = 'kept'
    update(el, value, oldValue)

    expect(el.innerHTML).toBe('kept')
  })
})
