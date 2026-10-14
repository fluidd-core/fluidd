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
      aria-label="Your plan"
    >
      <div class="acct-row">
        <span class="acct-icon-box"><frame-icon
          name="card"
          small
        /></span>
        <div class="acct-row__label plan__grow">
          <b>Free plan</b>
          <span>Your Library's storage, and the app. Paid plans for more storage and for Create come later.</span>
        </div>
        <span class="lib-pill">Plans coming soon</span>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

/**
 * Plan (KAN-532): a placeholder until plans and prices are settled and sold
 * (Legal Review Pack L16). It never names a price it can't sell.
 */
@Component({})
export default class AccountPlan extends Vue {}
</script>

<style lang="scss" scoped>
  .plan__grow {
    flex: 1 1 auto;
  }
</style>
