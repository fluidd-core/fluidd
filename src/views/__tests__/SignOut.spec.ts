import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import SignOut from '../SignOut.vue'

vi.mock('@/services/muon-cloud/state', () => ({
  cloudState: { ready: true, account: { id: 'fixture', name: 'Sample', email: 'sample@example.test' }, printers: [] }
}))
vi.mock('@/services/account/state', () => ({
  accountState: { sessions: [] }, loadSessions: async () => {}, describe: (error: Error) => error.message
}))
const signOutNow = vi.hoisted(() => vi.fn())
const endEverySession = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/sign-out', () => ({ signOutNow, endEverySession }))

afterEach(() => { vi.clearAllMocks() })

it('keeps a bookmarked sign-out page safe to load and puts other devices in account settings', async () => {
  const router = { replace: vi.fn(async () => {}), back: vi.fn() }
  const w = mount(SignOut, {
    mocks: { $router: router },
    stubs: { 'frame-icon': true, 'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' } }
  })
  expect(signOutNow).not.toHaveBeenCalled()
  expect(w.find('[data-tid="sign-out-everywhere"]').exists()).toBe(false)
  expect(w.find('a[href="/account/sessions"]').exists()).toBe(true)
  await w.find('[data-tid="sign-out-confirm"]').trigger('click')
  expect(signOutNow).toHaveBeenCalledWith('browser', { router })
  expect(endEverySession).not.toHaveBeenCalled()
  w.destroy()
})
