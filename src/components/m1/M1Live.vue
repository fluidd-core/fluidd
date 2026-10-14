<template>
  <printer-stage
    class="m1-live"
    :class="{ 'm1-live--on': shown }"
    :state="state"
    data-tid="m1-live"
    :data-live="shown ? 'on' : 'off'"
  >
    <canvas
      v-if="live"
      ref="canvas"
      class="m1-live__canvas"
      :title="shown ? 'Drag to turn it; double-click to put it back' : undefined"
      aria-hidden="true"
    />
  </printer-stage>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import PrinterStage from '@/components/printers/PrinterStage.vue'
import { claimLiveView } from '@/services/m1-3d/live-slot'
import { modelPose, samePose, type ModelPose } from '@/services/m1-3d/pose'
import { partColour, segmentsDone, toolpathFrom, type Toolpath } from '@/services/m1-3d/toolpath'
import type { M1Viewer } from '@/services/m1-3d/viewer'
import type { ThumbState } from '@/components/ui/PrinterThumb.vue'
import type { Move } from '@/store/gcodePreview/types'
import { httpClientActions } from '@/api/httpClientActions'
import { cloudState } from '@/services/muon-cloud/state'

/** The biggest file the stage fetches by itself to draw the print: most prints, not a day-long one. */
const AUTO_LOAD_BYTES = 16 * 1024 * 1024

/** Whether this browser can draw WebGL at all, asked once. */
let webgl: boolean | null = null
function canDrawWebgl (): boolean {
  if (webgl === null) {
    try {
      const c = document.createElement('canvas')
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      webgl = false
    }
  }
  return webgl
}

/**
 * The M1 on its stage, live: the photoreal model with the head and the bed
 * where the printer says they are, the chamber light as it is, the print's
 * progress on the base's screen, and the part itself hanging under the
 * plate, drawn from its G-code as far as the printer has got.
 *
 * The part comes from Fluidd's G-code preview. While printing, the stage
 * loads the job's file into it when the printer is on this network and
 * the file is under 16 MB; through Muon3D it draws the part only once the
 * preview holds it. The product shot shows until the
 * model has drawn, and stays when the browser can't draw it, when another
 * live M1 is on screen, or while this one is scrolled away.
 */
@Component({ components: { PrinterStage } })
export default class M1Live extends Mixins(ControlMixin) {
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
  giveBack: (() => void) | null = null
  visible = false
  observer: IntersectionObserver | null = null
  lastPose: ModelPose | null = null

  /** The print drawn, built from the preview once per file; frozen, so Vue leaves it alone. */
  printPath: Readonly<Toolpath> | null = null
  printPathFor = ''
  loadingFor = ''

  get pose (): ModelPose {
    return modelPose({
      position: this.position,
      homed: this.homedAxes,
      lights: this.hasLights && this.lightsValue > 0,
      progress: (this.$store.getters['printer/getPrintProgress'] as number) * 100
    })
  }

  mounted () {
    if (!canDrawWebgl() || typeof IntersectionObserver === 'undefined') return
    this.observer = new IntersectionObserver(entries => {
      this.visible = entries.some(e => e.isIntersecting)
      this.wake()
    })
    this.observer.observe(this.$el)
    document.addEventListener('visibilitychange', this.wake)
  }

  beforeDestroy () {
    this.observer?.disconnect()
    document.removeEventListener('visibilitychange', this.wake)
    this.stop()
  }

  /**
   * Starts the live M1 when it can show (on screen, the printer there), or
   * brings it up to date: a hidden tab skips the printer's changes, so
   * coming back to it draws the pose as it is now.
   */
  wake () {
    if (!this.visible || this.state === 'offline' || document.hidden) return
    if (!this.live) this.start()
    else this.push()
  }

  async start () {
    this.live = true
    this.giveBack = claimLiveView(() => this.stop())
    try {
      const { createViewer } = await import('@/services/m1-3d/viewer')
      await this.$nextTick()
      const canvas = this.$refs.canvas as HTMLCanvasElement | undefined
      if (!this.live || !canvas) return
      const viewer = createViewer(canvas)
      viewer.onFrame = () => {
        this.shown = true
        viewer.onFrame = null
      }
      viewer.setShift(this.shift)
      this.viewer = viewer
      this.lastPose = null
      this.push()
      this.onPrintFile()
    } catch (e) {
      console.warn('[m1] the live M1 could not start; showing its picture', e)
      this.stop()
    }
  }

  stop () {
    this.viewer?.dispose()
    this.viewer = null
    this.live = false
    this.shown = false
    this.giveBack?.()
    this.giveBack = null
  }

  /** Sends the printer's pose to the model, when it shows and has changed. */
  push () {
    if (!this.viewer || !this.visible || document.hidden) return
    const pose = this.pose
    if (samePose(this.lastPose, pose)) return
    this.lastPose = pose
    this.viewer.setPose(pose)
  }

  @Watch('pose')
  onPose () {
    this.push()
  }

  // -- the print -------------------------------------------------------------

  /** The job's file, from the G-code root, while one is printing or paused. */
  get jobPath (): string {
    if (!this.printerPrinting && !this.printerPaused) return ''
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
      this.printPathFor = ''
    } else if (this.previewPath === this.jobPath && this.printPathFor !== this.jobPath) {
      const moves = this.$store.getters['gcodePreview/getMoves'] as Move[]
      this.printPath = Object.freeze(toolpathFrom(moves))
      this.printPathFor = this.jobPath
    } else if (this.previewPath !== this.jobPath) {
      this.loadJob()
    }
    this.drawPrint()
  }

  /** Fetches the job's file into the preview, quietly: on this network, a file under 16 MB, nothing parsing. */
  async loadJob () {
    const file = this.$store.state.printer.printer.current_file as { filename?: string, path?: string, size?: number } | undefined
    const job = this.jobPath
    if (!this.live || !job || this.loadingFor === job || cloudState.activePrinterId) return
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

  drawPrint () {
    if (!this.viewer) return
    const metadata = this.$store.state.printer.printer.current_file as Record<string, unknown> | undefined
    this.viewer.setPrint(this.printPath, partColour(metadata?.filament_colors ?? metadata?.filament_colour))
    this.onFilePosition()
  }

  @Watch('filePosition')
  onFilePosition () {
    if (this.viewer && this.printPath) this.viewer.setPrintDone(segmentsDone(this.printPath, this.filePosition))
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
  .m1-live__canvas {
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
    .m1-live__canvas {
      opacity: 1;
    }

    :deep(.printer-stage__m1) {
      opacity: 0;
      transition: opacity 0.4s ease;
    }
  }
</style>
