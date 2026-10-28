import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountOverview from '../AccountOverview.vue'
import { CREDITS_CATALOGUE } from '@/services/account/credits-catalogue'
import type { CreditAccount } from '@/services/account/credits'

const loadCredits = vi.hoisted(() => vi.fn((): Promise<unknown> => new Promise(() => {})))
vi.mock('@/services/account/credits', async (actual) => ({ ...(await actual<object>()), loadCredits }))
vi.mock('@/services/account/state', async (actual) => ({ ...(await actual<object>()), loadOverview: vi.fn() }))
vi.mock('@/services/library/store', async (actual) => ({
  ...(await actual<object>()),
  refreshLibrary: vi.fn(async () => {}),
  watchLibraryAccount: vi.fn()
}))

const shipped = CREDITS_CATALOGUE.planPageOpen
const settle = () => new Promise(resolve => setTimeout(resolve))

const reached: CreditAccount = {
  plan: 'plus',
  period: 'monthly',
  renews: new Date(2026, 10, 9, 12).getTime(),
  willRenew: true,
  balance: 0,
  monthly: { left: 0, allowance: 400 },
  packs: 0,
  weekly: { used: 100, limit: 100, resets: new Date(2026, 10, 2, 9).getTime() },
  usage: { shape: { credits: 100, count: 5 }, part: { credits: 0, count: 0 }, scan: { credits: 0, count: 0 } },
  history: [],
  jobsAtOnce: 2
}

const overview = () => mount(AccountOverview, {
  propsData: { linkTo: (id: string) => `/account/${id}` },
  stubs: { 'frame-icon': true, 'printer-thumb': true, 'router-link': { template: '<a><slot /></a>' } }
})

const tile = (w: ReturnType<typeof overview>) => w.find('[data-tid="account-tile-plan"]').text().replace(/\s+/g, ' ')

describe('the Overview plan tile', () => {
  afterEach(() => {
    CREDITS_CATALOGUE.planPageOpen = shipped
    loadCredits.mockImplementation(() => new Promise(() => {}))
    vi.clearAllMocks()
  })

  it('says plans are coming, and asks for nothing, while the Plan page is closed', () => {
    CREDITS_CATALOGUE.planPageOpen = false
    const w = overview()
    expect(tile(w)).toContain('Free plan')
    expect(tile(w)).toContain('Printer features are always free')
    expect(tile(w)).toContain('Plans soon')
    expect(loadCredits).not.toHaveBeenCalled()
    w.destroy()
  })

  it('reads the plan once the page is open', () => {
    CREDITS_CATALOGUE.planPageOpen = true
    const w = overview()
    expect(loadCredits).toHaveBeenCalledTimes(1)
    expect(tile(w)).not.toContain('Plans soon')
    w.destroy()
  })

  it('shows the week\'s use and flags a reached limit', async () => {
    CREDITS_CATALOGUE.planPageOpen = true
    loadCredits.mockImplementation(async () => reached)
    const w = overview()
    await settle()
    expect(tile(w)).toContain('Plus plan')
    expect(tile(w)).toContain('100% of this week\'s limit used · Resets Mon 2 Nov')
    expect(tile(w)).toContain('Limit reached')
    w.destroy()
  })
})
