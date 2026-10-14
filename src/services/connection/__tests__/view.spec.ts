import { describe, expect, it } from 'vitest'
import { connectionView, retryIn, type ConnectionFacts } from '../view'

const up: ConnectionFacts = {
  socketConnected: true,
  apiConnected: true,
  authenticated: true,
  socketConnecting: false,
  wasConnected: true,
  stalled: false,
  printerIndependent: false,
  otherPrinter: false
}
const dropped: ConnectionFacts = { ...up, socketConnected: false, apiConnected: false, socketConnecting: true }

describe('what the connection shows', () => {
  it('is the page, with nothing over it, while connected', () => {
    expect(connectionView(up)).toEqual({ page: true, stale: false, banner: null, screen: null })
  })

  it('says the printer is updating, not unreachable, when it went quiet mid-install', () => {
    expect(connectionView({ ...dropped, updating: 'updating' })).toEqual({ page: false, stale: false, banner: null, screen: 'updating' })
    expect(connectionView({ ...dropped, updating: 'updating-late' }).screen).toBe('updating-late')
    expect(connectionView({ ...up, updating: 'updating' }).screen).toBeNull()
  })

  it('says so quietly when the printer goes silent, without taking the page down', () => {
    expect(connectionView({ ...up, stalled: true })).toMatchObject({ page: true, banner: 'quiet', stale: false })
  })

  it('keeps the page, out of date, under a trying-again bar after a drop', () => {
    expect(connectionView(dropped)).toEqual({ page: true, stale: true, banner: 'reconnecting', screen: null })
  })

  it('gives a printer never reached a screen of its own: connecting, then unreachable', () => {
    expect(connectionView({ ...dropped, wasConnected: false })).toMatchObject({ page: false, screen: 'connecting' })
    expect(connectionView({ ...dropped, wasConnected: false, socketConnecting: false })).toMatchObject({ page: false, screen: 'unreachable' })
  })

  it('shows the login page when the printer answers and wants one', () => {
    expect(connectionView({ ...dropped, wasConnected: false, apiConnected: true, authenticated: false })).toMatchObject({ page: true, screen: null })
  })

  it('leaves pages that are no printer\'s, and a printer still opening, alone', () => {
    expect(connectionView({ ...dropped, wasConnected: false, printerIndependent: true })).toMatchObject({ page: true, screen: null, banner: null })
    expect(connectionView({ ...dropped, otherPrinter: true })).toMatchObject({ page: true, banner: null })
  })
})

it('says the wait before the next try in seconds, then minutes', () => {
  expect(retryIn(3200)).toBe('4 s')
  expect(retryIn(0)).toBe('1 s')
  expect(retryIn(65_000)).toBe('1 min 5 s')
  expect(retryIn(120_000)).toBe('2 min')
})
