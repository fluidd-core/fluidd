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
    <seg-picker
      :options="[{ value: 'graph', label: 'Graph' }, { value: 'table', label: 'Table' }]"
      :value="table ? 'table' : 'graph'"
      label="Temperature view"
      @input="table = $event === 'table'"
    />
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
            :key="row.context + row.key"
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
                :disabled="!controlReady"
                class="ov-temps__target-field"
                @change="commitTarget(row.context, row.heater, $event)"
              />
              <span
                v-else
                class="ov-temps__none"
              >—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <temperature-timeline
        :key="historyContext"
        :points="chartData"
        :sensors="timelineSensors"
        :now="now"
        :start="printStart"
        :events="markers"
        :event-start="observedSince"
        :window-seconds="windowSeconds"
      />
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { chartWindows, defaultChartWindow, sensorRows, type ChartPoint, type SensorRow } from '@/services/overview/model'
import SegPicker from '@/components/control/SegPicker.vue'
import NumberField from '@/components/control/NumberField.vue'
import TemperatureTimeline from './TemperatureTimeline.vue'
import { observedEvents, type Observation } from '@/services/overview/timeline'
import type { Heater, Sensor } from '@/store/printer/types'
import type { HistoryItem } from '@/store/history/types'

const COLORS: Record<string, string> = { extruder: '#ff8c42', heater_bed: '#6aa8ff' }
/** For the other heaters and sensors, in order. */
const MORE_COLORS = ['#b38cff', '#4fd1a5', '#e6c84a', '#ff6b9a', '#8ab4c8', '#c49a6c']

/**
 * Retained nozzle/bed history, with a Table disclosure for every sensor
 * and exact heater targets. Missing history stays visible.
 */
@Component({ components: { NumberField, SegPicker, TemperatureTimeline } })
export default class OverviewTemps extends Mixins(OverviewMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  commitTarget (context: string, heater: Heater, value: number) { if (context === this.panelTarget) this.setHeater(heater, value) }

  table = false

  pickedWindow: number | null = null
  now = Date.now()
  timer: number | null = null

  mounted () {
    // The graph moves on with the clock, not only when a reading arrives.
    this.timer = window.setInterval(() => { this.now = Date.now() }, 1000)
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

  get rows (): Array<SensorRow<Heater> & { context: string }> {
    return sensorRows(this.heaters, this.sensors).map(row => ({ ...row, context: this.panelTarget }))
  }

  previous: Observation | null = null
  markers: Array<{ at: number; label: string }> = []
  observedSince = 0
  get chartData (): ChartPoint[] { return this.$store.getters['charts/getChartData'] ?? [] }
  get timelineSensors () { return this.keys.map(key => ({ key, label: this.rows.find(r => r.key === key)?.label ?? key, color: this.colorOf(key) })) }
  get currentHistory (): HistoryItem | undefined { return this.$store.state.history?.jobs?.find((j: HistoryItem) => j.status === 'in_progress' && j.filename === this.jobFile) }
  get printStart (): number | undefined { const start = this.currentHistory?.start_time; return typeof start === 'number' && Number.isFinite(start) ? start * 1000 : undefined }
  get historyContext (): string { return `${this.panelTarget}|${this.currentHistory?.job_id ?? this.jobFile}|${this.socketConnected && this.klippyConnected}` }
  get liveObservation (): Observation {
    const printer = this.$store.state.printer.printer
    const filament: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(printer)) {
      const sensor = value as { filament_detected?: boolean } | null
      if (/^filament_(switch|motion)_sensor /.test(key) && typeof sensor?.filament_detected === 'boolean') filament[key] = sensor.filament_detected
    }
    return { context: this.historyContext, layer: printer.print_stats?.info?.current_layer, paused: printer.pause_resume?.is_paused, duration: printer.print_stats?.total_duration, filament }
  }

  @Watch('liveObservation', { deep: true, immediate: true })
  recordObservation (current: Observation) {
    if (!this.socketConnected || !this.klippyConnected || !this.apiConnected) { this.previous = null; this.markers = []; this.observedSince = 0; return }
    const at = Date.now()
    if (!this.previous || current.context !== this.previous.context || (typeof current.duration === 'number' && typeof this.previous.duration === 'number' && current.duration < this.previous.duration)) { this.markers = []; this.observedSince = at; this.previous = null }
    this.markers.push(...observedEvents(this.previous, current, at))
    if (this.markers.length > 512) { this.markers = this.markers.slice(-512); this.observedSince = this.markers[0].at }
    this.previous = current
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

  // The table sits beside the graph, or below on a narrow card.
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
