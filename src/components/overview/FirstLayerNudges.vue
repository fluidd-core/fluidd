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
    <small>Layers 1–3 only. {{ firmwareNudgeAvailable ? 'The printer enforces the limit.' : "Shared limit, best effort: this printer doesn't enforce one yet." }} These nudges are not saved as calibration.</small>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { httpClientActions } from '@/api/httpClientActions'
import { databasePart, expectedCaughtUp, firstLayerAllowed, missingDatabaseKey, nudgeBudget, nudgeFits, readNudgeEntry } from '@/services/overview/nudges'
import type { NudgeDatabaseTarget, NudgeEntry } from '@/services/overview/nudges'
import type { HistoryItem } from '@/store/history/types'

class NudgeTargetChanged extends Error {}
@Component
export default class FirstLayerNudges extends Mixins(OverviewMixin) {
  captured = ''
  baseline: number | null = null
  refusal = ''
  pending = false
  readonly deviceId = `${Date.now()}-${Math.random()}`
  get managedPrinter () { return isManagedApiUrl(this.$store.state.config.apiUrl) && printerTransportBinding.remote ? cloudState.printers.find(p => p.id === cloudState.activePrinterId) : undefined }
  get knownM1 (): boolean { return ['M1', 'Muon3D M1'].includes(this.managedPrinter?.model ?? '') }
  get identity (): string {
    const job = this.currentJob
    return this.managedPrinter && job?.job_id ? `${this.managedPrinter.id}/${job.job_id}` : ''
  }

  get currentJob (): HistoryItem | undefined { return this.$store.state.history?.jobs?.find((j: HistoryItem) => j.status === 'in_progress' && j.filename === this.jobFile && !j.end_time) }

  get context (): string { return `${this.panelTarget}|${this.identity}` }
  get databaseKey (): string {
    const [printerId = '', jobId = ''] = this.identity.split('/')
    return `firstLayerNudges.${databasePart(printerId)}.${databasePart(jobId)}`
  }

  get databaseTarget (): NudgeDatabaseTarget {
    return {
      printerId: this.managedPrinter?.id ?? '',
      accountId: cloudState.account?.id ?? '',
      route: `${this.$store.state.config.apiUrl}|${this.$route?.params?.printer ?? ''}`,
      context: this.context,
      databaseKey: this.databaseKey
    }
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

  get firmwareNudgeAvailable (): boolean { return !!this.$store.getters['printer/getAvailableCommands']?.FIRST_LAYER_NUDGE }

  get allowedNow (): boolean {
    return this.isAllowedNow()
  }

  isAllowedNow (): boolean {
    const commands = this.$store.getters['printer/getAvailableCommands']
    const roleAllowsControl = !isManagedApiUrl(this.$store.state.config.apiUrl) || this.managedPrinter?.role === 'operator'
    return this.lockingAvailable && this.captured === this.context && firstLayerAllowed({ m1: this.knownM1, identity: this.identity, layer: this.printStats.info?.current_layer ?? NaN, printing: this.printerPrinting && !this.printerPaused && this.$store.state.printer.printer.pause_resume?.is_paused !== true, ready: roleAllowsControl && this.controlReady && !!(commands?.FIRST_LAYER_NUDGE || commands?.SET_GCODE_OFFSET), homed: this.isHomed('Z'), waiting: this.hasWait(this.$waits.onZAdjust) })
  }

  canMove (by: number): boolean { return Number.isFinite(this.reportedOffset) && (this.baseline === null || nudgeFits(this.reportedOffset, this.baseline, by)) }

  @Watch('context', { immediate: true })
  bind () {
    this.captured = this.context; this.baseline = null; this.refusal = ''
    // A selection change during a nudge must only abort that sequence; do not
    // start a background database read against the newly selected target.
    if (!this.pending) this.refreshBaseline()
  }

  targetMatches (target: NudgeDatabaseTarget): boolean {
    const current = this.databaseTarget
    return target.printerId === current.printerId && target.accountId === current.accountId && target.route === current.route && target.context === current.context && target.databaseKey === current.databaseKey
  }

  assertDatabaseTarget (target: NudgeDatabaseTarget): void {
    if (!this.targetMatches(target) || !this.isAllowedNow()) throw new NudgeTargetChanged()
  }

  async readSharedEntry (target: NudgeDatabaseTarget): Promise<NudgeEntry | null | undefined> {
    try {
      this.assertDatabaseTarget(target)
      const response = await httpClientActions.serverDatabaseItemGet<unknown>('fluidd', { params: { key: target.databaseKey } })
      return readNudgeEntry(response.data.result.value)
    } catch (error) {
      if (missingDatabaseKey(error)) return undefined
      throw error
    }
  }

  entryMatches (entry: NudgeEntry): boolean {
    return entry.start_time === this.currentJob?.start_time && entry.filename === this.currentJob?.filename
  }

  async pruneAndWrite (target: NudgeDatabaseTarget, entry: NudgeEntry): Promise<void> {
    const printerKey = target.databaseKey.split('.').slice(0, 2).join('.')
    let values: Record<string, unknown> = {}
    try {
      this.assertDatabaseTarget(target)
      const response = await httpClientActions.serverDatabaseItemGet<Record<string, unknown>>('fluidd', { params: { key: printerKey } })
      values = response.data.result.value ?? {}
    } catch (error) {
      if (!missingDatabaseKey(error)) throw error
    }
    const active = new Set((this.$store.state.history?.jobs ?? []).filter((job: HistoryItem) => job.status === 'in_progress' && !job.end_time).map((job: HistoryItem) => databasePart(String(job.job_id))))
    for (const jobId of Object.keys(values)) {
      if (!active.has(jobId)) {
        this.assertDatabaseTarget(target)
        await httpClientActions.serverDatabaseItemDelete('fluidd', `${printerKey}.${jobId}`)
      }
    }
    this.assertDatabaseTarget(target)
    await httpClientActions.serverDatabaseItemPost('fluidd', target.databaseKey, entry)
  }

  async refreshBaseline () {
    if (!this.identity) return
    const context = this.context
    const target = this.databaseTarget
    try {
      const entry = await this.readSharedEntry(target)
      if (context === this.context && entry && this.entryMatches(entry)) this.baseline = entry.baseline
    } catch { /* A send will retry and show an explicit refusal. */ }
  }

  async nudge (by: number) {
    if (!this.canNudge || ![-0.01, 0.01].includes(by)) return
    const context = this.context
    const target = this.databaseTarget
    const execute = async () => {
      // Web Locks can wait: check the actual printer/layer again inside the lock.
      if (context !== this.context || !this.isAllowedNow()) return
      const before = this.reportedOffset
      if (!Number.isFinite(before)) { this.refusal = 'No adjustment sent. The printer Z offset is unknown.'; return }
      try {
        let entry = await this.readSharedEntry(target)
        if (entry === null) {
          this.refusal = 'No adjustment sent. The shared baseline is unknown.'; return
        }
        if (entry === undefined) {
          const job = this.currentJob
          if (!job || !Number.isFinite(job.start_time)) { this.refusal = 'No adjustment sent. The print identity is unknown.'; return }
          await this.pruneAndWrite(target, { baseline: before, start_time: job.start_time, filename: job.filename })
          entry = await this.readSharedEntry(target)
          if (!entry || !this.entryMatches(entry) || Math.abs(entry.baseline - before) > 1e-8) {
            this.refusal = 'No adjustment sent. The shared baseline did not agree after saving.'; return
          }
        }
        if (!this.entryMatches(entry)) { this.refusal = 'No adjustment sent. The shared baseline belongs to a different print.'; return }
        this.baseline = entry.baseline
        // Database I/O and Web Locks can wait. Recheck authority, print context,
        // pending adjustment, current printer offset and cap immediately before send.
        if (context !== this.context || !this.isAllowedNow()) return
        if (entry.pending && entry.expected !== undefined && !expectedCaughtUp(this.reportedOffset, entry.expected, entry.pending.from, entry.pending.step) && Date.now() - entry.pending.created <= 5000) {
          this.refusal = 'No adjustment sent. A shared nudge is still awaiting printer confirmation.'; return
        }
        if (entry.pending) {
          const printerMoved = Math.abs(this.reportedOffset - entry.pending.from) > 1e-8
          entry = { ...entry, expected: printerMoved || entry.expected === undefined ? this.reportedOffset : entry.expected }
          delete entry.pending
          await this.pruneAndWrite(target, entry)
          if (context !== this.context || !this.isAllowedNow()) return
        }
        const effectiveOffset = entry.expected === undefined ? this.reportedOffset : Math.abs(entry.expected - entry.baseline) > Math.abs(this.reportedOffset - entry.baseline) ? entry.expected : this.reportedOffset
        if (!nudgeFits(effectiveOffset, entry.baseline, by)) {
          this.refusal = 'No adjustment sent. The shared 0.10 mm allowance would be exceeded.'; return
        }
        const nonce = `${Date.now()}-${Math.random()}`
        const reserved: NudgeEntry = { ...entry, expected: effectiveOffset + by, pending: { created: Date.now(), from: this.reportedOffset, step: by, device: this.deviceId, nonce } }
        await this.pruneAndWrite(target, reserved)
        const confirmed = await this.readSharedEntry(target)
        if (!this.targetMatches(target) || context !== this.context || !this.isAllowedNow() || !confirmed || !this.entryMatches(confirmed) || confirmed.expected !== reserved.expected || confirmed.pending?.device !== this.deviceId || confirmed.pending?.nonce !== nonce || confirmed.pending?.from !== this.reportedOffset) {
          this.refusal = 'No adjustment sent. The shared nudge reservation was not confirmed.'; return
        }
      } catch {
        this.refusal = 'No adjustment sent. The shared nudge database is unavailable.'; return
      }
      this.refusal = ''
      if (!this.targetMatches(target) || !this.isAllowedNow()) return
      if (this.firmwareNudgeAvailable) this.sendGcode(`FIRST_LAYER_NUDGE DIRECTION=${by < 0 ? 'CLOSER' : 'FURTHER'}`, this.$waits.onZAdjust)
      else this.adjustZ(by)
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
