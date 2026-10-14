import { describe, expect, it } from 'vitest'
import { blocksForeignHttp, browserFamily } from '../browser-family'

describe('browser family', () => {
  it('distinguishes Firefox, Safari and Chromium user agents', () => {
    expect(browserFamily('Mozilla/5.0 Firefox/130.0')).toBe('firefox')
    expect(browserFamily('Mozilla/5.0 Version/18.0 Safari/605.1.15')).toBe('safari')
    expect(browserFamily('Mozilla/5.0 Chrome/130.0 Safari/537.36')).toBe('chrome')
  })

  it('warns only for Firefox and Safari on HTTPS pages', () => {
    expect(blocksForeignHttp('https:', 'Firefox/130')).toBe(true)
    expect(blocksForeignHttp('https:', 'Version/18 Safari/605')).toBe(true)
    expect(blocksForeignHttp('https:', 'Chrome/130')).toBe(false)
    expect(blocksForeignHttp('http:', 'Firefox/130')).toBe(false)
  })
})
