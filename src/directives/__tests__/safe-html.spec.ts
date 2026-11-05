/**
 * @vitest-environment jsdom
 */
import type { DirectiveBinding, VNode } from 'vue'
import safeHtml from '../safe-html'

const vnode = {} as VNode

const update = (
  el: HTMLElement,
  binding: Pick<DirectiveBinding<string | undefined>, 'value'> & Partial<DirectiveBinding<string | undefined>>
) => {
  safeHtml(el, { name: 'safe-html', modifiers: {}, oldValue: null, ...binding }, vnode, vnode)
}

describe('safeHtml', () => {
  it('sanitizes without an argument', () => {
    const el = document.createElement('span')

    update(el, { value: '<b onclick="x()">a</b><script>x()</script>' })

    expect(el.innerHTML).toBe('<b>a</b>')
  })

  it('renders nothing for an undefined value', () => {
    const el = document.createElement('span')

    el.innerHTML = 'old'
    update(el, { value: undefined, oldValue: 'old' })

    expect(el.innerHTML).toBe('')
  })

  it('sanitizes and marks with an argument', () => {
    const el = document.createElement('span')

    update(el, { value: '<b onclick="x()">it\'s</b><script>it\'s</script>', arg: 'it\'s' })

    expect(el.innerHTML).toBe('<b><mark>it\'s</mark></b>')
  })

  it('replaces previous content', () => {
    const el = document.createElement('span')

    el.innerHTML = 'old'
    update(el, { value: 'new', arg: 'new' })

    expect(el.innerHTML).toBe('<mark>new</mark>')
  })

  it('updates when only the argument changes', () => {
    const el = document.createElement('span')

    update(el, { value: 'a b', arg: 'a' })
    update(el, { value: 'a b', oldValue: 'a b', arg: 'b', oldArg: 'a' })

    expect(el.innerHTML).toBe('a <mark>b</mark>')
  })

  it('removes marks when the argument is cleared', () => {
    const el = document.createElement('span')

    update(el, { value: 'a', arg: 'a' })
    update(el, { value: 'a', oldValue: 'a', oldArg: 'a' })

    expect(el.innerHTML).toBe('a')
  })

  it('skips the update when nothing changed', () => {
    const el = document.createElement('span')

    el.innerHTML = 'kept'
    update(el, { value: 'a', oldValue: 'a', arg: 'a', oldArg: 'a' })

    expect(el.innerHTML).toBe('kept')
  })
})
