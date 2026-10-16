<template>
  <div class="temperature-timeline">
    <svg
      viewBox="0 0 600 160"
      preserveAspectRatio="none"
      role="img"
      aria-label="Recorded temperatures. Drag or use the time control to inspect."
      @pointerdown="point"
      @pointermove="point"
    >
      <template v-for="sensor in sensors">
        <path
          :key="sensor.key"
          :d="path(sensor.key)"
          fill="none"
          :stroke="sensor.color"
          stroke-width="2"
        />
        <path
          :key="sensor.key + '-target'"
          :d="path(sensor.key + 'Target')"
          fill="none"
          :stroke="sensor.color"
          stroke-dasharray="4 4"
          opacity="0.5"
        />
      </template>
      <line
        v-for="(event, index) in visibleMarkers"
        :key="`event-${index}`"
        :data-marker="event.label"
        :x1="xAt(event.at)"
        :x2="xAt(event.at)"
        y1="148"
        y2="160"
        stroke="var(--m3d-text)"
        stroke-width="3"
        @click.stop="selectTime(event.at)"
      ><title>{{ event.label }}</title></line>
      <line
        v-if="cursor !== null && at >= plotFrom && at <= plotTo"
        :x1="xAt(at)"
        :x2="xAt(at)"
        y1="0"
        y2="160"
        stroke="var(--m3d-text)"
        stroke-dasharray="2 3"
      />
    </svg>
    <div class="temperature-timeline__axis">
      <span>{{ time(plotFrom) }}</span><span>{{ time(plotTo) }}</span>
    </div>
    <label>
      Inspect recorded time
      <input
        type="range"
        :min="from"
        :max="now"
        step="1000"
        :value="at"
        :aria-valuetext="time(at)"
        @input="pickInput"
        @keydown="key"
      >
    </label>
    <div
      class="temperature-timeline__track"
      aria-hidden="true"
    >
      <i :style="{ width: `${gapPercent}%` }" /><span>gap</span>
    </div>
    <div
      class="temperature-timeline__readout"
      aria-live="polite"
    >
      <b>{{ time(sample ? sample.date.getTime() : at) }}</b>
      <span v-if="!sample">No recorded sample at this time.</span>
      <span
        v-for="reading in readings"
        :key="reading.key"
      >
        {{ reading.text }}
      </span>
    </div>
    <button
      type="button"
      class="cbtn"
      @click="goLive"
    >
      Live
    </button>
    <p v-if="oldest !== null">
      Recorded history starts about {{ time(oldest) }}. Earlier time is a gap.
    </p>
    <p v-else>
      No temperature history is retained.
    </p>
    <p>Times are approximate: stored samples are aligned to receipt time. Scrubbing only inspects readings.</p>
    <p v-if="eventStart">
      Event markers observed since {{ time(eventStart) }}; earlier events are not recorded here.
    </p>
    <details v-if="events.length">
      <summary>Observed markers ({{ events.length }})</summary>
      <div class="temperature-timeline__events">
        <button
          v-for="(event, index) in events"
          :key="index"
          type="button"
          class="cbtn"
          :data-event="event.label"
          @click="selectTime(event.at)"
        >
          {{ time(event.at) }} · {{ event.label }}
        </button>
      </div>
    </details>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import type { ChartPoint } from '@/services/overview/model'
import { historyPath, sampleAt } from '@/services/overview/timeline'
@Component
export default class TemperatureTimeline extends Vue {
  @Prop({ type: Array, required: true }) readonly points!: ChartPoint[]
  @Prop({ type: Array, required: true }) readonly sensors!: Array<{ key: string; label: string; color: string }>
  @Prop({ type: Number, required: true }) readonly now!: number
  @Prop({ type: Number }) readonly start?: number
  @Prop({ type: Array, default: () => [] }) readonly events!: Array<{ at: number; label: string }>
  @Prop({ type: Number }) readonly eventStart?: number
  @Prop({ type: Number, default: 1200 }) readonly windowSeconds!: number
  cursor: number | null = null
  viewEnd: number | null = null

  get oldest (): number | null { return this.points.length ? this.points[0].date.getTime() : null }
  get from (): number { return Math.min(this.now, this.start ?? this.oldest ?? this.now - this.windowSeconds * 1000) }
  get plotTo (): number { return Math.min(this.now, this.viewEnd ?? this.now) }
  get plotFrom (): number { return Math.max(this.from, this.plotTo - this.windowSeconds * 1000) }
  get at (): number { return Math.max(this.from, Math.min(this.now, this.cursor ?? this.points.at(-1)?.date.getTime() ?? this.now)) }
  get sample (): ChartPoint | null { return sampleAt(this.points, this.at) }
  get visibleMarkers () { return this.events.filter(event => event.at >= this.plotFrom && event.at <= this.plotTo) }
  get gapPercent (): number { return this.oldest === null ? 100 : Math.max(0, Math.min(100, (this.oldest - this.from) / Math.max(1, this.now - this.from) * 100)) }
  get maximum (): number {
    let max = 100
    for (const p of this.points) {
      for (const sensor of this.sensors) {
        for (const value of [p[sensor.key], p[sensor.key + 'Target']]) if (typeof value === 'number' && Number.isFinite(value)) max = Math.max(max, value)
      }
    }
    return max + 10
  }

  get readings () {
    const sample = this.sample
    if (!sample) return []
    return this.sensors.map(sensor => ({ key: sensor.key, text: `${sensor.label} ${this.degrees(sample[sensor.key])}${typeof sample[sensor.key + 'Target'] === 'number' ? ` · target ${this.degrees(sample[sensor.key + 'Target'])}` : ''}` }))
  }

  path (name: string): string { return historyPath(this.points, name, this.plotFrom, this.plotTo, 600, v => 160 - v / this.maximum * 160) }
  degrees (value: number | Date): string { return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(2).replace(/0$/, '')}°` : 'unrecorded' }
  xAt (at: number): number { return Math.max(0, Math.min(600, (at - this.plotFrom) / Math.max(1, this.plotTo - this.plotFrom) * 600)) }
  time (at: number): string { return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
  pick (at: number) { this.cursor = Math.max(this.from, Math.min(this.now, at)) }
  pickInput (event: Event) { if (event.target instanceof HTMLInputElement) this.selectTime(Number(event.target.value)) }
  selectTime (at: number) { this.pick(at); this.viewEnd = Math.min(this.now, Math.max(this.from + this.windowSeconds * 1000, this.at + this.windowSeconds * 500)) }
  goLive () { this.cursor = null; this.viewEnd = null }
  point (event: PointerEvent) {
    const bounds = (event.currentTarget as SVGElement).getBoundingClientRect()
    if (bounds.width > 0) this.pick(this.plotFrom + Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) * (this.plotTo - this.plotFrom))
  }

  key (event: KeyboardEvent) {
    const target = ({ Home: this.from, End: this.now, ArrowLeft: this.at - 1000, ArrowRight: this.at + 1000, PageUp: this.at + 60000, PageDown: this.at - 60000 } as Record<string, number>)[event.key]
    if (target !== undefined) { event.preventDefault(); this.selectTime(target) }
  }
}
</script>
<style scoped>
.temperature-timeline svg { width: 100%; height: 160px; touch-action: none; background: repeating-linear-gradient(to top, transparent 0 39px, var(--m3d-border) 39px 40px); }
.temperature-timeline label, .temperature-timeline input { display: block; width: 100%; }
.temperature-timeline input { min-height: 44px; accent-color: var(--m3d-accent); }
.temperature-timeline__axis { display: flex; justify-content: space-between; font-size: 12px; }
.temperature-timeline__readout, .temperature-timeline__events { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 8px 0; }
.temperature-timeline__readout { font-variant-numeric: tabular-nums; }
.temperature-timeline__track { height: 8px; position: relative; background: var(--m3d-success); border-radius: 4px; overflow: hidden; }
.temperature-timeline__track i { display: block; height: 100%; background: repeating-linear-gradient(45deg, var(--m3d-surface-2) 0 4px, var(--m3d-border) 4px 8px); }
.temperature-timeline__track span { position: absolute; visibility: hidden; }
.temperature-timeline p { margin: 8px 0; color: var(--m3d-text-subtle); font-size: 12px; }
</style>
