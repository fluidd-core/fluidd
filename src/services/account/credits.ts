/**
 * The account's plan and usage (ADR 0023): what the Plan page says, worked
 * out from the model service's `GET /v1/create/plan` and the catalogue.
 * Plain functions, so the page only lays them out and the rules are tested
 * here. Times from the service are milliseconds.
 */
import { LibraryError, MODELS_URL, libraryErrorFrom } from '@/services/library/api'
import { modelsAssertion } from '@/services/library/assertion'
import { CREDITS_CATALOGUE, type CataloguePlan, type CostId, type PlanId } from './credits-catalogue'
import { dayText } from './model'

export type HistoryKind = 'shape' | 'part' | 'refund' | 'monthly' | 'rollover' | 'pack' | 'reversal'

export interface CreditHistoryRow {
  id: string;
  at: number;
  kind: HistoryKind | string;
  title: string;
  /** Credits added (positive) or spent (negative). */
  change: number;
  store?: string;
  transactionId?: string;
}

export interface CreditUsage {
  credits: number;
  count: number;
}

/** The model service's answer: the app's `CreditAccount` (packages/credits). */
export interface CreditAccount {
  plan: PlanId | string;
  period: 'monthly' | 'yearly' | null;
  /** When the month's credits next arrive. */
  renews: number;
  willRenew: boolean;
  balance: number;
  monthly: { left: number, allowance: number };
  /** Bought credits: the top-up, used after the limit. */
  packs: number;
  /**
   * The week's limit, in credits, once the model service counts weekly
   * limits (the contract proposed in the KAN-909 report). Not sent yet.
   */
  weekly?: { used: number, limit: number, resets: number };
  usage: { shape: CreditUsage, part: CreditUsage, scan: CreditUsage };
  history: CreditHistoryRow[];
  jobsAtOnce: number;
}

/**
 * The account's plan and usage from the model service, with the Library's
 * assertion. A 401 asks once more with a new assertion, as the Library does.
 * Refusals come back as a LibraryError (see creditsUnavailableReason).
 */
export async function loadCredits (fetcher?: typeof fetch): Promise<CreditAccount> {
  const http = fetcher ?? ((input, init) => fetch(input, init))
  async function ask (retried: boolean): Promise<Response> {
    const token = await modelsAssertion.get()
    let response: Response
    try {
      response = await http(`${MODELS_URL}/v1/create/plan`, { credentials: 'omit', cache: 'no-store', headers: { authorization: `Bearer ${token}` } })
    } catch {
      throw new LibraryError('offline', 'Your plan can\'t be reached.')
    }
    if (response.status !== 401 || retried) return response
    modelsAssertion.drop()
    return ask(true)
  }
  const response = await ask(false)
  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch { /* an HTML error page */ }
  if (!response.ok) throw libraryErrorFrom(response.status, data)
  return data as CreditAccount
}

export type CreditsUnavailable = 'unavailable' | 'off' | 'signed-out' | 'offline' | 'error'

/**
 * Why the page shows the plans alone: `unavailable` when this model service
 * has no Create yet (503, 404), `off` when the account hasn't turned the
 * model service on (`consent_required`), `signed-out` when the sign-in has
 * lapsed, and `error` for any other refusal, the console's included.
 */
export function creditsUnavailableReason (error: unknown): CreditsUnavailable {
  if (!(error instanceof LibraryError)) return 'error'
  if (error.code === 'not-signed-in') return 'signed-out'
  if (error.code === 'consent_required') return 'off'
  if (error.code === 'offline') return 'offline'
  if (error.code !== 'console' && (error.status === 503 || error.status === 404)) return 'unavailable'
  return 'error'
}

export interface UsageWindow {
  window: 'week' | 'month';
  /** Credits used, and allowed, in this window. */
  used: number;
  limit: number;
  /** When the window starts again, or when the plan ends if it won't renew. */
  resets: number;
  /** A paid plan that won't renew: the date is its end, not a reset. */
  ending?: boolean;
}

/**
 * The account's limit and how much of it is used. The service's `weekly`
 * once it sends one; until then its monthly allowance stands in, named as a
 * month so the page never claims a week it doesn't count.
 */
export function usageWindow (account: CreditAccount): UsageWindow {
  if (account.weekly) return { window: 'week', ...account.weekly }
  const { left, allowance } = account.monthly
  const ending = account.plan !== 'free' && !account.willRenew
  return { window: 'month', used: Math.max(0, allowance - left), limit: allowance, resets: account.renews, ending }
}

export type LimitState = 'none' | 'ok' | 'near' | 'reached'

/** None: the plan includes no usage here. Near: `warnAt` of the limit used. */
export function limitState (usage: UsageWindow): LimitState {
  if (usage.limit <= 0) return 'none'
  if (usage.used >= usage.limit) return 'reached'
  if (usage.used >= usage.limit * CREDITS_CATALOGUE.warnAt) return 'near'
  return 'ok'
}

/** Whole percent used: 100 only once the limit is reached. */
export function usedPercent (usage: UsageWindow): number {
  if (usage.limit <= 0) return 0
  if (usage.used >= usage.limit) return 100
  return Math.min(99, Math.floor((Math.max(usage.used, 0) / usage.limit) * 100))
}

/** "34% of this week's limit used". */
export function usedText (usage: UsageWindow): string {
  return `${usedPercent(usage)}% of this ${usage.window}'s limit used`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** "Resets Mon 3 Nov", or "Plan ends Mon 9 Nov" for a plan that won't renew. */
export function resetText (usage: UsageWindow, now: number = Date.now()): string {
  return `${usage.ending ? 'Plan ends' : 'Resets'} ${WEEKDAYS[new Date(usage.resets).getDay()]} ${dayText(usage.resets / 1000, now)}`
}

/**
 * The Overview tile's line: "34% of this week's limit used · Resets Mon 3 Nov",
 * with bought credits after it, or the promise when there's no limit to show.
 */
export function usageTileText (account: CreditAccount, now: number = Date.now()): string {
  const usage = usageWindow(account)
  const bought = account.packs > 0 ? `${credits(account.packs)} credits` : ''
  if (limitState(usage) === 'none') return bought || 'Printer features are always free'
  return [usedText(usage), resetText(usage, now), bought].filter(Boolean).join(' · ')
}

const cost = (id: CostId) => CREDITS_CATALOGUE.costs.find(c => c.id === id)?.credits ?? 0

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "About 5 shapes or 25 parts", "Enough for 3 parts", or "". */
export function outcomesText (credits: number): string {
  const shapes = Math.floor(credits / cost('shape'))
  const parts = Math.floor(credits / cost('part'))
  if (shapes >= 1) return `About ${plural(shapes, 'shape')} or ${plural(parts, 'part')}`
  if (parts >= 1) return `Enough for ${plural(parts, 'part')}`
  return ''
}

/** "A part uses 4 credits, a shape 20 and a scan 30". */
export function costsText (): string {
  return `A part uses ${cost('part')} credits, a shape ${cost('shape')} and a scan ${cost('scan')}`
}

export interface PlanRow {
  label: string;
  /** Text, or whether the plan has it. */
  value: string | boolean;
}

/**
 * What a plan gets, in the same rows for every plan so they line up side by
 * side. Only things that cost us to run.
 */
export function planRows (plan: CataloguePlan): PlanRow[] {
  return [
    { label: 'Each week', value: outcomesText(plan.weeklyLimit).replace(/^About /, '') || 'No usage' },
    { label: 'Jobs at once', value: String(plan.jobsAtOnce) },
    { label: 'Priority queue', value: plan.priority },
    { label: 'High detail shapes', value: plan.highDetail }
  ]
}

export function catalogPlan (id: string): CataloguePlan {
  return CREDITS_CATALOGUE.plans.find(p => p.id === id) ?? CREDITS_CATALOGUE.plans[0]
}

/** "Plus", or a plan the catalogue doesn't list yet under its own name. */
export function planName (id: string): string {
  const plan = CREDITS_CATALOGUE.plans.find(p => p.id === id)
  return plan?.name ?? (id ? id[0].toUpperCase() + id.slice(1) : '')
}

const SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }

/** "£7.99". */
export function money (amount: number, currency: string = CREDITS_CATALOGUE.currency): string {
  const symbol = SYMBOLS[currency]
  const text = amount.toFixed(2)
  return symbol ? `${symbol}${text}` : `${text} ${currency}`
}

/** "1,200", "−20". */
export function credits (n: number): string {
  return n < 0 ? `−${Math.abs(n).toLocaleString('en-GB')}` : n.toLocaleString('en-GB')
}

/** What a plan costs per month on a yearly plan, and the months it saves: "£6.67 a month, 2 months free". */
export function yearlyLine (plan: CataloguePlan): string {
  if (!plan.price) return ''
  const perMonth = plan.price.yearly / 12
  const saved = Math.round((plan.price.monthly * 12 - plan.price.yearly) / plan.price.monthly)
  return `${money(perMonth)} a month${saved >= 1 ? `, ${plural(saved, 'month')} free` : ''}`
}

/** Pence per credit, for comparing packs: "2.6p". */
export function perCreditText (price: number, creditCount: number): string {
  const pence = (price * 100) / creditCount
  return `${pence < 10 ? pence.toFixed(1) : Math.round(pence)}p`
}

/** "+400", "−20". */
export function changeText (change: number): string {
  return change > 0 ? `+${credits(change)}` : credits(change)
}

export type HistoryIcon = 'add' | 'spend' | 'refund' | 'expire'

export function historyIcon (row: CreditHistoryRow): HistoryIcon {
  if (row.kind === 'refund') return 'refund'
  if (row.kind === 'rollover' || row.kind === 'reversal') return 'expire'
  return row.change >= 0 ? 'add' : 'spend'
}
