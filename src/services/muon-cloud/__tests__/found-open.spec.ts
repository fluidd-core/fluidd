import { describe, expect, it } from 'vitest'
import { foundOpenFor } from '../found-open'

const row = (over: Record<string, unknown> = {}) => ({
  key: 'k',
  name: 'boxwood-367a',
  host: '192.168.1.20',
  meta: '',
  status: 'in your account',
  linked: true,
  canLink: false,
  cloudId: 'printer-abc',
  action: 'open',
  ...over
}) as any
const entry = (r: any) => ({ endpointId: 'printer-abc', row: r, lan: undefined }) as any

describe('opening a found-nearby tile', () => {
  it('uses the relay for an account printer on https', () => {
    expect(foundOpenFor(entry(row()), [{ id: 'printer-abc' }], true, 'https:')).toEqual({ kind: 'relay', printerId: 'printer-abc' })
  })

  it('asks for sign-in when a linked printer is found and nobody is signed in', () => {
    expect(foundOpenFor(entry(row()), [], false, 'https:')).toEqual({ kind: 'sign-in' })
  })

  it('keeps the LAN way on http', () => {
    expect(foundOpenFor(entry(row()), [{ id: 'printer-abc' }], true, 'http:')).toEqual({ kind: 'local' })
  })

  it('keeps the LAN way for an unlinked printer', () => {
    expect(foundOpenFor(entry(row({ linked: false })), [], false, 'https:')).toEqual({ kind: 'local' })
  })

  it('keeps the LAN way for a printer linked to another account', () => {
    expect(foundOpenFor(entry(row()), [{ id: 'printer-other' }], true, 'https:')).toEqual({ kind: 'local' })
  })
})
