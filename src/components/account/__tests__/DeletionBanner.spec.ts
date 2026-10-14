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

  it('keeps the date and both actions visible if keeping the account fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'try again' }), { status: 500 })))
    const w = open()
    expect(w.text()).toContain('15 Jan')
    await w.find('[data-tid="deletion-keep"]').trigger('click')
    await settle()
    expect(deletionState.deleteAfter).toBe(1800000000)
    expect(w.find('[data-tid="deletion-now"]').exists()).toBe(true)
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

  it('checks the choice, confirms with password and code, then signs out after immediate deletion', async () => {
    const sent: any[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
      const body = JSON.parse(options.body)
      sent.push(body)
      return body.password
        ? new Response(JSON.stringify({ ok: true, deleted: true }))
        : new Response(JSON.stringify({ reauth_required: true }), { status: 403 })
    }))
    const w = open()
    await w.find('[data-tid="deletion-now"]').trigger('click')
    expect(sent).toHaveLength(0)
    await w.find('[data-tid="deletion-confirm"]').trigger('click')
    await settle()
    await w.find('[data-tid="reauth-password"]').setValue('mock password')
    await w.find('[data-tid="reauth-code"]').setValue('123 456')
    await w.find('[data-tid="reauth-submit"]').trigger('click')
    await settle()
    expect(sent).toEqual([{ now: true }, { password: 'mock password', code: '123456', now: true }])
    expect(signOutNow).toHaveBeenCalledWith('deleted')
    w.destroy()
  })

  it('leaves the account pending when confirmation is cancelled', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ reauth_required: true }), { status: 403 })))
    const w = open()
    await w.find('[data-tid="deletion-now"]').trigger('click')
    await w.find('[data-tid="deletion-confirm"]').trigger('click')
    await settle()
    await w.find('[data-tid="reauth-dialog"] button').trigger('click')
    await settle()
    expect(signOutNow).not.toHaveBeenCalled()
    expect(deletionState.deleteAfter).toBe(1800000000)
    w.destroy()
  })
})
