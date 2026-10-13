import { describe, expect, it, vi } from 'vitest'
import router from '@/router'
import { isManagedConsolePath } from '../managedPath'
import { pathForLegacyHash } from '../legacyHash'
import { forgetSignedOut, noteSignedOut } from '@/services/account/signed-out-note'
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

describe('signing out and the emailed links (KAN-532)', () => {
  it.each([
    ['/sign-out', 'Sign out'],
    ['/signed-out', 'Signed out'],
    ['/account/verify-email', 'Email link'],
    ['/account/reset-password', 'Password link']
  ])('%s is %s: lazy, with no printer chrome', (path, name) => {
    const route = router.resolve(path).route
    expect(route.name).toBe(name)
    expect(isManagedConsolePath(path)).toBe(true)
    const component = route.matched[0].components.default as { cid?: number }
    expect(typeof component).toBe('function')
    expect(component.cid).toBeUndefined()
  })

  it('reads the console\'s emailed links, which still route by hash', () => {
    expect(pathForLegacyHash({ pathname: '/', search: '', hash: '#/account/verify-email?token=t1' })).toBe('/account/verify-email?token=t1')
  })

  it('goes on from / to the signed-out page only just after signing out', () => {
    const guard = router.resolve('/').route.matched[0].beforeEnter as unknown as (to: unknown, from: unknown, next: (to?: unknown) => void) => void
    const next = vi.fn()
    guard({}, {}, next)
    expect(next).toHaveBeenLastCalledWith()
    noteSignedOut({ scope: 'browser' })
    guard({}, {}, next)
    expect(next).toHaveBeenLastCalledWith({ path: '/signed-out', replace: true })
    forgetSignedOut()
  })
})
