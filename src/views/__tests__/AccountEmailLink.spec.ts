import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountEmailLink from '../AccountEmailLink.vue'
import { AccountError } from '@/services/account/client'

const verifyEmail = vi.hoisted(() => vi.fn(async () => 'new@muon3d.com'))
const resetPassword = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/services/account/sign-in', () => ({ verifyEmail, resetPassword }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { account: null } }))
vi.mock('@/services/muon-cloud/centralLogin', () => ({ centralLoginEnabled: () => true, startCentralSignIn: vi.fn(async () => {}) }))

function open (path: string, token?: string) {
  const replace = vi.fn(async () => {})
  const w = mount(AccountEmailLink, {
    mocks: { $route: { path, query: token ? { token } : {} }, $router: { replace, push: vi.fn(async () => {}) } },
    stubs: { 'router-link': { template: '<a><slot /></a>' } }
  })
  return { w, replace }
}

const tid = (w: ReturnType<typeof open>['w'], id: string) => w.find(`[data-tid="${id}"]`)
const settle = () => new Promise(resolve => setTimeout(resolve))

describe('the pages the console\'s emails open', () => {
  afterEach(() => { vi.clearAllMocks() })

  it('confirms the address once, and takes the token out of the address', async () => {
    const { w, replace } = open('/account/verify-email', 't1')
    expect(replace).toHaveBeenCalledWith({ path: '/account/verify-email' })
    await settle()
    expect(verifyEmail).toHaveBeenCalledWith('t1')
    expect(tid(w, 'email-link-done').text()).toContain('new@muon3d.com is your Muon3D address now')
  })

  it('says plainly when the link has expired', async () => {
    verifyEmail.mockRejectedValueOnce(new AccountError('That link has expired.', 400, { error: 'that link has expired' }))
    const { w } = open('/account/verify-email', 't1')
    await settle()
    expect(tid(w, 'email-link-error').text()).toBe('That link has expired.')
  })

  it('sets a new password only when both match', async () => {
    const { w } = open('/account/reset-password', 't2')
    await tid(w, 'email-link-password').setValue('correct horse')
    await tid(w, 'email-link-again').setValue('correct hose')
    await w.find('form').trigger('submit')
    expect(resetPassword).not.toHaveBeenCalled()
    expect(tid(w, 'email-link-error').text()).toBe('The two passwords are different.')
    await tid(w, 'email-link-again').setValue('correct horse')
    await w.find('form').trigger('submit')
    await settle()
    expect(resetPassword).toHaveBeenCalledWith('t2', 'correct horse')
    expect(tid(w, 'email-link-done').exists()).toBe(true)
  })

  it('asks for nothing with no token', () => {
    const { w } = open('/account/reset-password')
    expect(tid(w, 'email-link-error').text()).toContain('That link is incomplete')
    expect(w.find('form').exists()).toBe(false)
  })
})
