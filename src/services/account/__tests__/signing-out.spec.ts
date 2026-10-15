import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountError } from '../client'
import { forgetSignedOut, noteSignedOut, readSignedOut, SIGNED_OUT_KEY } from '../signed-out-note'
import { beginSignOut, endEverySession, signOutNow } from '../sign-out'
import type { Session } from '../api'

const endSessions = vi.hoisted(() => vi.fn())
const endSession = vi.hoisted(() => vi.fn(async () => ({ ok: true })))
const sessions = vi.hoisted(() => vi.fn())
vi.mock('../api', async (actual) => ({
  ...(await actual() as object),
  accountApi: { endSessions, endSession, sessions }
}))
const signOut = vi.hoisted(() => vi.fn(async () => true))
const cloud = vi.hoisted(() => ({ account: { id: 'a1', email: 'jack@muon3d.com', name: 'Jack Smith' } as unknown, activePrinterId: null as string | null }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: cloud, signOut }))
vi.mock('@/services/muon-cloud/activate', () => ({ activationState: { switching: null } }))
const central = vi.hoisted(() => ({ on: true }))
vi.mock('@/services/muon-cloud/centralLogin', () => ({ centralLoginEnabled: () => central.on }))

const NOW = 1_800_000_000

function session (id: string, extra: Partial<Session> = {}): Session {
  return { id, device: id, endpoint_id: null, kind: 'rotating', client_id: null, created_at: NOW, last_used_at: NOW, expires_at: NOW + 1, current: false, ...extra }
}

describe('the note the signed-out page reads', () => {
  afterEach(() => sessionStorage.clear())

  it('is kept for two minutes, in this tab only', () => {
    noteSignedOut({ scope: 'everywhere', email: 'jack@muon3d.com', password: true }, 1000)
    expect(JSON.parse(sessionStorage.getItem(SIGNED_OUT_KEY)!)).toMatchObject({ scope: 'everywhere', at: 1000 })
    expect(readSignedOut(1000 + 60_000)).toMatchObject({ scope: 'everywhere', email: 'jack@muon3d.com', password: true })
    expect(readSignedOut(1000 + 3 * 60_000)).toBeNull()
    forgetSignedOut()
    expect(readSignedOut(1000)).toBeNull()
  })

  it('reads nothing it doesn\'t understand', () => {
    sessionStorage.setItem(SIGNED_OUT_KEY, '{"at":1000,"scope":"elsewhere"}')
    expect(readSignedOut(1000)).toBeNull()
    sessionStorage.setItem(SIGNED_OUT_KEY, 'not json')
    expect(readSignedOut(1000)).toBeNull()
  })
})

describe('signing out', () => {
  beforeEach(() => {
    central.on = true
    cloud.account = { id: 'a1', email: 'jack@muon3d.com', name: 'Jack Smith' }
  })

  afterEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('signs this browser out from the menu without opening a choice page or ending other devices', async () => {
    const router = { push: vi.fn(async () => {}) }
    await beginSignOut(router as never)
    expect(signOut).toHaveBeenCalledOnce()
    expect(router.push).not.toHaveBeenCalled()
    expect(endSessions).not.toHaveBeenCalled()
    expect(readSignedOut()).toMatchObject({ scope: 'browser' })
  })

  it('signs out at once on a printer\'s own page, and says so after', async () => {
    central.on = false
    signOut.mockResolvedValueOnce(false)
    const router = { push: vi.fn(async () => {}) }
    await beginSignOut(router as never)
    expect(signOut).toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/signed-out')
    expect(readSignedOut()).toMatchObject({ scope: 'browser', email: 'jack@muon3d.com' })
  })

  it('notes where it signed out before the console takes the page away', async () => {
    await signOutNow('everywhere', { password: true })
    expect(readSignedOut()).toMatchObject({ scope: 'everywhere', password: true })
    expect(signOut).toHaveBeenCalled()
  })

  it('ends every session with one call on a console that has it', async () => {
    endSessions.mockResolvedValueOnce({ ok: true, ended: 4 })
    await endEverySession()
    expect(endSessions).toHaveBeenCalledWith('all')
    expect(sessions).not.toHaveBeenCalled()
  })

  it('on an older console, ends them one at a time: browsers last, this page\'s own left to the sign-out', async () => {
    endSessions.mockRejectedValueOnce(new AccountError('Not found.', 404, {}))
    sessions.mockResolvedValueOnce({
      sessions: [
        session('here', { current: true, parent_id: 'my-browser' }),
        session('my-browser', { kind: 'browser' }),
        session('mac', { kind: 'browser' }),
        session('phone'),
        session('slicer', { client_id: 'slicer' })
      ]
    })
    await endEverySession()
    expect(endSession.mock.calls.map(c => (c as unknown[])[0])).toEqual(['phone', 'slicer', 'mac'])
  })

  it('stops on any other refusal, so nothing is half done unseen', async () => {
    endSessions.mockRejectedValueOnce(new AccountError('Too many requests.', 429, { error: 'too many requests' }))
    await expect(endEverySession()).rejects.toThrow('Too many requests.')
    expect(endSession).not.toHaveBeenCalled()
  })
})
