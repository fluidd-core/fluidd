<template>
  <section
    class="ov-card ov-print"
    data-tid="overview-this-print"
  >
    <h2 class="ov-card__title">
      This print
    </h2>
    <div class="ov-print__numbers">
      <span
        class="ov-print__percent"
        :class="{ 'ov-print__percent--paused': printerPaused }"
      >{{ percentText }}</span>
      <span
        v-if="leftText"
        class="ov-print__left"
      >
        <b>{{ leftText }}</b>
        <span>{{ pro ? `ETA ${doneAt}${slicerSaid ? ` · slicer ${slicerSaidShort}` : ''}` : `done about ${doneAt}` }}</span>
      </span>
    </div>
    <div class="ov-print__bar">
      <i :style="{ width: `${Math.min(100, progress)}%` }" />
    </div>
    <dl class="ov-print__facts">
      <div
        v-for="fact in facts"
        :key="fact.label"
      >
        <dt>{{ fact.label }}</dt>
        <dd :class="{ 'ov-print__mono': fact.mono }">
          {{ fact.value }}
        </dd>
      </div>
    </dl>
    <div
      v-if="!pro && queue.length"
      class="ov-print__next"
    >
      <div class="ov-print__next-head">
        <span>Up next</span>
        <router-link :to="pagePath('/jobs')">
          Queue ({{ queue.length }})
        </router-link>
      </div>
      <div class="ov-print__next-job">
        <b>{{ nextName }}</b>
        <span v-if="queue.length > 1">then {{ queue.length - 1 }} more · starts when this one is lifted off</span>
        <span v-else>starts when this one is lifted off</span>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { jobName } from '@/services/printers-page/model'

/**
 * The print running now: how far, how long left, the layer, the filament,
 * how long it has run and what the slicer said, and what is queued next.
 * Pro gives the exact numbers: a decimal place, speed and flow now, the
 * position and which axes are homed.
 */
@Component({})
export default class OverviewThisPrint extends Mixins(OverviewMixin) {
  get percentText (): string {
    return this.pro ? `${this.progress.toFixed(1)}%` : `${Math.floor(this.progress)}%`
  }

  get slicerSaidShort (): string {
    return (this.slicerSaid ?? '').replace(' total', '')
  }

  get facts (): Array<{ label: string, value: string, mono?: boolean }> {
    const facts: Array<{ label: string, value: string, mono?: boolean }> = []
    if (this.pro) {
      if (this.layer && this.layers) facts.push({ label: 'Layer', value: `${this.layer} / ${this.layers} · Z ${this.position[2].toFixed(2)}` })
      if (this.filamentFact) facts.push({ label: 'Filament', value: this.filamentFact })
      const motion = this.$store.state.printer.printer.motion_report ?? {}
      if (typeof motion.live_velocity === 'number') facts.push({ label: 'Speed now', value: `${Math.round(motion.live_velocity)} mm/s` })
      if (typeof motion.live_extruder_velocity === 'number') {
        const flow = motion.live_extruder_velocity * Math.PI * (this.filamentDiameter / 2) ** 2
        facts.push({ label: 'Flow now', value: `${flow.toFixed(1)} mm³/s` })
      }
      facts.push({ label: 'Position', value: `X ${this.position[0].toFixed(2)}  Y ${this.position[1].toFixed(2)}`, mono: true })
      facts.push({ label: 'Homed', value: this.homedAxes.split('').join(' ') || 'none', mono: true })
      return facts
    }
    if (this.layerFact) facts.push({ label: 'Layer', value: this.layerFact })
    if (this.filamentFact) facts.push({ label: 'Filament', value: this.filamentFact })
    if (this.runningFor) facts.push({ label: 'Running for', value: this.runningFor })
    if (this.slicerSaid) facts.push({ label: 'Slicer said', value: this.slicerSaid })
    return facts
  }

  get nextName (): string {
    return jobName(this.queue[0]?.filename ?? '') ?? ''
  }
}
</script>

<style lang="scss" scoped>
  .ov-print {
    gap: 14px;
  }

  .ov-print__numbers {
    display: flex;
    align-items: flex-end;
    gap: 24px;
  }

  .ov-print__percent {
    color: var(--m3d-accent);
    font-size: 56px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  .ov-print__percent--paused {
    color: var(--m3d-warning);
  }

  .ov-print__left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: 4px;

    b {
      font-size: 22px;
      font-weight: 600;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .ov-print__bar {
    height: 8px;
    overflow: hidden;
    border-radius: 4px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      border-radius: 4px;
      background: var(--m3d-accent);
      transition: width var(--m3d-duration-base) var(--m3d-ease);
    }
  }

  .ov-print__facts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 16px;
    margin: 4px 0 0;

    dt {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }

    dd {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .ov-print__mono {
    font-family: var(--m3d-font-mono);
    font-size: 13px !important;
  }

  .ov-print__next {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid var(--m3d-border);
  }

  .ov-print__next-head {
    display: flex;
    justify-content: space-between;
    color: var(--m3d-text-muted);
    font-size: 13px;

    a {
      color: var(--m3d-accent) !important;
      text-decoration: none;
    }
  }

  .ov-print__next-job {
    display: flex;
    flex-direction: column;

    b {
      font-size: 14px;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }
</style>
