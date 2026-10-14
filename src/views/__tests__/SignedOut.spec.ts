import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SignedOut from '../SignedOut.vue'

vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { ready: true, account: null } }))
vi.mock('@/store', () => ({ default: {} }))
const nearby = vi.hoisted(() => vi.fn())
vi.mock('@/services/muon-cloud/api', () => ({ cloudApi: { nearby } }))
vi.mock('@/services/muon-cloud/centralLogin', () => ({ centralLoginEnabled: () => false }))
vi.mock('@/services/account/state', () => ({ describe: (e: Error) => e.message }))
vi.mock('@/services/account/sign-in', () => ({}))
const settle = () => new Promise(resolve => setTimeout(resolve))

function open () {
  nearby.mockResolvedValue({ printers: [{ printer_id: 'p1', name: 'Sample M1', local_addrs: ['127.0.0.1:9876'] }] })
  return mount(SignedOut, {
    mocks: { $router: { replace: vi.fn() } },
    stubs: { 'router-link': { template: '<a><slot /></a>' }, 'frame-icon': true, PrinterThumb: true }
  })
}

describe('nearby printer state after signing out', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })
  it.each([['standby', 'Ready'], ['printing', 'Printing'], ['paused', 'Paused']] as const)('shows %s using Control status words', async (state, label) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ result: { status: { webhooks: { state: 'ready' }, print_stats: { state } } } }))))
    const w = open()
    await settle()
    expect(w.find('[data-tid="nearby-status"]').exists()).toBe(true)
    expect(w.find('[data-tid="nearby-status"]').text()).toBe(label)
    expect(w.find('a[href="http://127.0.0.1:9876/"]').exists()).toBe(true)
    w.destroy()
  })
  it.each([[401, 'Needs access'], [503, 'Error']] as const)('keeps Open available when the status read answers %s', async (status, label) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status })))
    const w = open()
    await settle()
    expect(w.find('[data-tid="nearby-status"]').exists()).toBe(true)
    expect(w.find('[data-tid="nearby-status"]').text()).toBe(label)
    expect(w.find('a[href="http://127.0.0.1:9876/"]').exists()).toBe(true)
    w.destroy()
  })
  it('says status is unavailable when local access is blocked', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('blocked') }))
    const w = open()
    await settle()
    expect(w.find('[data-tid="nearby-status"]').exists()).toBe(true)
    expect(w.find('[data-tid="nearby-status"]').text()).toBe('Status unavailable')
    w.destroy()
  })
})
