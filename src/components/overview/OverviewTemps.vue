<template>
  <section
    class="ov-card ov-temps"
    data-tid="overview-temps"
  >
    <div class="ov-card__head">
      <h2 class="ov-card__title">
        {{ table ? 'Temperatures and sensors' : 'Temperatures' }}
      </h2>
      <div class="ov-temps__tools">
        <span
          v-for="s in (table ? [] : legend)"
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
    <div :class="{ 'ov-temps__body': table }">
      <table
        v-if="table"
        class="ov-temps__table"
        data-tid="overview-sensors"
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Power</th>
            <th>Actual</th>
            <th>Target</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.key"
          >
            <td>
              <i
                class="ov-temps__swatch"
                :style="{ background: colorOf(row.key) }"
              />{{ row.label }}
            </td>
            <td class="ov-temps__num">
              {{ row.power === null ? '—' : `${row.power}%` }}
            </td>
            <td class="ov-temps__num ov-temps__actual">
              {{ row.actual }}
            </td>
            <td>
              <number-field
                v-if="row.heater"
                :value="row.heater.target"
                unit="°"
                :label="`${row.label} target`"
                :min="0"
                :max="row.heater.maxTemp || 350"
                :disabled="!klippyReady"
                class="ov-temps__target-field"
                @change="setHeater(row.heater, $event)"
              />
              <span
                v-else
                class="ov-temps__none"
              >—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="ov-temps__plot">
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
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { chartLines, chartWindows, defaultChartWindow, sensorRows, type ChartPoint, type SensorRow } from '@/services/overview/model'
import SegPicker from '@/components/control/SegPicker.vue'
import NumberField from '@/components/control/NumberField.vue'
import type { Heater, Sensor } from '@/store/printer/types'

const COLORS: Record<string, string> = { extruder: '#ff8c42', heater_bed: '#6aa8ff' }
/** For the other heaters and sensors, in order. */
const MORE_COLORS = ['#b38cff', '#4fd1a5', '#e6c84a', '#ff6b9a', '#8ab4c8', '#c49a6c']

/**
 * The nozzle and bed over the last few minutes, each with its target
 * dashed. Pro shows every heater and sensor, as a table beside the graph:
 * power, temperature, and a target to type for each heater.
 */
@Component({ components: { NumberField, SegPicker } })
export default class OverviewTemps extends Mixins(OverviewMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  /** Every heater and sensor, with the table (Pro's Overview). */
  @Prop({ type: Boolean })
  readonly table?: boolean

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

  get sensors (): Sensor[] {
    return (this.$store.getters['printer/getSensors'] as Sensor[] | undefined) ?? []
  }

  get keys (): string[] {
    const main = ['extruder', 'heater_bed'].filter(k => this.heaters.some(h => h.name === k))
    if (!this.table) return main
    const others = this.heaters.map(h => h.name).filter(k => !main.includes(k))
    return [...main, ...others, ...this.sensors.map(s => s.key)]
  }

  get rows (): Array<SensorRow<Heater>> {
    return sensorRows(this.heaters, this.sensors)
  }

  get chart () {
    const data = (this.$store.getters['charts/getChartData'] as ChartPoint[]) ?? []
    return chartLines(data, this.keys, this.windowSeconds, this.now, this.W, this.H)
  }

  colorOf (key: string): string {
    if (COLORS[key]) return COLORS[key]
    const others = this.keys.filter(k => !COLORS[k])
    const i = others.indexOf(key)
    return i >= 0 ? MORE_COLORS[i % MORE_COLORS.length] : 'var(--m3d-text-muted)'
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

  .ov-temps {
    container-type: inline-size;
  }

  // Pro: the table beside the graph, under it when the card is narrow.
  .ov-temps__body {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: 16px 24px;
    align-items: center;

    @container (max-width: 560px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .ov-temps__plot {
    min-width: 0;
  }

  .ov-temps__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    th {
      padding: 0 8px 8px 0;
      color: var(--m3d-text-muted);
      font-size: 12px;
      font-weight: 500;
      text-align: left;
    }

    td {
      height: 36px;
      padding: 0 8px 0 0;
      border-top: 1px solid var(--m3d-border);
      white-space: nowrap;
    }
  }

  .ov-temps__swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 8px;
    border-radius: 3px;
    vertical-align: -1px;
  }

  .ov-temps__num {
    color: var(--m3d-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .ov-temps__actual {
    color: var(--m3d-text);
    font-weight: 600;
  }

  .ov-temps__target-field {
    width: 88px;
  }

  .ov-temps__none {
    color: var(--m3d-text-subtle);
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
