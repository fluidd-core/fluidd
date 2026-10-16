import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReauthDialog from '../ReauthDialog.vue'

function open (hasPassword = true) {
  return mount(ReauthDialog, {
    propsData: { value: true, hasPassword, twoStep: true, hasPasskey: true },
    stubs: { M3Dialog: { template: '<div><slot /><slot name="actions" /></div>' } }
  })
}

describe('confirmation on console ee19200', () => {
  it('keeps password and code available beside passkey confirmation', async () => {
    const w = open()
    expect(w.find('[data-tid="reauth-passkey"]').exists()).toBe(true)
    await w.find('[data-tid="reauth-password"]').setValue('test password')
    await w.find('[data-tid="reauth-code"]').setValue('ABCD 1234')
    await w.find('[data-tid="reauth-submit"]').trigger('click')
    expect(w.emitted('submit')?.[0]).toEqual([{ password: 'test password', code: 'ABCD1234' }])
    w.destroy()
  })
  it('offers confirmation to a passkey-only account', () => {
    const w = open(false)
    expect(w.find('[data-tid="reauth-passkey"]').exists()).toBe(true)
    expect(w.text()).not.toContain('Sign out and sign in again')
    expect(w.find('[data-tid="reauth-password"]').exists()).toBe(false)
    w.destroy()
  })
})
