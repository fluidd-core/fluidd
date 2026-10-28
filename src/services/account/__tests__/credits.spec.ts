import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LibraryError } from '@/services/library/api'
import { CREDITS_CATALOGUE } from '../credits-catalogue'
import {
  catalogPlan, changeText, credits, creditsUnavailableReason, historyIcon, limitState, loadCredits, money, outcomesText,
  perCreditText, planName, planRows, resetText, usageTileText, usageWindow, usedPercent, usedText, yearlyLine,
  type CreditAccount
} from '../credits'

// Dropping the assertion makes the next one different, so a retry can be told apart.
const auth = vi.hoisted(() => ({ dropped: false }))
const drop = vi.hoisted(() => vi.fn(() => { auth.dropped = true }))
vi.mock('@/services/library/assertion', () => ({ modelsAssertion: { get: async () => auth.dropped ? 'assertion-2' : 'assertion-1', drop } }))

const now = new Date(2026, 9, 28).getTime()
const monday = new Date(2026, 10, 2, 9).getTime()

const account = (over: Partial<CreditAccount> = {}): CreditAccount => ({
  plan: 'plus',
  period: 'monthly',
  renews: new Date(2026, 10, 9, 12).getTime(),
  willRenew: true,
  balance: 286,
  monthly: { left: 236, allowance: 400 },
  packs: 0,
  usage: { shape: { credits: 120, count: 6 }, part: { credits: 32, count: 8 }, scan: { credits: 30, count: 1 } },
  history: [],
  jobsAtOnce: 2,
  ...over
})

describe('the plan\'s limit', () => {
  it('reads the weekly limit when the service sends one', () => {
    expect(usageWindow(account({ weekly: { used: 34, limit: 100, resets: monday } }))).toEqual({ window: 'week', used: 34, limit: 100, resets: monday })
  })

  it('names the service\'s monthly allowance as a month until it counts weeks', () => {
    const w = usageWindow(account())
    expect(w).toMatchObject({ window: 'month', used: 164, limit: 400 })
    expect(usedText(w)).toBe('41% of this month\'s limit used')
    // Credits kept past the allowance mean nothing used yet, not a negative.
    expect(usageWindow(account({ monthly: { left: 520, allowance: 400 } })).used).toBe(0)
  })

  it('is near at the warning share, reached at the limit, and none with no limit', () => {
    const at = (used: number, limit = 100) => limitState({ window: 'week', used, limit, resets: monday })
    expect(at(0)).toBe('ok')
    expect(at(100 * CREDITS_CATALOGUE.warnAt - 1)).toBe('ok')
    expect(at(100 * CREDITS_CATALOGUE.warnAt)).toBe('near')
    expect(at(99)).toBe('near')
    expect(at(100)).toBe('reached')
    expect(at(140)).toBe('reached')
    expect(at(0, 0)).toBe('none')
  })

  it('only says 100% once the limit is reached', () => {
    const pct = (used: number) => usedPercent({ window: 'week', used, limit: 100, resets: monday })
    expect(pct(34)).toBe(34)
    expect(pct(99.6)).toBe(99)
    expect(pct(100)).toBe(100)
    expect(pct(-5)).toBe(0)
  })

  it('says when it resets, with the day of the week', () => {
    expect(resetText({ window: 'week', used: 0, limit: 100, resets: monday }, now)).toBe('Resets Mon 2 Nov')
  })

  it('puts the limit, the reset and any bought credits on the Overview tile', () => {
    expect(usageTileText(account({ weekly: { used: 34, limit: 100, resets: monday } }), now)).toBe('34% of this week\'s limit used · Resets Mon 2 Nov')
    expect(usageTileText(account({ weekly: { used: 100, limit: 100, resets: monday }, packs: 120 }), now))
      .toBe('100% of this week\'s limit used · Resets Mon 2 Nov · 120 credits')
    // Production Free today: no allowance and nothing bought.
    expect(usageTileText(account({ plan: 'free', monthly: { left: 0, allowance: 0 } }), now)).toBe('Printer features are always free')
  })
})

describe('plans side by side', () => {
  it('gives every plan the same rows in the same order, so they line up', () => {
    const labels = CREDITS_CATALOGUE.plans.map(p => planRows(p).map(r => r.label))
    for (const l of labels) expect(l).toEqual(labels[0])
    expect(labels[0]).toEqual(['Each week', 'Jobs at once', 'Priority queue', 'High detail shapes'])
  })

  it('differs only in what costs us to run, and gives more for more', () => {
    const [free, plus, pro] = CREDITS_CATALOGUE.plans
    expect(free.weeklyLimit).toBeLessThan(plus.weeklyLimit)
    expect(plus.weeklyLimit).toBeLessThan(pro.weeklyLimit)
    expect(planRows(pro).find(r => r.label === 'High detail shapes')?.value).toBe(true)
    expect(planRows(free).find(r => r.label === 'Priority queue')?.value).toBe(false)
    expect(planRows(plus)[0].value).toBe('5 shapes or 25 parts')
  })

  it('keeps things that cost us nothing free on every plan', () => {
    expect(CREDITS_CATALOGUE.free).toEqual(expect.arrayContaining(['Every printer feature', 'Editing a part\'s code', 'STEP export']))
  })
})

describe('prices', () => {
  it('turns credits into what they make', () => {
    expect(outcomesText(286)).toBe('About 14 shapes or 71 parts')
    expect(outcomesText(12)).toBe('Enough for 3 parts')
    expect(outcomesText(3)).toBe('')
  })

  it('prices plans and packs from the catalogue', () => {
    expect(money(7.99)).toBe('£7.99')
    expect(yearlyLine(catalogPlan('plus'))).toBe('£6.67 a month, 2 months free')
    expect(yearlyLine(catalogPlan('free'))).toBe('')
    expect(perCreditText(12.99, 500)).toBe('2.6p')
    expect(planName('team')).toBe('Team')
  })

  it('keeps every top-up dearer per credit than Plus, so the plan is always the better buy', () => {
    const plus = catalogPlan('plus')
    const plusPerCredit = (plus.price?.monthly ?? 0) / (plus.weeklyLimit * 52 / 12)
    for (const pack of CREDITS_CATALOGUE.packs) expect(pack.price / pack.credits).toBeGreaterThan(plusPerCredit)
  })

  it('signs history rows and picks their icon', () => {
    expect(changeText(400)).toBe('+400')
    expect(changeText(-1200)).toBe('−1,200')
    expect(credits(-20)).toBe('−20')
    const row = (kind: string, change: number) => ({ id: '1', at: 0, kind, title: '', change })
    expect(historyIcon(row('refund', 20))).toBe('refund')
    expect(historyIcon(row('rollover', -64))).toBe('expire')
    expect(historyIcon(row('shape', -20))).toBe('spend')
    expect(historyIcon(row('pack', 100))).toBe('add')
  })
})

describe('reading the plan', () => {
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
    expect(drop).toHaveBeenCalledTimes(1)
    const sent = fetcher.mock.calls.map(([, init]) => (init as RequestInit & { headers: Record<string, string> }).headers.authorization)
    expect(sent).toEqual(['Bearer assertion-1', 'Bearer assertion-2'])
  })

  it('names why there is no usage to show', async () => {
    const refuse = (status: number, code?: string) => vi.fn(async () => new Response(code ? JSON.stringify({ error: { code, message: code } }) : '<html>', { status }))
    const reason = async (f: ReturnType<typeof refuse>) => creditsUnavailableReason(await loadCredits(f as unknown as typeof fetch).catch(e => e))
    expect(await reason(refuse(503, 'create_unavailable'))).toBe('unavailable')
    expect(await reason(refuse(404))).toBe('unavailable')
    expect(await reason(refuse(403, 'consent_required'))).toBe('off')
    expect(await reason(refuse(401))).toBe('signed-out')
    expect(await reason(refuse(500))).toBe('error')
    const offline = vi.fn(async () => { throw new TypeError('network') })
    expect(creditsUnavailableReason(await loadCredits(offline as unknown as typeof fetch).catch(e => e))).toBe('offline')
    // The console being down is not Create being closed.
    expect(creditsUnavailableReason(new LibraryError('console', 'no', 503))).toBe('error')
  })
})
