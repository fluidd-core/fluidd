import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { Component, Mixins } from 'vue-property-decorator'
import AccountReauthMixin from '../account-reauth'
import { AccountError } from '@/services/account/client'
import type { Reauth } from '@/services/account/api'

@Component({ template: '<div />' })
class Page extends Mixins(AccountReauthMixin) {}

const refused = () => new AccountError('Enter your password to confirm it is you.', 403, { error: 'enter your password to confirm it is you', reauth_required: true })

describe('"Confirm it\'s you"', () => {
  it('asks nothing when the console lets the change through', async () => {
    const page = mount(Page).vm
    const act = vi.fn(async () => 'done')
    expect(await page.withReauth(act)).toBe('done')
    expect(act).toHaveBeenCalledWith({})
    expect(page.reauthState.open).toBe(false)
  })

  it('opens the dialog on reauth_required, then runs the change again with the password', async () => {
    const page = mount(Page).vm
    const act = vi.fn(async (r: Reauth) => {
      if (!r.password) throw refused()
      return 'removed'
    })
    const result = page.withReauth(act, { action: 'Remove passkey', danger: true })
    await new Promise(resolve => setTimeout(resolve))
    expect(page.reauthState).toMatchObject({ open: true, action: 'Remove passkey', danger: true })
    page.reauthOn.submit({ password: 'correct horse' })
    expect(await result).toBe('removed')
    expect(act).toHaveBeenLastCalledWith({ password: 'correct horse' })
    expect(page.reauthState.open).toBe(false)
  })

  it('keeps the dialog open with the console\'s words when the password is wrong', async () => {
    const page = mount(Page).vm
    const act = vi.fn(async (r: Reauth) => {
      if (!r.password) throw refused()
      throw new AccountError('That password is not right.', 401, { error: 'that password is not right' })
    })
    page.withReauth(act)
    await new Promise(resolve => setTimeout(resolve))
    page.reauthOn.submit({ password: 'wrong' })
    await new Promise(resolve => setTimeout(resolve))
    expect(page.reauthState).toMatchObject({ open: true, error: 'That password is not right.' })
  })

  it('answers null when the person cancels', async () => {
    const page = mount(Page).vm
    const result = page.withReauth(async (r: Reauth) => { if (!r.password) throw refused() })
    await new Promise(resolve => setTimeout(resolve))
    page.reauthOn.cancel()
    expect(await result).toBeNull()
  })

  it('passes any other error straight through', async () => {
    const page = mount(Page).vm
    await expect(page.withReauth(async () => { throw new AccountError('Gone.', 404, { error: 'gone' }) })).rejects.toThrow('Gone.')
  })
})
