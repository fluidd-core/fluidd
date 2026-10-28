import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AccountPlan from '../AccountPlanPlanned.vue'

describe('Plan pricing', () => {
  it('pins pricing B and every compute allowance exactly', () => {
    const wrapper = mount(AccountPlan)
    const visibleContent = wrapper.element.cloneNode(true) as HTMLElement
    visibleContent.querySelectorAll('.sr-only').forEach(node => node.remove())
    const text = visibleContent.textContent?.replace(/\s+/g, ' ').trim() ?? ''

    expect(text).toContain('FreeCurrent plan40 credits per month')
    expect(text).toContain('Plus£7.99/month or £79.99/year400 credits per month')
    expect(text).toContain('Pro£19.99/month or £199.99/year1,200 credits per month')
    expect(text).toContain('100 credits for £2.99')
    expect(text).toContain('500 credits for £12.99')
    expect(text).toContain('1,500 credits for £34.99')
    expect(text).toContain('One High detail generation costs 40 credits.')
    expect(text.match(/£/g)).toHaveLength(7)
    expect(text).toContain('All browser and on-printer work is free. Only server compute uses credits.')
    expect(text).not.toMatch(/(?:\d[\d,.]*\s*(?:GiB|GB|MiB|MB)|storage\s+(?:of\s+)?\d)/i)
    wrapper.destroy()
  })

  it('is an informational, semantic and screen-reader-friendly plan list', () => {
    const wrapper = mount(AccountPlan)
    const headings = wrapper.findAll('h1, h2, h3').wrappers.map(node => `${node.element.tagName}:${node.text()}`)

    expect(headings).toEqual([
      'H1:Plan',
      'H2:Credits pay for server compute',
      'H3:Free',
      'H3:Plus',
      'H3:Pro',
      'H3:Credit packs'
    ])
    expect(wrapper.find('[aria-label="Monthly plans"]').element.tagName).toBe('UL')
    expect(wrapper.findAll('[aria-label="Monthly plans"] > li')).toHaveLength(3)
    expect(wrapper.find('[aria-label="Current plan"]').text()).toBe('Current plan')
    const spokenPrices = wrapper.findAll('.sr-only').wrappers.map(node => node.text())
    expect(spokenPrices).toEqual([
      '£7.99 per month',
      '£79.99 per year',
      '£19.99 per month',
      '£199.99 per year',
      '£2.99',
      '£12.99',
      '£34.99'
    ])
    expect(wrapper.findAll('[aria-label^="£"]')).toHaveLength(0)
    expect(wrapper.text()).toContain("Payments aren't available yet.")
    expect(wrapper.find('button, a').exists()).toBe(false)
    wrapper.destroy()
  })
})
