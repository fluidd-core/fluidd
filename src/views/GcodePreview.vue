<template>
  <div
    class="prev"
    :class="{ 'prev--phone': isMobileViewport }"
    data-tid="preview-page"
  >
    <section class="prev__stage">
      <gcode-preview
        v-if="loaded"
        class="prev__drawing"
        :layer="shownLayer"
        :progress="following ? undefined : moveEnd"
        :disabled="false"
        bare
        @cancelObject="cancelObject"
      />
      <div
        v-else-if="parsing"
        class="prev__busy"
      >
        <v-progress-circular
          :value="parserProgress"
          size="44"
          width="3"
          color="primary"
        />
        <span>Reading {{ fileName }}… {{ Math.round(parserProgress) }}%</span>
        <button
          type="button"
          class="prev__link"
          @click="stopReading"
        >
          Stop
        </button>
      </div>
      <div
        v-else-if="fetching"
        class="prev__busy"
      >
        <v-progress-circular
          indeterminate
          size="44"
          width="3"
          color="primary"
        />
        <span>Fetching {{ fetching }} from {{ printerName }}…</span>
      </div>
      <div
        v-else
        class="prev__empty"
      >
        <frame-icon name="layout" />
        <p>Nothing loaded. Load what's printing, or open a file.</p>
      </div>
    </section>

    <aside class="prev__side">
      <div class="prev__head">
        <div class="prev__titles">
          <h2>{{ loaded ? title : 'G-code preview' }}</h2>
          <p v-if="loaded">
            {{ fileName }}
          </p>
        </div>
        <button
          v-if="loaded"
          type="button"
          class="prev__link"
          data-tid="preview-unload"
          @click="unload"
        >
          Unload
        </button>
      </div>

      <button
        v-if="printerFile && !printerFileLoaded"
        type="button"
        class="cbtn cbtn--primary"
        data-tid="preview-load-print"
        :disabled="parsing || !!fetching"
        @click="load(printerFile)"
      >
        Load what's printing
      </button>
      <label class="prev__open">
        <span>Open a file</span>
        <select
          :value="''"
          :disabled="parsing || !!fetching || !files.length"
          aria-label="Open a file"
          data-tid="preview-open"
          @change="openPicked"
        >
          <option value="">
            {{ files.length ? 'Choose…' : 'No G-code on the printer' }}
          </option>
          <option
            v-for="f in files"
            :key="f.key"
            :value="f.key"
          >
            {{ f.title }}
          </option>
        </select>
      </label>
      <p
        v-if="error"
        class="prev__error"
      >
        {{ error }}
      </p>

      <template v-if="loaded">
        <div class="prev__slider">
          <span>Layer</span>
          <range-slider
            :value="shownLayer"
            :min="0"
            :max="Math.max(0, fileLayers.length - 1)"
            label="Layer"
            @change="setLayer"
          />
        </div>
        <div
          v-if="!following"
          class="prev__slider"
        >
          <span>Along it</span>
          <range-slider
            :value="moveEnd - layerStart"
            :min="0"
            :max="Math.max(0, layerEnd - layerStart)"
            label="How far along the layer"
            @change="moveEnd = layerStart + $event"
          />
        </div>
        <dl
          class="prev__stats"
          data-tid="preview-stats"
        >
          <div>
            <dt>Layer</dt>
            <dd>{{ shownLayer + 1 }} / {{ fileLayers.length }}</dd>
          </div>
          <div>
            <dt>Z</dt>
            <dd>{{ z.toFixed(2) }} mm</dd>
          </div>
          <div>
            <dt>Moves</dt>
            <dd>{{ (layerEnd - layerStart).toLocaleString() }}</dd>
          </div>
        </dl>
        <viewer-toggles />
        <label
          v-if="printerFileLoaded"
          class="prev__follow"
        >
          <span>
            <b>Follow the print</b>
            <span>The layer and the line it's on, as it prints</span>
          </span>
          <toggle-switch
            :value="following"
            label="Follow the print"
            @input="following = $event"
          />
        </label>
        <p
          v-if="printerFileLoaded && hasObjects"
          class="prev__note"
        >
          Objects on the plate are outlined. Pick one in the drawing to stop printing it; the rest carry on.
        </p>
      </template>
    </aside>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import JobsMixin from '@/mixins/jobs'
import BrowserMixin from '@/mixins/browser'
import type { AppFile } from '@/store/files/types'
import type { Layer } from '@/store/gcodePreview/types'
import { jobTitle } from '@/services/jobs/model'
import GcodePreview from '@/components/widgets/gcode-preview/GcodePreview.vue'
import RangeSlider from '@/components/control/RangeSlider.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import ViewerToggles from '@/components/jobs/ViewerToggles.vue'

/**
 * The full-screen G-code preview (Jobs › Preview): the drawing as large as
 * the window allows, and beside it the file, its layer, how far along the
 * layer, what's drawn, and following the print. It loads what's printing,
 * or any file on the printer; Jobs' viewer opens here with its file
 * already loaded. As Fluidd's own did, it loads a print as it starts and
 * follows it, when Settings says to.
 */
@Component({ components: { GcodePreview, RangeSlider, ToggleSwitch, ViewerToggles } })
export default class GcodePreviewPage extends Mixins(JobsMixin, BrowserMixin) {
  shownLayer = 0
  moveEnd = 0
  fetching = ''
  error = ''

  mounted () {
    this.loadFiles()
    this.shownLayer = this.following ? this.printLayer : Math.floor(this.fileLayers.length / 4)
    this.moveEnd = this.layerEnd
  }

  get files () {
    return [...this.jobFiles].sort((a, b) => b.modified - a.modified)
  }

  get previewFile (): AppFile | undefined {
    return this.$store.getters['gcodePreview/getFile'] as AppFile | undefined
  }

  get fileName (): string {
    return this.previewFile?.filename ?? this.fetching
  }

  get title (): string {
    return jobTitle(this.previewFile?.filename ?? '')
  }

  get parsing (): boolean {
    return !!this.$store.state.gcodePreview.parserWorker
  }

  get fileLayers (): Layer[] {
    return (this.$store.getters['gcodePreview/getLayers'] as Layer[]) ?? []
  }

  get moveCount (): number {
    return (this.$store.getters['gcodePreview/getMoves'] as unknown[]).length
  }

  get loaded (): boolean {
    return !this.parsing && this.moveCount > 0 && this.fileLayers.length > 0
  }

  get parserProgress (): number {
    const bytes = this.$store.getters['gcodePreview/getParserProgress'] as number
    const size = this.previewFile?.size
    return size ? Math.min(100, bytes / size * 100) : 0
  }

  get layerStart (): number {
    return this.fileLayers[this.shownLayer]?.move ?? 0
  }

  get layerEnd (): number {
    return this.fileLayers[this.shownLayer + 1]?.move ?? this.moveCount
  }

  get z (): number {
    return this.fileLayers[this.shownLayer]?.z ?? 0
  }

  get printerFile (): AppFile | undefined {
    const current = this.$store.state.printer.printer.current_file as AppFile | undefined
    return current?.filename && this.busy ? current : undefined
  }

  get printerFileLoaded (): boolean {
    const f = this.previewFile
    const p = this.printerFile
    return !!f && !!p && `${f.path}/${f.filename}` === `${p.path}/${p.filename}`
  }

  get following (): boolean {
    return this.printerFileLoaded && !!this.$store.getters['gcodePreview/getViewerOption']('followProgress')
  }

  set following (value: boolean) {
    this.$store.commit('gcodePreview/setViewerState', { followProgress: value })
    if (value) this.shownLayer = this.printLayer
  }

  get printLayer (): number {
    const position = this.$store.state.printer.printer.virtual_sdcard?.file_position ?? 0
    return this.$store.getters['gcodePreview/getLayerNrByFilePosition'](position) as number
  }

  get hasObjects (): boolean {
    return (this.$store.state.printer.printer.exclude_object?.objects?.length ?? 0) > 1
  }

  setLayer (layer: number) {
    this.shownLayer = layer
    this.moveEnd = this.layerEnd
    if (this.following && layer !== this.printLayer) this.$store.commit('gcodePreview/setViewerState', { followProgress: false })
  }

  @Watch('printLayer')
  onPrintLayer (layer: number) {
    if (this.following) this.shownLayer = layer
  }

  @Watch('fileLayers')
  onLayers (layers: Layer[], old: Layer[]) {
    if (!layers.length || layers === old) return
    // A new file: the print's layer when following it, else a layer partway up, where the part shows its shape.
    const autoFollow = this.$store.state.config.uiSettings.gcodePreview.autoFollowOnFileLoad
    if (autoFollow && this.printerFileLoaded) this.$store.commit('gcodePreview/setViewerState', { followProgress: true })
    this.shownLayer = this.following ? this.printLayer : Math.floor(layers.length / 4)
    this.moveEnd = this.layerEnd
  }

  /** A print starting loads its file, when Settings › G-code preview says so (as Fluidd's own viewer did). */
  @Watch('printerFile')
  onPrinterFile () {
    const settings = this.$store.state.config.uiSettings.gcodePreview
    const auto = this.isMobileViewport ? settings.autoLoadMobileOnPrintStart : settings.autoLoadOnPrintStart
    if (auto && this.printerFile && !this.printerFileLoaded && !this.parsing) this.load(this.printerFile)
  }

  openPicked (event: Event) {
    const select = event.target as HTMLSelectElement
    const job = this.files.find(f => f.key === select.value)
    select.value = ''
    if (job) this.load(job.file)
  }

  async load (file: AppFile) {
    this.error = ''
    this.fetching = file.filename
    try {
      const response = await this.getGcode(file)
      const gcode = response?.data
      if (!gcode) return
      if (this.parsing) await this.$store.dispatch('gcodePreview/terminateParserWorker')
      this.$store.dispatch('gcodePreview/loadGcode', { file, gcode })
    } catch {
      this.error = `${this.printerName} didn't send ${file.filename}. Try again in a moment.`
    } finally {
      this.fetching = ''
    }
  }

  stopReading () {
    this.$store.dispatch('gcodePreview/terminateParserWorker')
  }

  unload () {
    this.$store.dispatch('gcodePreview/reset')
  }

  async cancelObject (id: string) {
    const ok = await this.$confirm(`Stop printing ${id}? The rest of the plate carries on.`, { title: 'Skip an object', color: 'card-heading', icon: '$error' })
    if (ok) this.sendGcode(`EXCLUDE_OBJECT NAME=${id.toUpperCase().replace(/\s/g, '_')}`)
  }
}
</script>

<style lang="scss" scoped>
  .prev {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 16px;
    height: calc(100vh - 250px);
    height: calc(100svh - 250px);
    min-height: 480px;
  }

  .prev__stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border-radius: 22px;
    background: radial-gradient(90% 80% at 50% 45%, #1d2a2a 0%, #121516 75%);
  }

  .prev__drawing {
    width: 100%;
    height: 100%;

    :deep(.v-input__slot) {
      min-height: 0 !important;
      max-height: none;
      height: calc(100vh - 250px);
      height: calc(100svh - 250px);
    }
  }

  .prev__busy,
  .prev__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--m3d-text-muted);
    font-size: 14px;
    text-align: center;

    p {
      margin: 0;
    }
  }

  .prev__side {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    overflow-y: auto;
    padding: 18px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .prev__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .prev__titles {
    min-width: 0;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    p {
      margin: 2px 0 0;
      overflow: hidden;
      color: var(--m3d-text-muted);
      font-family: var(--m3d-font-mono, monospace);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .prev__link {
    flex: none;
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;
  }

  .prev__open {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--m3d-text-muted);
    font-size: 12px;

    select {
      height: 40px;
      padding: 0 12px;
      border: 0;
      border-radius: 12px;
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
    }
  }

  .prev__error {
    margin: 0;
    color: var(--m3d-danger);
    font-size: 13px;
  }

  .prev__slider {
    display: flex;
    flex-direction: column;
    gap: 4px;

    > span {
      color: var(--m3d-text-subtle);
      font-size: 12px;
    }
  }

  .prev__stats {
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
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .prev__follow {
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

  .prev__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .prev--phone {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(300px, 1fr) auto;
    height: auto;

    .prev__drawing :deep(.v-input__slot) {
      height: 60svh;
    }
  }
</style>
