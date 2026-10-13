import { describe, expect, it, test } from 'vitest'
import router from '@/router'
import { routeAfterInit } from '../afterInit'
import { isDeniedNavigation, NAVIGATION_DENYLIST } from '@/swNavigation'
import swSource from '@/sw.ts?raw'

describe('/slice', () => {
  it('is the lazy Slice page, printer-independent and kept across a printer switch', () => {
    const route = router.resolve('/slice').route
    expect(route.name).toBe('Slice')
    expect(route.matched).toHaveLength(1)
    expect(route.matched[0].meta.printerIndependent).toBe(true)
    expect(route.matched[0].meta.keepOnPrinterSwitch).toBe(true)
    // A model dropped on the slicer is the slicer's, never an upload to the printer.
    expect(route.matched[0].meta.fileDropRoot).toBeUndefined()
    const component = route.matched[0].components.default as { cid?: number }
    expect(typeof component).toBe('function')
    expect(component.cid).toBeUndefined()
  })

  it('keeps the printer\'s sign-in: not signed in, it goes to the login', () => {
    const guard = router.resolve('/slice').route.matched[0].beforeEnter
    const signedIn = router.resolve('/console').route.matched[0].beforeEnter
    expect(guard).toBe(signedIn)
  })
})

describe('where appInit sends the page (a printer switch)', () => {
  test.each([
    ['/slice', null],
    ['/', null],
    ['/console', '/'],
    ['/jobs', '/']
  ])('from %s: %s', (path, to) => {
    expect(routeAfterInit(router.resolve(path).route, true)).toBe(to)
  })

  it('nowhere when not signed in to the printer', () => {
    expect(routeAfterInit(router.resolve('/console').route, false)).toBeNull()
  })
})

describe('the service worker\'s navigations', () => {
  test.each(['/slicer', '/slicer/', '/slicer?x=1', '/slicer/embed.html', '/slicer/index.html?x=1'])('leaves %s to the network (the slicer the printer serves)', (path) => {
    expect(isDeniedNavigation(path)).toBe(true)
  })

  test.each(['/', '/index.html', '/slice', '/slice?x=1', '/slicers', '/slicer-notes'])('answers %s with Fluidd', (path) => {
    expect(isDeniedNavigation(path)).toBe(false)
  })

  it('is the list the service worker uses', () => {
    expect(swSource).toMatch(/import \{ NAVIGATION_DENYLIST(, [A-Za-z]+)* \} from '\.\/swNavigation'/)
    expect(swSource).toMatch(/const denylist = import\.meta\.env\.DEV\s+\? undefined\s+: NAVIGATION_DENYLIST/)
  })

  it('keeps every earlier rule', () => {
    expect(NAVIGATION_DENYLIST.map(String)).toEqual(expect.arrayContaining([
      String(/\/websocket/),
      String(/\/(printer|api|access|machine|server)\//),
      String(/^\/auth\//),
      String(/^\/j\//)
    ]))
    expect(isDeniedNavigation('/authorize?x')).toBe(true)
  })
})
