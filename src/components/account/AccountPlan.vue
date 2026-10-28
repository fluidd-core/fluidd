<template>
  <account-plan-planned v-if="!pageOpen" />
  <div
    v-else
    class="acct-section"
    data-tid="account-plan"
  >
    <div class="acct-head acct-head--row">
      <div class="acct-head__title">
        <h1>Plan</h1>
        <acct-more label="How plans work">
          We only charge for what costs us to run: making shapes, parts and scans on our servers. Everything else is free on every plan.
          Your plan's usage resets each {{ windowName }}. Credits are a top-up, used only once you reach the limit.
        </acct-more>
      </div>
      <span
        v-if="account"
        class="lib-pill"
        data-tid="plan-current"
      >{{ planLabel }}<template v-if="account.period"> · {{ account.period }}</template></span>
    </div>

    <p
      v-if="reading"
      class="acct-muted plan-reading"
      data-tid="plan-reading"
    >
      Reading your plan…
    </p>
    <template v-else>
      <!-- Near or at the limit: when it resets, and what keeps you going. Never about a printer. -->
      <div
        v-if="limit === 'near' || limit === 'reached'"
        class="acct-note acct-note--warn"
        role="status"
        data-tid="plan-limit-note"
      >
        <frame-icon
          name="clock"
          small
        />
        <span class="plan__note-text">
          <b>{{ limit === 'reached' ? `You've reached this ${windowName}'s limit.` : `${usedLine}.` }}</b>
          {{ resetLine }}.
          <template v-if="limit === 'reached' && topUp > 0">Your {{ fmt(topUp) }} credits are in use{{ usage && usage.ending ? '' : ' until then' }}.</template>
        </span>
        <button
          v-if="limit === 'reached' && topUp === 0"
          type="button"
          class="lib-btn lib-btn--sm"
          :disabled="!paymentsOpen"
          :title="paymentsOpen ? undefined : soon"
          data-tid="plan-note-credits"
          @click="scrollTo('plan-credits')"
        >
          Buy credits
        </button>
      </div>

      <p
        v-if="unavailable"
        class="acct-note acct-note--info"
        data-tid="plan-unavailable"
      >
        <frame-icon
          name="info"
          small
        />
        <span>{{ unavailableLine }}</span>
      </p>

      <!-- Usage: how much of the limit is used, and when it resets. -->
      <section
        v-if="account && usage"
        class="lib-surface acct-card acct-card--pad plan-usage"
        aria-labelledby="plan-usage-heading"
        data-tid="plan-usage"
      >
        <div class="plan-usage__top">
          <h2 id="plan-usage-heading">
            {{ windowName === 'week' ? 'This week' : 'This month' }}
          </h2>
          <span
            v-if="limit !== 'none'"
            class="acct-muted"
            data-tid="plan-usage-resets"
          >{{ resetLine }}</span>
        </div>
        <template v-if="limit !== 'none'">
          <div
            class="plan-meter"
            aria-hidden="true"
          >
            <span
              class="plan-meter__used"
              :class="{ 'plan-meter__used--warn': limit !== 'ok' }"
              :style="{ width: `${percent}%` }"
            />
          </div>
          <span data-tid="plan-usage-line">{{ usedLine }}</span>
        </template>
        <span
          v-else
          class="acct-muted"
          data-tid="plan-usage-line"
        >No usage included on your plan yet.</span>
        <span class="acct-muted">{{ madeLine }}</span>
        <span
          v-if="topUp > 0"
          class="plan-usage__credits"
          data-tid="plan-topup"
        ><b>{{ fmt(topUp) }} credits</b> for after your limit</span>
        <div class="acct-actions">
          <button
            type="button"
            class="lib-btn"
            data-tid="plan-change"
            @click="scrollTo('plan-plans')"
          >
            Change plan
          </button>
        </div>
      </section>

      <!-- Plans side by side: the same rows on each, and only what costs us to run. -->
      <section
        id="plan-plans"
        class="lib-surface acct-card"
        aria-labelledby="plan-plans-heading"
      >
        <div class="acct-card__title">
          <h2 id="plan-plans-heading">
            Plans
          </h2>
          <div
            class="plan-period"
            role="group"
            aria-label="Billing period"
          >
            <button
              v-for="p in periods"
              :key="p"
              type="button"
              class="plan-period__opt"
              :class="{ 'plan-period__opt--on': period === p }"
              :aria-pressed="period === p ? 'true' : 'false'"
              :data-tid="`plan-period-${p}`"
              @click="period = p"
            >
              {{ p === 'monthly' ? 'Monthly' : 'Yearly' }}
            </button>
          </div>
        </div>
        <ul class="plan-grid">
          <li
            v-for="p in plans"
            :key="p.id"
            class="plan-option"
            :class="{ 'plan-option--current': isCurrent(p) }"
            :data-tid="`plan-option-${p.id}`"
          >
            <div class="plan-option__name">
              <h3>{{ p.name }}</h3>
              <span
                v-if="isCurrent(p)"
                class="lib-pill lib-pill--ok"
              >Current</span>
              <span
                v-else-if="p.id === recommended"
                class="lib-pill"
              >Most popular</span>
            </div>
            <div class="plan-option__price">
              <template v-if="p.price">
                <b>{{ period === 'monthly' ? money(p.price.monthly) : money(p.price.yearly) }}</b> <span class="acct-muted">{{ period === 'monthly' ? 'a month' : 'a year' }}</span>
              </template>
              <b v-else>{{ money(0) }}</b>
            </div>
            <span
              v-if="p.price && period === 'yearly'"
              class="plan-option__save"
            >{{ yearly(p) }}</span>
            <dl class="plan-option__rows">
              <div
                v-for="row in rows(p)"
                :key="row.label"
                class="plan-option__row"
                :class="{ 'plan-option__row--off': row.value === false }"
                data-tid="plan-row"
              >
                <dt>{{ row.label }}</dt>
                <dd v-if="row.value === true">
                  <frame-icon
                    name="check"
                    small
                  /><span class="sr-only">Included</span>
                </dd>
                <dd v-else-if="row.value === false">
                  <span aria-hidden="true">—</span><span class="sr-only">Not included</span>
                </dd>
                <dd v-else>
                  {{ row.value }}
                </dd>
              </div>
            </dl>
            <button
              v-if="!isCurrent(p) && p.price"
              type="button"
              class="lib-btn lib-btn--sm plan-option__go"
              :class="{ 'lib-btn--pri': p.id === recommended }"
              :disabled="!paymentsOpen"
              :title="paymentsOpen ? undefined : soon"
              :data-tid="`plan-choose-${p.id}`"
            >
              Choose {{ p.name }}
            </button>
          </li>
        </ul>
        <p
          class="plan-free"
          data-tid="plan-free"
        >
          <b>Free on every plan:</b> {{ freeLine }}.
        </p>
        <p
          v-if="!paymentsOpen"
          class="acct-muted plan-soon"
          data-tid="plan-soon"
        >
          {{ soon }}.
        </p>
      </section>

      <!-- Credits: a top-up for after the limit, offered, never pushed. -->
      <section
        id="plan-credits"
        class="lib-surface acct-card"
        aria-labelledby="plan-credits-heading"
        data-tid="plan-credits"
      >
        <div class="acct-card__title">
          <h2 id="plan-credits-heading">
            Credits
          </h2>
          <acct-more
            label="How credits work"
            end
          >
            Credits are only used once you reach your plan's limit, and they never expire. {{ costsLine }}. A job that fails gives its usage back.
          </acct-more>
        </div>
        <div class="acct-list">
          <div
            v-for="pack in packs"
            :key="pack.credits"
            class="acct-row"
            :data-tid="`plan-pack-${pack.credits}`"
          >
            <div class="acct-row__label">
              <b>{{ fmt(pack.credits) }} credits</b>
              <span>{{ outcomes(pack.credits) }} · {{ perCredit(pack.price, pack.credits) }} a credit</span>
            </div>
            <div class="acct-row__control">
              <button
                type="button"
                class="lib-btn lib-btn--sm"
                :disabled="!paymentsOpen"
                :title="paymentsOpen ? undefined : soon"
              >
                {{ money(pack.price) }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="account"
        class="lib-surface acct-card"
        aria-labelledby="plan-history-heading"
        data-tid="plan-history"
      >
        <div class="acct-card__title">
          <h2 id="plan-history-heading">
            History
          </h2>
        </div>
        <div class="acct-list">
          <div
            v-for="row in history"
            :key="row.id"
            class="acct-lrow"
            :data-tid="`plan-history-${row.kind}`"
          >
            <span
              class="plan-hist__icon"
              :class="`plan-hist__icon--${icon(row)}`"
            ><frame-icon
              :name="iconName(row)"
              small
            /></span>
            <span class="acct-lrow__text">{{ row.title }}</span>
            <span class="acct-lrow__time">{{ when(row.at) }}</span>
            <span
              class="plan-hist__change"
              :class="{ 'plan-hist__change--add': row.change > 0 }"
            >{{ change(row.change) }}</span>
          </div>
          <p
            v-if="!history.length"
            class="acct-muted plan-hist__empty"
          >
            Nothing yet.
          </p>
        </div>
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { CREDITS_CATALOGUE, type CataloguePack, type CataloguePlan } from '@/services/account/credits-catalogue'
import {
  changeText, costsText, credits, creditsUnavailableReason, historyIcon, limitState, loadCredits, money, outcomesText,
  perCreditText, planName, planRows, resetText, usageWindow, usedPercent, usedText, yearlyLine,
  type CreditAccount, type CreditHistoryRow, type CreditsUnavailable, type HistoryIcon, type LimitState, type PlanRow, type UsageWindow
} from '@/services/account/credits'
import { whenText } from '@/services/account/model'
import AcctMore from './AcctMore.vue'
import AccountPlanPlanned from './AccountPlanPlanned.vue'

type Period = 'monthly' | 'yearly'

/**
 * Plan (ADR 0023, and Jack's rule of 28 Oct: charge only for what costs us
 * to run). Leads with how much of the plan's limit is used and when it
 * resets, then the plans side by side, then credits as a top-up for after
 * the limit, then the history, from the model service's
 * `GET /v1/create/plan`. Every number on it comes from the catalogue
 * (credits-catalogue.ts) or the service. No button takes money until
 * `paymentsOpen`. Until `planPageOpen`, it shows the planned-prices card and
 * asks the service nothing.
 */
@Component({ components: { AcctMore, AccountPlanPlanned } })
export default class AccountPlan extends Vue {
  account: CreditAccount | null = null
  /** Until the service answers, so nothing about the account shows and then changes. */
  reading = true
  unavailable: CreditsUnavailable | null = null
  period: Period = 'monthly'
  readonly periods: Period[] = ['monthly', 'yearly']
  readonly soon = 'Payments open soon'

  async created () {
    if (!this.pageOpen) return
    try {
      this.account = await loadCredits()
      if (this.account.period === 'yearly') this.period = 'yearly'
    } catch (error) {
      this.unavailable = creditsUnavailableReason(error)
    } finally {
      this.reading = false
    }
  }

  get pageOpen (): boolean {
    return CREDITS_CATALOGUE.planPageOpen
  }

  get paymentsOpen (): boolean {
    return CREDITS_CATALOGUE.paymentsOpen
  }

  get plans (): CataloguePlan[] {
    return CREDITS_CATALOGUE.plans
  }

  get packs (): CataloguePack[] {
    return CREDITS_CATALOGUE.packs
  }

  get recommended (): string {
    return CREDITS_CATALOGUE.recommended
  }

  /** The account's plan in the catalogue: none before the service answers, or for a plan Control doesn't list. */
  get currentPlan (): CataloguePlan | null {
    const id = this.account?.plan
    return CREDITS_CATALOGUE.plans.find(p => p.id === id) ?? null
  }

  get planLabel (): string {
    return this.account ? planName(this.account.plan) : ''
  }

  isCurrent (plan: CataloguePlan): boolean {
    return plan.id === this.currentPlan?.id
  }

  get usage (): UsageWindow | null {
    return this.account ? usageWindow(this.account) : null
  }

  /** "week" once the service counts weeks; "month" until then. */
  get windowName (): UsageWindow['window'] {
    return this.usage?.window ?? 'week'
  }

  get limit (): LimitState {
    return this.usage ? limitState(this.usage) : 'none'
  }

  get percent (): number {
    return this.usage ? usedPercent(this.usage) : 0
  }

  /** "34% of this week's limit used". */
  get usedLine (): string {
    return this.usage ? usedText(this.usage) : ''
  }

  /** "Resets Mon 3 Nov". */
  get resetLine (): string {
    return this.usage ? resetText(this.usage) : ''
  }

  /** Bought credits, for after the limit. */
  get topUp (): number {
    return Math.max(this.account?.packs ?? 0, 0)
  }

  /** "6 shapes, 8 parts and 1 scan this month": the service counts these monthly. */
  get madeLine (): string {
    const u = this.account?.usage
    const window = 'this month'
    if (!u) return ''
    const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`
    const made = [
      u.shape.count ? plural(u.shape.count, 'shape') : '',
      u.part.count ? plural(u.part.count, 'part') : '',
      u.scan.count ? plural(u.scan.count, 'scan') : ''
    ].filter(Boolean)
    if (!made.length) return `Nothing made yet ${window}`
    const list = made.length > 1 ? `${made.slice(0, -1).join(', ')} and ${made[made.length - 1]}` : made[0]
    return `${list} ${window}`
  }

  get history (): CreditHistoryRow[] {
    return this.account?.history ?? []
  }

  get freeLine (): string {
    return CREDITS_CATALOGUE.free.join(', ')
  }

  get costsLine (): string {
    return costsText()
  }

  get unavailableLine (): string {
    switch (this.unavailable) {
      case 'off': return 'Turn on Muon3D models in Library and storage to see your usage.'
      case 'offline': return 'Your usage can\'t be reached right now.'
      case 'signed-out': return 'Sign in again to see your usage.'
      case 'error': return 'Your usage didn\'t load. Try again later.'
      default: return 'Your usage shows here once Create opens.'
    }
  }

  /**
   * The account's own plan says what the service grants it, a month at a
   * time until the service counts weeks; the others, the catalogue.
   */
  rows (plan: CataloguePlan): PlanRow[] {
    const rows = planRows(plan)
    const usage = this.usage
    if (!usage || usage.window !== 'month' || !this.isCurrent(plan)) return rows
    const granted = usage.limit > 0 ? `${credits(usage.limit)} credits` : 'None yet'
    return [{ label: 'Each month', value: granted }, ...rows.slice(1)]
  }

  outcomes (n: number): string {
    return outcomesText(n)
  }

  money (amount: number): string {
    return money(amount)
  }

  fmt (n: number): string {
    return credits(n)
  }

  yearly (plan: CataloguePlan): string {
    return yearlyLine(plan)
  }

  perCredit (price: number, n: number): string {
    return perCreditText(price, n)
  }

  change (n: number): string {
    return changeText(n)
  }

  when (ms: number): string {
    return whenText(ms / 1000)
  }

  icon (row: CreditHistoryRow): HistoryIcon {
    return historyIcon(row)
  }

  iconName (row: CreditHistoryRow): string {
    return { add: 'plus', spend: 'minus', refund: 'refresh', expire: 'clock' }[historyIcon(row)]
  }

  scrollTo (id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style lang="scss" scoped>
  .plan-reading {
    margin: 0;
    padding: 12px 0;
  }

  .plan__note-text {
    flex: 1 1 auto;
  }

  .plan-usage {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .plan-usage__top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;

    h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }
  }

  .plan-usage__credits {
    font-size: 13px;
  }

  .plan-meter {
    overflow: hidden;
    height: 8px;
    border-radius: 4px;
    background: var(--m3d-surface-2);
  }

  .plan-meter__used {
    display: block;
    height: 100%;
    background: var(--m3d-accent);
  }

  .plan-meter__used--warn {
    background: var(--m3d-warning, #e0a030);
  }

  .plan-period {
    display: inline-flex;
    padding: 2px;
    border-radius: 8px;
    background: var(--m3d-surface-2);
  }

  .plan-period__opt {
    padding: 4px 10px;
    border-radius: 6px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 500;
  }

  .plan-period__opt--on {
    background: var(--m3d-surface);
    color: var(--m3d-text);
    box-shadow: 0 1px 2px rgb(0 0 0 / 12%);
  }

  .plan-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
    gap: 12px;
    padding: 4px 0 12px;
    margin: 0;
    list-style: none;
  }

  .plan-option {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 14px;
    border: 1px solid var(--m3d-border);
    border-radius: 9px;
  }

  .plan-option--current {
    border-color: var(--m3d-accent);
  }

  .plan-option__name {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }
  }

  .plan-option__price {
    display: flex;
    align-items: baseline;
    gap: 6px;

    b {
      font-size: 20px;
      font-weight: 600;
    }
  }

  .plan-option__save {
    color: var(--m3d-success);
    font-size: 12px;
    font-weight: 500;
  }

  .plan-option__rows {
    display: flex;
    flex-direction: column;
    margin: 6px 0 0;
    font-size: 13px;
  }

  .plan-option__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 30px;
    padding: 4px 0;
    border-top: 1px solid var(--m3d-border);

    dt {
      flex: none;
      color: var(--m3d-text-muted);
      white-space: nowrap;
    }

    dd {
      display: inline-flex;
      margin: 0;
      font-weight: 500;
      text-align: right;
    }
  }

  .plan-option__row--off dd {
    color: var(--m3d-text-muted);
  }

  .plan-option__go {
    align-self: flex-start;
    margin-top: auto;
  }

  .plan-free {
    margin: 0 0 6px;
    font-size: 13px;
  }

  .plan-soon {
    margin: 0 0 14px;
    font-size: 12px;
  }

  .plan-hist__icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .plan-hist__icon--add,
  .plan-hist__icon--refund {
    color: var(--m3d-success);
  }

  .plan-hist__change {
    min-width: 48px;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    text-align: right;
  }

  .plan-hist__change--add {
    color: var(--m3d-success);
  }

  .plan-hist__empty {
    padding: 12px 0;
    margin: 0;
  }
</style>
