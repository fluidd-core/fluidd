import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LibraryError } from '@/services/library/api'
import { CREDITS_CATALOGUE } from '../credits-catalogue'
import {
  balanceAlert, balanceState, catalogPlan, changeText, credits, creditsUnavailableReason, historyIcon, loadCredits, money,
  monthlyText, nextGrantText, outcomesText, perCreditText, planName, yearlyLine, type CreditAccount
} from '../credits'

// Dropping the assertion makes the next one different, so a retry can be told apart.
const auth = vi.hoisted(() => ({ dropped: false }))
const drop = vi.hoisted(() => vi.fn(() => { auth.dropped = true }))
vi.mock('@/services/library/assertion', () => ({ modelsAssertion: { get: async () => auth.dropped ? 'assertion-2' : 'assertion-1', drop } }))

const account = (over: Partial<CreditAccount> = {}): CreditAccount => ({
  plan: 'plus',
  period: 'monthly',
  renews: new Date(2026, 10, 9, 12).getTime(),
  willRenew: true,
  balance: 286,
  monthly: { left: 236, allowance: 400 },
  packs: 50,
  usage: { shape: { credits: 120, count: 6 }, part: { credits: 32, count: 8 }, scan: { credits: 30, count: 1 } },
  history: [],
  jobsAtOnce: 2,
  ...over
})

describe('credits in words', () => {
  it('turns a balance into what it buys', () => {
    expect(outcomesText(286)).toBe('About 14 shapes or 71 parts')
    expect(outcomesText(20)).toBe('About 1 shape or 5 parts')
    expect(outcomesText(12)).toBe('Enough for 3 parts')
    expect(outcomesText(3)).toBe('')
  })

  it('is low below one shape and empty below one part', () => {
    expect(balanceState(286)).toBe('ok')
    expect(balanceState(CREDITS_CATALOGUE.lowBelow)).toBe('ok')
    expect(balanceState(CREDITS_CATALOGUE.lowBelow - 1)).toBe('low')
    expect(balanceState(4)).toBe('low')
    expect(balanceState(3)).toBe('empty')
    expect(balanceState(0)).toBe('empty')
    expect(balanceState(-40)).toBe('empty')
  })

  it('only warns when there is a way to more credits', () => {
    const now = new Date(2026, 9, 28).getTime()
    expect(balanceAlert(account({ balance: 12, monthly: { left: 12, allowance: 400 }, packs: 0 }), now)).toBe('low')
    expect(balanceAlert(account({ plan: 'free', willRenew: false, balance: 0, monthly: { left: 0, allowance: 40 }, packs: 0 }), now)).toBe('empty')
    // Production today: Free grants nothing and nothing can be bought, so there's nothing to tell them.
    expect(CREDITS_CATALOGUE.paymentsOpen).toBe(false)
    expect(balanceAlert(account({ plan: 'free', willRenew: false, balance: 0, monthly: { left: 0, allowance: 0 }, packs: 0 }), now)).toBe('ok')
    expect(balanceAlert(account({ willRenew: false, balance: 3 }), now)).toBe('ok')
  })

  it('shows monthly credits kept from last month past the allowance', () => {
    expect(monthlyText({ left: 236, allowance: 400 })).toBe('236 of 400')
    expect(monthlyText({ left: 520, allowance: 400 })).toBe('520')
    expect(credits(-1200)).toBe('−1,200')
  })

  it('says when more credits come, and says nothing when none are coming', () => {
    const now = new Date(2026, 9, 28).getTime()
    expect(nextGrantText(account(), now)).toBe('400 more on 9 Nov')
    expect(nextGrantText(account({ willRenew: false }), now)).toBe('')
    expect(nextGrantText(account({ plan: 'free', willRenew: false, monthly: { left: 12, allowance: 40 } }), now)).toBe('40 more on 9 Nov')
    expect(nextGrantText(account({ plan: 'free', monthly: { left: 0, allowance: 0 } }), now)).toBe('')
  })

  it('prices plans and packs from the catalogue', () => {
    expect(money(7.99)).toBe('£7.99')
    expect(yearlyLine(catalogPlan('plus'))).toBe('£6.67 a month, 2 months free')
    expect(yearlyLine(catalogPlan('free'))).toBe('')
    expect(perCreditText(12.99, 500)).toBe('2.6p')
    expect(catalogPlan('nonsense').id).toBe('free')
    expect(planName('pro')).toBe('Pro')
    expect(planName('team')).toBe('Team')
  })

  it('signs history rows and picks their icon', () => {
    expect(changeText(400)).toBe('+400')
    expect(changeText(-1200)).toBe('−1,200')
    const row = (kind: string, change: number) => ({ id: '1', at: 0, kind, title: '', change })
    expect(historyIcon(row('refund', 20))).toBe('refund')
    expect(historyIcon(row('rollover', -64))).toBe('expire')
    expect(historyIcon(row('shape', -20))).toBe('spend')
    expect(historyIcon(row('pack', 100))).toBe('add')
  })

  it('keeps every pack dearer per credit than Plus, so the plan is always the better buy', () => {
    const plus = catalogPlan('plus')
    const plusPerCredit = (plus.price?.monthly ?? 0) / plus.monthlyCredits
    for (const pack of CREDITS_CATALOGUE.packs) expect(pack.price / pack.credits).toBeGreaterThan(plusPerCredit)
  })
})

describe('reading the credits', () => {
  beforeEach(() => {
    auth.dropped = false
    drop.mockClear()
  })

  it('asks the model service with the account assertion', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(account()), { status: 200 }))
    const got = await loadCredits(fetcher as unknown as typeof fetch)
    expect(got.balance).toBe(286)
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/v1\/create\/plan$/)
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer assertion-1')
    expect(init.credentials).toBe('omit')
  })

  it('asks once more with a new assertion after a 401', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(account()), { status: 200 }))
    expect((await loadCredits(fetcher as unknown as typeof fetch)).balance).toBe(286)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(drop).toHaveBeenCalledTimes(1)
    const sent = fetcher.mock.calls.map(([, init]) => (init as RequestInit & { headers: Record<string, string> }).headers.authorization)
    expect(sent).toEqual(['Bearer assertion-1', 'Bearer assertion-2'])
  })

  it('names why there is no balance to show', async () => {
    const refuse = (status: number, code?: string) => vi.fn(async () => new Response(code ? JSON.stringify({ error: { code, message: code } }) : '<html>', { status }))
    const reason = async (f: ReturnType<typeof refuse>) => creditsUnavailableReason(await loadCredits(f as unknown as typeof fetch).catch(e => e))
    expect(await reason(refuse(503, 'create_unavailable'))).toBe('unavailable')
    expect(await reason(refuse(404))).toBe('unavailable')
    expect(await reason(refuse(403, 'consent_required'))).toBe('off')
    expect(await reason(refuse(401))).toBe('signed-out')
    const offline = vi.fn(async () => { throw new TypeError('network') })
    expect(creditsUnavailableReason(await loadCredits(offline as unknown as typeof fetch).catch(e => e))).toBe('offline')
    expect(await reason(refuse(500))).toBe('error')
    expect(creditsUnavailableReason(new LibraryError('console', 'no', 502))).toBe('error')
    // The console being down is not Create being closed.
    expect(creditsUnavailableReason(new LibraryError('console', 'no', 503))).toBe('error')
  })
})
