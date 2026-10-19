import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosAdapter, AxiosInstance } from 'axios'
import { EventBus } from '@/eventBus'
import { HttpClientPlugin } from '../httpClient'
import { MANAGED_API_URL } from '@/services/muon-cloud/origin'

/** What muon-link answers a request no remote role may make (crates/muon-link-device/src/proxy.rs). */
const REFUSAL = { error: 'muon-link policy refused this request: denied for every role: the Aux API proxy' }

function client (apiUrl: string, status: number, data: unknown): AxiosInstance {
  const store = { state: { config: { apiUrl } }, dispatch: vi.fn(async () => false), commit: vi.fn() }
  const host: any = { prototype: {} }
  HttpClientPlugin.install(host, { store: store as never })
  const http: AxiosInstance = host.$httpClient
  http.defaults.baseURL = apiUrl
  const adapter: AxiosAdapter = async config => {
    const response = { data, status, statusText: '', headers: {}, config, request: undefined }
    if (config.validateStatus?.(status)) return response
    throw Object.assign(new Error(`Request failed with status code ${status}`), { isAxiosError: true, response, config })
  }
  http.defaults.adapter = adapter
  return http
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('a request the cloud gateway refuses', () => {
  it('raises no toast for a read: the page already shows the feature as unavailable', async () => {
    // 14 Oct: each refused read on Boxwood through Muon3D toasted "Server error".
    const toast = vi.spyOn(EventBus, '$emit')
    await expect(client(MANAGED_API_URL, 403, REFUSAL).get('/server/aux/update/status')).rejects.toThrow()
    expect(toast).not.toHaveBeenCalled()
  })

  it('says why when something the person asked for is refused', async () => {
    const toast = vi.spyOn(EventBus, '$emit')
    await expect(client(MANAGED_API_URL, 403, REFUSAL).post('/server/aux/wifi/connect', {})).rejects.toThrow()
    expect(toast).toHaveBeenCalledWith(REFUSAL.error, { type: 'error' })
  })

  it('still toasts a refusal from a printer on the network', async () => {
    const toast = vi.spyOn(EventBus, '$emit')
    await expect(client('http://192.168.137.73', 403, { error: { message: 'Forbidden' } }).get('/server/aux/update/status')).rejects.toThrow()
    expect(toast).toHaveBeenCalledWith('Forbidden', { type: 'error' })
  })
})
