<template>
  <control-card
    title="Probe"
    :locked="controlLock"
    data-tid="probe-card"
  >
    <template
      v-if="probeLabel !== 'probe'"
      #aside
    >
      <span>{{ probeLabel }}</span>
    </template>

    <div class="probe__rows">
      <div
        v-if="zOffset !== null"
        class="crow"
      >
        <span class="crow__name">Z offset <span class="crow__sub">· printer.cfg</span></span>
        <span class="crow__value">{{ zOffset.toFixed(3) }} mm</span>
      </div>
      <div class="crow">
        <span class="crow__name">Now <span class="crow__sub">· {{ queried ? 'as last asked' : 'not asked yet' }}</span></span>
        <span class="probe__now">
          <span
            v-if="queried"
            class="probe__state"
            :class="{ 'probe__state--hit': triggered }"
          >{{ triggered ? 'Triggered' : 'Open' }}</span>
          <button
            type="button"
            class="probe__link"
            :disabled="!controlReady || hasWait($waits.onQueryProbe)"
            data-tid="probe-query"
            @click="query"
          >
            Ask
          </button>
        </span>
      </div>
    </div>

    <div
      v-if="accuracy"
      class="probe__result"
      data-tid="probe-accuracy"
    >
      <dl class="probe__stats">
        <div>
          <dt>Spread</dt>
          <dd>{{ micron(accuracy.stddev) }}</dd>
        </div>
        <div>
          <dt>Range</dt>
          <dd>{{ micron(accuracy.range) }}</dd>
        </div>
        <div>
          <dt>Average</dt>
          <dd>{{ accuracy.average.toFixed(4) }} mm</dd>
        </div>
      </dl>
      <p
        class="probe__verdict"
        :class="`probe__verdict--${verdict.tone}`"
      >
        {{ verdict.text }}
        <span class="probe__when">{{ accuracyWhen }}</span>
      </p>
    </div>
    <p
      v-else
      class="probe__note"
    >
      Probe accuracy probes the middle of the bed ten times and shows how far apart the heights land.
    </p>

    <div class="probe__buttons">
      <button
        type="button"
        class="cbtn"
        :disabled="!canCheck"
        :title="checksBlocked"
        data-tid="probe-accuracy-run"
        @click="checkAccuracy"
      >
        {{ checking ? 'Probing…' : 'Check probe accuracy' }}
      </button>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import type { ConsoleEntry } from '@/store/console/types'
import type { Probe } from '@/store/printer/types'
import { bedMiddle, parseProbeAccuracy, probeAccuracyScript, probeVerdict, type ProbeAccuracy } from '@/services/maintenance/model'
import ControlCard from '@/components/control/ControlCard.vue'
import { plateCheckNeeded } from '@/services/jobs/plate'

/**
 * Pro's probe: its Z offset, whether it's triggered when asked, and probe
 * accuracy (ten probes in the middle of the bed) with how repeatable the
 * heights are. The result comes from Klipper's own line in the console.
 */
@Component({ components: { ControlCard } })
export default class ProbeCard extends Mixins(MaintenanceMixin) {
  queryAfter = Infinity
  queryPrevious: ConsoleEntry[] = []

  @Watch('maintenanceTarget')
  clearQuery () { this.queryAfter = Infinity; this.queryPrevious = [] }

  get queryReport (): boolean | null {
    const entries = (this.$store.state.console.console as ConsoleEntry[] | undefined) ?? []
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i]
      if (entry.type !== 'response' || (entry.time ?? 0) < this.queryAfter || this.queryPrevious.includes(entry)) continue
      const match = /\bprobe: (open|TRIGGERED)\b/i.exec(entry.message)
      if (match) return match[1].toLowerCase() === 'triggered'
    }
    return null
  }

  get queried (): boolean { return this.queryReport !== null }

  get probe (): Probe | undefined {
    return this.$store.getters['printer/getProbe'] as Probe | undefined
  }

  get probeLabel (): string {
    return (this.probe?.name ?? 'probe').replace(/_/g, ' ')
  }

  get zOffset (): number | null {
    const settings = this.probe?.name ? this.$store.getters['printer/getPrinterSettings'](this.probe.name) : undefined
    const value = Number(settings?.z_offset)
    return settings && Number.isFinite(value) ? value : null
  }

  get triggered (): boolean {
    return this.queryReport === true
  }

  query () {
    if (!this.probe || !this.controlReady || this.hasWait(this.$waits.onQueryProbe)) return
    this.queryPrevious = [...(this.$store.state.console.console ?? [])]
    this.queryAfter = Math.floor(Date.now() / 1000)
    this.sendGcode('QUERY_PROBE', this.$waits.onQueryProbe)
  }

  /** The newest PROBE_ACCURACY result in the console, and when it came. */
  get latest (): { result: ProbeAccuracy, time: number } | null {
    const entries = (this.$store.state.console.console as ConsoleEntry[] | undefined) ?? []
    for (let i = entries.length - 1; i >= 0; i--) {
      const result = parseProbeAccuracy(entries[i].message ?? '')
      if (result) return { result, time: entries[i].time ?? 0 }
    }
    return null
  }

  get accuracy (): ProbeAccuracy | null {
    return this.latest?.result ?? null
  }

  get verdict () {
    return probeVerdict(this.accuracy?.stddev ?? 0)
  }

  get accuracyWhen (): string {
    const t = this.latest?.time
    if (!t) return ''
    const d = new Date(t * 1000)
    return `· ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
  }

  micron (mm: number): string {
    return `${Math.round(mm * 1000)} µm`
  }

  get checking (): boolean {
    return this.hasWait(this.$waits.onProbeAccuracy)
  }

  get canCheck (): boolean {
    return 'PROBE_ACCURACY' in this.gcodeCommands && !this.checksBlocked && !this.checking
  }

  get middle (): [number, number] {
    const mesh = this.$store.state.printer.printer.configfile?.settings?.bed_mesh
    return bedMiddle(mesh?.mesh_min, mesh?.mesh_max, this.axisMin, this.axisMax)
  }

  async checkAccuracy () {
    if (!this.canCheck) return
    const target = this.maintenanceTarget
    const [x, y] = this.middle
    const ok = await this.$confirm(
      `${this.allHomed ? 'The head' : 'It homes, then the head'} goes to the middle of the bed (X${x} Y${y}) and probes there ten times. Keep the plate on and the nozzle clean.`,
      // It touches the middle of the plate ten times: the plate check first, as for a print.
      { title: 'Check how steady the probe is?', buttonTrueText: 'Start', plateCheck: plateCheckNeeded(this.$store.state.history?.jobs) }
    )
    if (!ok || target !== this.maintenanceTarget || !this.canCheck) return
    this.sendGcode(probeAccuracyScript(this.allHomed, this.middle), this.$waits.onProbeAccuracy)
  }
}
</script>

<style lang="scss" scoped>
  .probe__rows {
    display: flex;
    flex-direction: column;

    > .crow + .crow {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .probe__now {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }

  .probe__state {
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
  }

  .probe__state--hit {
    background: rgba(255, 159, 10, 0.16);
    color: var(--m3d-warning, #ff9f0a);
  }

  .probe__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;

    &:disabled {
      opacity: 0.45;
    }
  }

  .probe__result {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .probe__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;

    div {
      padding: 8px 12px;
      border-radius: 12px;
      background: var(--m3d-surface-2);
    }

    dt {
      color: var(--m3d-text-subtle);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    dd {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .probe__verdict {
    margin: 0;
    font-size: 13px;
  }

  .probe__verdict--ok {
    color: var(--m3d-success, #30d158);
  }

  .probe__verdict--warn {
    color: var(--m3d-warning, #ff9f0a);
  }

  .probe__when {
    color: var(--m3d-text-subtle);
  }

  .probe__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .probe__buttons {
    display: flex;
    gap: 8px;
  }
</style>
