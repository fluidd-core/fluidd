/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
import { afterEach, expect, it, vi } from 'vitest'
import { cloudApi, REFRESH_KEY, storeToken, storedToken, TOKEN_KEY } from '../api'
import { checkCentralSession } from '../centralLogin'
import { initCloud, signOut } from '../state'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); sessionStorage.clear() })

it('keeps the refreshed token when the saved session needed refreshing to load the account', async () => {
  vi.useFakeTimers()
  storeToken('expired')
  vi.spyOn(cloudApi, 'me').mockImplementation(async () => {
    storeToken('fresh')
    return { account: { id: 'account', name: 'Jack', email: 'jack@example.test', created_at: 1 }, endpoint_id: null }
  })
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: {} })
  await initCloud()
  expect(storedToken()).toBe('fresh')
})

it('reports the pending central logout navigation so the caller does not reload over its form post', async () => {
  const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
  expect(await signOut()).toBe(true)
  expect(submit).toHaveBeenCalledOnce()
  const form = document.querySelector('form')!
  expect(form.action).toBe('https://control.muon3d.com/logout')
  expect(form.method).toBe('post')
  expect(new FormData(form).get('client_id')).toBe('fluidd')
  form.remove()
})

it('writes the access and refresh keys on sign-in and clears both on sign-out', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (new URL(url).pathname === '/token') {
      return new Response(JSON.stringify({ access_token: 'access', refresh_token: 'refresh', token_type: 'Bearer', expires_in: 900 }))
    }
    const state = new URL(url).searchParams.get('state')
    return { ok: true, redirected: true, url: `https://control.muon3d.com/?state=${state}&iss=https%3A%2F%2Fcontrol.muon3d.com&code=test`, body: { cancel: vi.fn() } } as unknown as Response
  }))
  await checkCentralSession()
  expect(localStorage.getItem(TOKEN_KEY)).toBe('access')
  expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh')

  vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
  await signOut()
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  document.querySelector('form')?.remove()
})
