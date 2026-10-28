import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountSecurity from '../AccountSecurity.vue'
import { AccountError } from '@/services/account/client'

const api = vi.hoisted(() => ({
  passkeys: vi.fn(async () => ({ passkeys: [] })),
  identities: vi.fn(async () => ({ identities: [] })),
  removePasskey: vi.fn(async () => ({})),
  totpConfirm: vi.fn(async () => ({ recovery_codes: ['one', 'two'] })),
  newRecoveryCodes: vi.fn(async () => ({ recovery_codes: ['new-one', 'new-two'] }))
}))

vi.mock('@/services/account/api', async (actual) => ({
  ...(await actual() as object),
  accountApi: api
}))

const accountState = vi.hoisted(() => ({
  me: {
    account: { id: 'a1', email: 'owner@muon3d.com', name: 'Owner', created_at: 0, has_password: true, two_step: true },
    endpoint_id: null,
    sign_in: { password: true, passkeys: 1, identities: [], two_step: true, recovery_left: 8 }
  },
  events: [],
  config: { social: {} }
}))

vi.mock('@/services/account/state', async (actual) => ({
  ...(await actual() as object),
  accountState,
  loadMe: vi.fn(async () => accountState.me),
  loadConfig: vi.fn(async () => accountState.config),
  loadEvents: vi.fn(async () => accountState.events)
}))

vi.mock('@/services/account/webauthn', async (actual) => ({
  ...(await actual() as object),
  passkeysSupported: () => false
}))

function open () {
  const confirm = vi.fn(async () => false)
  const wrapper = mount(AccountSecurity, {
    propsData: { linkTo: (id: string) => `/account/${id}` },
    mocks: { $confirm: confirm },
    stubs: {
      M3Dialog: {
        props: ['value', 'title'],
        template: '<div v-if="value" class="dialog"><h2>{{ title }}</h2><slot /><slot name="actions" /></div>'
      },
      ReauthDialog: true,
      AppQrCode: true,
      'router-link': { template: '<a><slot /></a>' },
      'frame-icon': true
    }
  })
  return { wrapper, confirm }
}

const settle = () => new Promise(resolve => setTimeout(resolve))

describe('account sign-in security', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not remove a passkey when its destructive confirmation is cancelled', async () => {
    const { wrapper, confirm } = open()
    const key = { id: 'key-1', name: 'Owner phone', created_at: 1, last_used_at: null }

    await (wrapper.vm as any).removePasskey(key)

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Owner phone'), expect.objectContaining({ danger: true }))
    expect(api.removePasskey).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('normalizes a spaced authenticator code and keeps the setup open when the printer refuses it', async () => {
    api.totpConfirm.mockRejectedValueOnce(new Error('That code is not right.'))
    const { wrapper } = open()
    const vm = wrapper.vm as any
    vm.dialog = 'twoStep'
    vm.setup = { secret: 'ABCD1234', otpauth_url: 'otpauth://totp/Muon3D' }
    vm.form.code = '123 456'

    await vm.confirmTwoStep()
    await wrapper.vm.$nextTick()

    expect(api.totpConfirm).toHaveBeenCalledWith('123456')
    expect(vm.dialog).toBe('twoStep')
    expect(wrapper.find('.m3-dlg__error').text()).toBe('That code is not right.')
    expect(vm.codes).toEqual([])
    wrapper.destroy()
  })

  it('marks recovery-code rotation unavailable without showing an empty save dialog', async () => {
    api.newRecoveryCodes.mockRejectedValueOnce(new AccountError('Not found.', 404))
    const { wrapper, confirm } = open()
    confirm.mockResolvedValueOnce(true)

    await (wrapper.vm as any).newCodes()
    await settle()

    expect(api.newRecoveryCodes).toHaveBeenCalled()
    expect((wrapper.vm as any).recoveryMissing).toBe(true)
    expect((wrapper.vm as any).dialog).toBe('')
    expect(wrapper.text()).toContain('Coming soon')
    expect(wrapper.find('[data-tid="recovery-codes"]').exists()).toBe(false)
    wrapper.destroy()
  })
})
