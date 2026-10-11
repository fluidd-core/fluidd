import { describe, expect, it } from 'vitest'
import { pathForLegacyHash } from '../legacyHash'

const at = (pathname: string, search: string, hash: string) => ({ pathname, search, hash })

describe('pathForLegacyHash', () => {
  it('turns a hash route into its path', () => {
    expect(pathForLegacyHash(at('/', '', '#/jobs'))).toBe('/jobs')
    expect(pathForLegacyHash(at('/', '', '#/'))).toBe('/')
  })

  it("keeps the route's own query and its own fragment", () => {
    expect(pathForLegacyHash(at('/', '', '#/link?code=482913'))).toBe('/link?code=482913')
    expect(pathForLegacyHash(at('/', '', '#/settings#auth'))).toBe('/settings#auth')
    expect(pathForLegacyHash(at('/', '', '#/settings?x=1#auth'))).toBe('/settings?x=1#auth')
  })

  it('keeps a query that came before the hash when the route has none', () => {
    expect(pathForLegacyHash(at('/', '?code=c0de&state=s', '#/'))).toBe('/?code=c0de&state=s')
    expect(pathForLegacyHash(at('/', '?a=1', '#/join?code=X'))).toBe('/join?code=X')
  })

  it('lands on the route itself whatever path the old address was opened at', () => {
    // nginx sends /setup to /#/setup, and an old index.html could be served anywhere.
    expect(pathForLegacyHash(at('/setup', '', '#/setup'))).toBe('/setup')
    expect(pathForLegacyHash(at('/fluidd/', '', '#/console'))).toBe('/console')
  })

  it('never makes a protocol-relative address', () => {
    expect(pathForLegacyHash(at('/', '', '#//evil.example/x'))).toBe('/evil.example/x')
  })

  it('leaves an address that is not a hash route alone', () => {
    for (const hash of ['', '#', '#auth', '#macros']) {
      expect(pathForLegacyHash(at('/settings', '', hash))).toBeNull()
    }
  })
})
