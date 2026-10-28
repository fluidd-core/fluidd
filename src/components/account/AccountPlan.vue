<template>
  <div
    class="acct-section"
    data-tid="account-plan"
  >
    <div class="acct-head acct-head--row">
      <div class="acct-head">
        <h1>Plan and credits</h1>
      </div>
      <span
        v-if="account"
        class="lib-pill"
        data-tid="plan-current"
      >{{ planLabel }}<template v-if="account.period"> · {{ account.period }}</template></span>
    </div>

    <!-- Low and empty: what's left, when more comes, and the way to more. Never about a printer. -->
    <div
      v-if="alert !== 'ok'"
      class="acct-note"
      :class="alert === 'empty' ? 'acct-note--bad' : 'acct-note--warn'"
      role="status"
      data-tid="plan-balance-note"
    >
      <frame-icon
        name="alert"
        small
      />
      <span class="plan__note-text">
        <b>{{ alert === 'empty' ? 'Out of credits' : 'Low on credits' }}.</b>
        {{ alert === 'empty' ? '' : `${outcomes}.` }}
        <template v-if="nextGrantLine">{{ nextGrantLine }}.</template>
      </span>
      <button
        type="button"
        class="lib-btn lib-btn--sm lib-btn--pri"
        :disabled="!paymentsOpen"
        :title="paymentsOpen ? undefined : soon"
        data-tid="plan-note-top-up"
        @click="scrollTo('plan-packs')"
      >
        Top up
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

    <!-- The balance: one number, what it buys, and when more comes. -->
    <section
      v-if="account"
      class="lib-surface acct-card acct-card--pad plan-balance"
      aria-labelledby="plan-balance-heading"
      data-tid="plan-balance"
    >
      <div class="plan-balance__top">
        <div class="plan-balance__figure">
          <h2
            id="plan-balance-heading"
            class="sr-only"
          >
            Balance
          </h2>
          <span
            class="plan-balance__number"
            data-tid="plan-balance-number"
          >{{ fmt(account.balance) }}</span>
          <span class="plan-balance__unit">credits</span>
          <acct-more label="How credits are spent">
            Monthly credits go first, then packs. Packs never expire.
            {{ rolloverLine }}
            A job that fails gives its credits back.
          </acct-more>
        </div>
        <span
          v-if="outcomes"
          class="acct-muted"
        >{{ outcomes }}</span>
      </div>

      <div
        class="plan-meter"
        role="img"
        :aria-label="meterLabel"
      >
        <span
          class="plan-meter__monthly"
          :style="{ width: `${monthlyShare}%` }"
        />
        <span
          class="plan-meter__packs"
          :style="{ width: `${packsShare}%` }"
        />
      </div>
      <div class="plan-legend">
        <span v-if="account.monthly.allowance > 0 || account.monthly.left > 0"><i class="plan-legend__dot plan-legend__dot--monthly" />Monthly {{ monthly }}</span>
        <span v-if="account.packs > 0"><i class="plan-legend__dot plan-legend__dot--packs" />Packs {{ fmt(account.packs) }}</span>
        <span
          v-if="nextGrantLine"
          class="plan-legend__next"
        >{{ nextGrantLine }}</span>
      </div>

      <div class="acct-actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          :disabled="!paymentsOpen"
          :title="paymentsOpen ? undefined : soon"
          data-tid="plan-top-up"
          @click="scrollTo('plan-packs')"
        >
          Top up
        </button>
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

    <section
      v-if="account"
      class="lib-surface acct-card"
      aria-labelledby="plan-month-heading"
    >
      <div class="acct-card__title">
        <h2 id="plan-month-heading">
          This month
        </h2>
      </div>
      <div class="plan-usage">
        <div
          v-for="u in usage"
          :key="u.label"
          class="plan-usage__item"
        >
          <span class="plan-usage__count">{{ u.count }}</span>
          <span class="acct-muted">{{ u.label }} · {{ fmt(u.credits) }} credits</span>
        </div>
      </div>
    </section>

    <!-- Plans, with the yearly saving in months. -->
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
          <span class="plan-option__credits">{{ planCredits(p) }}</span>
          <ul
            v-if="p.perks.length"
            class="plan-option__perks"
          >
            <li
              v-for="perk in p.perks"
              :key="perk"
            >
              <frame-icon
                name="check"
                small
              />{{ perk }}
            </li>
          </ul>
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
        v-if="!paymentsOpen"
        class="acct-muted plan-soon"
        data-tid="plan-soon"
      >
        {{ soon }}.
      </p>
    </section>

    <section
      id="plan-packs"
      class="lib-surface acct-card"
      aria-labelledby="plan-packs-heading"
    >
      <div class="acct-card__title">
        <h2 id="plan-packs-heading">
          Credit packs
        </h2>
        <span class="acct-card__aside">Never expire</span>
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
            <span>{{ perCredit(pack.price, pack.credits) }} a credit</span>
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
      class="lib-surface acct-card"
      aria-labelledby="plan-costs-heading"
      data-tid="plan-costs"
    >
      <div class="acct-card__title">
        <h2 id="plan-costs-heading">
          What credits buy
        </h2>
        <acct-more
          label="About prices"
          end
        >
          Every job shows its price before it runs. A failed job gives its credits back.
        </acct-more>
      </div>
      <div class="acct-list">
        <div
          v-for="c in costs"
          :key="c.id"
          class="acct-lrow"
        >
          <span class="acct-lrow__text">{{ c.label }}<span
            v-if="c.plan"
            class="lib-pill plan-costs__plan"
          >{{ planName(c.plan) }}</span></span>
          <span class="plan-costs__credits">{{ c.credits }}</span>
        </div>
        <div class="acct-lrow">
          <span class="acct-lrow__text acct-muted">{{ freeLine }}</span>
          <span class="plan-costs__credits">Free</span>
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
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { CREDITS_CATALOGUE, type CataloguePack, type CataloguePlan, type CatalogueCost } from '@/services/account/credits-catalogue'
import {
  balanceAlert, changeText, credits, creditsUnavailableReason, historyIcon, loadCredits, money, monthlyText, nextGrantText,
  outcomesText, perCreditText, planName, yearlyLine,
  type BalanceState, type CreditAccount, type CreditHistoryRow, type CreditsUnavailable, type HistoryIcon
} from '@/services/account/credits'
import { whenText } from '@/services/account/model'
import AcctMore from './AcctMore.vue'

type Period = 'monthly' | 'yearly'

/**
 * Plan and credits (ADR 0023): the balance and what it buys, this month's
 * use, plans, packs, prices and the history, from the model service's
 * `GET /v1/create/plan`. Every number on it comes from the catalogue
 * (credits-catalogue.ts) or the service. No button takes money until
 * `paymentsOpen`.
 */
@Component({ components: { AcctMore } })
export default class AccountPlan extends Vue {
  account: CreditAccount | null = null
  unavailable: CreditsUnavailable | null = null
  period: Period = 'monthly'
  readonly periods: Period[] = ['monthly', 'yearly']
  readonly soon = 'Payments open soon'

  async created () {
    try {
      this.account = await loadCredits()
      if (this.account.period === 'yearly') this.period = 'yearly'
    } catch (error) {
      this.unavailable = creditsUnavailableReason(error)
    }
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

  get costs (): CatalogueCost[] {
    return CREDITS_CATALOGUE.costs
  }

  get recommended (): string {
    return CREDITS_CATALOGUE.recommended
  }

  /** The account's plan in the catalogue: none before the balance is read, or for a plan Control doesn't list. */
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

  /** Low or out, and only when there's a way to more (see balanceAlert). */
  get alert (): BalanceState {
    return this.account ? balanceAlert(this.account) : 'ok'
  }

  /** "236 of 400". */
  get monthly (): string {
    return this.account ? monthlyText(this.account.monthly) : ''
  }

  /** The account's own plan says what the service grants it; the others, the catalogue. */
  planCredits (plan: CataloguePlan): string {
    const n = this.account && this.isCurrent(plan) ? this.account.monthly.allowance : plan.monthlyCredits
    return n > 0 ? `${credits(n)} credits a month` : 'No monthly credits'
  }

  get outcomes (): string {
    return outcomesText(this.account?.balance ?? 0)
  }

  /** "400 more on 9 Nov". */
  get nextGrantLine (): string {
    return this.account ? nextGrantText(this.account) : ''
  }

  get rolloverLine (): string {
    const months = this.currentPlan?.rolloverMonths ?? 0
    if (!months) return 'Unused monthly credits end with the month.'
    return `Unused monthly credits keep for ${months === 1 ? 'a month' : `${months} months`}.`
  }

  get monthlyShare (): number {
    return this.share(this.account?.monthly.left ?? 0)
  }

  get packsShare (): number {
    return this.share(this.account?.packs ?? 0)
  }

  /** The bar's full width is this month's credits, kept ones included, plus the packs. */
  share (n: number): number {
    const a = this.account
    if (!a) return 0
    const whole = Math.max(Math.max(a.monthly.allowance, a.monthly.left) + Math.max(a.packs, 0), 1)
    return Math.max(0, Math.min(100, (Math.max(n, 0) / whole) * 100))
  }

  get meterLabel (): string {
    const a = this.account
    return a ? `${this.monthly} monthly credits left, and ${credits(a.packs)} from packs` : ''
  }

  get usage (): { label: string, count: number, credits: number }[] {
    const u = this.account?.usage
    if (!u) return []
    return [
      { label: 'Shapes', ...u.shape },
      { label: 'Parts', ...u.part },
      { label: 'Scans', ...u.scan }
    ]
  }

  get history (): CreditHistoryRow[] {
    return this.account?.history ?? []
  }

  get freeLine (): string {
    return CREDITS_CATALOGUE.free.join(', ')
  }

  get unavailableLine (): string {
    switch (this.unavailable) {
      case 'off': return 'Turn on Muon3D models in Library and storage to see your balance.'
      case 'offline': return 'Your balance can\'t be reached right now.'
      case 'signed-out': return 'Sign in again to see your balance.'
      case 'error': return 'Your balance didn\'t load. Try again later.'
      default: return 'Your balance shows here once Create opens.'
    }
  }

  planName (id: string): string {
    return planName(id)
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
  .plan__note-text {
    flex: 1 1 auto;
  }

  .plan-balance__top {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .plan-balance__figure {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .plan-balance__number {
    font-size: 36px;
    font-weight: 600;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  .plan-balance__unit {
    color: var(--m3d-text-muted);
    font-size: 15px;
  }

  .plan-meter {
    display: flex;
    overflow: hidden;
    height: 8px;
    border-radius: 4px;
    background: var(--m3d-surface-2);
  }

  .plan-meter__monthly {
    background: var(--m3d-accent);
  }

  .plan-meter__packs {
    background: color-mix(in srgb, var(--m3d-accent) 45%, transparent);
  }

  .plan-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .plan-legend__dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: 50%;
  }

  .plan-legend__dot--monthly {
    background: var(--m3d-accent);
  }

  .plan-legend__dot--packs {
    background: color-mix(in srgb, var(--m3d-accent) 45%, transparent);
  }

  .plan-legend__next {
    margin-left: auto;
  }

  .plan-usage {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 4px 0 16px;
  }

  .plan-usage__item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
  }

  .plan-usage__count {
    font-size: 20px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
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

  .plan-option__credits {
    font-size: 13px;
    font-weight: 500;
  }

  .plan-option__perks {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 12px;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .plan-option__go {
    align-self: flex-start;
    margin-top: auto;
  }

  .plan-soon {
    margin: 0 0 14px;
    font-size: 12px;
  }

  .plan-costs__plan {
    margin-left: 8px;
  }

  .plan-costs__credits {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
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
