import { afterEach, describe, expect, it, test } from 'vitest'
import router from '@/router'
import { setActiveSlugSource } from '../printerSlugSource'
import { isPrinterPagePath, pageOfRoute, scopedPath } from '../printerPagePaths'

afterEach(() => setActiveSlugSource(() => null))

describe("a printer's pages", () => {
  test.each([
    ['/boxwood-367a', 'Dashboard'],
    ['/boxwood-367a/jobs', 'Jobs'],
    ['/boxwood-367a/console', 'Console'],
    ['/boxwood-367a/settings', 'Settings'],
    ['/boxwood-367a/camera/front', 'Camera'],
    ['/workshop-one-367a/history', 'History'],
    ['/p-printer-a1b2/system', 'System']
  ])('%s is %s, for that printer', (path, name) => {
    const route = router.resolve(path).route
    expect(route.name).toBe(name)
    expect(route.params.printer).toBe(path.split('/')[1])
  })

  it('keeps the settings sub-navigation, a named view at the top level', () => {
    const route = router.resolve('/boxwood-367a/settings/macros/abc').route
    expect(route.name).toBe('Macros')
    expect(route.params).toMatchObject({ printer: 'boxwood-367a', categoryId: 'abc' })
    expect(route.matched.map(r => Object.keys(r.components))).toEqual([['default', 'navigation'], ['default', 'navigation']])
  })

  test.each(['/link', '/join', '/sign-in', '/setup', '/fleet', '/login', '/icons'])('%s is not a printer', (path) => {
    expect(router.resolve(path).route.params.printer).toBeUndefined()
  })

  it('opens Printers at the root', () => {
    expect(router.resolve('/').route.name).toBe('Printers')
    expect(router.resolve('/').route.meta?.printerIndependent).toBe(true)
    expect(router.resolve('/welcome').route.name).toBe('Printers')
  })
})

describe('an old address without a printer', () => {
  test.each([
    ['/jobs', '/walnut-8987/jobs'],
    ['/settings#auth', '/walnut-8987/settings#auth'],
    ['/settings/macros/abc', '/walnut-8987/settings/macros/abc'],
    ['/camera/front', '/walnut-8987/camera/front'],
    ['/configure?root=config', '/walnut-8987/configure?root=config']
  ])('%s goes to the same page of the printer Fluidd is on: %s', (path, to) => {
    setActiveSlugSource(() => 'walnut-8987')
    expect(router.resolve(path).route.fullPath).toBe(to)
  })

  it('goes to Printers when Fluidd is on no printer', () => {
    expect(router.resolve('/jobs').route.fullPath).toBe('/')
  })

  it('is a page with no printer for the slicer, which works without one', () => {
    expect(router.resolve('/slice').route.name).toBe('Slice (no printer)')
  })
})

describe('links written without the printer', () => {
  it('are for the printer Fluidd is on', () => {
    expect(scopedPath('/', 'walnut-8987')).toBe('/walnut-8987')
    expect(scopedPath('/jobs', 'walnut-8987')).toBe('/walnut-8987/jobs')
    expect(scopedPath('/settings#theme', 'walnut-8987')).toBe('/walnut-8987/settings#theme')
    expect(scopedPath('/fleet', 'walnut-8987')).toBe('/fleet')
    expect(scopedPath('/jobs', null)).toBe('/jobs')
  })

  it('know which pages belong to a printer', () => {
    expect(isPrinterPagePath('/jobs')).toBe(true)
    expect(isPrinterPagePath('/jobsite')).toBe(false)
    expect(isPrinterPagePath('/link')).toBe(false)
  })
})

describe('the page a route is, without its printer', () => {
  test.each([
    ['/boxwood-367a', '/'],
    ['/boxwood-367a/console', '/console'],
    ['/boxwood-367a/settings/macros/abc', '/settings/macros/abc'],
    ['/p-printer-a1b2/diagnostics', '/diagnostics'],
    ['/link', '/link'],
    ['/', '/']
  ])('%s is %s', (path, page) => {
    expect(pageOfRoute(router.resolve(path).route)).toBe(page)
  })
})
