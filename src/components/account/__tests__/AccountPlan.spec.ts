import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountPlan from '../AccountPlan.vue'
import { CREDITS_CATALOGUE } from '@/services/account/credits-catalogue'
import { LibraryError } from '@/services/library/api'
import type { CreditAccount } from '@/services/account/credits'

const loadCredits = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/credits', async (actual) => ({ ...(await actual<object>()), loadCredits }))

const settle = () => new Promise(resolve => setTimeout(resolve))
const shipped = CREDITS_CATALOGUE.planPageOpen
const monday = new Date(2026, 10, 2, 9).getTime()

const plus: CreditAccount = {
  plan: 'plus',
  period: 'monthly',
  renews: new Date(2026, 10, 9, 12).getTime(),
  willRenew: true,
  balance: 286,
  monthly: { left: 236, allowance: 400 },
  packs: 0,
  weekly: { used: 34, limit: 100, resets: monday },
  usage: { shape: { credits: 40, count: 2 }, part: { credits: 32, count: 8 }, scan: { credits: 0, count: 0 } },
  history: [
    { id: '9', at: Date.now() - 3600_000, kind: 'shape', title: 'Low-poly fox planter', change: -20 },
    { id: '8', at: Date.now() - 7200_000, kind: 'refund', title: 'Chess knight, refunded', change: 20 },
    { id: '4', at: Date.now() - 18 * 86400_000, kind: 'pack', title: '100 credits', change: 100 }
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

describe('Plan, while closed', () => {
  beforeEach(() => { CREDITS_CATALOGUE.planPageOpen = false })
  afterEach(() => {
    CREDITS_CATALOGUE.planPageOpen = shipped
    vi.clearAllMocks()
  })

  it('shows the planned-prices card and asks the service nothing', async () => {
    const w = await open(plus)
    expect(w.find('h1').text()).toBe('Plan')
    expect(w.text()).toContain('These are planned prices.')
    expect(w.find('[data-tid="plan-usage"]').exists()).toBe(false)
    expect(loadCredits).not.toHaveBeenCalled()
    w.destroy()
  })
})

describe('Plan', () => {
  beforeEach(() => { CREDITS_CATALOGUE.planPageOpen = true })
  afterEach(() => {
    CREDITS_CATALOGUE.planPageOpen = shipped
    vi.clearAllMocks()
  })

  it('leads with how much of the week is used and when it resets, then the plans', async () => {
    const w = await open(plus)
    const usage = text(w.find('[data-tid="plan-usage"]'))
    expect(usage).toContain('This week')
    expect(usage).toContain('34% of this week\'s limit used')
    expect(usage).toContain('Resets Mon 2 Nov')
    expect(usage).toContain('2 shapes and 8 parts this week')
    expect(w.find('[data-tid="plan-current"]').text()).toBe('Plus · monthly')
    expect(w.find('[data-tid="plan-limit-note"]').exists()).toBe(false)
    // No list of what credits buy up front: the plans come first, prices per job sit behind (i).
    const headings = w.findAll('h2').wrappers.map(h => h.text())
    expect(headings).toEqual(['This week', 'Plans', 'Credits', 'History'])
    expect(w.text()).not.toContain('What credits buy')
    w.destroy()
  })

  it('names the service\'s monthly allowance as a month until it sends a week', async () => {
    const w = await open({ ...plus, weekly: undefined })
    const usage = text(w.find('[data-tid="plan-usage"]'))
    expect(usage).toContain('This month')
    expect(usage).toContain('41% of this month\'s limit used')
    expect(usage).not.toContain('week')
    w.destroy()
  })

  it('shows the plans side by side, with the same rows and only what costs us to run', async () => {
    const w = await open(plus)
    const rows = (id: string) => w.findAll(`[data-tid="plan-option-${id}"] [data-tid="plan-row"]`).wrappers
      .map(r => `${r.find('dt').text()}: ${r.find('dd').text().replace(/\s+/g, ' ').trim()}`)
    expect(rows('free')).toEqual(['Each week: 1 shape or 5 parts', 'Jobs at once: 1', 'Priority queue: —Not included', 'High detail shapes: —Not included'])
    expect(rows('plus')).toEqual(['Each week: 5 shapes or 25 parts', 'Jobs at once: 2', 'Priority queue: Included', 'High detail shapes: —Not included'])
    expect(rows('pro')).toEqual(['Each week: 15 shapes or 75 parts', 'Jobs at once: 4', 'Priority queue: Included', 'High detail shapes: Included'])
    for (const plan of CREDITS_CATALOGUE.plans) {
      const card = text(w.find(`[data-tid="plan-option-${plan.id}"]`))
      if (plan.price) expect(card).toContain(`£${plan.price.monthly.toFixed(2)}`)
      for (const free of CREDITS_CATALOGUE.free) expect(card).not.toContain(free)
    }
    const free = text(w.find('[data-tid="plan-free"]'))
    for (const item of CREDITS_CATALOGUE.free) expect(free).toContain(item)
    expect(w.find('[data-tid="plan-option-plus"]').text()).toContain('Current')
    w.destroy()
  })

  it('says when the limit is nearly used, and when it resets', async () => {
    const w = await open({ ...plus, weekly: { used: 85, limit: 100, resets: monday } })
    const note = text(w.find('[data-tid="plan-limit-note"]'))
    expect(note).toContain('85% of this week\'s limit used.')
    expect(note).toContain('Resets Mon 2 Nov.')
    expect(note).not.toMatch(/printer/i)
    expect(w.find('[data-tid="plan-note-credits"]').exists()).toBe(false)
    w.destroy()
  })

  it('at the limit, says when it resets and offers credits without pushing them', async () => {
    const w = await open({ ...plus, weekly: { used: 100, limit: 100, resets: monday } })
    const note = text(w.find('[data-tid="plan-limit-note"]'))
    expect(note).toContain('You\'ve reached this week\'s limit.')
    expect(note).toContain('Resets Mon 2 Nov.')
    expect(w.find('[data-tid="plan-note-credits"]').text()).toBe('Buy credits')
    w.destroy()
  })

  it('at the limit with bought credits, says they carry on until the reset', async () => {
    const w = await open({ ...plus, packs: 120, weekly: { used: 100, limit: 100, resets: monday } })
    expect(text(w.find('[data-tid="plan-limit-note"]'))).toContain('Your 120 credits are in use until then.')
    expect(w.find('[data-tid="plan-note-credits"]').exists()).toBe(false)
    expect(text(w.find('[data-tid="plan-topup"]'))).toBe('120 credits for after your limit')
    w.destroy()
  })

  it('says nothing about limits when the plan includes no usage (production Free today)', async () => {
    const w = await open({ ...plus, plan: 'free', period: null, weekly: undefined, monthly: { left: 0, allowance: 0 }, packs: 0, history: [] })
    expect(w.find('[data-tid="plan-limit-note"]').exists()).toBe(false)
    expect(w.find('[data-tid="plan-usage-line"]').text()).toBe('No usage included on your plan yet.')
    expect(w.find('.plan-meter').exists()).toBe(false)
    expect(w.find('[data-tid="plan-option-free"]').text()).toContain('Current')
    w.destroy()
  })

  it('keeps credits as a top-up: never expiring, priced per credit, with job prices behind (i)', async () => {
    const w = await open(plus)
    for (const pack of CREDITS_CATALOGUE.packs) expect(text(w.find(`[data-tid="plan-pack-${pack.credits}"]`))).toContain(`£${pack.price.toFixed(2)}`)
    expect(text(w.find('[data-tid="plan-pack-100"]'))).toContain('About 5 shapes or 25 parts')
    await w.find('[data-tid="plan-credits"] [data-tid="acct-more"]').trigger('click')
    const more = text(w.find('[data-tid="plan-credits"] [role="note"]'))
    expect(more).toContain('only used once you reach your plan\'s limit')
    expect(more).toContain('A part uses 4 credits, a shape 20 and a scan 30')
    w.destroy()
  })

  it('shows refunds and purchases in the history, signed', async () => {
    const w = await open(plus)
    const history = text(w.find('[data-tid="plan-history"]'))
    expect(history).toContain('Low-poly fox planter')
    expect(history).toContain('−20')
    expect(history).toContain('Chess knight, refunded')
    expect(history).toContain('+100')
    w.destroy()
  })

  it('shows the plans from the catalogue, with nothing marked current, when there is no usage to read', async () => {
    const w = await open(new LibraryError('create_unavailable', 'no', 503))
    expect(w.find('[data-tid="plan-usage"]').exists()).toBe(false)
    expect(w.find('[data-tid="plan-unavailable"]').text()).toContain('Your usage shows here once Create opens.')
    for (const plan of CREDITS_CATALOGUE.plans) expect(w.find(`[data-tid="plan-option-${plan.id}"]`).exists()).toBe(true)
    expect(w.find('[data-tid="plan-current"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Current')
    w.destroy()
  })

  it('says why the usage is missing', async () => {
    const line = async (error: Error) => {
      const w = await open(error)
      const said = w.find('[data-tid="plan-unavailable"]').text()
      w.destroy()
      return said
    }
    expect(await line(new LibraryError('not-signed-in', 'no', 401))).toBe('Sign in again to see your usage.')
    expect(await line(new LibraryError('consent_required', 'no', 403))).toContain('Turn on Muon3D models')
    expect(await line(new LibraryError('internal', 'no', 500))).toBe('Your usage didn\'t load. Try again later.')
  })

  it('shows nothing from the account until the service answers', async () => {
    loadCredits.mockImplementation(() => new Promise(() => {}))
    const w = mount(AccountPlan, { stubs: { 'frame-icon': true } })
    await settle()
    expect(w.find('[data-tid="plan-reading"]').text()).toBe('Reading your plan…')
    expect(w.find('[data-tid="plan-option-free"]').exists()).toBe(false)
    w.destroy()
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
    const w = await open({ ...plus, weekly: { used: 100, limit: 100, resets: monday } })
    const buying = w.findAll('[data-tid="plan-note-credits"], [data-tid^="plan-choose-"], [data-tid^="plan-pack-"] button').wrappers
    expect(buying.length).toBeGreaterThan(4)
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
