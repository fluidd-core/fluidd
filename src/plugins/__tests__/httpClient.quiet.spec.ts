import Vue from 'vue'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventBus } from '@/eventBus'
import { HttpClientPlugin } from '../httpClient'

/**
 * KAN-547: a developer-mode refusal is shown by the page that asked, in the
 * printer's words ("Only jack@… can change developer mode…"). The client's
 * error toast would show it a second time, with its `dev-mode:<code>:`
 * prefix, so that one route is kept out of the toasts. Every other path
 * still toasts as before.
 */
const store = { state: { config: { apiUrl: '' } }, dispatch: vi.fn(async () => false), commit: vi.fn() }

function refuseWith (status: number, message: string) {
  Vue.$httpClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const response = { data: { error: { code: status, message } }, status, statusText: '', headers: {}, config }
    throw new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, {}, response)
  }
}

describe('the HTTP client\'s error toasts', () => {
  beforeEach(() => {
    HttpClientPlugin.install(Vue, { store: store as any })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('leave a developer-mode refusal to the page that asked', async () => {
    const toast = vi.spyOn(EventBus, '$emit')
    for (const status of [403, 409, 428, 500]) {
      refuseWith(status, 'dev-mode:owner_required: Only jack@example.com can change developer mode on this printer.')
      await expect(Vue.$httpClient.post('/server/muon/dev_mode/request', { enabled: true })).rejects.toBeInstanceOf(AxiosError)
      await expect(Vue.$httpClient.get('/server/muon/dev_mode/request', { params: { challenge_id: 'x' } })).rejects.toBeInstanceOf(AxiosError)
    }
    expect(toast).not.toHaveBeenCalled()
  })

  it('still toast everything else', async () => {
    const toast = vi.spyOn(EventBus, '$emit')
    refuseWith(403, 'access-denied:wifi: nope')
    await expect(Vue.$httpClient.post('/server/aux/wifi/connect', {})).rejects.toBeInstanceOf(AxiosError)
    expect(toast).toHaveBeenCalledWith('access-denied:wifi: nope', { type: 'error' })
  })
})
