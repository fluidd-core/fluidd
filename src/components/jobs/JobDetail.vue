<template>
  <v-dialog
    :value="!!job"
    :fullscreen="isMobileViewport"
    max-width="1000"
    content-class="job-detail__dialog"
    @input="!$event && $emit('close')"
  >
    <div
      v-if="job"
      class="job-detail"
      data-tid="job-detail"
    >
      <header class="job-detail__head">
        <div class="job-detail__titles">
          <h2>{{ job.title }}</h2>
          <span class="job-detail__file">{{ job.filename }}</span>
        </div>
        <div class="job-detail__nav">
          <button
            type="button"
            aria-label="The job before"
            :disabled="!hasPrev"
            @click="$emit('step', -1)"
          >
            <frame-icon name="chevronLeft" />
          </button>
          <button
            type="button"
            aria-label="The job after"
            :disabled="!hasNext"
            @click="$emit('step', 1)"
          >
            <frame-icon name="chevronRight" />
          </button>
          <button
            type="button"
            class="job-detail__close"
            aria-label="Close"
            @click="$emit('close')"
          >
            <frame-icon name="x" />
          </button>
        </div>
      </header>

      <div class="job-detail__body">
        <div class="job-detail__view">
          <div class="job-detail__view-tools">
            <seg-picker
              :options="viewOptions"
              :value="view"
              label="View"
              @input="setView"
            />
          </div>

          <div class="job-detail__stage">
            <template v-if="view === 'model'">
              <img
                v-if="job.thumbnail"
                :src="job.thumbnail"
                alt=""
                class="job-detail__picture"
              >
              <span
                v-else
                class="job-detail__empty"
              >The slicer put no picture in this file. Layers shows the part from its G-code.</span>
            </template>
            <template v-else>
              <span
                v-if="layerCount"
                class="job-detail__layer-badge"
              >Layer {{ layer + 1 }} of {{ layerCount }} · Z {{ layerZ.toFixed(2) }} mm</span>
              <div
                v-if="parsing"
                class="job-detail__parsing"
              >
                <v-progress-circular
                  :value="parserProgress"
                  size="40"
                  width="3"
                  color="primary"
                />
                Reading the G-code… {{ Math.round(parserProgress) }}%
              </div>
              <gcode-preview
                v-else-if="previewLoaded"
                class="job-detail__preview"
                :layer="layer"
                :disabled="false"
              />
              <span
                v-else-if="previewError"
                class="job-detail__empty"
              >{{ previewError }}</span>
            </template>
          </div>

          <div
            v-if="view === 'layers' && layerCount"
            class="job-detail__scrub"
          >
            <button
              type="button"
              class="job-detail__play"
              :aria-label="playing ? 'Stop' : 'Play the layers'"
              @click="togglePlay"
            >
              <v-icon small>
                {{ playing ? '$pause' : '$play' }}
              </v-icon>
            </button>
            <range-slider
              :value="layer"
              :min="0"
              :max="layerCount - 1"
              label="Layer"
              @change="layer = $event"
            />
            <span class="job-detail__count">{{ layer + 1 }} / {{ layerCount }}</span>
          </div>
        </div>

        <aside class="job-detail__side">
          <div class="job-detail__actions">
            <button
              type="button"
              class="cbtn cbtn--primary cbtn--wide"
              :disabled="!canPrint"
              data-tid="job-detail-print"
              @click="$emit('print')"
            >
              <v-icon small>
                $play
              </v-icon>
              {{ busy ? (canQueue ? 'Add to queue' : 'Busy') : 'Print now' }}
            </button>
            <button
              v-if="canQueue && !busy"
              type="button"
              class="cbtn cbtn--grow"
              data-tid="job-detail-queue"
              @click="$emit('queue')"
            >
              Add to queue
            </button>
          </div>
          <ul
            v-if="checks.length"
            class="job-detail__checks"
          >
            <li
              v-for="check in checks"
              :key="check.text"
              :class="{ 'job-detail__check--warn': !check.ok }"
            >
              <v-icon x-small>
                {{ check.ok ? '$check' : '$warning' }}
              </v-icon>
              {{ check.text }}
            </li>
          </ul>
          <dl class="job-detail__facts">
            <div
              v-for="fact in facts"
              :key="fact.label"
            >
              <dt>{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>
          <div class="job-detail__more">
            <button
              type="button"
              @click="$emit('download')"
            >
              <frame-icon
                name="download"
                small
              />
              Download
            </button>
            <button
              type="button"
              class="job-detail__delete"
              :disabled="job.printing"
              @click="$emit('delete')"
            >
              Delete
            </button>
          </div>
        </aside>
      </div>
    </div>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import FilesMixin from '@/mixins/files'
import type { JobFile } from '@/mixins/jobs'
import { readyChecks, type ReadyCheck } from '@/services/jobs/model'
import { longDuration } from '@/services/overview/model'
import GcodePreview from '@/components/widgets/gcode-preview/GcodePreview.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import RangeSlider from '@/components/control/RangeSlider.vue'

/** How fast Play steps through the layers. */
const PLAY_MS = 250

/**
 * One job: its picture, or its layers drawn from the G-code (Fluidd's own
 * preview, loaded when Layers is chosen); what to know before printing it;
 * the slicer's facts; Print now or Add to queue, Download and Delete.
 */
@Component({ components: { GcodePreview, SegPicker, RangeSlider } })
export default class JobDetail extends Mixins(BrowserMixin, FilesMixin) {
  @Prop({ type: Object, default: null })
  readonly job!: JobFile | null

  @Prop({ type: Boolean })
  readonly busy?: boolean

  @Prop({ type: Boolean })
  readonly canQueue?: boolean

  @Prop({ type: Boolean, default: true })
  readonly canPrint!: boolean

  @Prop({ type: Boolean })
  readonly hasPrev?: boolean

  @Prop({ type: Boolean })
  readonly hasNext?: boolean

  @Prop({ type: String, default: null })
  readonly material!: string | null

  @Prop({ type: String, default: '' })
  readonly printerName!: string

  view: 'model' | 'layers' = 'model'
  layer = 0
  playing = false
  timer: number | null = null
  previewError = ''

  get viewOptions (): SegOption[] {
    return [{ value: 'model', label: 'Model' }, { value: 'layers', label: 'Layers' }]
  }

  @Watch('job')
  onJob () {
    this.stop()
    this.layer = 0
    this.previewError = ''
    this.view = this.job?.thumbnail ? 'model' : 'layers'
    if (this.view === 'layers') this.loadPreview()
  }

  setView (view: 'model' | 'layers') {
    this.view = view
    if (view === 'layers') this.loadPreview()
  }

  get previewFile () {
    return this.$store.getters['gcodePreview/getFile'] as { filename: string, path: string } | undefined
  }

  get previewLoaded (): boolean {
    const f = this.previewFile
    if (!f || !this.job) return false
    const path = f.path ? `${f.path}/${f.filename}` : f.filename
    return path === this.job.path && !this.parsing
  }

  get parserProgress (): number {
    const bytes = this.$store.getters['gcodePreview/getParserProgress'] as number
    return this.job?.size ? Math.min(100, bytes / this.job.size * 100) : 0
  }

  get parsing (): boolean {
    return !!this.$store.state.gcodePreview.parserWorker
  }

  /** A parse that was running when this job asked for its layers: load them once it ends. */
  @Watch('parsing')
  onParsing (parsing: boolean) {
    if (!parsing && this.view === 'layers' && !this.previewLoaded && !this.previewError) this.loadPreview()
  }

  async loadPreview () {
    const job = this.job
    if (!job || this.previewLoaded || this.parsing) return
    try {
      const response = await this.getGcode(job.file)
      const gcode = response?.data
      if (!gcode || this.job !== job || this.previewLoaded) return
      // Another file began parsing while this one downloaded: onParsing tries again once it ends.
      if (this.parsing) return
      this.$store.dispatch('gcodePreview/loadGcode', { file: job.file, gcode })
    } catch {
      this.previewError = "The printer didn't send this file. Try again in a moment."
    }
  }

  get layers (): Array<{ z: number }> {
    return (this.$store.getters['gcodePreview/getLayers'] as Array<{ z: number }>) ?? []
  }

  get layerCount (): number {
    return this.previewLoaded ? this.layers.length : 0
  }

  get layerZ (): number {
    return this.layers[this.layer]?.z ?? 0
  }

  @Watch('layerCount')
  onLayerCount (count: number) {
    // Open on a layer partway up, where the part shows its shape.
    if (count && this.layer === 0) this.layer = Math.floor(count / 4)
  }

  togglePlay () {
    if (this.playing) {
      this.stop()
      return
    }
    if (this.layer >= this.layerCount - 1) this.layer = 0
    this.playing = true
    this.timer = window.setInterval(() => {
      if (this.layer >= this.layerCount - 1) this.stop()
      else this.layer++
    }, PLAY_MS)
  }

  stop () {
    this.playing = false
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  beforeDestroy () {
    this.stop()
  }

  get checks (): ReadyCheck[] {
    if (!this.job) return []
    return readyChecks(this.job.file, this.job.filename, this.material, this.printerName, !!this.busy)
  }

  get facts (): Array<{ label: string, value: string }> {
    const f = this.job?.file
    if (!f) return []
    const facts: Array<{ label: string, value: string }> = []
    if (f.estimated_time) facts.push({ label: 'Print time', value: longDuration(f.estimated_time) })
    if (f.filament_weight_total || f.filament_name) {
      facts.push({ label: 'Filament', value: [f.filament_weight_total ? `${Math.round(f.filament_weight_total)} g` : '', f.filament_name ?? f.filament_type ?? ''].filter(Boolean).join(' · ') })
    }
    if (f.layer_height && f.object_height) {
      const count = f.layer_count ?? Math.round(f.object_height / f.layer_height)
      facts.push({ label: 'Layers', value: `${count} × ${f.layer_height} mm · ${f.object_height} mm tall` })
    }
    if (f.first_layer_extr_temp) facts.push({ label: 'Nozzle · bed', value: `${f.first_layer_extr_temp}° · ${f.first_layer_bed_temp ?? 0}°` })
    if (f.slicer) facts.push({ label: 'Sliced with', value: `${f.slicer}${f.slicer_version ? ` ${f.slicer_version}` : ''}` })
    // The printer gives a file's time in seconds.
    facts.push({ label: 'Uploaded', value: new Date(f.modified * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) })
    const history = f.history as { start_time?: number } | undefined
    facts.push({ label: 'Printed', value: history?.start_time ? new Date(history.start_time * 1000).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'never' })
    return facts
  }
}
</script>

<style lang="scss" scoped>
  .job-detail {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: min(860px, calc(100vh - 48px));
    padding: 20px 22px;
    border-radius: 26px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  :deep(.v-dialog--fullscreen) .job-detail,
  .job-detail__dialog.v-dialog--fullscreen .job-detail {
    height: 100%;
    border-radius: 0;
  }

  .job-detail__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .job-detail__titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
  }

  .job-detail__file {
    overflow: hidden;
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .job-detail__nav {
    display: flex;
    flex: none;
    gap: 4px;

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: var(--m3d-text-muted);

      &:hover:not(:disabled) {
        background: var(--m3d-hover);
        color: var(--m3d-text);
      }

      &:disabled {
        opacity: 0.35;
        cursor: default;
      }
    }
  }

  .job-detail__close {
    background: var(--m3d-surface-2);
  }

  .job-detail__body {
    display: grid;
    flex: 1 1 auto;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 20px;
    min-height: 0;
  }

  .job-detail__view {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    min-height: 0;
  }

  .job-detail__stage {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    min-height: 280px;
    overflow: hidden;
    border-radius: 18px;
    background: radial-gradient(100% 100% at 50% 35%, #232527 0%, #141517 75%);
  }

  .job-detail__picture {
    width: 80%;
    height: 80%;
    object-fit: contain;
  }

  .job-detail__preview {
    width: 100%;
    height: 100%;
  }

  // Top right: the preview's own tools sit top left.
  .job-detail__layer-badge {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 1;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgb(0 0 0 / 60%);
    font-size: 12px;
    font-weight: 600;
  }

  .job-detail__parsing,
  .job-detail__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 360px;
    color: var(--m3d-text-muted);
    font-size: 14px;
    text-align: center;
  }

  .job-detail__scrub {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .job-detail__play {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--m3d-surface-2);

    .v-icon {
      color: var(--m3d-text) !important;
    }
  }

  .job-detail__count {
    flex: none;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .job-detail__side {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    overflow-y: auto;
  }

  .job-detail__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .cbtn--wide {
      height: 48px;
      font-size: 15px;
    }
  }

  .job-detail__checks {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 13px;

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--m3d-text-muted);

      .v-icon {
        color: var(--m3d-success) !important;
      }
    }
  }

  .job-detail__check--warn .v-icon {
    color: var(--m3d-warning) !important;
  }

  .job-detail__facts {
    margin: 0;

    > div {
      display: grid;
      grid-template-columns: 110px minmax(0, 1fr);
      gap: 8px;
      padding: 7px 0;
      border-top: 1px solid var(--m3d-border);
    }

    dt {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }

    dd {
      margin: 0;
      font-size: 13px;
    }
  }

  .job-detail__more {
    display: flex;
    justify-content: space-between;
    margin-top: auto;

    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 12px;
      border-radius: 999px;
      color: var(--m3d-text-muted);
      font-size: 13px;
      font-weight: 600;

      &:hover:not(:disabled) {
        background: var(--m3d-hover);
        color: var(--m3d-text);
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    }
  }

  .job-detail__delete {
    color: var(--m3d-danger) !important;
  }

  @media (max-width: 899px) {
    .job-detail__body {
      grid-template-columns: minmax(0, 1fr);
      overflow-y: auto;
    }

    .job-detail__stage {
      min-height: 320px;
    }
  }
</style>

<style lang="scss">
  .v-dialog.job-detail__dialog {
    overflow: visible;
    box-shadow: none;
  }
</style>
