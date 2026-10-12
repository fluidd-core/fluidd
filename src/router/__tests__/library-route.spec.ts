import { describe, expect, it } from 'vitest'
import router from '@/router'
import { routeAfterInit } from '../afterInit'
import { scopedPath } from '../printerPagePaths'

describe('the Library\'s pages', () => {
  it.each([
    ['/boxwood-367a/library', 'Library', 'printer'],
    ['/boxwood-367a/library/6f1d2c3a-8b4e-4f5a-9c6d-7e8f9a0b1c2d', 'Library print', 'printer'],
    ['/library', 'Library (no printer)', undefined],
    ['/library/6f1d2c3a-8b4e-4f5a-9c6d-7e8f9a0b1c2d', 'Library print (no printer)', undefined]
  ])('%s is %s: lazy, the account\'s, and drawn beside the printer\'s rail when there is one', (path, name, frame) => {
    const route = router.resolve(path).route
    expect(route.name).toBe(name)
    expect(route.matched[0].meta.printerIndependent).toBe(true)
    expect(route.matched[0].meta.frame).toBe(frame)
    const component = route.matched[0].components.default as { cid?: number }
    expect(typeof component).toBe('function')
    expect(component.cid).toBeUndefined()
  })

  it('links to the Library of the printer open', () => {
    expect(scopedPath('/library', 'walnut-8987')).toBe('/walnut-8987/library')
    expect(scopedPath('/library/abc', 'walnut-8987')).toBe('/walnut-8987/library/abc')
    expect(scopedPath('/library', null)).toBe('/library')
  })

  it('stays on the same print when Fluidd switches printer', () => {
    const walnut = { slug: 'walnut-8987', isActive: (slug: string) => slug === 'walnut-8987' }
    expect(routeAfterInit(router.resolve('/boxwood-367a/library/abc').route, walnut)).toBe('/walnut-8987/library/abc')
  })
})
