import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AccountPrivacy from '../AccountPrivacy.vue'
vi.mock('@/services/account/state', () => ({ accountState: { me: null }, loadMe: async () => {}, describe: (e:Error) => e.message }))
vi.mock('@/services/account/api', () => ({ accountApi: { retention: async () => ({}) } }))
describe('Library data export', () => {
  it('offers a Library download beside account data', () => {
    const w = shallowMount(AccountPrivacy, { propsData: { linkTo: (id:string) => '/account/' + id } })
    expect(w.find('[data-tid="privacy-library-download"]').exists()).toBe(true)
    expect(w.text()).toContain('archive')
    w.destroy()
  })
})
