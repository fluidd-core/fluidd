import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountPlan from '../AccountPlan.vue'
import { CREDITS_CATALOGUE } from '@/services/account/credits-catalogue'
import { LibraryError } from '@/services/library/api'
import type { CreditAccount } from '@/services/account/credits'

const loadCredits = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/credits', async (actual) => ({ ...(await actual<object>()), loadCredits }))

const settle = () => new Promise(resolve => setTimeout(resolve))

const plus: CreditAccount = {
  plan: 'plus',
  period: 'monthly',
  renews: new Date(2026, 10, 9, 12).getTime(),
  willRenew: true,
  balance: 286,
  monthly: { left: 236, allowance: 400 },
  packs: 50,
  usage: { shape: { credits: 120, count: 6 }, part: { credits: 32, count: 8 }, scan: { credits: 30, count: 1 } },
  history: [
    { id: '9', at: Date.now() - 3600_000, kind: 'shape', title: 'Low-poly fox planter', change: -20 },
    { id: '8', at: Date.now() - 7200_000, kind: 'refund', title: 'Chess knight, refunded', change: 20 },
    { id: '4', at: Date.now() - 18 * 86400_000, kind: 'monthly', title: 'Monthly credits', change: 400 }
  ],
  jobsAtOnce: 2
}

async function open (answer: CreditAccount | Error) {
  loadCredits.mockImplementation(async () => { if (answer instanceof Error) throw answer; return answer })
  const w = mount(AccountPlan, { stubs: { 'frame-icon': true } })
  await settle()
  return w
}

const text = (w: { text: () => string }) => w.text().replace(/\s+/g, ' ')

describe('Plan and credits', () => {
  afterEach(() => { vi.clearAllMocks() })

  it('leads with the balance, what it buys and when more comes', async () => {
    const w = await open(plus)
    expect(w.find('[data-tid="plan-balance-number"]').text()).toBe('286')
    const balance = text(w.find('[data-tid="plan-balance"]'))
    expect(balance).toContain('About 14 shapes or 71 parts')
    expect(balance).toContain('Monthly 236 of 400')
    expect(balance).toContain('Packs 50')
    expect(balance).toContain('400 more on 9 Nov')
    expect(w.find('[data-tid="plan-current"]').text()).toBe('Plus · monthly')
    expect(w.find('[data-tid="plan-balance-note"]').exists()).toBe(false)
    w.destroy()
  })

  it('shows refunds and monthly grants in the history, signed', async () => {
    const w = await open(plus)
    const history = text(w.find('[data-tid="plan-history"]'))
    expect(history).toContain('Low-poly fox planter')
    expect(history).toContain('−20')
    expect(history).toContain('Chess knight, refunded')
    expect(history).toContain('+400')
    expect(w.find('[data-tid="plan-history-refund"]').exists()).toBe(true)
    w.destroy()
  })

  it('warns when low, with what is left and when more comes, never about a printer', async () => {
    const w = await open({ ...plus, plan: 'free', period: null, willRenew: false, balance: 12, monthly: { left: 12, allowance: 40 }, packs: 0 })
    const note = text(w.find('[data-tid="plan-balance-note"]'))
    expect(note).toContain('Low on credits.')
    expect(note).toContain('Enough for 3 parts.')
    expect(note).toContain('40 more on 9 Nov.')
    expect(note).not.toMatch(/printer/i)
    w.destroy()
  })

  it('leaves out the monthly line when the server grants no monthly credits', async () => {
    const w = await open({ ...plus, plan: 'free', period: null, willRenew: false, balance: 100, monthly: { left: 0, allowance: 0 }, packs: 100 })
    const balance = text(w.find('[data-tid="plan-balance"]'))
    expect(balance).not.toContain('Monthly')
    expect(balance).not.toContain('more on')
    expect(balance).toContain('Packs 100')
    w.destroy()
  })

  it('says nothing about being out when Free grants nothing and nothing can be bought', async () => {
    const w = await open({ ...plus, plan: 'free', period: null, willRenew: false, balance: 0, monthly: { left: 0, allowance: 0 }, packs: 0, usage: { shape: { credits: 0, count: 0 }, part: { credits: 0, count: 0 }, scan: { credits: 0, count: 0 } }, history: [] })
    expect(w.find('[data-tid="plan-balance-note"]').exists()).toBe(false)
    expect(w.find('[data-tid="plan-balance-number"]').text()).toBe('0')
    expect(text(w.find('[data-tid="plan-option-free"]'))).toContain('No monthly credits')
    expect(text(w.find('[data-tid="plan-option-free"]'))).not.toContain('credits a month')
    expect(w.find('[data-tid="plan-option-free"]').text()).toContain('Current')
    w.destroy()
  })

  it('shows monthly credits kept from last month in full', async () => {
    const w = await open({ ...plus, balance: 570, monthly: { left: 520, allowance: 400 } })
    const balance = text(w.find('[data-tid="plan-balance"]'))
    expect(balance).toContain('Monthly 520')
    expect(balance).not.toContain('520 of 400')
    w.destroy()
  })

  it('says out of credits at zero', async () => {
    const w = await open({ ...plus, plan: 'free', period: null, willRenew: false, balance: 0, monthly: { left: 0, allowance: 40 }, packs: 0 })
    expect(text(w.find('[data-tid="plan-balance-note"]'))).toContain('Out of credits.')
    expect(w.find('[data-tid="plan-balance-note"]').classes()).toContain('acct-note--bad')
    w.destroy()
  })

  it('shows plans, packs and prices from the catalogue when there is no balance to read', async () => {
    const w = await open(new LibraryError('create_unavailable', 'no', 503))
    expect(w.find('[data-tid="plan-balance"]').exists()).toBe(false)
    expect(w.find('[data-tid="plan-unavailable"]').text()).toContain('Your balance shows here once Create opens.')
    for (const plan of CREDITS_CATALOGUE.plans) {
      const card = text(w.find(`[data-tid="plan-option-${plan.id}"]`))
      expect(card).toContain(`${plan.monthlyCredits.toLocaleString('en-GB')} credits a month`)
      if (plan.price) expect(card).toContain(`£${plan.price.monthly.toFixed(2)}`)
    }
    for (const pack of CREDITS_CATALOGUE.packs) expect(text(w.find(`[data-tid="plan-pack-${pack.credits}"]`))).toContain(`£${pack.price.toFixed(2)}`)
    const costs = text(w.find('[data-tid="plan-costs"]'))
    for (const cost of CREDITS_CATALOGUE.costs) expect(costs).toContain(cost.label)
    expect(costs).toContain('Every printer feature')
    expect(w.find('[data-tid="plan-current"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Current')
    w.destroy()
  })

  it('says why the balance is missing', async () => {
    const line = async (error: Error) => {
      const w = await open(error)
      const said = w.find('[data-tid="plan-unavailable"]').text()
      w.destroy()
      return said
    }
    expect(await line(new LibraryError('not-signed-in', 'no', 401))).toBe('Sign in again to see your balance.')
    expect(await line(new LibraryError('consent_required', 'no', 403))).toContain('Turn on Muon3D models')
    expect(await line(new LibraryError('internal', 'no', 500))).toBe('Your balance didn\'t load. Try again later.')
  })

  it('switches to yearly prices with the saving in months', async () => {
    const w = await open(plus)
    await w.find('[data-tid="plan-period-yearly"]').trigger('click')
    expect(w.find('[data-tid="plan-option-plus"] .plan-option__price').text().replace(/\s+/g, ' ')).toBe('£79.99 a year')
    expect(text(w.find('[data-tid="plan-option-plus"]'))).toContain('2 months free')
    expect(w.find('[data-tid="plan-period-yearly"]').attributes('aria-pressed')).toBe('true')
    w.destroy()
  })

  it('takes no money while payments are closed: every buying button is disabled and says so', async () => {
    expect(CREDITS_CATALOGUE.paymentsOpen).toBe(false)
    const w = await open(plus)
    const buying = w.findAll('[data-tid="plan-top-up"], [data-tid^="plan-choose-"], [data-tid^="plan-pack-"] button').wrappers
    expect(buying.length).toBeGreaterThan(3)
    for (const b of buying) {
      expect(b.attributes('disabled')).toBe('disabled')
      expect(b.attributes('title')).toBe('Payments open soon')
    }
    expect(w.find('[data-tid="plan-soon"]').text()).toBe('Payments open soon.')
    expect(w.find('a[href]').exists()).toBe(false)
    expect(text(w)).not.toMatch(/(?:\d[\d,.]*\s*(?:GiB|GB|MiB|MB)|storage\s+(?:of\s+)?\d)/i)
    w.destroy()
  })
})
