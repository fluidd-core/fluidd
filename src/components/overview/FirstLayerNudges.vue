<template>
  <div
    v-if="knownM1 && identity && earlyLayer"
    class="first-layer-nudges"
  >
    <b>First layer height</b>
    <button
      type="button"
      class="cbtn"
      :disabled="!canNudge || !canMove(-0.01)"
      @click="nudge(-0.01)"
    >
      Nozzle closer · 0.01 mm
    </button>
    <button
      type="button"
      class="cbtn"
      :disabled="!canNudge || !canMove(0.01)"
      @click="nudge(0.01)"
    >
      Nozzle further · 0.01 mm
    </button>
    <p v-if="budget">
      {{ budget.total > 0 ? '+' : '' }}{{ budget.total.toFixed(2) }} mm from the start of this print · {{ budget.remaining.toFixed(2) }} mm remaining.
    </p>
    <p v-else>
      Shared nudge allowance is loading or unavailable. No adjustment sent.
    </p>
    <p
      v-if="!lockingAvailable"
      role="status"
    >
      Nudges are unavailable in this browser.
    </p>
    <p
      v-if="refusal"
      role="status"
    >
      {{ refusal }}
    </p>
    <small>Layers 1–3 only. The printer's shared offset is checked for every nudge. These nudges are not saved as calibration.</small>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { httpClientActions } from '@/api/httpClientActions'
import { databasePart, firstLayerAllowed, nudgeBudget, nudgeFits, readBaseline } from '@/services/overview/nudges'
import type { HistoryItem } from '@/store/history/types'
@Component
export default class FirstLayerNudges extends Mixins(OverviewMixin) {
  captured = ''
  baseline: number | null = null
  refusal = ''
  pending = false
  get managedPrinter () { return isManagedApiUrl(this.$store.state.config.apiUrl) && printerTransportBinding.remote ? cloudState.printers.find(p => p.id === cloudState.activePrinterId) : undefined }
  get knownM1 (): boolean { return ['M1', 'Muon3D M1'].includes(this.managedPrinter?.model ?? '') }
  get identity (): string {
    const job = this.$store.state.history?.jobs?.find((j: HistoryItem) => j.status === 'in_progress' && j.filename === this.jobFile && !j.end_time)
    return this.managedPrinter && job?.job_id ? `${this.managedPrinter.id}/${job.job_id}` : ''
  }

  get context (): string { return `${this.panelTarget}|${this.identity}` }
  get databaseKey (): string {
    const [printerId = '', jobId = ''] = this.identity.split('/')
    return `firstLayerNudges.${databasePart(printerId)}.${databasePart(jobId)}`
  }
  get earlyLayer (): boolean { const layer = this.printStats.info?.current_layer; return Number.isInteger(layer) && layer >= 1 && layer <= 3 }
  get reportedOffset (): number {
    const origin = this.$store.state.printer.printer.gcode_move?.homing_origin
    return Array.isArray(origin) && origin.length >= 3 && typeof origin[2] === 'number' && Number.isFinite(origin[2]) ? origin[2] : NaN
  }
  get budget () { return this.baseline === null ? null : nudgeBudget(this.reportedOffset, this.baseline) }
  get lockingAvailable (): boolean { return typeof navigator.locks?.request === 'function' }
  get canNudge (): boolean {
    return !this.pending && this.allowedNow
  }
  get allowedNow (): boolean {
    return this.lockingAvailable && this.captured === this.context && firstLayerAllowed({ m1: this.knownM1, identity: this.identity, layer: this.printStats.info?.current_layer ?? NaN, printing: this.printerPrinting && !this.printerPaused && this.$store.state.printer.printer.pause_resume?.is_paused !== true, ready: this.controlReady && !!this.$store.getters['printer/getAvailableCommands']?.SET_GCODE_OFFSET, homed: this.isHomed('Z'), waiting: this.hasWait(this.$waits.onZAdjust) })
  }

  canMove (by: number): boolean { return Number.isFinite(this.reportedOffset) && (this.baseline === null || nudgeFits(this.reportedOffset, this.baseline, by)) }

  @Watch('context', { immediate: true })
  bind () { this.captured = this.context; this.baseline = null; this.refusal = ''; void this.refreshBaseline() }

  async readSharedBaseline (): Promise<number | null | undefined> {
    const response = await httpClientActions.serverDatabaseItemGet<unknown>('fluidd')
    return readBaseline(response.data.result.value, this.databaseKey)
  }

  async refreshBaseline () {
    if (!this.identity) return
    const context = this.context
    try {
      const baseline = await this.readSharedBaseline()
      if (context === this.context && typeof baseline === 'number') this.baseline = baseline
    } catch { /* A send will retry and show an explicit refusal. */ }
  }
  async nudge (by: number) {
    if (!this.canNudge || ![-0.01, 0.01].includes(by)) return
    const context = this.context
    const execute = async () => {
      // Web Locks can wait: check the actual printer/layer again inside the lock.
      if (context !== this.context || !this.allowedNow) return
      const before = this.reportedOffset
      if (!Number.isFinite(before)) { this.refusal = 'No adjustment sent. The printer Z offset is unknown.'; return }
      try {
        let baseline = await this.readSharedBaseline()
        if (baseline === null) {
          this.refusal = 'No adjustment sent. The shared baseline is unknown.'; return
        }
        if (baseline === undefined) {
          await httpClientActions.serverDatabaseItemPost('fluidd', this.databaseKey, before)
          baseline = await this.readSharedBaseline()
          if (typeof baseline !== 'number' || Math.abs(baseline - before) > 1e-8) {
            this.refusal = 'No adjustment sent. The shared baseline did not agree after saving.'; return
          }
        }
        this.baseline = baseline
        // Database I/O and Web Locks can wait. Recheck authority, print context,
        // pending adjustment, current printer offset and cap immediately before send.
        if (context !== this.context || !this.allowedNow) return
        if (!nudgeFits(this.reportedOffset, baseline, by)) {
          this.refusal = 'No adjustment sent. The shared 0.10 mm allowance would be exceeded.'; return
        }
      } catch {
        this.refusal = 'No adjustment sent. The shared nudge database is unavailable.'; return
      }
      this.refusal = ''
      this.adjustZ(by)
    }
    this.pending = true
    try {
      await navigator.locks.request(`muon-first-layer:${this.identity}`, execute)
    } catch { this.refusal = 'No adjustment sent. The nudge allowance could not be locked.' } finally { this.pending = false }
  }
}
</script>
<style scoped>
.first-layer-nudges { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-top: 12px; border-top: 1px solid var(--m3d-border); }
.first-layer-nudges p, .first-layer-nudges small { flex-basis: 100%; margin: 0; color: var(--m3d-text-subtle); }
</style>
