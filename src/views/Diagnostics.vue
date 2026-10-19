<template>
  <div
    class="charts"
    :class="{ 'charts--phone': isMobileViewport }"
    data-tid="charts-page"
  >
    <div class="charts__bar">
      <p class="charts__intro">
        Your own charts, from anything the printer reports. They keep the last {{ retentionText }}.
      </p>
      <span class="charts__grow" />
      <button
        type="button"
        class="cbtn cbtn--primary"
        data-tid="charts-add"
        @click="add"
      >
        <frame-icon
          name="plus"
          small
        />
        Add a chart
      </button>
    </div>

    <p
      v-if="!collecting"
      class="charts__off"
      data-tid="charts-off"
    >
      Charts are off, so nothing new is drawn. Collecting their numbers costs a little on every update from the printer.
      <button
        type="button"
        class="charts__link"
        data-tid="charts-turn-on"
        @click="turnOn"
      >
        Turn them on
      </button>
    </p>

    <p
      v-if="!shown.length && !hidden.length"
      class="charts__note"
    >
      No charts yet. Add one: pick what to draw, its unit and its colour.
    </p>

    <div class="charts__grid">
      <section
        v-for="(chart, i) in shown"
        :key="chart.id"
        class="charts__panel"
        :data-chart="chart.title"
      >
        <header class="charts__head">
          <h2>{{ chart.title }}</h2>
          <span class="charts__grow" />
          <button
            type="button"
            class="charts__icon"
            :disabled="i === 0"
            :aria-label="`Move ${chart.title} earlier`"
            @click="move(chart.id, -1)"
          >
            <frame-icon
              name="chevronLeft"
              small
            />
          </button>
          <button
            type="button"
            class="charts__icon"
            :disabled="i === shown.length - 1"
            :aria-label="`Move ${chart.title} later`"
            @click="move(chart.id, 1)"
          >
            <frame-icon
              name="chevronRight"
              small
            />
          </button>
          <button
            type="button"
            class="charts__link"
            @click="setShown(chart.id, false)"
          >
            Hide
          </button>
          <button
            type="button"
            class="charts__link"
            data-tid="charts-edit"
            @click="edit(chart)"
          >
            Edit
          </button>
        </header>
        <ul class="charts__legend">
          <li
            v-for="metric in legend(chart)"
            :key="metric.key"
          >
            <i :style="{ background: metric.color }" />
            <span>{{ metric.name }}</span>
            <b>{{ metric.value }}</b>
          </li>
        </ul>
        <diagnostics-card
          :config="chart"
          bare
        />
      </section>
    </div>

    <section
      v-if="hidden.length"
      class="charts__hidden"
    >
      <h3>Hidden</h3>
      <div class="charts__hidden-list">
        <span
          v-for="chart in hidden"
          :key="chart.id"
          class="charts__hidden-item"
        >
          {{ chart.title }}
          <button
            type="button"
            class="charts__link"
            @click="setShown(chart.id, true)"
          >
            Show
          </button>
        </span>
      </div>
    </section>

    <diagnostics-card-config-dialog
      v-if="dialog.open"
      v-model="dialog.open"
      :config="dialog.card"
      @save="save"
      @delete="remove"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { v4 as uuidv4 } from 'uuid'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import type { DiagnosticsCardConfig, DiagnosticsCardContainer } from '@/store/diagnostics/types'
import { defaultState } from '@/store/layout/state'
import { flattenCharts, formatMetric, layoutFrom, metricValue, moveChart } from '@/services/charts/model'
import DiagnosticsCard from '@/components/widgets/diagnostics/DiagnosticsCard.vue'
import DiagnosticsCardConfigDialog from '@/components/widgets/diagnostics/DiagnosticsCardConfigDialog.vue'

/**
 * Charts: your own charts from anything the printer
 * reports, each with a live legend of its values, in an order you set;
 * hidden ones wait below. Each is still Fluidd's chart, kept in Fluidd's
 * layout store, and edited with Fluidd's chart editor.
 */
@Component({ components: { DiagnosticsCard, DiagnosticsCardConfigDialog } })
export default class Diagnostics extends Mixins(StateMixin, BrowserMixin) {
  dialog: { open: boolean, card: DiagnosticsCardConfig | null } = { open: false, card: null }

  get charts (): DiagnosticsCardConfig[] {
    return flattenCharts(this.$store.getters['layout/getLayout']('diagnostics') as DiagnosticsCardContainer)
  }

  get shown (): DiagnosticsCardConfig[] {
    return this.charts.filter(c => c.enabled)
  }

  get hidden (): DiagnosticsCardConfig[] {
    return this.charts.filter(c => !c.enabled)
  }

  /** Settings › General's diagnostics switch, which also shows this page's tab. */
  get collecting (): boolean {
    return !!this.$store.state.config.uiSettings.general.enableDiagnostics
  }

  turnOn () {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.enableDiagnostics', value: true, server: true })
  }

  get retentionText (): string {
    const seconds = this.$store.getters['charts/getChartRetention'] as number
    const minutes = Math.round((seconds || 0) / 60)
    return minutes >= 60 ? `${Math.round(minutes / 60)} h` : `${minutes} minutes`
  }

  legend (chart: DiagnosticsCardConfig) {
    const points = (this.$store.state.charts.diagnostics as Array<Record<string, unknown>> | undefined) ?? []
    return chart.axes
      .filter(axis => axis.enabled)
      .flatMap((axis, a) => axis.metrics.map((metric, i) => ({
        key: `${a}-${i}`,
        name: metric.name,
        color: metric.style.lineColor,
        value: formatMetric(metricValue(points, metric.collector), axis.unit)
      })))
  }

  write (charts: DiagnosticsCardConfig[]) {
    this.$store.dispatch('layout/onLayoutChange', { name: 'diagnostics', value: layoutFrom(charts) })
  }

  move (id: string, by: number) {
    // Moving among the charts shown; hidden ones keep their places after them.
    this.write([...moveChart(this.shown, id, by), ...this.hidden])
  }

  setShown (id: string, enabled: boolean) {
    this.write(this.charts.map(c => (c.id === id ? { ...c, enabled } : c)))
  }

  add () {
    const card = JSON.parse(JSON.stringify(defaultState().layouts.diagnostics.container1[0])) as DiagnosticsCardConfig
    card.id = ''
    this.dialog = { open: true, card }
  }

  edit (chart: DiagnosticsCardConfig) {
    this.dialog = { open: true, card: JSON.parse(JSON.stringify(chart)) }
  }

  save (card: DiagnosticsCardConfig) {
    if (card.id === '') {
      this.write([...this.charts, { ...card, id: uuidv4(), enabled: true }])
    } else {
      this.write(this.charts.map(c => (c.id === card.id ? card : c)))
    }
  }

  remove (id: string) {
    this.write(this.charts.filter(c => c.id !== id))
  }
}
</script>

<style lang="scss" scoped>
  .charts {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .charts__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .charts__intro,
  .charts__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .charts__off {
    margin: 0;
    padding: 12px 16px;
    border-radius: 14px;
    background: rgba(255, 159, 10, 0.1);
    font-size: 14px;
  }

  .charts__grow {
    flex: 1 1 auto;
  }

  .charts__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .charts__panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    padding: 18px 18px 8px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .charts__head {
    display: flex;
    align-items: center;
    gap: 6px;

    h2 {
      margin: 0;
      overflow: hidden;
      font-size: 17px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .charts__icon {
    display: inline-flex;
    padding: 5px;
    border-radius: 8px;
    color: var(--m3d-text-muted);

    &:disabled {
      opacity: 0.3;
    }

    &:hover:not(:disabled) {
      background: var(--m3d-surface-2);
    }
  }

  .charts__link {
    margin-left: 6px;
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;
  }

  .charts__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 13px;

    li {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    i {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }

    span {
      color: var(--m3d-text-muted);
    }

    b {
      font-variant-numeric: tabular-nums;
    }
  }

  .charts__hidden h3 {
    margin: 0 0 8px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .charts__hidden-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .charts__hidden-item {
    display: inline-flex;
    align-items: center;
    padding: 6px 8px 6px 14px;
    border-radius: 999px;
    background: var(--m3d-surface);
    font-size: 13px;
  }

  @media (max-width: 1263px) {
    .charts__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
