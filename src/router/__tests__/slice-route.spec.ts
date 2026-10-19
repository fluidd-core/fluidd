import { describe, expect, it, test } from 'vitest'
import router from '@/router'
import { routeAfterInit } from '../afterInit'
import { isDeniedNavigation, NAVIGATION_DENYLIST } from '@/swNavigation'
import swSource from '@/sw.ts?raw'

describe('/slice', () => {
  it.each([
    ['/boxwood-367a/slice', 'Slice'],
    ['/slice', 'Slice (no printer)']
  ])('%s is the lazy Slice page, printer-independent and kept across a printer switch', (path, name) => {
    const route = router.resolve(path).route
    expect(route.name).toBe(name)
    expect(route.matched).toHaveLength(1)
    expect(route.matched[0].meta.printerIndependent).toBe(true)
    expect(route.matched[0].meta.keepOnPrinterSwitch).toBe(true)
    // A model dropped on the slicer is the slicer's, never an upload to the printer.
    expect(route.matched[0].meta.fileDropRoot).toBeUndefined()
    const component = route.matched[0].components.default as { cid?: number }
    expect(typeof component).toBe('function')
    expect(component.cid).toBeUndefined()
  })

  it.each(['/boxwood-367a/slice', '/slice'])('%s remains explicitly mode-free (KAN-550)', (path) => {
    const route = router.resolve(path).route
    expect(route.matched[0].meta.noMode).toBe(true)
  })

  it('keeps the printer\'s sign-in: not signed in, it goes to the login', () => {
    const guard = router.resolve('/boxwood-367a/slice').route.matched[0].beforeEnter
    const signedIn = router.resolve('/boxwood-367a/console').route.matched[0].beforeEnter
    expect(guard).toBe(signedIn)
  })
})

describe('where appInit sends the page (a printer switch to walnut-8987)', () => {
  const walnut = { slug: 'walnut-8987', isActive: (slug: string) => slug === 'walnut-8987' }

  test.each([
    ['/', null],
    ['/fleet', null],
    ['/slice', null],
    ['/walnut-8987/jobs', null],
    ['/boxwood-367a', '/walnut-8987'],
    ['/boxwood-367a/jobs?sort=name', '/walnut-8987/jobs?sort=name'],
    ['/boxwood-367a/slice', '/walnut-8987/slice'],
    ['/boxwood-367a/settings#macros', '/walnut-8987/settings#macros']
  ])('from %s: %s', (path, to) => {
    expect(routeAfterInit(router.resolve(path).route, walnut)).toBe(to)
  })

  it('nowhere while no printer is open', () => {
    expect(routeAfterInit(router.resolve('/boxwood-367a/jobs').route, { slug: null, isActive: () => false })).toBeNull()
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
