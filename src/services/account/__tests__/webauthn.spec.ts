import { describe, expect, it } from 'vitest'
import { creationOptions, credentialJson, deviceLabel, fromBase64url, requestOptions, toBase64url } from '../webauthn'

const bytes = (...b: number[]) => new Uint8Array(b).buffer

describe('passkeys, as the console reads them', () => {
  it('writes and reads base64url without padding, as the console does', () => {
    expect(toBase64url(bytes(0xfb, 0xff, 0x01))).toBe('-_8B')
    expect(new Uint8Array(fromBase64url('-_8B'))).toEqual(new Uint8Array([0xfb, 0xff, 0x01]))
    expect(Array.from(new Uint8Array(fromBase64url('YWNjdDE')))).toEqual([97, 99, 99, 116, 49])
  })

  it('turns the creation options\' binary fields into bytes', () => {
    const options = creationOptions({
      challenge: 'AAEC',
      rp: { id: 'muon3d.com', name: 'Muon3D' },
      user: { id: 'YWNjdDE', name: 'jack@muon3d.com', displayName: 'Jack Smith' },
      excludeCredentials: [{ type: 'public-key', id: 'AQ' }]
    })
    expect(new Uint8Array(options.challenge as ArrayBuffer)).toEqual(new Uint8Array([0, 1, 2]))
    expect(new TextDecoder().decode(options.user.id as ArrayBuffer)).toBe('acct1')
    expect(new Uint8Array(options.excludeCredentials![0].id as ArrayBuffer)).toEqual(new Uint8Array([1]))
    expect(options.rp.id).toBe('muon3d.com')
  })

  it('leaves an empty allow list empty, so any passkey on the device may answer', () => {
    const options = requestOptions({ challenge: 'AAEC', rpId: 'muon3d.com', allowCredentials: [] })
    expect(options.allowCredentials).toEqual([])
  })

  it('sends the credential back with base64url fields', () => {
    const credential = {
      id: 'cred-1',
      rawId: bytes(1, 2),
      type: 'public-key',
      response: { clientDataJSON: bytes(3), authenticatorData: bytes(4), signature: bytes(5), userHandle: bytes(6) }
    } as unknown as PublicKeyCredential
    expect(credentialJson(credential)).toEqual({
      id: 'cred-1',
      rawId: 'AQI',
      type: 'public-key',
      response: { clientDataJSON: 'Aw', authenticatorData: 'BA', signature: 'BQ', userHandle: 'Bg' }
    })
  })

  it('names a passkey after the browser it was made in', () => {
    expect(deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36')).toBe('Chrome on Windows')
    expect(deviceLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15')).toBe('Safari on a Mac')
    expect(deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1')).toBe('Safari on an iPhone')
    expect(deviceLabel('Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0')).toBe('Firefox on Linux')
  })
})
