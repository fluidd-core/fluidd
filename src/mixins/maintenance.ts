import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from './control'
import { Waits } from '@/globals'
import { activeSlug } from '@/services/printer-pages'
import { running } from '@/services/maintenance/running'
import {
  checkCommand,
  checkProduced,
  checkStatus,
  meshSummary,
  probeCount,
  type CheckEvidence,
  type CheckId,
  type CheckStatus,
  type MeshSummary
} from '@/services/maintenance/model'
import type { ConsoleEntry } from '@/store/console/types'
import {
  choosePlan,
  homingTouches,
  liveGrid,
  meshLayout,
  meshPoints,
  meshProgress,
  parseProbeLine,
  planFrom,
  planFromSettings,
  type MeshPoint,
  type MeshProgress,
  type ProbeTouch
} from '@/services/maintenance/live-probe'

/** A bed measurement under way, as far as it has got. */
export interface MeshRun {
  points: MeshPoint[];
  /** Rows by Y ascending, cells by X ascending; null where not touched yet. */
  grid: Array<Array<number | null>>;
  progress: MeshProgress;
  /** Every touch of the plate so far, homing included, for the live M1. */
  touches: ProbeTouch[];
}

/** A pause between touches longer than this ends a measurement the printer began by itself. */
const AUTO_GAP_S = 90

export interface CheckRow {
  id: CheckId;
  title: string;
  description: string;
  icon: string;
  status: CheckStatus;
  /** What the button says: Run, or Check for the one you adjust by hand. */
  action: string;
  /** The G-code, or null when the printer can't run the check. */
  gcode: string | null;
  wait: string;
  /** What the confirmation says before it starts. */
  confirm: string;
}

interface CheckInfo {
  id: CheckId;
  title: string;
  description: string;
  icon: string;
  action: string;
  wait: string;
  /** What to say before it starts; `gcode` is what will run. */
  confirm: (nozzle: number, gcode: string) => string;
}

const CHECKS: CheckInfo[] = [
  {
    id: 'bedMesh',
    title: 'Level the bed',
    description: 'Measures the plate so the first layer is even.',
    icon: 'mesh',
    action: 'Run',
    wait: Waits.onMeshCalibrate,
    confirm: () => 'It homes, then touches the plate at every point of the mesh. Keep the plate on and the nozzle clean.'
  },
  {
    id: 'firstLayer',
    title: 'First layer height',
    description: "How close the nozzle starts to the plate. Too high and prints don't stick; too low and they scrape.",
    icon: 'firstLayer',
    action: 'Check',
    wait: Waits.onProbeCalibrate,
    confirm: () => 'It homes and brings the nozzle down to the plate, then you lower it until a sheet of paper just drags under it.'
  },
  {
    id: 'shaper',
    title: 'Vibration tuning',
    description: 'Lets it print fast without ripples. Run it again after moving the printer to a new table.',
    icon: 'pulse',
    action: 'Run',
    wait: Waits.onShaperCalibrate,
    confirm: () => "It homes, then shakes the toolhead to measure how the printer rings. It's loud for a few minutes."
  },
  {
    id: 'pid',
    title: 'Heater tuning',
    description: 'Keeps the nozzle steady at its temperature.',
    icon: 'thermometer',
    action: 'Run',
    wait: Waits.onPidCalibrate,
    confirm: (nozzle, gcode) => gcode.startsWith('PID_CALIBRATE')
      ? `It heats the nozzle to ${nozzle}°C and lets it cool a few times. Don't touch the nozzle while it runs.`
      : "It heats the nozzle and lets it cool a few times, the printer's own way. Don't touch the nozzle while it runs."
  }
]

/**
 * Maintenance's state: each check, when it last ran here and whether it's
 * due, running one, and the bed mesh. A run counts once Klipper has its
 * result (a new mesh, or a setting waiting to be saved), so a check stopped
 * halfway isn't recorded as done.
 */
@Component({})
export default class MaintenanceMixin extends Mixins(ControlMixin) {
  get gcodeCommands (): Record<string, unknown> {
    return (this.$store.state.printer.printer.gcode?.commands as Record<string, unknown> | undefined) ??
      (this.$store.getters['printer/getAvailableCommands'] as Record<string, unknown>) ?? {}
  }

  get lastRun (): Record<string, number> {
    return this.$store.state.config.uiSettings.maintenance?.lastRun ?? {}
  }

  /** The nozzle temperature heater tuning uses: the material set now, else PLA's, else 215°C. */
  get tuneTemperature (): number {
    const pla = this.materials.find(m => /^pla\b/i.test(m.name))
    return Math.round(this.material?.nozzle ?? pla?.nozzle ?? 215)
  }

  get checks (): CheckRow[] {
    const now = Date.now()
    const context = { commands: this.gcodeCommands, homed: this.allHomed, nozzleTarget: this.tuneTemperature }
    return CHECKS
      .map(info => ({
        id: info.id,
        title: info.title,
        description: info.description,
        icon: info.icon,
        action: info.action,
        wait: info.wait,
        status: checkStatus(info.id, this.lastRun[info.id], now),
        gcode: checkCommand(info.id, context),
        confirm: info.confirm(this.tuneTemperature, checkCommand(info.id, context) ?? '')
      }))
      .filter(row => row.gcode !== null)
  }

  get dueCount (): number {
    return this.checks.filter(c => c.status.due).length
  }

  /** The check running now: its wait is up, or the paper test is open. */
  get runningId (): CheckId | null {
    const row = this.checks.find(c => this.hasWait(c.wait))
    if (row) return row.id
    return this.isManualProbeActive ? 'firstLayer' : null
  }

  /** Why no check can start now, or '' when one can. */
  get checksBlocked (): string {
    if (!this.klippyReady) return 'The printer isn\'t ready.'
    if (this.printerPrinting || this.printerPaused) return 'Not while printing.'
    if (this.runningId) return 'Another check is running.'
    return ''
  }

  get evidence (): CheckEvidence {
    return {
      mesh: JSON.stringify(this.$store.state.printer.printer.bed_mesh?.probed_matrix ?? []),
      pending: (this.$store.getters['printer/getSaveConfigPendingItems'] as CheckEvidence['pending']) ?? {}
    }
  }

  async runCheck (row: CheckRow) {
    if (!row.gcode || this.checksBlocked) return
    const ok = await this.$confirm(row.confirm, { title: row.title, buttonTrueText: 'Start' })
    // Asked again: a print may have started from elsewhere while the question was open.
    if (!ok || this.checksBlocked) return
    running.check = { id: row.id, printer: activeSlug(), startedAt: Date.now(), before: this.evidence, homeFirst: /(^|\n)G28\b/.test(row.gcode) }
    this.sendGcode(row.gcode, row.wait)
  }

  /** Records the running check once Klipper has its result. */
  recordIfDone () {
    const check = running.check
    if (!check || check.printer !== activeSlug()) return
    if (!checkProduced(check.id, check.before, this.evidence)) return
    running.check = null
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.maintenance.lastRun',
      value: { ...this.lastRun, [check.id]: Date.now() },
      server: true
    })
  }

  get mesh (): number[][] {
    return (this.$store.state.printer.printer.bed_mesh?.probed_matrix as number[][] | undefined) ?? []
  }

  get meshSummary (): MeshSummary | null {
    return meshSummary(this.mesh)
  }

  /** Whether a mesh is loaded, so moves follow it. */
  get meshInUse (): boolean {
    return !!this.$store.state.printer.printer.bed_mesh?.profile_name
  }

  /** The mesh's points across and deep, from the printer's settings. */
  get meshSize (): [number, number] | null {
    const settings = this.$store.state.printer.printer.configfile?.settings?.bed_mesh
    return probeCount(settings?.probe_count) ??
      (this.mesh.length ? [this.mesh[0].length, this.mesh.length] : null)
  }

  get measuring (): boolean {
    return this.hasWait(Waits.onMeshCalibrate)
  }

  /**
   * The plate touches of the measurement under way: since Level the bed was
   * pressed here, or, for one the printer began by itself (a print's start,
   * a macro, the console), since the run of touches it is in began, while
   * the printer is still busy.
   */
  get probeTouches (): ProbeTouch[] {
    const entries = this.$store.state.console.console as ConsoleEntry[]
    const check = running.check
    if (this.measuring && check && check.id === 'bedMesh') {
      const since = Math.floor(check.startedAt / 1000) - 1
      return entries
        .filter(e => (e.time ?? 0) >= since)
        .map(e => parseProbeLine(e.message, e.time ?? 0))
        .filter((t): t is ProbeTouch => t !== null)
    }
    if (this.$store.state.printer.printer.idle_timeout?.state !== 'Printing') return []
    const touches: ProbeTouch[] = []
    for (let i = entries.length - 1; i >= 0; i--) {
      const touch = parseProbeLine(entries[i].message, entries[i].time ?? 0)
      if (!touch) continue
      if (touches.length && touches[0].time - touch.time > AUTO_GAP_S) break
      touches.unshift(touch)
    }
    const now = Date.now() / 1000
    return touches.length && now - touches[touches.length - 1].time <= AUTO_GAP_S ? touches : []
  }

  /** The bed measurement under way, or null: what it is doing, and the grid so far. */
  get meshRun (): MeshRun | null {
    const touches = this.probeTouches
    if (!this.measuring && !touches.some(t => t.kind === 'touch')) return null
    const points = meshPoints(touches)
    const settings = this.$store.state.printer.printer.configfile?.settings?.bed_mesh
    const plan = choosePlan(points, [
      planFrom(this.$store.state.printer.printer['gcode_macro _BED_MESH_PLAN']?.points),
      planFromSettings(settings?.mesh_min, settings?.mesh_max, probeCount(settings?.probe_count))
    ])
    const layout = meshLayout(plan ? plan.map(([x, y]) => ({ x, y })) : points)
    const bed = this.$store.state.printer.printer.heater_bed
    return {
      points,
      grid: liveGrid(points, layout),
      touches,
      progress: meshProgress({
        points,
        total: plan ? plan.length : null,
        homingTouches: homingTouches(touches),
        homedAtStart: !(running.check?.homeFirst ?? !this.allHomed),
        bed: bed ? { temperature: bed.temperature, target: bed.target } : null
      })
    }
  }

  /** Lifetime printing hours, from the print history. */
  get printHours (): number | null {
    if (!this.$store.getters['server/componentSupport']('history')) return null
    const seconds = this.$store.getters['history/getRollUp']?.total_print_time as number | undefined
    return seconds === undefined ? null : Math.round(seconds / 3600)
  }

  get saveConfigPending (): boolean {
    return this.$store.getters['printer/getSaveConfigPending'] as boolean
  }

  /** Why Save can't run now, or '' when it can: SAVE_CONFIG restarts Klipper, which ends a print, paused or not. */
  get saveBlocked (): string {
    if (this.printerPrinting || this.printerPaused) return 'Not while printing.'
    if (this.hasWait(this.$waits.onSaveConfig)) return 'Saving…'
    return ''
  }

  async saveResults () {
    if (this.saveBlocked) return
    const ok = await this.$confirm('Saving keeps the new results after a restart. Klipper restarts to save them, which takes a few seconds.', {
      title: 'Save the results?',
      buttonTrueText: 'Save and restart Klipper',
      buttonFalseText: 'Not now'
    })
    if (ok && !this.saveBlocked) this.sendGcode('SAVE_CONFIG', this.$waits.onSaveConfig)
  }
}
