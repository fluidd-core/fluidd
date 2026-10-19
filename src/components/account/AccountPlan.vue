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
      class="lib-surface acct-card plan"
      aria-labelledby="plan-heading"
      tabindex="0"
    >
      <h2 id="plan-heading">
        Credits pay for server compute
      </h2>
      <p>All browser and on-printer work is free. Only server compute uses credits.</p>
      <p class="plan__notice">
        These are planned prices. Payments aren't available yet.
      </p>

      <ul
        class="plan__grid"
        aria-label="Monthly plans"
      >
        <li class="plan__option">
          <div class="plan__name">
            <h3>Free</h3>
            <span
              class="plan__current"
              aria-label="Current plan"
            >Current plan</span>
          </div>
          <p>40 credits per month</p>
        </li>
        <li class="plan__option">
          <h3>Plus</h3>
          <p>
            <span aria-hidden="true">£7.99/month</span><span class="sr-only">£7.99 per month</span>
            or
            <span aria-hidden="true">£79.99/year</span><span class="sr-only">£79.99 per year</span>
          </p>
          <p>400 credits per month</p>
        </li>
        <li class="plan__option">
          <h3>Pro</h3>
          <p>
            <span aria-hidden="true">£19.99/month</span><span class="sr-only">£19.99 per month</span>
            or
            <span aria-hidden="true">£199.99/year</span><span class="sr-only">£199.99 per year</span>
          </p>
          <p>1,200 credits per month</p>
        </li>
      </ul>

      <section aria-labelledby="packs-heading">
        <h3 id="packs-heading">
          Credit packs
        </h3>
        <ul class="plan__packs">
          <li>100 credits for <span aria-hidden="true">£2.99</span><span class="sr-only">£2.99</span></li>
          <li>500 credits for <span aria-hidden="true">£12.99</span><span class="sr-only">£12.99</span></li>
          <li>1,500 credits for <span aria-hidden="true">£34.99</span><span class="sr-only">£34.99</span></li>
        </ul>
      </section>
      <p>One High detail generation costs 40 credits.</p>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

/** ADR 0023, pricing B. Billing is not connected to this information screen. */
@Component({})
export default class AccountPlan extends Vue {}
</script>

<style lang="scss" scoped>
  .plan {
    max-width: 100%;
    overflow-wrap: anywhere;

    &:focus-visible {
      outline: 2px solid var(--m3d-focus-ring);
      outline-offset: 3px;
    }
  }

  .plan__notice {
    padding: 12px;
    border: 1px solid var(--m3d-border);
    border-radius: 6px;
    background: var(--m3d-accent-soft);
  }

  .plan__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr));
    gap: 16px;
    padding: 0;
    margin: 20px 0;
    list-style: none;
  }

  .plan__option {
    min-width: 0;
    padding: 16px;
    border: 1px solid var(--m3d-border);
    border-radius: 6px;
  }

  .plan__name {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .plan__current {
    color: var(--m3d-accent);
    font-weight: 600;
  }

  .plan__packs {
    display: grid;
    gap: 8px;
    padding-left: 20px;
  }
</style>
