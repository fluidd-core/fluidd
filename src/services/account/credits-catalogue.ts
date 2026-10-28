/**
 * Plans, usage limits and prices as Control shows them: THE one place to
 * change a number in Control. The Plan page and the Overview tile read from
 * here.
 *
 * The rule (Jack, 28 Oct 2026): we only charge for what costs us money to
 * run, which is making shapes, parts and scans on our servers. Everything else
 * is free on every plan (`free`). A plan gives usage up to a weekly limit;
 * credits are a top-up, used only once that week's limit is reached.
 *
 * Usage is counted in credits: each job uses its `costs` from the week's
 * limit, then from bought credits. The model service still grants monthly
 * pots (`plans.rs`); until it counts weekly limits, the page shows its
 * monthly figure as a month. Prices mirror `pricing.rs`.
 *
 * Nothing here takes money: `paymentsOpen` stays false until store and web
 * checkout exist (KAN-406), and the buttons say so. Setting it true only
 * enables the buttons; each still needs its checkout wired in AccountPlan.vue.
 */

export type PlanId = 'free' | 'plus' | 'pro'
export type CostId = 'part' | 'partChange' | 'shape' | 'shapeRefine' | 'photo' | 'scan' | 'highDetail'

export interface CataloguePlan {
  id: PlanId;
  name: string;
  /** Per month and per year, in `currency`. Null for Free. */
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

export const CREDITS_CATALOGUE = {
  /**
   * Shows the Plan and credits page (on since 28 Oct 2026). False puts back
   * the planned-prices card (AccountPlanPlanned.vue), and the Overview tile
   * reads no balance. The specs set it for themselves.
   */
  planPageOpen: true,
  currency: 'GBP',
  /** Checkout exists. False: buttons show, disabled, with "Payments open soon". */
  paymentsOpen: false,
  /** The plan the page marks as the one most people want. */
  recommended: 'plus' as PlanId,
  /** Only what costs us to run differs between plans. */
  plans: [
    { id: 'free', name: 'Free', price: null, weeklyLimit: 20, jobsAtOnce: 1, priority: false, highDetail: false },
    { id: 'plus', name: 'Plus', price: { monthly: 7.99, yearly: 79.99 }, weeklyLimit: 100, jobsAtOnce: 2, priority: true, highDetail: false },
    { id: 'pro', name: 'Pro', price: { monthly: 19.99, yearly: 199.99 }, weeklyLimit: 300, jobsAtOnce: 4, priority: true, highDetail: true }
  ] as CataloguePlan[],
  /** Top-up credits, on every plan: used only after the weekly limit, and they never expire. */
  packs: [
    { credits: 100, price: 2.99 },
    { credits: 500, price: 12.99 },
    { credits: 1500, price: 34.99 }
  ] as CataloguePack[],
  /** Credits per job, as pricing.rs charges them, from the limit first. */
  costs: [
    { id: 'part', label: 'Part', credits: 4 },
    { id: 'partChange', label: 'Change a part', credits: 2 },
    { id: 'shape', label: 'Shape', credits: 20 },
    { id: 'shapeRefine', label: 'Another idea', credits: 12 },
    { id: 'photo', label: 'Shape from a photo', credits: 15 },
    { id: 'scan', label: 'Scan', credits: 30 },
    { id: 'highDetail', label: 'High detail shape', credits: 40 }
  ] as CatalogueCost[],
  /** Free on every plan: nothing here costs us to run. */
  free: ['Every printer feature', 'Part sliders', 'Editing a part\'s code', 'Make printable', 'Import', 'STEP export', 'Create API and MCP'],
  /** Share of the weekly limit at which the page says it's nearly used. */
  warnAt: 0.8
}
