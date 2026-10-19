import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MANAGED_API_URL } from '@/services/muon-cloud/origin'

// init.ts imports the store and the router, which are slow to load and not
// under test here. The store records what appInit tells it.
const fake = vi.hoisted(() => {
  const state = { config: { apiUrl: '' }, auth: { authenticated: false } }
  const commits: Array<[string, unknown]> = []
  return {
    state,
    commits,
    store: {
      state,
      commit: (name: string, payload: unknown) => {
        commits.push([name, payload])
        if (name === 'auth/setAuthenticated') state.auth.authenticated = payload as boolean
      },
      dispatch: async (name: string, payload?: any) => {
        if (name === 'reset') state.auth.authenticated = false
        if (name === 'config/onInitApiConfig') state.config.apiUrl = payload.apiUrl
      }
    }
  }
})
vi.mock('@/store', () => ({ default: fake.store }))
vi.mock('@/router', () => ({ default: { currentRoute: { path: '/', params: {} }, replace: vi.fn(async () => {}) } }))
vi.mock('@/services/printer-pages', () => ({
  activeSlug: () => null,
  correctAddress: vi.fn(),
  isActiveSlug: () => false,
  learnActiveIdentity: vi.fn(async () => null)
}))
const http = vi.hoisted(() => ({
  serverDatabaseItemGet: vi.fn(),
  serverDatabaseItemPost: vi.fn(async () => ({})),
  defaults: { baseURL: '', headers: { common: {} } }
}))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: http }))

const { appInit } = await import('@/init')

const lan = { apiUrl: 'http://192.168.137.73', socketUrl: 'ws://192.168.137.73/websocket' }
const cloud = { apiUrl: MANAGED_API_URL, socketUrl: 'wss://muon-cloud.invalid/websocket' }
const HOST = { endpoints: [], blacklist: [], hosted: false, themePresets: [] }

function refusedWith (status: number) {
  return Object.assign(new Error(`Request failed with status code ${status}`), { isAxiosError: true, response: { status } })
}

beforeEach(() => {
  fake.commits.length = 0
  fake.state.auth.authenticated = false
  http.serverDatabaseItemGet.mockReset()
})

describe('appInit and the printer\'s own login', () => {
  it('does not take a printer still being opened for one that wants its login', async () => {
    // Through Muon3D the first answer takes seconds. Until it came, a reset
    // store read as "answered, not signed in", and the page went to the
    // login (Boxwood, 14 Oct 2026).
    let answer!: (value: unknown) => void
    http.serverDatabaseItemGet.mockReturnValue(new Promise(resolve => { answer = resolve }))
    const loading = appInit(cloud, HOST as never)
    await vi.waitFor(() => expect(http.serverDatabaseItemGet).toHaveBeenCalled())

    expect(fake.state.auth.authenticated).toBe(true)

    answer({ data: { result: { value: {} } } })
    await loading
    expect(fake.state.auth.authenticated).toBe(true)
  })

  it('still signs out when a printer on the network answers 401', async () => {
    http.serverDatabaseItemGet.mockRejectedValue(refusedWith(401))
    const config = await appInit(lan, HOST as never)

    expect(config.apiAuthenticated).toBe(false)
    expect(fake.state.auth.authenticated).toBe(false)
  })

  it('never asks for Moonraker\'s login through Muon3D, even on a 401', async () => {
    http.serverDatabaseItemGet.mockRejectedValue(refusedWith(401))
    const config = await appInit(cloud, HOST as never)

    expect(config.apiAuthenticated).toBe(true)
    expect(fake.commits).not.toContainEqual(['auth/setAuthenticated', false])
  })
})
