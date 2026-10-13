import { describe, expect, it } from 'vitest'
import router from '@/router'
import { routeAfterInit } from '../afterInit'
import { scopedPath } from '../printerPagePaths'
import { ACCOUNT_KEY, ALL_PRINTERS_KEY, LIBRARY_KEY, PAGE_KEYS, SECTIONS } from '../printerSections'

describe('the account\'s pages (KAN-532)', () => {
  it.each([
    ['/boxwood-367a/account', 'Account', 'printer', undefined],
    ['/boxwood-367a/account/profile', 'Account', 'printer', 'profile'],
    ['/account', 'Account (no printer)', undefined, undefined],
    ['/account/library', 'Account (no printer)', undefined, 'library']
  ])('%s is %s: lazy, the account\'s, and beside the printer\'s rail when there is one', (path, name, frame, section) => {
    const route = router.resolve(path).route
    expect(route.name).toBe(name)
    expect(route.params.section).toBe(section)
    expect(route.matched[0].meta.printerIndependent).toBe(true)
    expect(route.matched[0].meta.frame).toBe(frame)
    // Lazy: an import, so the first load doesn't carry the account's pages.
    const component = route.matched[0].components.default as { cid?: number }
    expect(typeof component).toBe('function')
    expect(component.cid).toBeUndefined()
  })

  it('links to the account under the printer open, and stays there on a switch', () => {
    expect(scopedPath('/account', 'walnut-8987')).toBe('/walnut-8987/account')
    expect(scopedPath('/account/security', 'walnut-8987')).toBe('/walnut-8987/account/security')
    expect(scopedPath('/account', null)).toBe('/account')
    const walnut = { slug: 'walnut-8987', isActive: (slug: string) => slug === 'walnut-8987' }
    expect(routeAfterInit(router.resolve('/boxwood-367a/account/profile').route, walnut)).toBe('/walnut-8987/account/profile')
  })

  it('has its own G key, A, which no section or page uses', () => {
    const taken = [ALL_PRINTERS_KEY, LIBRARY_KEY, ...SECTIONS.map(s => s.key), ...PAGE_KEYS.map(k => k.key)]
    expect(taken).not.toContain(ACCOUNT_KEY)
    expect(ACCOUNT_KEY).toBe('a')
  })
})
