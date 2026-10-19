import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountDelete from '../AccountDelete.vue'
import { accountState } from '@/services/account/state'
import type { Me } from '@/services/account/api'
import { deletionState } from '@/services/muon-cloud/deletion'

const deleteAccount = vi.hoisted(() => vi.fn(async (): Promise<{ ok: boolean, delete_after?: number, unlinked?: number }> => ({ ok: true })))
const cancelDeletion = vi.hoisted(() => vi.fn(async () => ({ ok: true })))
vi.mock('@/services/account/api', async (actual) => ({
  ...(await actual() as object),
  accountApi: { deleteAccount, cancelDeletion, me: vi.fn(async () => accountState.me) }
}))
vi.mock('@/services/library/store', () => ({
  libraryState: { enabled: false, usedBytes: null },
  libraryItems: () => [],
  libraryPrints: () => [],
  refreshLibrary: async () => {},
  watchLibraryAccount: () => {}
}))
const signOutNow = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/sign-out', () => ({ signOutNow }))

const DAY = 86400

function me (deletion?: Me['account']['deletion'] | 'absent'): Me {
  const account: Me['account'] = { id: 'a1', email: 'jack@muon3d.com', name: 'Jack Smith', created_at: 0, has_password: true, two_step: false }
  if (deletion !== 'absent') account.deletion = deletion ?? null
  return { account, endpoint_id: null, sign_in: { password: true, passkeys: 0, identities: [], two_step: false } }
}

function open (who: Me) {
  deletionState.deleteAfter = who.account.deletion?.delete_after ?? null
  accountState.accountId = null
  accountState.me = who
  return mount(AccountDelete, {
    propsData: { linkTo: (id: string) => `/account/${id}` },
    stubs: {
      M3Dialog: { props: ['value', 'title'], template: '<div v-if="value" class="dialog"><h2>{{ title }}</h2><slot /><slot name="actions" /></div>' },
      'router-link': { template: '<a><slot /></a>' },
      'frame-icon': true
    },
    attachTo: document.body
  })
}

const tid = (w: ReturnType<typeof open>, id: string) => w.find(`[data-tid="${id}"]`)

async function throughToStep2 (w: ReturnType<typeof open>) {
  await tid(w, 'delete-open').trigger('click')
  await tid(w, 'delete-continue').trigger('click')
  await tid(w, 'delete-password').setValue('correct horse')
}

describe('Delete account', () => {
  it('lets a passkey-only account delete after a recent sign-in, without sending an empty password', async () => {
    const who = me()
    who.account.has_password = false
    who.sign_in!.password = false
    who.sign_in!.passkeys = 1
    const w = open(who)
    await tid(w, 'delete-open').trigger('click')
    await tid(w, 'delete-continue').trigger('click')
    expect(tid(w, 'delete-confirm').exists()).toBe(true)
    await tid(w, 'delete-confirm').trigger('click')
    await new Promise(resolve => setTimeout(resolve))
    expect(deleteAccount).toHaveBeenCalledWith({})
    expect(tid(w, 'delete-done').exists()).toBe(true)
    w.destroy()
  })

  afterEach(() => {
    vi.clearAllMocks()
    accountState.me = null
    deletionState.deleteAfter = null
  })

  it('waits 14 days by default on a console with the grace period, and can still be kept', async () => {
    deleteAccount.mockResolvedValueOnce({ ok: true, delete_after: 1_800_000_000 + 14 * DAY })
    const w = open(me())
    expect(w.text()).toContain('We wait 14 days before deleting anything')
    await throughToStep2(w)
    expect(tid(w, 'delete-confirm').text()).toBe('Delete in 14 days')
    await tid(w, 'delete-confirm').trigger('click')
    await new Promise(resolve => setTimeout(resolve))
    expect(deleteAccount).toHaveBeenCalledWith({ password: 'correct horse', code: undefined })
    expect(w.find('.dialog h2').text()).toMatch(/^Your account will be deleted on /)
    await tid(w, 'delete-done').trigger('click')
    expect(signOutNow).toHaveBeenCalledWith('deleted')
  })

  it('offers only the grace period when requesting deletion', async () => {
    const w = open(me())
    await throughToStep2(w)
    expect(tid(w, 'delete-now').exists()).toBe(false)
    expect(tid(w, 'delete-confirm').text()).toBe('Delete in 14 days')
    await tid(w, 'delete-confirm').trigger('click')
    await new Promise(resolve => setTimeout(resolve))
    expect(deleteAccount).toHaveBeenCalledWith({ password: 'correct horse', code: undefined })
  })

  it('does not send a deletion to an old console without the grace period', async () => {
    const w = open(me('absent'))
    expect(tid(w, 'delete-open').exists()).toBe(false)
    expect(deleteAccount).not.toHaveBeenCalled()
  })

  it('shows a deletion that is waiting, and keeps the account', async () => {
    const w = open(me({ requested_at: 1_800_000_000, delete_after: 1_800_000_000 + 14 * DAY }))
    expect(tid(w, 'delete-scheduled').exists()).toBe(true)
    await tid(w, 'delete-keep').trigger('click')
    expect(cancelDeletion).toHaveBeenCalled()
  })

  it('offers no second deletion while a deletion waits', async () => {
    const w = open(me({ requested_at: 1_800_000_000, delete_after: 1_800_000_000 + 14 * DAY }))
    expect(tid(w, 'delete-open').exists()).toBe(false)
    expect(tid(w, 'delete-keep').exists()).toBe(true)
    expect(deleteAccount).not.toHaveBeenCalled()
  })

  it('keeps the dialog open with the console\'s words when the password is wrong', async () => {
    deleteAccount.mockRejectedValueOnce(new Error('That password is not right.'))
    const w = open(me())
    await throughToStep2(w)
    await tid(w, 'delete-confirm').trigger('click')
    await new Promise(resolve => setTimeout(resolve))
    expect(w.text()).toContain('That password is not right.')
    expect(tid(w, 'delete-confirm').exists()).toBe(true)
  })
})
