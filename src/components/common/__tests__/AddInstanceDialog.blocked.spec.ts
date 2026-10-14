import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const discovery = vi.hoisted(() => {
  let answer: (blocked: boolean) => void = () => {}
  return {
    discoveryState: { blockedByPage: { ownUrl: 'http://192.168.1.20/' } as { ownUrl: string | null } | null },
    instanceFor: vi.fn(),
    probeAddress: vi.fn(async () => null),
    pageBlocksLanIpv4: vi.fn(() => new Promise<boolean>(resolve => { answer = resolve })),
    answerBlockCheck: (blocked: boolean) => answer(blocked)
  }
})

// Only what the dialog says once the browser has blocked an address is under
// test; the block check itself is page-blocks-lan.spec.ts.
vi.mock('@/services/muon-cloud/discovery', () => discovery)

const { default: AddInstanceDialog } = await import('../AddInstanceDialog.vue')

const mocks = {
  $t: (key: string) => key,
  $filters: {
    getApiUrls: (url: string) => ({ apiUrl: url, socketUrl: `${url.replace(/^http/, 'ws')}/websocket` })
  },
  $rules: { required: () => true },
  $store: { state: { config: { hostConfig: { hosted: false } } }, getters: {} }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('AddInstanceDialog on a page the browser blocks from IP addresses', () => {
  it('says the browser blocked the address, with the way round it', async () => {
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })
    const vm = wrapper.vm as any
    vm.url = '192.168.1.31'

    const shown = vm.onUnreachable('http://192.168.1.31', 'Network Error')
    discovery.answerBlockCheck(true)
    await shown

    expect(vm.error).toBeNull()
    expect(vm.note).toBe('app.endpoint.error.blocked_ip_from_name app.endpoint.error.blocked_ip_from_name_way_round')
    expect(vm.outcome).toBe('blocked')
    expect(vm.status.html).toBe(vm.note)
  })

  it('drops the answer when the address changed while the check ran', async () => {
    // Codex, on #32: the first check takes seconds, and its answer was
    // written over whatever the dialog said about the new address.
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })
    const vm = wrapper.vm as any
    vm.url = '192.168.1.31'
    vm.note = null

    const shown = vm.onUnreachable('http://192.168.1.31', 'Network Error')
    vm.url = 'muon-walnut-8987'
    discovery.answerBlockCheck(true)
    await shown

    expect(vm.note).toBeNull()
    expect(vm.error).toBeNull()
  })
})
