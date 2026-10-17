import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DeletionBanner from '../DeletionBanner.vue'
import { deletionState } from '@/services/muon-cloud/deletion'

vi.mock('@/services/muon-cloud/state', () => ({ refreshPrinters: async () => {} }))
vi.mock('@/services/account/state', () => ({
  accountState: { me: { account: { has_password: true }, sign_in: { password: true, passkeys: 1, two_step: true } } },
  loadMe: async () => {},
  describe: (error: Error) => error.message
}))
const signOutNow = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/sign-out', () => ({ signOutNow }))

const settle = () => new Promise(resolve => setTimeout(resolve))
const box = { props: ['value', 'title'], template: '<div v-if="value"><h2>{{ title }}</h2><slot /><slot name="actions" /></div>' }

function open () {
  localStorage.setItem('muon.cloud.token', 'mock-session')
  deletionState.deleteAfter = 1800000000
  return mount(DeletionBanner, { stubs: { M3Dialog: box, 'frame-icon': true } })
}

describe('the app-wide deletion banner', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    localStorage.clear()
    deletionState.deleteAfter = null
  })

  it('keeps the date and recovery action visible if keeping the account fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'try again' }), { status: 500 })))
    const w = open()
    expect(w.text()).toContain('15 Jan')
    await w.find('[data-tid="deletion-keep"]').trigger('click')
    await settle()
    expect(deletionState.deleteAfter).toBe(1800000000)
    expect(w.find('[data-tid="deletion-now"]').exists()).toBe(false)
    expect(w.find('[data-tid="deletion-keep"]').exists()).toBe(true)
    expect(w.find('[role="alert"]').text()).toContain('Try again')
    w.destroy()
  })

  it('keeps the account only after the console accepts cancellation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true }))))
    const w = open()
    await w.find('[data-tid="deletion-keep"]').trigger('click')
    await settle()
    expect(deletionState.deleteAfter).toBe(null)
    expect(signOutNow).not.toHaveBeenCalled()
    w.destroy()
  })

  it('offers recovery without a second destructive action or an automatic request', () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const w = open()
    expect(w.findAll('button')).toHaveLength(1)
    expect(w.find('[data-tid="deletion-keep"]').exists()).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
    expect(signOutNow).not.toHaveBeenCalled()
    expect(deletionState.deleteAfter).toBe(1800000000)
    w.destroy()
  })
})
