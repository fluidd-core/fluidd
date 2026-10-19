import { beforeEach, describe, expect, it, vi } from 'vitest'
import { actions } from '../actions'
import { MANAGED_API_URL } from '@/services/muon-cloud/origin'

const http = vi.hoisted(() => ({
  accessCurrentUserGet: vi.fn(),
  accessUsersListGet: vi.fn(),
  accessApiKeyGet: vi.fn(),
  defaults: { headers: { common: {} } }
}))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: http }))
const router = vi.hoisted(() => ({ currentRoute: { path: '/boxwood-367a' }, push: vi.fn() }))
vi.mock('@/router', () => ({ default: router }))

const init = (apiUrl: string) => {
  const commit = vi.fn()
  const run = actions.init as (context: object) => Promise<void>
  return { commit, done: run({ commit, rootState: { config: { apiUrl } } }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  http.accessCurrentUserGet.mockResolvedValue({ data: { result: { username: 'jack' } } })
  http.accessUsersListGet.mockResolvedValue({ data: { result: { users: [] } } })
  http.accessApiKeyGet.mockResolvedValue({ data: { result: 'key' } })
})

describe('auth/init', () => {
  it('asks a cloud printer for none of the endpoints its gateway always refuses', async () => {
    const { commit, done } = init(MANAGED_API_URL)
    await done

    expect(http.accessCurrentUserGet).not.toHaveBeenCalled()
    expect(http.accessUsersListGet).not.toHaveBeenCalled()
    expect(http.accessApiKeyGet).not.toHaveBeenCalled()
    expect(commit).not.toHaveBeenCalled()
  })

  it('still loads the user, the user list and the API key from a printer on the LAN', async () => {
    const { commit, done } = init('http://192.168.1.153')
    await done

    expect(http.accessCurrentUserGet).toHaveBeenCalledOnce()
    expect(http.accessUsersListGet).toHaveBeenCalledOnce()
    expect(http.accessApiKeyGet).toHaveBeenCalledOnce()
    expect(commit).toHaveBeenCalledWith('setCurrentUser', { username: 'jack' })
    expect(commit).toHaveBeenCalledWith('setUsers', [])
    expect(commit).toHaveBeenCalledWith('setApiKey', 'key')
  })
})

describe('auth/logout', () => {
  it("never sends a cloud printer to Moonraker's login page", async () => {
    // A 401 through the gateway used to close the socket and push /login,
    // whose password muon-link refuses to every remote role.
    const commit = vi.fn()
    const logout = actions.logout as (context: object) => Promise<void>
    await logout({ commit, rootState: { config: { apiUrl: MANAGED_API_URL } }, rootGetters: { 'config/getTokenKeys': {} } })

    expect(commit).not.toHaveBeenCalledWith('setAuthenticated', false)
    expect(router.push).not.toHaveBeenCalled()
  })
})
