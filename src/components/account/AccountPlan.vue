<template>
  <div
    class="acct-section"
    data-tid="account-plan"
  >
    <div class="acct-head">
      <h1>Plan</h1>
      <p>Everything your printers do stays free for good, with or without an account.</p>
    </div>

    <section
      class="lib-surface acct-card"
      aria-label="Plans"
    >
      <h2>Credits pay for server compute</h2>
      <p>All browser and on-printer work is free. Credits pay for Create work on our servers.</p>
      <p>Planned prices. Paid plans and credit packs are not available to buy here yet.</p>
      <div class="plan__grid">
        <article><h3>Free</h3><p>£0</p><p>40 credits each month</p></article>
        <article><h3>Plus</h3><p>£7.99/month or £79.99/year</p><p>400 credits each month</p></article>
        <article><h3>Pro</h3><p>£19.99/month or £199.99/year</p><p>1,200 credits each month</p></article>
      </div>
      <h3>Credit packs</h3>
      <p>100 credits for £2.99 · 500 for £12.99 · 1,500 for £34.99.</p>
      <p>High detail uses 40 credits. Packs add compute credits.</p>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

/**
 * ADR 0023, pricing B. Billing is not connected to this information screen.
 */
@Component({})
export default class AccountPlan extends Vue {}
</script>

<style lang="scss" scoped>
  .plan__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr)); gap: 16px; margin: 20px 0; }
  .plan__grid article { padding: 16px; border: 1px solid var(--m3d-border); border-radius: 6px; }
</style>
