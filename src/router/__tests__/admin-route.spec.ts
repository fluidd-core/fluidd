import { describe, expect, it } from 'vitest'
import router from '@/router'
import { isManagedConsolePath } from '../managedPath'

describe('the hosted staff route', () => {
  it('is lazy, independent of printers and has its own staff frame', () => {
    const route = router.resolve('/admin').route
    expect(route.name).toBe('Admin')
    expect(route.params.printer).toBeUndefined()
    expect(route.meta?.printerIndependent).toBe(true)
    expect(isManagedConsolePath('/admin')).toBe(true)
    expect(typeof route.matched[0].components.default).toBe('function')
  })
})
