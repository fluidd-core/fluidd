<template>
  <div
    class="overview"
    :class="{ 'overview--phone': isMobileViewport, 'overview--pro': pro && !isMobileViewport }"
    data-tid="overview-page"
  >
    <!-- A phone: the stage, the print and its buttons, then the rest, one under another. -->
    <template v-if="isMobileViewport">
      <overview-stage class="overview__stage" />
      <section
        v-if="busy"
        class="ov-card overview__job"
        data-tid="overview-phone-job"
      >
        <b class="overview__job-name">{{ jobName }}</b>
        <div class="overview__job-numbers">
          <span
            class="overview__job-percent"
            :class="{ 'overview__job-percent--paused': printerPaused }"
          >{{ Math.floor(progress) }}%</span>
          <span class="overview__job-left">
            <b v-if="leftText">{{ leftText }}</b>
            <span>{{ [doneAt ? `done about ${doneAt}` : '', layer && layers ? `layer ${layer}/${layers}` : ''].filter(Boolean).join(' · ') }}</span>
          </span>
        </div>
        <div class="overview__job-bar">
          <i :style="{ width: `${Math.min(100, progress)}%` }" />
        </div>
        <div class="overview__job-actions">
          <button
            type="button"
            class="cbtn cbtn--grow"
            :disabled="!klippyReady"
            @click="printerPaused ? resumePrint() : pausePrint()"
          >
            {{ printerPaused ? 'Resume' : 'Pause' }}
          </button>
          <button
            type="button"
            class="cbtn cbtn--grow cbtn--danger"
            :disabled="!klippyReady"
            @click="cancelPrint()"
          >
            Stop print
          </button>
        </div>
      </section>
      <overview-print-something v-else />
      <overview-tiles phone />
      <control-speed
        v-if="busy"
        simple
      />
      <overview-quick-actions v-if="!busy" />
      <overview-temps phone />
    </template>

    <!-- Simple: the glance. -->
    <template v-else-if="!pro">
      <div class="overview__top">
        <overview-stage class="overview__stage" />
        <overview-this-print v-if="busy" />
        <overview-print-something v-else />
      </div>
      <overview-tiles />
      <div
        class="overview__bottom"
        :class="{ 'overview__bottom--idle': !busy }"
      >
        <overview-temps />
        <overview-quick-actions v-if="!busy" />
      </div>
    </template>

    <!--
      Pro: everything Simple has, with more in the same panels. Live tuning
      (speed, flow, pressure advance, Z, fan) whether printing or not; every
      heater and sensor with its target; the objects and macros; the console.
    -->
    <template v-else>
      <div class="overview__pro-top">
        <overview-stage class="overview__stage" />
        <overview-this-print v-if="busy" />
        <overview-print-something v-else />
        <overview-live-tune />
      </div>
      <div class="overview__pro-middle">
        <overview-temps table />
        <overview-plate />
      </div>
      <div
        class="overview__pro-bottom"
        :class="{ 'overview__pro-bottom--idle': !busy }"
      >
        <overview-quick-actions v-if="!busy" />
        <overview-console />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import BrowserMixin from '@/mixins/browser'
import OverviewStage from '@/components/overview/OverviewStage.vue'
import OverviewThisPrint from '@/components/overview/OverviewThisPrint.vue'
import OverviewPrintSomething from '@/components/overview/OverviewPrintSomething.vue'
import OverviewTiles from '@/components/overview/OverviewTiles.vue'
import OverviewTemps from '@/components/overview/OverviewTemps.vue'
import OverviewQuickActions from '@/components/overview/OverviewQuickActions.vue'
import OverviewLiveTune from '@/components/overview/OverviewLiveTune.vue'
import OverviewPlate from '@/components/overview/OverviewPlate.vue'
import OverviewConsole from '@/components/overview/OverviewConsole.vue'
import ControlSpeed from '@/components/control/ControlSpeed.vue'

/**
 * Overview, a printer's own page (`/boxwood-367a`). Simple is the glance:
 * the whole M1, the print or something to print, four live tiles that
 * open Control, the temperature graph and quick actions. Pro gives the
 * exact numbers, live tuning, the objects on the plate and the macros.
 */
@Component({
  components: {
    OverviewStage,
    OverviewThisPrint,
    OverviewPrintSomething,
    OverviewTiles,
    OverviewTemps,
    OverviewQuickActions,
    OverviewLiveTune,
    OverviewPlate,
    OverviewConsole,
    ControlSpeed
  }
})
export default class Overview extends Mixins(OverviewMixin, BrowserMixin) {}
</script>

<style lang="scss" scoped>
  .overview {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .overview__top {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 16px;
    min-height: 400px;
  }

  .overview__stage {
    min-height: 400px;
  }

  .overview__bottom {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .overview__bottom--idle {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  }

  .overview__pro-top {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 4fr) minmax(0, 4fr);
    gap: 16px;

    .overview__stage {
      min-height: 360px;
    }
  }

  .overview__pro-middle {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 16px;
  }

  .overview__pro-bottom {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .overview__pro-bottom--idle {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  }

  @media (max-width: 1263px) {
    .overview__top,
    .overview__bottom--idle,
    .overview__pro-middle,
    .overview__pro-bottom--idle {
      grid-template-columns: minmax(0, 1fr);
    }

    .overview__pro-top {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

      .overview__stage {
        grid-column: 1 / -1;
        min-height: 320px;
        max-height: 440px;
      }
    }
  }

  @media (max-width: 899px) {
    .overview__pro-top {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .overview--phone {
    gap: 12px;

    .overview__stage {
      min-height: 300px;
    }
  }

  .overview__job {
    gap: 10px !important;
  }

  .overview__job-name {
    font-size: 15px;
  }

  .overview__job-numbers {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  .overview__job-percent {
    color: var(--m3d-accent);
    font-size: 44px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .overview__job-percent--paused {
    color: var(--m3d-warning);
  }

  .overview__job-left {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    b {
      font-size: 17px;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .overview__job-bar {
    height: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      background: var(--m3d-accent);
    }
  }

  .overview__job-actions {
    display: flex;
    gap: 10px;

    .cbtn {
      height: 48px;
    }
  }
</style>

<style lang="scss">
  // The card every Overview panel is.
  .overview {
    .ov-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
      padding: 20px;
      border-radius: 22px;
      background: var(--m3d-surface);
      color: var(--m3d-text);
    }

    .ov-card__head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px 12px;
    }

    .ov-card__title {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    .ov-card__aside {
      color: var(--m3d-text-subtle);
      font-size: 12px;
    }

    .ov-card__link {
      color: var(--m3d-accent) !important;
      font-size: 13px;
      text-decoration: none;
    }
  }
</style>
