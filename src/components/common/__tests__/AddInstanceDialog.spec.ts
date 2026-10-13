import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import AddInstanceDialog from '../AddInstanceDialog.vue'
import { bindHttpClientToPrinterTransport } from '@/services/managed-session/httpTransportBinding'
import type { PrinterTransport } from '@/services/managed-transport'

const mocks = {
  $t: (key: string) => key,
  $filters: {
    getApiUrls: (url: string) => ({ apiUrl: url, socketUrl: `${url.replace(/^http/, 'ws')}/websocket` })
  },
  $rules: { required: () => true },
  $store: { state: { config: { hostConfig: { hosted: false } } }, getters: {} }
}

describe('AddInstanceDialog', () => {
  it('routes a non-Muon Klipper printer into separate setup rather than an M1 instance', () => {
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })
    const vm = wrapper.vm as any
    vm.url = 'http://192.168.1.50'
    vm.outcome = 'klipper'
    vm.verified = true
    vm.addInstance()
    expect(wrapper.emitted('resolve')).toBeUndefined()
    expect(vm.selectedKind).toBe('moonraker')
    expect(vm.foreignHost).toBe('192.168.1.50')
    expect(vm.foreignVerified).toBe(false)
    wrapper.destroy()
  })

  it('ignores a successful probe after the address was edited', async () => {
    let answer!: (response: Response) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { answer = resolve })))
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })
    const vm = wrapper.vm as any
    vm.selectBrand('octoprint')
    vm.foreignHost = '192.168.1.10'
    await wrapper.vm.$nextTick()
    const probe = vm.probeForeign()
    vm.foreignHost = '192.168.1.11'
    await wrapper.vm.$nextTick()
    answer(new Response('{"api":"0.1","server":"1.11.3"}'))
    await probe
    expect(vm.foreignVerified).toBe(false)
    expect(vm.foreignHost).toBe('192.168.1.11')
    wrapper.destroy()
    vi.unstubAllGlobals()
  })

  it('invalidates a direct printer probe when the address or key changes', async () => {
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })
    const vm = wrapper.vm as any
    vm.selectBrand('octoprint')
    vm.foreignHost = '192.168.1.10'
    await wrapper.vm.$nextTick()
    vm.foreignVerified = true
    vm.foreignHost = '192.168.1.11'
    await wrapper.vm.$nextTick()
    expect(vm.foreignVerified).toBe(false)
    vm.foreignVerified = true
    vm.apiKey = 'changed'
    await wrapper.vm.$nextTick()
    expect(vm.foreignVerified).toBe(false)
    wrapper.destroy()
  })

  let fetch: Mock<Parameters<PrinterTransport['fetch']>, ReturnType<PrinterTransport['fetch']>>
  let release: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    // A cloud printer is showing: Fluidd's client travels over Iroh and
    // carries that printer's sign-in.
    const httpClient = axios.create()
    httpClient.defaults.headers.common.Authorization = 'Bearer cloud-printer-token'
    Vue.$httpClient = httpClient as typeof Vue.$httpClient
    fetch = vi.fn<Parameters<PrinterTransport['fetch']>, ReturnType<PrinterTransport['fetch']>>(async () => new Response('{"result":{}}', { status: 200 }))
    release = bindHttpClientToPrinterTransport(httpClient, { fetch, openWebSocket: vi.fn(), close: vi.fn() })
  })

  afterEach(() => {
    release()
    vi.useRealTimers()
    vi.restoreAllMocks()
    delete (Vue as { $httpClient?: unknown }).$httpClient
  })

  it('checks a typed address on the network, not over the cloud printer, and without its sign-in', async () => {
    // Not a Muon3D printer: its identity is not found, so Moonraker is asked.
    const network = vi.fn(async () => new Response('', { status: 404 }))
    vi.stubGlobal('fetch', network)
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ status: 200, data: {} })
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })

    ;(wrapper.vm as any).url = 'http://192.168.1.50'
    await vi.advanceTimersByTimeAsync(750)

    expect(fetch).not.toHaveBeenCalled()
    expect((network.mock.calls[0] as unknown[])[0]).toBe('http://192.168.1.50/server/muon/identity')
    expect(get).toHaveBeenCalledTimes(1)
    const [url, config] = get.mock.calls[0]
    expect(url).toMatch(/^http:\/\/192\.168\.1\.50\/server\/info\?t=\d+$/)
    expect(JSON.stringify(config)).not.toContain('cloud-printer-token')
    expect((wrapper.vm as any).verified).toBe(true)
    // It answered as Moonraker, not as a Muon printer: it can still be added, and the box says so.
    expect((wrapper.vm as any).outcome).toBe('klipper')
    expect((wrapper.vm as any).status.title).toBe("A printer answered, but it isn't a Muon printer")
    vi.unstubAllGlobals()
  })

  it('finds a Muon3D printer by its name, trying .local when the bare name does not answer', async () => {
    const endpointId = 'f1f6920f'.repeat(8)
    const network = vi.fn(async (url: string) => {
      if (url.startsWith('http://muon-boxwood-367a/')) throw new TypeError('Failed to fetch')
      if (url.endsWith('/server/muon/identity')) {
        return new Response(JSON.stringify({ result: { display: 'Boxwood · 367A', endpoint_id: endpointId } }), { status: 200 })
      }
      return new Response('{"result":{}}', { status: 200 })
    })
    vi.stubGlobal('fetch', network)
    const get = vi.spyOn(axios, 'get')
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })

    ;(wrapper.vm as any).url = 'muon-boxwood-367a'
    await vi.advanceTimersByTimeAsync(750)

    expect(fetch).not.toHaveBeenCalled()
    expect(get).not.toHaveBeenCalled()
    expect((wrapper.vm as any).verified).toBe(true)
    expect((wrapper.vm as any).outcome).toBe('muon')
    expect((wrapper.vm as any).status.title).toBe('Found Boxwood · 367A')
    expect((wrapper.vm as any).addLabel).toBe('Add Boxwood · 367A')
    ;(wrapper.vm as any).addInstance()
    expect(wrapper.emitted('resolve')?.[0][0]).toMatchObject({
      name: 'Boxwood · 367A',
      apiUrl: 'http://muon-boxwood-367a.local',
      socketUrl: 'ws://muon-boxwood-367a.local/websocket',
      endpointId
    })
    vi.unstubAllGlobals()
  })

  it('checks a pasted address, which reaches the watcher before the form revalidates', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })))
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ status: 200, data: {} })
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })
    ;(wrapper.vm as any).valid = false

    ;(wrapper.vm as any).url = 'http://192.168.1.52'
    // The watcher runs now, while the form still reads as invalid.
    await wrapper.vm.$nextTick()
    ;(wrapper.vm as any).valid = true
    await vi.advanceTimersByTimeAsync(750)

    expect(get).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('does not verify an address that does not answer', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue(Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      request: {}
    }))
    const noCors = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', noCors)
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })

    ;(wrapper.vm as any).url = 'http://192.168.1.51'
    await vi.advanceTimersByTimeAsync(750)

    expect(fetch).not.toHaveBeenCalled()
    expect((wrapper.vm as any).verified).toBe(false)
    expect((wrapper.vm as any).verifying).toBe(false)
    expect((wrapper.vm as any).outcome).toBe('unreachable')
    expect((wrapper.vm as any).status.title).toBe('Nothing answered at 192.168.1.51')
    ;(wrapper.vm as any).addInstance()
    expect(wrapper.emitted('resolve')).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('says a Muon printer that wants a sign-in needs one, and still adds it', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/server/muon/identity')) {
        return new Response(JSON.stringify({ result: { display: 'Walnut · 8987' } }), { status: 200 })
      }
      if (url.includes('/printer/objects/query')) return new Response('', { status: 401 })
      return new Response('{"result":{}}', { status: 200 })
    }))
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })

    ;(wrapper.vm as any).url = '192.168.1.53'
    await vi.advanceTimersByTimeAsync(750)

    expect((wrapper.vm as any).outcome).toBe('locked')
    expect((wrapper.vm as any).status.title).toBe('Walnut · 8987 wants you to sign in')
    expect((wrapper.vm as any).verified).toBe(true)
    vi.unstubAllGlobals()
  })

  it('says something that answers, but not as a printer, is not one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })))
    vi.spyOn(axios, 'get').mockRejectedValue(Object.assign(new Error('Request failed with status code 404'), {
      isAxiosError: true,
      request: {},
      response: { status: 404 }
    }))
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })

    ;(wrapper.vm as any).url = 'http://192.168.1.54'
    await vi.advanceTimersByTimeAsync(750)

    expect((wrapper.vm as any).outcome).toBe('not-printer')
    expect((wrapper.vm as any).verifying).toBe(false)
    expect((wrapper.vm as any).verified).toBe(false)
    vi.unstubAllGlobals()
  })

  it('says an address that is not one is not, without asking the network', async () => {
    const network = vi.fn()
    vi.stubGlobal('fetch', network)
    const wrapper = shallowMount(AddInstanceDialog, {
      mocks: { ...mocks, $filters: { getApiUrls: () => { throw new Error('Invalid URL') } } },
      propsData: { value: true }
    })

    ;(wrapper.vm as any).url = 'http://'
    await vi.advanceTimersByTimeAsync(750)

    expect((wrapper.vm as any).outcome).toBe('invalid')
    expect(network).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('offers the printers found on this network, and one tap picks one', async () => {
    const found = [{ key: 'lan:walnut', name: 'Walnut · 8987', detail: '192.168.1.44' }]
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true, found }, stubs: { M3Dialog: { template: '<div><slot /><slot name="actions" /></div>' } } })

    const choice = wrapper.find('[data-tid="add-printer-found-lan:walnut"]')
    expect(choice.text()).toContain('Walnut · 8987')
    expect(choice.text()).toContain('192.168.1.44')
    await choice.trigger('click')

    expect(wrapper.emitted('pick')).toEqual([['lan:walnut']])
    expect(wrapper.emitted('input')).toEqual([[false]])
  })
})
