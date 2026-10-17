import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AccountPlan from '../AccountPlan.vue'
describe('Plan pricing', () => {
  it('shows the compute allowances and prices without selling unconfigured plans or storage', () => {
    const w = mount(AccountPlan, { stubs: { FrameIcon: true } })
    const text = w.text()
    for (const line of ['40 credits', '400 credits', '1,200 credits', '£7.99', '£79.99', '£19.99', '£199.99', '£2.99', '£12.99', '£34.99', 'High detail', 'server compute']) expect(text).toContain(line)
    expect(text).not.toContain('more storage')
    expect(text).not.toContain('5 GiB')
    expect(w.find('button').exists()).toBe(false)
    w.destroy()
  })
})
