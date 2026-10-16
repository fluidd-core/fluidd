import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountSecurity from '../AccountSecurity.vue'
vi.mock('@/services/account/state', () => ({ accountState: { me: null, events: [], config: null }, loadMe: async () => {}, loadConfig: async () => {}, loadEvents: async () => {}, describe: (e:Error) => e.message }))
afterEach(() => { vi.restoreAllMocks() })
describe('password confirmation', () => {
  it('offers the shared confirmation flow after choosing a new password', async () => {
    const w = shallowMount(AccountSecurity, { propsData: { linkTo: (id:string) => '/account/' + id }, methods: { refresh: () => {} }, stubs: { M3Dialog: { props: ['value'], template: '<div v-if="value"><slot/><slot name="actions"/></div>' } } })
    const vm = w.vm as any; vm.open('password'); vm.form.next = 'new fixture password'; await w.vm.$nextTick()
    const button = w.findAll('button').wrappers.filter(b => b.text() === 'Change password').pop()!
    expect(button.attributes('disabled')).toBeUndefined()
    const confirm = vi.spyOn(vm, 'withReauth').mockResolvedValue(null)
    await button.trigger('click')
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(vm.message).toBe('')
    w.destroy()
  })
  it('renders a refused password change beside the new password field', async () => {
    const w = shallowMount(AccountSecurity, { propsData: { linkTo: (id:string) => '/account/' + id }, methods: { refresh: () => {} }, stubs: { M3Dialog: { props: ['value'], template: '<div v-if="value"><slot/><slot name="actions"/></div>' } } })
    const vm = w.vm as any; vm.open('password'); vm.form.next = 'new fixture password'; await w.vm.$nextTick()
    vi.spyOn(vm, 'withReauth').mockRejectedValue(new Error('Too many attempts. Try again later.'))
    await w.findAll('button').wrappers.filter(b => b.text() === 'Change password').pop()!.trigger('click')
    await new Promise(resolve => setTimeout(resolve))
    const input = w.find('input[autocomplete="new-password"]')
    expect(w.find('[role="alert"]').text()).toContain('Too many attempts')
    expect(input.attributes('aria-describedby')).toBe('security-password-error')
    expect(vm.message).toBe('')
  })
})
