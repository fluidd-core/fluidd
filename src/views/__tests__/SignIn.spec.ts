import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SignIn from '../SignIn.vue'
import { AccountError } from '@/services/account/client'

const passwordSignIn = vi.hoisted(() => vi.fn())
const codeSignIn = vi.hoisted(() => vi.fn())
const passkeySignIn = vi.hoisted(() => vi.fn())
const forgotPassword = vi.hoisted(() => vi.fn(async () => {}))
const finishSignIn = vi.hoisted(() => vi.fn(async () => 'https://control.example.test/handoff?code=h1&next=%2Fauthorize'))
const signUp = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/sign-in', () => ({ passwordSignIn, codeSignIn, passkeySignIn, forgotPassword, finishSignIn, signUp }))
const supported = vi.hoisted(() => ({ yes: true }))
vi.mock('@/services/account/webauthn', () => ({
  passkeysSupported: () => supported.yes,
  cancelledPasskey: (e: unknown) => e instanceof DOMException && e.name === 'NotAllowedError'
}))

function open () {
  const box = { template: '<div><slot /></div>' }
  const w = shallowMount(SignIn, {
    mocks: { $route: { query: { continue: '/authorize?client_id=fluidd&state=s' } } },
    stubs: {
      'v-card': box,
      'v-card-title': box,
      'v-card-subtitle': box,
      'v-card-text': box,
      'v-card-actions': box,
      'v-alert': { template: '<div v-bind="$attrs"><slot /></div>' },
      'v-form': { template: '<form @submit="$emit(`submit`, $event)"><slot /></form>' },
      'v-text-field': { props: ['value'], template: '<label><input :value="value" @input="$emit(`input`, $event.target.value)"></label>' },
      'v-btn': { template: '<button type="button" v-on="$listeners"><slot /></button>' },
      AppBtn: { template: '<button v-on="$listeners"><slot /></button>' }
    }
  })
  const go = vi.spyOn(w.vm as unknown as { go: (url: string) => void }, 'go').mockImplementation(() => {})
  return { w, go }
}

const tid = (w: ReturnType<typeof open>['w'], id: string) => w.find(`[data-tid="${id}"]`)
const settle = () => new Promise(resolve => setTimeout(resolve))

async function typeIn (w: ReturnType<typeof open>['w'], id: string, value: string) {
  const input = tid(w, id).find('input')
  await input.setValue(value)
}

describe('Sign in to Muon3D', () => {
  afterEach(() => { vi.clearAllMocks() })

  it('asks for the two-step code after a right password, then hands off', async () => {
    passwordSignIn.mockRejectedValueOnce(new AccountError('Enter the code.', 403, { mfa_required: true, mfa_token: 'mfa-1' }))
    codeSignIn.mockResolvedValueOnce('page-session')
    const { w, go } = open()
    await typeIn(w, 'sign-in-email', 'jack@muon3d.com')
    await typeIn(w, 'sign-in-password', 'correct horse')
    await w.find('form').trigger('submit')
    await settle()
    expect(w.text()).toContain('Enter your code')
    expect(tid(w, 'sign-in-error').exists()).toBe(false)
    await typeIn(w, 'sign-in-code', '482 913')
    await w.find('form').trigger('submit')
    await settle()
    expect(codeSignIn).toHaveBeenCalledWith('mfa-1', '482 913')
    expect(finishSignIn).toHaveBeenCalledWith('page-session', '/authorize?client_id=fluidd&state=s')
    expect(go).toHaveBeenCalledWith('https://control.example.test/handoff?code=h1&next=%2Fauthorize')
  })

  it('signs in with a passkey, and says nothing when the person cancels it', async () => {
    passkeySignIn.mockRejectedValueOnce(new DOMException('cancelled', 'NotAllowedError'))
    const { w, go } = open()
    await tid(w, 'sign-in-passkey').trigger('click')
    await settle()
    expect(tid(w, 'sign-in-error').exists()).toBe(false)
    passkeySignIn.mockResolvedValueOnce('page-session')
    await tid(w, 'sign-in-passkey').trigger('click')
    await settle()
    expect(go).toHaveBeenCalled()
  })

  it('offers no passkey where the browser has none', () => {
    supported.yes = false
    const { w } = open()
    expect(tid(w, 'sign-in-passkey').exists()).toBe(false)
    supported.yes = true
  })

  it('sends a reset link, and says the same whether or not there is an account', async () => {
    const { w } = open()
    await tid(w, 'sign-in-forgot').trigger('click')
    await typeIn(w, 'sign-in-email', 'someone@example.com')
    await w.find('form').trigger('submit')
    await settle()
    expect(forgotPassword).toHaveBeenCalledWith('someone@example.com')
    expect(tid(w, 'sign-in-sent').text()).toContain('If there\'s an account for someone@example.com')
  })

  it('shows the console\'s words for a wrong password', async () => {
    passwordSignIn.mockRejectedValueOnce(new AccountError('That email or password is not right.', 401, { error: 'that email or password is not right' }))
    const { w, go } = open()
    await w.find('form').trigger('submit')
    await settle()
    expect(tid(w, 'sign-in-error').text()).toBe('That email or password is not right.')
    expect(go).not.toHaveBeenCalled()
  })

  it.each(['', '12', '121', 'not a number', '13.5'])("blocks invalid signup age '%s' with an accessible error", async value => {
    const { w } = open()
    ;(w.vm as any).setMode('sign-up'); await w.vm.$nextTick()
    await typeIn(w, 'sign-up-age', value)
    await w.find('form').trigger('submit'); await settle()
    expect(signUp).not.toHaveBeenCalled()
    expect(tid(w, 'sign-up-age-error').attributes('role')).toBe('alert')
    expect(tid(w, 'sign-up-age').attributes('aria-describedby')).toContain('sign-up-age-error')
  })

  it('announces a signup network refusal', async () => {
    signUp.mockRejectedValueOnce(new Error('The Muon3D service could not be reached.'))
    const { w } = open()
    ;(w.vm as any).setMode('sign-up'); await w.vm.$nextTick()
    await typeIn(w, 'sign-up-age', '18')
    await w.find('form').trigger('submit'); await settle()
    expect(tid(w, 'sign-in-error').attributes('aria-live')).toBe('assertive')
    expect(tid(w, 'sign-in-error').text()).toContain('could not be reached')
  })
})
