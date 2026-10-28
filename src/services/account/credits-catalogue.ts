/**
 * Plans, credits and prices as Control shows them: THE one place to change a
 * number in Control. The Plan and credits page, its low and empty states and
 * its "about N shapes" lines all read from here.
 *
 * It mirrors the model service's `src/create/pricing.rs` (which charges) and
 * the app's `packages/credits/src/catalogue.ts`. Jack chose these values on
 * 2026-10-06 (ADR 0023, option B). A price change goes in all three files.
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
  /**
   * Credits added at the start of every month, yearly plans included. The
   * service's figure wins for the account's own plan: Free grants nothing
   * until `MODELS_CREATE_FREE_MONTHLY=1` turns this allowance on.
   */
  monthlyCredits: number;
  /** Months of allowance unused monthly credits may keep. 0: they lapse. */
  rolloverMonths: number;
  jobsAtOnce: number;
  /** Per month and per year, in `currency`. Null for Free. */
  price: { monthly: number, yearly: number } | null;
  /** What it adds beyond credits, as short labels. */
  perks: string[];
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
  /** The plan it needs, when not every plan has it. */
  plan?: PlanId;
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
  plans: [
    { id: 'free', name: 'Free', monthlyCredits: 40, rolloverMonths: 0, jobsAtOnce: 1, price: null, perks: ['Parts, shapes and scans', '1 job at a time'] },
    {
      id: 'plus',
      name: 'Plus',
      monthlyCredits: 400,
      rolloverMonths: 1,
      jobsAtOnce: 2,
      price: { monthly: 7.99, yearly: 79.99 },
      perks: ['Faster queue', 'Edit a part\'s code', '2 jobs at once']
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyCredits: 1200,
      rolloverMonths: 3,
      jobsAtOnce: 4,
      price: { monthly: 19.99, yearly: 199.99 },
      perks: ['Everything in Plus', 'High detail shapes', 'STEP export', 'Create API and MCP', '4 jobs at once']
    }
  ] as CataloguePlan[],
  /** On every plan; never expire; spent after the month's credits. */
  packs: [
    { credits: 100, price: 2.99 },
    { credits: 500, price: 12.99 },
    { credits: 1500, price: 34.99 }
  ] as CataloguePack[],
  /** Credits per job, as pricing.rs charges them. */
  costs: [
    { id: 'part', label: 'Part', credits: 4 },
    { id: 'partChange', label: 'Change a part', credits: 2 },
    { id: 'shape', label: 'Shape', credits: 20 },
    { id: 'shapeRefine', label: 'Another idea', credits: 12 },
    { id: 'photo', label: 'Shape from a photo', credits: 15 },
    { id: 'scan', label: 'Scan', credits: 30 },
    { id: 'highDetail', label: 'High detail shape', credits: 40, plan: 'pro' }
  ] as CatalogueCost[],
  /** What never costs a credit, on any plan. */
  free: ['Every printer feature', 'Part sliders', 'Make printable', 'Import'],
  /** Below this many credits the balance is low: less than one shape. */
  lowBelow: 20
}
