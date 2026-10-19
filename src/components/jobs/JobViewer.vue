<template>
  <aside
    class="jv"
    data-tid="job-viewer"
  >
    <div class="jv__head">
      <h2>G-code viewer</h2>
      <span class="jv__grow" />
      <button
        v-if="job"
        type="button"
        class="jv__link"
        data-tid="job-viewer-details"
        @click="$emit('open', job)"
      >
        Details
      </button>
    </div>
    <p
      v-if="job"
      class="jv__file"
      :title="job.path"
    >
      {{ job.filename }}
    </p>

    <div class="jv__body">
      <div class="jv__stage">
        <p
          v-if="!job"
          class="jv__empty"
        >
          Pick a file to see its layers.
        </p>
        <gcode-preview
          v-else-if="loadedHere"
          class="jv__preview"
          :layer="layer"
          :disabled="false"
          bare
          @cancelObject="cancelObject"
        />
        <div
          v-else-if="parsingHere || downloading"
          class="jv__busy"
        >
          <v-progress-circular
            :value="parsingHere ? parserProgress : undefined"
            :indeterminate="!parsingHere"
            size="40"
            width="3"
            color="primary"
          />
          <span>{{ parsingHere ? `Reading the G-code… ${Math.round(parserProgress)}%` : `Fetching ${size} from ${printerName}…` }}</span>
          <button
            v-if="parsingHere"
            type="button"
            class="jv__link"
            @click="cancel"
          >
            Stop
          </button>
        </div>
        <template v-else>
          <img
            v-if="job.thumbnail"
            :src="job.thumbnail"
            alt=""
            class="jv__picture"
          >
          <div class="jv__load">
            <button
              type="button"
              class="cbtn"
              data-tid="job-viewer-load"
              @click="load"
            >
              Show the layers · {{ size }}
            </button>
            <span
              v-if="error"
              class="jv__error"
            >{{ error }}</span>
          </div>
        </template>
      </div>
      <div class="jv__side">
        <template v-if="loadedHere">
          <range-slider
            :value="layer"
            :min="0"
            :max="Math.max(0, layerCount - 1)"
            label="Layer"
            :value-text-formatter="layerValueText"
            @change="setLayer"
          />
          <dl
            class="jv__stats"
            data-tid="job-viewer-stats"
          >
            <div>
              <dt>Layer</dt>
              <dd>{{ layer + 1 }} / {{ layerCount }}</dd>
            </div>
            <div>
              <dt>Z</dt>
              <dd>{{ z.toFixed(2) }} mm</dd>
            </div>
            <div>
              <dt>Moves</dt>
              <dd>{{ layerMoves.toLocaleString() }}</dd>
            </div>
          </dl>
          <viewer-toggles />
          <label
            v-if="job && job.printing"
            class="jv__follow"
          >
            <span>
              <b>Follow the print</b>
              <span>The layer and the line it's on, as it prints</span>
            </span>
            <toggle-switch
              :value="follow"
              label="Follow the print"
              @input="follow = $event"
            />
          </label>
        </template>

        <div class="jv__actions">
          <router-link
            v-if="loadedHere"
            :to="fullscreenTo"
            class="cbtn"
          >
            <frame-icon
              name="expand"
              small
            />
            Open full screen
          </router-link>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="!job || !canPrint || job.printing"
            data-tid="job-viewer-print"
            @click="job && $emit('print', job)"
          >
            <v-icon small>
              $play
            </v-icon>
            {{ job && job.printing ? 'Printing' : busy ? (canQueue ? 'Add to queue' : 'Busy') : 'Print' }}
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import type { JobFile } from '@/mixins/jobs'
import type { Layer } from '@/store/gcodePreview/types'
import { fileSize } from '@/services/jobs/model'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import GcodePreview from '@/components/widgets/gcode-preview/GcodePreview.vue'
import RangeSlider from '@/components/control/RangeSlider.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import ViewerToggles from './ViewerToggles.vue'

/** After the first file's layers are asked for, the next file's load once the cursor rests this long. */
const AUTO_LOAD_MS = 600

/**
 * Pro Jobs' G-code viewer: the file the table's cursor is on, its picture
 * until its layers are asked for (the whole file comes over the network,
 * which is slow on a printer's Wi-Fi), then its layers with a slider,
 * what's drawn, and following the print when it's the one printing.
 */
@Component({ components: { GcodePreview, RangeSlider, ToggleSwitch, ViewerToggles } })
export default class JobViewer extends Mixins(StateMixin, FilesMixin) {
  @Prop({ type: Object, default: null })
  readonly job!: JobFile | null

  @Prop({ type: Boolean })
  readonly busy?: boolean

  @Prop({ type: Boolean })
  readonly canQueue?: boolean

  @Prop({ type: Boolean, default: true })
  readonly canPrint!: boolean

  @Prop({ type: String, default: '' })
  readonly printerName!: string

  layer = 0
  error = ''
  downloading = false
  autoLoad = false
  timer: number | null = null

  layerValueText (value: number): string {
    return `Layer ${value + 1} of ${this.layerCount}`
  }

  get size (): string {
    return this.job ? fileSize(this.job.size) : ''
  }

  // -- the preview store ------------------------------------------------------------

  get previewPath (): string | null {
    const f = this.$store.getters['gcodePreview/getFile'] as { filename: string, path: string } | undefined
    if (!f) return null
    return f.path ? `${f.path}/${f.filename}` : f.filename
  }

  get parsing (): boolean {
    return !!this.$store.state.gcodePreview.parserWorker
  }

  get parsingHere (): boolean {
    return this.parsing && !!this.job && this.previewPath === this.job.path
  }

  get loadedHere (): boolean {
    return !!this.job && !this.parsing && this.previewPath === this.job.path && this.layers.length > 0
  }

  get parserProgress (): number {
    const bytes = this.$store.getters['gcodePreview/getParserProgress'] as number
    return this.job?.size ? Math.min(100, bytes / this.job.size * 100) : 0
  }

  get layers (): Layer[] {
    return (this.$store.getters['gcodePreview/getLayers'] as Layer[]) ?? []
  }

  get layerCount (): number {
    return this.loadedHere ? this.layers.length : 0
  }

  get z (): number {
    return this.layers[this.layer]?.z ?? 0
  }

  /** The moves in this layer: from its first to the next layer's. */
  get layerMoves (): number {
    const moves = (this.$store.getters['gcodePreview/getMoves'] as unknown[]).length
    const from = this.layers[this.layer]?.move ?? 0
    const to = this.layers[this.layer + 1]?.move ?? moves
    return Math.max(0, to - from)
  }

  get follow (): boolean {
    return !!this.$store.getters['gcodePreview/getViewerOption']('followProgress')
  }

  set follow (value: boolean) {
    this.$store.commit('gcodePreview/setViewerState', { followProgress: value })
    if (value) this.layer = this.printLayer
  }

  get filePosition (): number {
    return this.$store.state.printer.printer.virtual_sdcard?.file_position ?? 0
  }

  get printLayer (): number {
    return this.$store.getters['gcodePreview/getLayerNrByFilePosition'](this.filePosition) as number
  }

  get fullscreenTo (): string {
    return scopedPath('/preview', activeSlug())
  }

  setLayer (layer: number) {
    this.layer = layer
    // Moving the layer by hand stops following, as the full-screen viewer does.
    if (this.follow && layer !== this.printLayer) this.$store.commit('gcodePreview/setViewerState', { followProgress: false })
  }

  @Watch('printLayer')
  onPrintLayer (layer: number) {
    if (this.follow && this.loadedHere && this.job?.printing) this.layer = layer
  }

  // -- loading ------------------------------------------------------------------------

  @Watch('job')
  onJob (job: JobFile | null, old: JobFile | null) {
    if (job?.key === old?.key) return
    this.clearTimer()
    this.error = ''
    this.downloading = false
    this.layer = this.loadedHere ? this.startLayer() : 0
    if (job && this.autoLoad && !this.loadedHere && !this.parsingHere) {
      this.timer = window.setTimeout(() => this.load(), AUTO_LOAD_MS)
    }
  }

  @Watch('layerCount')
  onLayerCount (count: number, old: number) {
    if (count && !old) this.layer = this.startLayer()
  }

  /** Where a file opens: the print's layer when following it, else a layer partway up, where the part shows its shape. */
  startLayer (): number {
    if (this.follow && this.job?.printing) return this.printLayer
    return Math.floor(this.layers.length / 4)
  }

  async load () {
    this.clearTimer()
    const job = this.job
    if (!job || this.loadedHere || this.parsingHere || this.downloading) return
    this.autoLoad = true
    this.error = ''
    this.downloading = true
    try {
      const response = await this.getGcode(job.file)
      const gcode = response?.data
      if (!gcode || this.job?.key !== job.key) return
      // One file parses at a time: the one asked for last wins.
      if (this.parsing) await this.$store.dispatch('gcodePreview/terminateParserWorker')
      this.$store.dispatch('gcodePreview/loadGcode', { file: job.file, gcode })
    } catch {
      if (this.job?.key === job.key) this.error = "The printer didn't send it. Try again in a moment."
    } finally {
      if (this.job?.key === job.key) this.downloading = false
    }
  }

  cancel () {
    this.autoLoad = false
    this.$store.dispatch('gcodePreview/terminateParserWorker')
  }

  clearTimer () {
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = null
  }

  beforeDestroy () {
    this.clearTimer()
  }

  async cancelObject (id: string) {
    const ok = await this.$confirm("The rest of the plate carries on. A part that's skipped can't be added back.", { title: `Stop printing ${id}?`, buttonTrueText: 'Skip it', buttonFalseText: 'Keep printing it', danger: true })
    if (ok) this.sendGcode(`EXCLUDE_OBJECT NAME=${id.toUpperCase().replace(/\s/g, '_')}`)
  }
}
</script>

<style lang="scss" scoped>
  .jv {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    padding: 18px;
    border-radius: 22px;
    background: var(--m3d-surface);
    container-type: inline-size;
  }

  .jv__body,
  .jv__side {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  // Under the table, with a page's width: the drawing on the left, what works it on the right.
  @container (min-width: 760px) {
    .jv__body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      align-items: start;
      gap: 20px;
    }
  }

  .jv__head {
    display: flex;
    align-items: center;
    gap: 8px;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }
  }

  .jv__grow {
    flex: 1 1 auto;
  }

  .jv__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;
  }

  .jv__file {
    margin: -6px 0 0;
    overflow: hidden;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .jv__stage {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 300px;
    overflow: hidden;
    border-radius: 16px;
    background: radial-gradient(90% 80% at 50% 45%, #1d2a2a 0%, #121516 75%);
  }

  .jv__preview {
    width: 100%;

    :deep(.v-input__slot) {
      min-height: 300px !important;
      max-height: 460px;
    }
  }

  .jv__empty {
    margin: 0;
    padding: 20px;
    color: var(--m3d-text-subtle);
    font-size: 14px;
    text-align: center;
  }

  .jv__picture {
    width: 62%;
    max-height: 220px;
    object-fit: contain;
  }

  .jv__load {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding-bottom: 16px;
  }

  .jv__error {
    color: var(--m3d-danger);
    font-size: 13px;
  }

  .jv__busy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .jv__stats {
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
      color: var(--m3d-text);
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .jv__follow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    cursor: pointer;

    > span {
      display: flex;
      flex-direction: column;
      font-size: 13px;

      span {
        color: var(--m3d-text-muted);
        font-size: 12px;
      }
    }
  }

  .jv__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
