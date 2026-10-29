/**
 * Plans, usage limits and prices as Control shows them.
 *
 * The numbers are not kept here. The model service's `pricing.rs` is the one
 * catalogue, and `GET /v1/create/catalogue` serves it (KAN-1155): plans,
 * prices, weekly limits, jobs at once, packs and credits per job.
 * `loadCatalogue` reads it into `catalogue`, which the Plan page reads. What
 * stays here is Control's own: whether payments are open, which plan to
 * mark, the words, and when to warn.
 *
 * The rule (Jack, 28 Oct 2026): we only charge for what costs us money to
 * run, which is making shapes, parts and scans on our servers. Everything else
 * is free on every plan (`free`). A plan gives usage up to a weekly limit;
 * credits are a top-up, used only once that week's limit is reached.
 *
 * Nothing here takes money: `paymentsOpen` stays false until store and web
 * checkout exist (KAN-406), and the buttons say so. Setting it true only
 * enables the buttons; each still needs its checkout wired in AccountPlan.vue.
 */
import Vue from 'vue'
import { MODELS_URL } from '@/services/library/api'

export type PlanId = 'free' | 'plus' | 'pro'
export type CostId = 'part' | 'partChange' | 'shape' | 'shapeRefine' | 'photo' | 'scan' | 'highDetail'

export interface CataloguePlan {
  id: PlanId | string;
  name: string;
  /** Per month and per year, in the catalogue's currency. Null for Free. */
  price: { monthly: number, yearly: number } | null;
  /** Credits of usage a week. The limit resets weekly; nothing carries over. */
  weeklyLimit: number;
  /** Jobs running on our servers at the same time. */
  jobsAtOnce: number;
  /** Jobs start ahead of the standard queue. */
  priority: boolean;
  /** High detail shapes, which run on a bigger model. */
  highDetail: boolean;
}

export interface CataloguePack {
  credits: number;
  price: number;
}

export interface CatalogueCost {
  id: CostId;
  /** "Shape". */
  label: string;
  credits: number;
}

/** Control's settings for the Plan page. Every number is the service's. */
export const CREDITS_CATALOGUE = {
  /** Checkout exists. False: buttons show, disabled, with "Payments open soon". */
  paymentsOpen: false,
  /** The plan the page marks as the one most people want. */
  recommended: 'plus' as PlanId,
  /** Free on every plan: nothing here costs us to run. */
  free: ['Every printer feature', 'Part sliders', 'Editing a part\'s code', 'Make printable', 'Import', 'STEP export', 'Create API and MCP'],
  /** Share of the weekly limit at which the page says it's nearly used. */
  warnAt: 0.8
}

/** What each job is called on the page, in the order the page lists them. */
const COST_LABELS: Record<CostId, string> = {
  part: 'Part',
  partChange: 'Change a part',
  shape: 'Shape',
  shapeRefine: 'Another idea',
  photo: 'Shape from a photo',
  scan: 'Scan',
  highDetail: 'High detail shape'
}

/** The service's catalogue, once read: empty until then. Reactive, so the page fills in when it arrives. */
export const catalogue = Vue.observable({
  currency: 'GBP',
  plans: [] as CataloguePlan[],
  packs: [] as CataloguePack[],
  costs: [] as CatalogueCost[]
})

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/**
 * Takes the service's answer into `catalogue`. Returns false, and changes
 * nothing, for an answer without plans.
 */
export function setCatalogue (data: unknown): boolean {
  const d = (data ?? {}) as Record<string, unknown>
  if (!Array.isArray(d.plans) || !d.plans.length) return false
  const plans = (d.plans as Record<string, unknown>[]).map(p => {
    const price = p.price as Record<string, unknown> | null
    return {
      id: String(p.id),
      name: String(p.name),
      price: price ? { monthly: num(price.monthly), yearly: num(price.yearly) } : null,
      weeklyLimit: num(p.weeklyLimit),
      jobsAtOnce: num(p.jobsAtOnce),
      priority: p.priority === true,
      highDetail: p.highDetail === true
    }
  })
  const packs = (Array.isArray(d.packs) ? d.packs as Record<string, unknown>[] : [])
    .map(p => ({ credits: num(p.credits), price: num(p.price) }))
    .filter(p => p.credits > 0)
  const costs = (d.costs ?? {}) as Record<string, unknown>
  catalogue.currency = typeof d.currency === 'string' ? d.currency : 'GBP'
  catalogue.plans = plans
  catalogue.packs = packs
  catalogue.costs = (Object.keys(COST_LABELS) as CostId[])
    .filter(id => num(costs[id]) > 0)
    .map(id => ({ id, label: COST_LABELS[id], credits: num(costs[id]) }))
  return true
}

let reading: Promise<boolean> | null = null

/**
 * Reads the catalogue from the model service, once a session. No account
 * needed. Resolves false when it can't be read; the next call tries again.
 */
export function loadCatalogue (fetcher?: typeof fetch): Promise<boolean> {
  if (catalogue.plans.length) return Promise.resolve(true)
  if (reading) return reading
  const http = fetcher ?? ((input, init) => fetch(input, init))
  reading = http(`${MODELS_URL}/v1/create/catalogue`, { credentials: 'omit' })
    .then(async response => response.ok && setCatalogue(await response.json()))
    .catch(() => false)
    .finally(() => { reading = null })
  return reading
}
