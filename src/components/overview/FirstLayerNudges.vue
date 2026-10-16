<template>
  <div
    v-if="knownM1 && identity && earlyLayer"
    class="first-layer-nudges"
  >
    <b>First layer height</b>
    <button
      type="button"
      class="cbtn"
      :disabled="!canNudge || !budget || budget.spent >= 0.1"
      @click="nudge(-0.01)"
    >
      Nozzle closer · 0.01 mm
    </button>
    <button
      type="button"
      class="cbtn"
      :disabled="!canNudge || !budget || budget.spent >= 0.1"
      @click="nudge(0.01)"
    >
      Nozzle further · 0.01 mm
    </button>
    <p v-if="budget">
      Nudged here: {{ budget.total > 0 ? '+' : '' }}{{ budget.total.toFixed(2) }} mm · {{ budget.spent.toFixed(2) }} of 0.10 mm allowance used.
    </p>
    <p v-else>
      Nudge allowance is unavailable. No adjustment sent.
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
    <small>Layers 1–3 only. This browser remembers the allowance for this print. These nudges are not saved as calibration.</small>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { firstLayerAllowed, readNudge, reserveNudge } from '@/services/overview/nudges'
import type { HistoryItem } from '@/store/history/types'
@Component
export default class FirstLayerNudges extends Mixins(OverviewMixin) {
  captured = ''
  budgetRevision = 0
  refusal = ''
  pending = false
  get managedPrinter () { return isManagedApiUrl(this.$store.state.config.apiUrl) && printerTransportBinding.remote ? cloudState.printers.find(p => p.id === cloudState.activePrinterId) : undefined }
  get knownM1 (): boolean { return ['M1', 'Muon3D M1'].includes(this.managedPrinter?.model ?? '') }
  get identity (): string {
    const job = this.$store.state.history?.jobs?.find((j: HistoryItem) => j.status === 'in_progress' && j.filename === this.jobFile && !j.end_time)
    return this.managedPrinter && job?.job_id ? `${this.managedPrinter.id}/${job.job_id}` : ''
  }

  get context (): string { return `${this.panelTarget}|${this.identity}` }
  get earlyLayer (): boolean { const layer = this.printStats.info?.current_layer; return Number.isInteger(layer) && layer >= 1 && layer <= 3 }
  get budget () { return this.budgetRevision >= 0 && this.identity ? readNudge(localStorage, this.identity) : null }
  get lockingAvailable (): boolean { return typeof navigator.locks?.request === 'function' }
  get canNudge (): boolean {
    return this.lockingAvailable && this.captured === this.context && firstLayerAllowed({ m1: this.knownM1, identity: this.identity, layer: this.printStats.info?.current_layer ?? NaN, printing: this.printerPrinting && !this.printerPaused && this.$store.state.printer.printer.pause_resume?.is_paused !== true, ready: this.controlReady && !!this.$store.getters['printer/getAvailableCommands']?.SET_GCODE_OFFSET, homed: this.isHomed('Z'), waiting: this.pending || this.hasWait(this.$waits.onZAdjust) })
  }

  @Watch('context', { immediate: true })
  bind () { this.captured = this.context; this.budgetRevision++; this.refusal = '' }

  mounted () { window.addEventListener('storage', this.onStorage) }
  beforeDestroy () { window.removeEventListener('storage', this.onStorage) }
  onStorage () { this.budgetRevision++ }
  async nudge (by: number) {
    if (!this.canNudge || ![-0.01, 0.01].includes(by)) return
    const context = this.context
    const execute = () => {
      // Web Locks can wait: check the actual printer/layer again inside the lock.
      this.pending = false
      if (context !== this.context || !this.canNudge) return
      const reserved = reserveNudge(localStorage, this.identity, by)
      this.budgetRevision++
      if (!reserved) { this.refusal = 'No adjustment sent. The 0.10 mm allowance is used or cannot be saved.'; return }
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
