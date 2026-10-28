/**
 * The account's credits (ADR 0023): what the Plan and credits page says,
 * worked out from the model service's `GET /v1/create/plan` and the catalogue.
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
  packs: number;
  usage: { shape: CreditUsage, part: CreditUsage, scan: CreditUsage };
  history: CreditHistoryRow[];
  jobsAtOnce: number;
}

/**
 * The account's credits from the model service, with the Library's
 * assertion. Refusals come back as a LibraryError (see creditsUnavailableReason).
 */
export async function loadCredits (fetcher?: typeof fetch): Promise<CreditAccount> {
  const http = fetcher ?? ((input, init) => fetch(input, init))
  const token = await modelsAssertion.get()
  let response: Response
  try {
    response = await http(`${MODELS_URL}/v1/create/plan`, { headers: { authorization: `Bearer ${token}` } })
  } catch {
    throw new LibraryError('offline', 'Your credits can\'t be reached.')
  }
  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch { /* an HTML error page */ }
  if (!response.ok) throw libraryErrorFrom(response.status, data)
  return data as CreditAccount
}

/**
 * Why the page shows the catalogue alone: `unavailable` when this model
 * service has no Create yet (503, 404), `off` when the account hasn't turned
 * the model service on (`consent_required`).
 */
export function creditsUnavailableReason (error: unknown): 'unavailable' | 'off' | 'signed-out' | 'offline' {
  if (!(error instanceof LibraryError)) return 'offline'
  if (error.code === 'not-signed-in') return 'signed-out'
  if (error.code === 'consent_required') return 'off'
  if (error.code === 'offline') return 'offline'
  return 'unavailable'
}

export type BalanceState = 'ok' | 'low' | 'empty'

const cost = (id: CostId) => CREDITS_CATALOGUE.costs.find(c => c.id === id)?.credits ?? 0

/** Empty: not enough to make anything new (one part). Low: less than one shape. */
export function balanceState (balance: number): BalanceState {
  if (balance < cost('part')) return 'empty'
  if (balance < CREDITS_CATALOGUE.lowBelow) return 'low'
  return 'ok'
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "About 14 shapes or 71 parts", "Enough for 3 parts", or "". */
export function outcomesText (credits: number): string {
  const shapes = Math.floor(credits / cost('shape'))
  const parts = Math.floor(credits / cost('part'))
  if (shapes >= 1) return `About ${plural(shapes, 'shape')} or ${plural(parts, 'part')}`
  if (parts >= 1) return `Enough for ${plural(parts, 'part')}`
  return ''
}

export function catalogPlan (id: string): CataloguePlan {
  return CREDITS_CATALOGUE.plans.find(p => p.id === id) ?? CREDITS_CATALOGUE.plans[0]
}

const SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }

/** "£7.99". */
export function money (amount: number, currency: string = CREDITS_CATALOGUE.currency): string {
  const symbol = SYMBOLS[currency]
  const text = amount.toFixed(2)
  return symbol ? `${symbol}${text}` : `${text} ${currency}`
}

/** "1,200". */
export function credits (n: number): string {
  return n.toLocaleString('en-GB')
}

/** What a plan costs per month on a yearly plan, and the months it saves: "£6.67 a month, 2 months free". */
export function yearlyLine (plan: CataloguePlan): string {
  if (!plan.price) return ''
  const perMonth = plan.price.yearly / 12
  const saved = Math.round((plan.price.monthly * 12 - plan.price.yearly) / plan.price.monthly)
  return `${money(perMonth)} a month${saved >= 1 ? `, ${plural(saved, 'month')} free` : ''}`
}

/** Pence per credit, for comparing packs and plans: "2.6p". */
export function perCreditText (price: number, creditCount: number): string {
  const pence = (price * 100) / creditCount
  return `${pence < 10 ? pence.toFixed(1) : Math.round(pence)}p`
}

/** "400 more on 9 Nov", or "" when none are coming: no allowance, or a paid plan that won't renew. */
export function nextGrantText (account: CreditAccount, now: number = Date.now()): string {
  if (!account.monthly.allowance || (account.plan !== 'free' && !account.willRenew)) return ''
  return `${credits(account.monthly.allowance)} more on ${dayText(account.renews / 1000, now)}`
}

/** "+400", "−20". */
export function changeText (change: number): string {
  return change > 0 ? `+${credits(change)}` : `−${credits(Math.abs(change))}`
}

export type HistoryIcon = 'add' | 'spend' | 'refund' | 'expire'

export function historyIcon (row: CreditHistoryRow): HistoryIcon {
  if (row.kind === 'refund') return 'refund'
  if (row.kind === 'rollover' || row.kind === 'reversal') return 'expire'
  return row.change >= 0 ? 'add' : 'spend'
}
