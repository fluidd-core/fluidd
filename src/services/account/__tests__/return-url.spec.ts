import { describe, expect, it } from 'vitest'
import { libraryReturnUrl } from '../model'

describe('Library account return URL', () => {
  it.each([
    'http://library.muon3d.com/account',
    'https://evil.example/account',
    'https://library.muon3d.com@evil.example/account',
    '//library.muon3d.com/account',
    'https://library.muon3d.com:444/account'
  ])('rejects %s', value => expect(libraryReturnUrl(value)).toBeNull())

  it('accepts production and staging Library URLs', () => {
    expect(libraryReturnUrl('https://library.muon3d.com/library?q=1')).toBe('https://library.muon3d.com/library?q=1')
    expect(libraryReturnUrl('https://staging.library.muon3d.com/')).toBe('https://staging.library.muon3d.com/')
  })
})
