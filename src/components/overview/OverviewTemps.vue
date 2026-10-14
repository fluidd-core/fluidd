<template>
  <section
    class="ov-card ov-temps"
    data-tid="overview-temps"
  >
    <div class="ov-card__head">
      <h2 class="ov-card__title">
        Temperatures
      </h2>
      <div class="ov-temps__tools">
        <span
          v-for="s in legend"
          :key="s.key"
          class="ov-temps__legend"
        >
          <i :style="{ background: s.color }" />{{ s.label }}
        </span>
        <seg-picker
          v-if="!phone"
          :options="windows"
          :value="windowSeconds"
          label="Time shown"
          @input="windowSeconds = $event"
        />
        <span
          v-else
          class="ov-temps__window"
        >{{ windowLabel }}</span>
      </div>
    </div>
    <svg
      class="ov-temps__chart"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="ariaLabel"
    >
      <path
        v-for="i in 3"
        :key="`grid-${i}`"
        :d="`M0 ${(H / 4) * i}H${W}`"
        class="ov-temps__grid"
      />
      <template v-for="line in chart.lines">
        <path
          v-if="line.targetY !== null"
          :key="`${line.key}-target`"
          :d="`M0 ${line.targetY}H${W}`"
          class="ov-temps__target"
        />
        <path
          :key="line.key"
          :d="line.path"
          class="ov-temps__line"
          :style="{ stroke: colorOf(line.key) }"
        />
      </template>
    </svg>
    <div class="ov-temps__axis">
      <span>−{{ windowLabel }}</span>
      <span>now</span>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { chartLines, chartWindows, defaultChartWindow, type ChartPoint } from '@/services/overview/model'
import SegPicker from '@/components/control/SegPicker.vue'

const COLORS: Record<string, string> = { extruder: '#ff8c42', heater_bed: '#6aa8ff' }

/** The nozzle and bed over the last few minutes, each with its target dashed. */
@Component({ components: { SegPicker } })
export default class OverviewTemps extends Mixins(OverviewMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  W = 600
  H = 160
  pickedWindow: number | null = null
  now = Date.now()
  timer: number | null = null

  mounted () {
    // The graph moves on with the clock, not only when a reading arrives.
    this.timer = window.setInterval(() => { this.now = Date.now() }, 5000)
  }

  beforeDestroy () {
    if (this.timer !== null) window.clearInterval(this.timer)
  }

  get windows (): Array<{ value: number, label: string }> {
    return chartWindows(this.$store.getters['charts/getChartRetention'] as number)
  }

  /** The window picked, while the store keeps that much; else the default. */
  get windowSeconds (): number {
    const picked = this.pickedWindow
    if (picked !== null && this.windows.some(w => w.value === picked)) return picked
    return defaultChartWindow(this.windows)
  }

  set windowSeconds (value: number) {
    this.pickedWindow = value
  }

  get windowLabel (): string {
    return this.windows.find(w => w.value === this.windowSeconds)?.label ?? `${Math.round(this.windowSeconds / 60)} min`
  }

  get keys (): string[] {
    return ['extruder', 'heater_bed'].filter(k => this.heaters.some(h => h.name === k))
  }

  get chart () {
    const data = (this.$store.getters['charts/getChartData'] as ChartPoint[]) ?? []
    return chartLines(data, this.keys, this.windowSeconds, this.now, this.W, this.H)
  }

  colorOf (key: string): string {
    return COLORS[key] ?? 'var(--m3d-text-muted)'
  }

  get legend () {
    return this.keys.map(key => {
      const h = this.heaters.find(x => x.name === key)
      const label = key === 'extruder' ? 'Nozzle' : 'Bed'
      const reading = h ? `${Math.round(h.temperature)}°${h.target ? ` / ${Math.round(h.target)}` : ''}` : ''
      return { key, label: `${label} ${reading}`, color: this.colorOf(key) }
    })
  }

  get ariaLabel (): string {
    return `Temperature graph: ${this.legend.map(l => l.label).join(', ')}`
  }
}
</script>

<style lang="scss" scoped>
  .ov-temps__tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px 16px;
  }

  .ov-temps__legend {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;

    i {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }
  }

  .ov-temps__window {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .ov-temps__chart {
    width: 100%;
    height: 160px;
  }

  .ov-temps__grid {
    stroke: var(--m3d-border);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .ov-temps__target {
    stroke: var(--m3d-text-subtle);
    stroke-width: 1;
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
  }

  .ov-temps__line {
    fill: none;
    stroke-width: 2;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .ov-temps__axis {
    display: flex;
    justify-content: space-between;
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono);
    font-size: 11px;
  }
</style>
