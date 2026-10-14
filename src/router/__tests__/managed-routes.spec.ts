import { describe, expect, it, test } from 'vitest'
import router from '@/router'

describe('Muon3D account routes', () => {
  test.each([
    ['/', 'Printers'],
    ['/link', 'Link a printer']
  ])('%s resolves to %s and renders without a printer connection', (path, name) => {
    const route = router.resolve(path).route

    expect(route.name).toBe(name)
    expect(route.matched).toHaveLength(1)
    expect(route.matched[0].meta.printerIndependent).toBe(true)
  })

  test.each(['/setup', '/setup?step=network'])('%s resolves to the lazy setup page, which needs no printer connection', (path) => {
    const route = router.resolve(path).route

    expect(route.name).toBe('setup')
    expect(route.matched).toHaveLength(1)
    expect(route.matched[0].meta.printerIndependent).toBe(true)
    // A loader, not a component constructor (those carry a cid): the setup
    // chunk loads only on this route. /link is lazy too now (KAN-525), so the
    // check that it really is a chunk loader, not an odd component, is that
    // calling it answers a promise.
    const component = route.matched[0].components.default as { cid?: number } & (() => unknown)
    expect(typeof component).toBe('function')
    expect(component.cid).toBeUndefined()
    const loaded = component()
    expect(loaded).toBeDefined()
    expect(typeof (loaded as Promise<unknown>).then).toBe('function')
  })

  it('sends the old fleet address to Printers, which holds the fleet now', () => {
    expect(router.resolve('/fleet').route.name).toBe('Printers')
  })

  test.each(['/managed/sign-in', '/onboarding', '/link-printer'])('the retired placeholder %s is gone', (path) => {
    expect(router.resolve(path).route.name).not.toBe('Managed sign in')
    expect(router.resolve(path).route.matched.every(m => m.meta.printerIndependent !== true)).toBe(true)
  })
})
