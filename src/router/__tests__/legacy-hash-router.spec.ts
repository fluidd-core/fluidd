import { describe, expect, it, vi } from 'vitest'
import router from '@/router'

// An old address, from before path routing: the link QR code's hash form.
vi.hoisted(() => {
  window.history.replaceState(null, '', '/#/link?code=482913')
})

describe('the router, loaded at an old hash address', () => {
  it('moves the address to its path before it reads it', () => {
    expect(window.location.pathname).toBe('/link')
    expect(window.location.search).toBe('?code=482913')
    expect(window.location.hash).toBe('')
  })

  it('routes by path, and starts on the link page with the code', () => {
    expect(router.mode).toBe('history')
    const route = router.resolve(`${window.location.pathname}${window.location.search}`).route

    expect(route.name).toBe('Link a printer')
    expect(route.query.code).toBe('482913')
  })
})
