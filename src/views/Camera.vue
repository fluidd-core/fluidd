<template>
  <div
    class="camera-page"
    data-tid="camera-page"
    @keydown.esc="closeDetails"
  >
    <div
      v-if="camera"
      ref="detailsBar"
      class="camera-details-bar"
    >
      <button
        ref="detailsTrigger"
        type="button"
        class="camera-details-trigger"
        data-tid="camera-details-trigger"
        :aria-expanded="detailsOpen ? 'true' : 'false'"
        aria-controls="camera-details"
        @click="toggleDetails"
      >
        Stream info
      </button>
      <dl
        v-show="detailsOpen"
        id="camera-details"
        ref="detailsPanel"
        class="camera-details"
        tabindex="-1"
        aria-label="Stream information"
      >
        <div><dt>Service</dt><dd>{{ detail(camera.service) }}</dd></div>
        <div><dt>Stream</dt><dd>{{ displayUrl(camera.stream_url) }}</dd></div>
        <div><dt>Snapshot</dt><dd>{{ displayUrl(camera.snapshot_url) }}</dd></div>
        <div><dt>Frame rate</dt><dd>{{ frameRate }}</dd></div>
        <div><dt>Turned</dt><dd>{{ turnedText }}</dd></div>
      </dl>
    </div>

    <div
      v-if="camera"
      ref="stage"
      class="camera-stage"
      data-tid="camera-stage"
    >
      <camera-item
        ref="item"
        :key="camera.uid"
        :camera="camera"
        fullscreen
        class="camera-stage__item"
      />

      <div
        class="camera-stage__live"
        data-tid="camera-live"
      >
        <span class="camera-stage__dot" />
        <strong>Live</strong>
        <span v-if="facts && !isMobileViewport">{{ facts }}</span>
      </div>

      <div
        v-if="hasLights || timelapseSupported"
        class="camera-stage__side"
      >
        <button
          v-if="hasLights"
          type="button"
          class="camera-stage__chip"
          :aria-pressed="lightsOn ? 'true' : 'false'"
          data-tid="camera-lights"
          @click="setLights(!lightsOn)"
        >
          <frame-icon
            name="bulb"
            small
          />
          {{ lightsOn ? 'Lights on' : 'Lights off' }}
        </button>
        <span
          v-if="timelapseSupported"
          class="camera-stage__chip camera-stage__chip--still"
        >
          Timelapse: {{ timelapseOn ? 'on' : 'off' }}
        </span>
      </div>
    </div>

    <div
      v-else
      class="camera-empty"
    >
      <frame-icon name="camera" />
      <p>This printer has no camera set up.</p>
      <router-link
        :to="addTo"
        class="cbtn"
      >
        Add a camera
      </router-link>
    </div>

    <template v-if="camera && isMobileViewport">
      <p
        v-if="facts"
        class="camera-phone-facts"
      >
        {{ facts }}
      </p>
      <camera-actions class="camera-phone-actions" />
    </template>

    <p
      v-if="camera"
      class="camera-notes"
    >
      <span>
        <template v-if="timelapseSupported">
          Timelapses of finished prints are in
          <router-link :to="timelapseTo">Jobs › Timelapse</router-link>.
        </template>
      </span>
      <span
        v-if="hasLights && !lightsOn"
        class="camera-notes__aside"
      >Lights off makes the picture dark</span>
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import OverviewMixin from '@/mixins/overview'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'
import CameraActions from '@/components/camera/CameraActions.vue'
import { jobTitle } from '@/services/jobs/model'
import { EventBus } from '@/eventBus'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { cameraFor, liveFacts, snapshotName, snapshotPlan } from '@/services/camera/model'
import type { WebcamConfig } from '@/store/webcams/types'

/**
 * Camera (`/boxwood-367a/camera/front`): the picture as big as the page
 * allows, with what's printing over it and the lights beside it. Snapshot
 * saves a frame; Full screen (F) fills the screen. Stream info opens beside
 * the picture without exposing credentials carried in its addresses.
 */
@Component({ components: { CameraActions, CameraItem } })
export default class Camera extends Mixins(OverviewMixin, BrowserMixin) {
  detailsOpen = false

  get cameras (): WebcamConfig[] {
    return this.$store.getters['webcams/getEnabledWebcams'] as WebcamConfig[]
  }

  get camera (): WebcamConfig | null {
    return cameraFor(this.cameras, this.$route.params.cameraId)
  }

  get facts (): string {
    return liveFacts({
      printing: this.printerPrinting,
      paused: this.printerPaused,
      name: this.jobFile ? jobTitle(this.jobFile) : '',
      progress: this.progress,
      layer: this.layer,
      layers: this.layers,
      left: this.leftText
    })
  }

  get lightsOn (): boolean {
    return this.lightsValue > 0
  }

  get timelapseSupported (): boolean {
    return this.$store.getters['server/componentSupport']('timelapse') as boolean
  }

  get timelapseOn (): boolean {
    return !!this.$store.state.timelapse?.settings?.enabled
  }

  get timelapseTo (): string {
    return scopedPath('/timelapse', activeSlug())
  }

  get addTo (): string {
    return `${scopedPath('/settings', activeSlug())}#camera`
  }

  get turnedText (): string {
    const camera = this.camera
    if (!camera || (camera.rotation == null && camera.flip_horizontal == null && camera.flip_vertical == null)) return 'Unknown'
    const parts: string[] = []
    if (camera.rotation) parts.push(`${camera.rotation}°`)
    if (camera.flip_horizontal) parts.push('flipped across')
    if (camera.flip_vertical) parts.push('flipped up and down')
    return parts.join(', ') || 'Not turned'
  }

  get frameRate (): string {
    const camera = this.camera
    if (!camera || camera.target_fps == null) return 'Unknown'
    const idle = camera.target_fps_idle == null ? 'unknown' : camera.target_fps_idle
    return `${camera.target_fps} fps, ${idle} idle`
  }

  detail (value: unknown): string {
    if (value == null || String(value).trim() === '') return 'Unknown'
    return String(value)
  }

  displayUrl (value: string | undefined): string {
    return value ? redactCameraUrl(value) : 'Unknown'
  }

  toggleDetails () {
    if (this.detailsOpen) this.closeDetails()
    else {
      this.detailsOpen = true
      this.$nextTick(() => (this.$refs.detailsPanel as HTMLElement | undefined)?.focus())
    }
  }

  closeDetails () {
    if (!this.detailsOpen) return
    const panel = this.$refs.detailsPanel as HTMLElement | undefined
    const restoreFocus = !!panel?.contains(document.activeElement)
    this.detailsOpen = false
    if (restoreFocus) {
      this.$nextTick(() => (this.$refs.detailsTrigger as HTMLButtonElement | undefined)?.focus())
    }
  }

  mounted () {
    EventBus.bus.$on('camera-snapshot', this.snapshot)
    EventBus.bus.$on('camera-fullscreen', this.fillScreen)
    document.addEventListener('click', this.onDocumentClick)
  }

  beforeDestroy () {
    EventBus.bus.$off('camera-snapshot', this.snapshot)
    EventBus.bus.$off('camera-fullscreen', this.fillScreen)
    document.removeEventListener('click', this.onDocumentClick)
  }

  onDocumentClick (event: MouseEvent) {
    const bar = this.$refs.detailsBar as HTMLElement | undefined
    if (!this.detailsOpen || (event.target instanceof Node && bar?.contains(event.target))) return
    this.closeDetails()
  }

  fillScreen () {
    const stage = this.$refs.stage as HTMLElement | undefined
    if (!stage) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else stage.requestFullscreen?.().catch(() => {})
  }

  /**
   * Saves the frame on screen as a JPEG. A camera on another address that
   * doesn't allow it can't be drawn; then its own snapshot address opens,
   * or the page says it can't.
   */
  async snapshot () {
    const camera = this.camera
    if (!camera) return
    const item = this.$refs.item as (CameraItem & { componentInstance?: { streamingElement?: Element } }) | undefined
    const element = item?.componentInstance?.streamingElement
    const name = snapshotName(this.printerName, camera.name ?? 'camera', new Date())
    try {
      const blob = await frameOf(element, { rotation: camera.rotation, flipX: camera.flip_horizontal, flipY: camera.flip_vertical })
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = name
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
        return
      }
    } catch {
      // A frame from another address that doesn't allow it: fall through.
    }
    if (camera.snapshot_url) {
      window.open(new URL(camera.snapshot_url, document.URL).toString(), '_blank', 'noopener')
    } else {
      EventBus.$emit("This camera's picture can't be saved from here.", { type: 'warning', timeout: 5000 })
    }
  }
}

/** Camera addresses may embed basic-auth credentials or arbitrary signed query values. */
export function redactCameraUrl (value: string): string {
  try {
    const absolute = /^[a-z][a-z\d+.-]*:/i.test(value)
    const url = new URL(value, document.URL)
    url.username = ''
    url.password = ''
    const keys = Array.from(url.searchParams.keys())
    for (const key of keys) url.searchParams.set(key, '[redacted]')
    url.hash = ''
    const shown = absolute ? url.toString() : `${url.pathname}${url.search}`
    return shown.replace(/%5Bredacted%5D/g, '[redacted]')
  } catch {
    return 'Unknown'
  }
}

/** The frame an image or video shows now, turned as the page turns it, as a JPEG; null when it isn't one. */
function frameOf (element: Element | undefined, turn: Parameters<typeof snapshotPlan>[2]): Promise<Blob | null> {
  let width = 0
  let height = 0
  if (element instanceof HTMLImageElement) {
    width = element.naturalWidth
    height = element.naturalHeight
  } else if (element instanceof HTMLVideoElement) {
    width = element.videoWidth
    height = element.videoHeight
  }
  if (!element || !width || !height) return Promise.resolve(null)
  const plan = snapshotPlan(width, height, turn)
  const canvas = document.createElement('canvas')
  canvas.width = plan.width
  canvas.height = plan.height
  const context = canvas.getContext('2d')
  if (context) {
    for (const [op, a, b] of plan.steps) {
      if (op === 'translate') context.translate(a, b as number)
      else if (op === 'scale') context.scale(a, b as number)
      else context.rotate(a)
    }
    context.drawImage(element as HTMLImageElement | HTMLVideoElement, -width / 2, -height / 2, width, height)
  }
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92)
    } catch (e) {
      reject(e)
    }
  })
}
</script>

<style lang="scss" scoped>
  .camera-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .camera-stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .camera-details-bar {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 32px;
  }

  .camera-details-trigger {
    padding: 6px 12px;
    border: 1px solid var(--m3d-border, currentColor);
    border-radius: 10px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    font: inherit;
    cursor: pointer;
  }

  .camera-details {
    position: absolute;
    z-index: 5;
    top: calc(100% + 6px);
    right: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(160px, 1fr));
    gap: 12px;
    width: min(520px, calc(100vw - 32px));
    margin: 0;
    padding: 16px 20px;
    border-radius: 18px;
    background: var(--m3d-surface);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);

    dt {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }

    dd {
      margin: 2px 0 0;
      font-family: var(--m3d-font-mono, monospace);
      font-size: 12px;
      word-break: break-all;
    }
  }

  .camera-stage:fullscreen {
    border-radius: 0;
    background: #000;
  }

  .camera-stage__item {
    width: 100%;
    background: transparent !important;

    // The page's camera tabs provide its name; this page offers stream details.
    :deep(.camera-name),
    :deep(.camera-frames),
    :deep(.camera-fullscreen) {
      display: none;
    }

    :deep(.camera-image) {
      max-height: calc(100vh - 260px);
      margin: 0 auto;
    }
  }

  .camera-stage:fullscreen .camera-stage__item :deep(.camera-image) {
    max-height: 100vh;
  }

  .camera-stage__live,
  .camera-stage__side {
    position: absolute;
    top: 14px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    max-width: calc(100% - 28px);
    padding: 8px 14px;
    border-radius: 14px;
    background: rgba(20, 22, 24, 0.72);
    backdrop-filter: blur(10px);
    color: #fff;
    font-size: 13px;
  }

  .camera-stage__live {
    left: 14px;

    span:last-child:not(.camera-stage__dot) {
      color: rgba(255, 255, 255, 0.78);
    }
  }

  .camera-stage__side {
    right: 14px;
    padding: 4px;
  }

  .camera-stage__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--m3d-danger, #ef4444);
  }

  .camera-stage__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .camera-stage__chip--still {
    cursor: default;

    &:hover {
      background: transparent;
    }
  }

  .camera-phone-facts {
    margin: 0;
    font-size: 14px;
  }

  .camera-phone-actions :deep(.cbtn) {
    flex: 1 1 0;
  }

  .camera-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 64px 16px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);
    text-align: center;

    p {
      margin: 0;
    }
  }

  .camera-notes {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 6px 16px;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;

    a {
      color: var(--m3d-accent) !important;
    }
  }

  .camera-notes__aside {
    color: var(--m3d-text-subtle);
  }

  @media (max-width: 600px) {
    .camera-details {
      grid-template-columns: 1fr;
    }
  }
</style>
