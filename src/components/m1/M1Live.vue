<template>
  <printer-stage
    class="m1-live"
    :class="{ 'm1-live--on': shown }"
    :state="state"
    data-tid="m1-live"
    :data-live="shown ? 'on' : 'off'"
  >
    <div
      v-if="live"
      ref="slot"
      class="m1-live__slot"
      :title="shown ? 'Drag to turn it; double-click to put it back' : undefined"
      aria-hidden="true"
    />
  </printer-stage>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import PrinterStage from '@/components/printers/PrinterStage.vue'
import { Waits } from '@/globals'
import { claimLiveView } from '@/services/m1-3d/live-slot'
import { built, canDrawWebgl, loadViewer, newCanvas, park, prebuild, takeParked } from '@/services/m1-3d/parked'
import { liveSyncFor, type LiveSync } from '@/services/m1-3d/live-sync'
import { plateTaps, screenFrom, type LedStrip, type PlateTap, type ScreenState } from '@/services/m1-3d/live-state'
import { motionPathFrom, type MotionPath } from '@/services/m1-3d/motion'
import { modelPose, samePose, type ModelPose } from '@/services/m1-3d/pose'
import { partColour, segmentsDone, toolpathFrom, type Toolpath } from '@/services/m1-3d/toolpath'
import type { M1Viewer } from '@/services/m1-3d/viewer'
import type { ThumbState } from '@/components/ui/PrinterThumb.vue'
import type { Move } from '@/store/gcodePreview/types'
import { httpClientActions } from '@/api/httpClientActions'
import { cloudState } from '@/services/muon-cloud/state'
import { activeSlug } from '@/services/printer-pages'
import { ACTIVE_PHASES } from '@/services/updates/model'
import { updateWatch } from '@/services/updates/watch'
import { afterFirstPaint } from '@/services/startup/idle'

/** The biggest file the stage fetches by itself to draw the print: most prints, not a day-long one. */
const AUTO_LOAD_BYTES = 16 * 1024 * 1024
/** Past this many moves the head isn't followed along the file (the path would cost a phone too much); the part is still drawn. */
const MAX_FOLLOWED_MOVES = 2_000_000
/** Marks of the plate's touches stay this long after the printer stops touching it. */
const TAP_LINGER_MS = 60_000
/** A print's part stays drawn in these states too: it is still on the plate. */
const PART_STATES = ['printing', 'paused', 'complete', 'cancelled', 'error']

/**
 * The M1 on its stage, live: the photoreal model in step with the printer.
 * The head and the bed move as the printer's own motion reports say, four
 * times a second, and between reports as the file being printed (or the
 * way the head was going) says they must (live-sync.ts), so the model moves
 * smoothly and where the printer is. The part grows under the nozzle; a
 * purge or a macro's extrusion leaves its line; each touch of the plate
 * leaves a mark coloured by the height it found; the LED strips show their
 * pixels; and the base's screen shows what the printer's panel shows.
 *
 * The part comes from Fluidd's G-code preview. While printing, the stage
 * loads the job's file into it when the printer is on this network and
 * the file is under 16 MB; through Muon3D it draws the part only once the
 * preview holds it, and lays the part from the reports until then. The
 * product shot shows until the model has drawn, and stays when the browser
 * can't draw it, when another live M1 is on screen, or while this one is
 * scrolled away.
 */
@Component({ components: { PrinterStage } })
export default class M1Live extends Mixins(MaintenanceMixin) {
  @Prop({ type: String, default: 'idle' })
  readonly state!: ThumbState

  /** Moves the machine left by this share of the stage, to clear a card on the right. */
  @Prop({ type: Number, default: 0 })
  readonly shift!: number

  /** Whether this view holds the live M1 and has a canvas for it. */
  live = false
  /** Whether the model has drawn, so the picture can go. */
  shown = false

  viewer: M1Viewer | null = null
  canvas: HTMLCanvasElement | null = null
  giveBack: (() => void) | null = null
  visible = false
  observer: IntersectionObserver | null = null
  stopReports: (() => void) | null = null

  /** The print drawn, built from the preview once per file; frozen, so Vue leaves it alone. */
  printPath: Readonly<Toolpath> | null = null
  /** The same file as moves to follow the head along; frozen too. */
  motionPath: Readonly<MotionPath> | null = null
  printPathFor = ''
  loadingFor = ''

  /** The last pose and report passed on, so an unchanged one draws nothing. */
  lastPose: ModelPose | null = null
  lastReport = ''

  /** The marks on the plate, kept a while after the touching ends. */
  tapsShown: PlateTap[] = []
  tapsTimer = 0

  /** Set on destroy so an idle callback still owed does nothing (KAN-525). */
  gone = false
  /** Set once the view has been seen and the app has painted; nothing loads the viewer before. */
  armed = false

  /** This printer's sync, which outlives the view. Not data: Vue mustn't walk it. */
  sync (): LiveSync {
    return liveSyncFor(activeSlug() ?? (this.$store.state.config.apiUrl as string) ?? '')
  }

  get pose (): ModelPose {
    return modelPose({
      position: this.position,
      homed: this.homedAxes,
      lights: this.hasLights && this.lightsValue > 0,
      progress: (this.$store.getters['printer/getPrintProgress'] as number) * 100
    })
  }

  get printState (): string {
    return (this.$store.state.printer.printer.print_stats?.state as string | undefined) ?? ''
  }

  mounted () {
    this.sync().setPose(this.pose)
    this.stopReports = this.$store.subscribeAction({
      after: action => {
        if (action.type === 'printer/onFastNotifyStatusUpdate' && action.payload?.key === 'motion_report') this.report()
      }
    })
    if (typeof IntersectionObserver === 'undefined') return
    // The observer is cheap and starts at once; the viewer build waits for
    // the view's first intersect AND the app's first paint — building it
    // earlier cost seconds on the frame the overview first draws (KAN-525).
    // canDrawWebgl is part of that cost too: it makes a WebGL context, and
    // that stalls the frame it runs in, so it waits here as well.
    this.observer = new IntersectionObserver(entries => {
      this.visible = entries.some(e => e.isIntersecting)
      if (this.visible && !this.armed) {
        afterFirstPaint(() => {
          if (this.gone || !canDrawWebgl()) return
          this.armed = true
          prebuild()
          this.wake()
        })
      }
      this.wake()
    })
    this.observer.observe(this.$el)
    document.addEventListener('visibilitychange', this.wake)
  }

  beforeDestroy () {
    this.gone = true
    this.stopReports?.()
    this.observer?.disconnect()
    document.removeEventListener('visibilitychange', this.wake)
    clearTimeout(this.tapsTimer)
    this.stop()
  }

  /** Starts the live M1 when it can show (on screen, the printer there), and draws only while it shows. */
  wake () {
    if (!this.armed) return
    const showing = this.visible && this.state !== 'offline' && !document.hidden
    this.viewer?.setActive(showing)
    if (showing && !this.live) this.start()
  }

  async start () {
    if (!this.armed) return
    this.live = true
    this.giveBack = claimLiveView(() => this.stop())
    try {
      await built()
      let held = takeParked()
      if (!held) {
        const { createViewer } = await loadViewer()
        await this.$nextTick()
        if (!this.live || !this.$refs.slot) return
        const canvas = newCanvas()
        ;(this.$refs.slot as HTMLElement).appendChild(canvas)
        held = { viewer: createViewer(canvas), canvas }
      } else {
        await this.$nextTick()
        const slot = this.$refs.slot as HTMLElement | undefined
        if (!this.live || !slot) {
          park(held)
          return
        }
        slot.appendChild(held.canvas)
      }
      const { viewer, canvas } = held
      this.canvas = canvas
      viewer.setActive(true)
      viewer.restyle()
      viewer.onFrame = () => {
        this.shown = true
        viewer.onFrame = null
      }
      viewer.setShift(this.shift)
      this.viewer = viewer
      this.sync().setPose(this.pose)
      this.lastReport = ''
      this.report()
      viewer.follow(this.sync())
      this.onPrintFile()
      this.onScreen(this.screen)
      this.onLeds()
      viewer.setTaps(this.tapsShown)
    } catch (e) {
      console.warn('[m1] the live M1 could not start; showing its picture', e)
      this.stop()
    }
  }

  /** Lets the live M1 go, parking it for the next view. */
  stop () {
    const viewer = this.viewer
    const canvas = this.canvas
    this.viewer = null
    this.canvas = null
    this.live = false
    this.shown = false
    this.giveBack?.()
    this.giveBack = null
    if (viewer && canvas) park({ viewer, canvas })
  }

  // -- where the head and the bed are ----------------------------------------

  @Watch('pose')
  onPose (pose: ModelPose) {
    if (samePose(this.lastPose, pose)) return
    this.lastPose = pose
    this.sync().setPose(pose)
    this.viewer?.wake()
  }

  /** A motion report: where the head is now, how fast it and the filament are going. */
  report () {
    const printer = this.$store.state.printer.printer
    const motion = printer.motion_report
    const live = motion?.live_position as number[] | undefined
    if (!Array.isArray(live) || live.length < 3) return
    const velocity = (motion.live_velocity as number | undefined) ?? 0
    const extruderVelocity = (motion.live_extruder_velocity as number | undefined) ?? 0
    const key = `${live[0]},${live[1]},${live[2]},${velocity},${extruderVelocity}`
    if (key === this.lastReport) return
    this.lastReport = key
    const end = printer.toolhead?.position as number[] | undefined
    this.sync().observe({
      at: performance.now(),
      live: [live[0], live[1], live[2]],
      velocity,
      extruderVelocity,
      target: Array.isArray(end) && end.length >= 3 ? [end[0], end[1], end[2]] : [live[0], live[1], live[2]],
      speedFactor: (printer.gcode_move?.speed_factor as number | undefined) ?? 1,
      filePosition: this.printState === 'printing' ? (printer.virtual_sdcard?.file_position as number | undefined) ?? null : null
    })
    this.viewer?.wake()
  }

  // -- the print -------------------------------------------------------------

  /** The job's file, from the G-code root, while its part is on the plate. */
  get jobPath (): string {
    if (!PART_STATES.includes(this.printState)) return ''
    return (this.$store.state.printer.printer.print_stats?.filename as string | undefined) ?? ''
  }

  /** The file Fluidd's G-code preview holds, parsed. */
  get previewPath (): string {
    if (this.$store.state.gcodePreview.parserWorker) return ''
    const file = this.$store.getters['gcodePreview/getFile'] as { filename: string, path?: string } | undefined
    if (!file) return ''
    return file.path ? `${file.path}/${file.filename}` : file.filename
  }

  get filePosition (): number {
    return (this.$store.state.printer.printer.virtual_sdcard?.file_position as number | undefined) ?? 0
  }

  /** Builds the job's print once the preview holds its file, and asks for the file when it can. */
  @Watch('jobPath', { immediate: true })
  @Watch('previewPath')
  onPrintFile () {
    if (!this.jobPath) {
      this.printPath = null
      this.motionPath = null
      this.printPathFor = ''
    } else if (this.previewPath === this.jobPath && this.printPathFor !== this.jobPath) {
      const moves = this.$store.getters['gcodePreview/getMoves'] as Move[]
      this.printPath = Object.freeze(toolpathFrom(moves))
      this.motionPath = moves.length <= MAX_FOLLOWED_MOVES ? Object.freeze(motionPathFrom(moves)) : null
      this.printPathFor = this.jobPath
    } else if (this.previewPath !== this.jobPath) {
      this.loadJob()
    }
    this.drawPrint()
  }

  /**
   * Fetches the job's file into the preview, quietly: while it prints, on
   * this network, a file under 16 MB, nothing parsing. A finished part is
   * drawn only from a preview that already holds it, so opening the
   * overview after a print doesn't download the file again.
   */
  async loadJob () {
    const file = this.$store.state.printer.printer.current_file as { filename?: string, path?: string, size?: number } | undefined
    const job = this.jobPath
    if (!this.live || !job || this.loadingFor === job || cloudState.activePrinterId) return
    if (this.printState !== 'printing' && this.printState !== 'paused') return
    if (this.$store.state.gcodePreview.parserWorker || !file?.filename || !file.size || file.size > AUTO_LOAD_BYTES) return
    this.loadingFor = job
    try {
      const response = await httpClientActions.serverFilesGet<string>(`gcodes/${job}`, { responseType: 'text', transformResponse: [v => v] })
      if (this.jobPath !== job || !response?.data) return
      // Asked again after the download: another preview may have begun
      // parsing meanwhile (onPrintFile tries again when it ends), or the
      // preview may hold this file already.
      if (this.$store.state.gcodePreview.parserWorker || this.previewPath === job) return
      const appFile = { ...file, path: file.path ?? job.split('/').slice(0, -1).join('/') }
      this.$store.dispatch('gcodePreview/loadGcode', { file: appFile, gcode: response.data })
    } catch (e) {
      console.warn('[m1] the print could not be fetched; the stage goes on without it', e)
    } finally {
      // Only a request in flight holds the job back; a failed or stale one lets the next try go.
      if (this.loadingFor === job) this.loadingFor = ''
    }
  }

  /** The job's file once its metadata has come: a print that starts gets it a moment after its name. */
  get jobFileKnown (): string {
    const file = this.$store.state.printer.printer.current_file as { filename?: string, size?: number } | undefined
    return file?.filename && file.size ? `${file.filename}:${file.size}` : ''
  }

  @Watch('jobFileKnown')
  onJobFileKnown (known: string) {
    if (known) this.onPrintFile()
  }

  /**
   * The filament's colour: the one set for what's loaded (Overview, Control
   * or the slicer, kept on the printer as muon_material_color), since that is
   * what is in the nozzle; else the file's slicer settings.
   */
  get partColour (): number {
    if (this.loadedColour) return parseInt(this.loadedColour.slice(1), 16)
    const metadata = this.$store.state.printer.printer.current_file as Record<string, unknown> | undefined
    return partColour(metadata?.filament_colors ?? metadata?.filament_colour)
  }

  @Watch('partColour')
  onPartColour () {
    this.drawPrint()
  }

  drawPrint () {
    // A finished print is followed no longer: all of it is on the plate.
    this.sync().setPath(this.printState === 'complete' ? null : this.motionPath)
    this.onFilePosition()
    this.viewer?.setPrint(this.printPath, this.partColour)
  }

  @Watch('filePosition')
  onFilePosition () {
    this.sync().setFileDone(this.printPath ? segmentsDone(this.printPath, this.filePosition) : 0)
    this.viewer?.wake()
  }

  /** A new print clears what the last one left on the plate; a resume doesn't. */
  @Watch('printState')
  onPrintState (now: string, before: string) {
    if (now === 'printing' && before !== 'paused') this.sync().trace.clear()
    this.drawPrint()
  }

  // -- the screen, the strips and the plate's touches -------------------------

  get screen (): ScreenState {
    const printer = this.$store.state.printer.printer
    const phase = this.meshRun?.progress.phase
    const remembered = updateWatch.remembered
    return screenFrom({
      printState: this.printState,
      updating: !!remembered && ACTIVE_PHASES.includes(remembered.phase),
      homing: this.hasWait([Waits.onHomeAll, Waits.onHomeXY, Waits.onHomeX, Waits.onHomeY, Waits.onHomeZ]) || phase === 'homing',
      probing: this.measuring || phase === 'measuring',
      progress: this.$store.getters['printer/getPrintProgress'] as number,
      nozzle: printer.extruder ?? null,
      bed: printer.heater_bed ?? null,
      filename: (printer.print_stats?.filename as string | undefined) ?? '',
      connected: !!this.$store.state.socket.open
    })
  }

  @Watch('screen')
  onScreen (screen: ScreenState) {
    this.viewer?.setScreen(screen)
  }

  /** The strips' pixels: Klipper's color_data for the M1's two neopixel chains. */
  get leds (): [LedStrip, LedStrip] {
    const printer = this.$store.state.printer.printer
    const strip = (name: string) => (printer[`neopixel ${name}`]?.color_data as number[][] | undefined) ?? null
    return [strip('Left'), strip('Right')]
  }

  @Watch('leds')
  onLeds () {
    this.viewer?.setLeds(...this.leds)
  }

  get liveTaps (): PlateTap[] {
    return plateTaps(this.probeTouches)
  }

  /** Shows the touches as they come, and keeps the last for a while once they stop. */
  @Watch('liveTaps')
  onLiveTaps (taps: PlateTap[]) {
    clearTimeout(this.tapsTimer)
    if (taps.length) {
      this.tapsShown = taps
      this.viewer?.setTaps(taps)
    } else if (this.tapsShown.length) {
      this.tapsTimer = window.setTimeout(() => {
        this.tapsShown = []
        this.viewer?.setTaps([])
      }, TAP_LINGER_MS)
    }
  }

  get dark (): boolean {
    return this.$vuetify.theme.dark
  }

  /** The stage takes the theme's colours. */
  @Watch('dark')
  async onDark () {
    await this.$nextTick()
    this.viewer?.restyle()
  }

  @Watch('shift')
  onShift (share: number) {
    this.viewer?.setShift(share)
  }

  @Watch('state')
  onState (state: ThumbState) {
    if (state === 'offline') this.stop()
    else this.wake()
  }
}
</script>

<style lang="scss" scoped>
  .m1-live__slot {
    position: absolute;
    inset: 0;
  }

  /* The canvas is made in code (and kept between views), so it has no scope of its own. */
  .m1-live :deep(.m1-live__canvas) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.4s ease;
    cursor: grab;
    touch-action: pan-y;

    &:active {
      cursor: grabbing;
    }
  }

  .m1-live--on {
    :deep(.m1-live__canvas) {
      opacity: 1;
    }

    :deep(.printer-stage__m1) {
      opacity: 0;
      transition: opacity 0.4s ease;
    }
  }
</style>
