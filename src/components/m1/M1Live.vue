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
import type { M1Viewer } from '@/services/m1-3d/viewer'
import type { ThumbState } from '@/components/ui/PrinterThumb.vue'

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
 * where the printer says they are, the chamber light as it is, and the
 * print's progress on the base's screen. The product shot shows until the
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

  get pose (): ModelPose {
    return modelPose({
      position: this.position,
      axisMin: this.axisMin,
      axisMax: this.axisMax,
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
