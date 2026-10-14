/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudState, refreshPrinters, requestAccess } from '../state'
import { CloudError, storeToken } from '../api'
import { deletionState, deletionBlocksView } from '../deletion'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

describe('cloud access while deletion is pending', () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ deletion_pending: true, delete_after: 1800000000 }), { status: 403 }))
  beforeEach(() => {
    const saved = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
      removeItem: (key: string) => saved.delete(key)
    })
    localStorage.setItem('muon.cloud.url', 'https://console.example.test')
    storeToken('mock-session')
    cloudState.account = { id: 'sample', name: 'Sample', email: 'sample@example.test', created_at: 0 }
    cloudState.config = null
    deletionState.deleteAfter = 1800000000
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    storeToken(null)
    cloudState.account = null
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('does not reread a forbidden printer list once the pending state is known', async () => {
    await refreshPrinters()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(deletionState.deleteAfter).toBe(1800000000)
  })

  it('refuses remote access before registering a key or asking for a grant', async () => {
    const error = await requestAccess('p1').catch(e => e)
    expect(error).toBeInstanceOf(CloudError)
    expect(error.deletionPending).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['Library', true], ['Library print (no printer)', true], ['Link a printer', true], ['Join a printer', true],
    ['Printers', false], ['Control', false], ['Account (no printer)', false], ['Sign out', false], ['setup', false]
  ] as const)('shows the pending state on %s while leaving permitted views available', (name, blocked) => {
    expect(deletionBlocksView(name)).toBe(blocked)
  })
})
