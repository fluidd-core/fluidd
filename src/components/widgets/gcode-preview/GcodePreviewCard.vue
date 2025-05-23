<template>
  <collapsable-card
    :title="$tc('app.general.title.gcode_preview')"
    icon="$cubeScan"
    :draggable="!fullscreen"
    :collapsable="!fullscreen"
    layout-path="dashboard.gcode-preview-card"
  >
    <template #menu>
      <app-btn-collapse-group :collapsed="narrow">
        <app-btn
          :disabled="!printerFile || printerFileLoaded"
          small
          class="my-1"
          :class="{
            'me-1': !fullscreen
          }"
          @click="loadCurrent"
        >
          {{ $t('app.gcode.btn.load_current_file') }}
        </app-btn>

        <app-btn
          v-if="!fullscreen"
          icon
          @click="$filters.routeTo({ name: 'gcode_preview' })"
        >
          <v-icon dense>
            $fullScreen
          </v-icon>
        </app-btn>
      </app-btn-collapse-group>
    </template>

    <v-card-text
      :class="{ 'no-pointer-events': overlay }"
      @dragover="handleDragOver"
      @dragenter.self.prevent
      @dragleave.self.prevent="handleDragLeave"
      @drop.self.prevent="handleDrop"
    >
      <gcode-preview-parser-progress-dialog
        v-if="showParserProgressDialog"
        :value="showParserProgressDialog"
        :progress="parserProgress"
        :file="file"
        @cancel="abortParser"
      />

      <v-row>
        <v-col
          cols="12"
          md="8"
        >
          <v-row>
            <v-col>
              <app-named-slider
                :label="$t('app.gcode.label.layer')"
                :value="(!fileLoaded) ? 0 : currentLayer + 1"
                :min="(!fileLoaded) ? 0 : 1"
                :max="layerCount"
                :disabled="!fileLoaded"
                @input="setCurrentLayer($event - 1)"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <app-named-slider
                :label="$t('app.general.label.progress')"
                :value="moveProgress - currentLayerMoveRange.min"
                :min="0"
                :max="currentLayerMoveRange.max - currentLayerMoveRange.min"
                :disabled="!fileLoaded"
                @input="setMoveProgress($event + currentLayerMoveRange.min)"
              />
            </v-col>
          </v-row>
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-row>
            <v-col>
              <v-card
                outlined
                class="px-2 py-1 text-center stat-square justify-center"
                :class="{ 'text--disabled': !fileLoaded }"
              >
                <div class="">
                  {{ $t('app.gcode.label.layers') }}
                </div>
                <div class="focus--text">
                  {{ layerCount }}
                </div>
                <div class="">
                  {{ $t('app.gcode.label.current_layer_height') }}
                </div>
                <div class="focus--text">
                  {{ currentLayerHeight }}
                </div>
              </v-card>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <app-btn
                :disabled="!fileLoaded"
                block
                @click="resetFile"
              >
                {{ $t('app.general.btn.reset_file') }}
              </app-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <gcode-preview
            ref="preview"
            :layer="currentLayer"
            :progress="moveProgress"
            :disabled="!fileLoaded"
            @cancelObject="cancelObject($event)"
          />
        </v-col>
      </v-row>

      <app-drag-overlay
        v-model="overlay"
        :message="$t('app.gcode.overlay.drag_file_load')"
        icon="$cubeScan"
        absolute
      />
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import BrowserMixin from '@/mixins/browser'
import GcodePreview from './GcodePreview.vue'
import GcodePreviewParserProgressDialog from './GcodePreviewParserProgressDialog.vue'
import type { AppFile, AppFileWithMeta } from '@/store/files/types'
import type { Layer, MinMax, Move } from '@/store/gcodePreview/types'
import { getFileDataTransferDataFromDataTransfer, hasFileDataTransferTypeInDataTransfer } from '@/util/file-data-transfer'
import { consola } from 'consola'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'

@Component({
  components: {
    GcodePreviewParserProgressDialog,
    GcodePreview
  }
})
export default class GcodePreviewCard extends Mixins(StateMixin, FilesMixin, BrowserMixin) {
  @Prop({ type: Boolean })
  readonly narrow?: boolean

  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  @Ref('preview')
  readonly preview!: GcodePreview

  currentLayer = 0
  moveProgress = 0
  overlay = false

  @Watch('layerCount')
  onLayerCountChanged () {
    this.currentLayer = 0
  }

  @Watch('followProgress')
  onFollowProgressChanged () {
    if (this.followProgress) {
      this.currentLayer = this.fileProgressLayerNr
      this.syncMoveProgress()
    }
  }

  @Watch('currentLayer')
  onCurrentLayerChanged () {
    if (this.followProgress && this.currentLayer !== this.fileProgressLayerNr) {
      this.followProgress = false
    }

    if (!this.followProgress) {
      this.moveProgress = this.currentLayerMoveRange.max
    }
  }

  @Watch('filePosition')
  onFilePositionChanged () {
    if (this.followProgress) {
      const moves = this.moves

      if (moves.length === 0) {
        return
      }

      this.syncMoveProgress()

      const {
        min,
        max
      } = this.currentLayerMoveRange

      if (this.filePosition < moves[min].filePosition || this.filePosition > moves[max].filePosition) {
        this.currentLayer = this.fileProgressLayerNr
      }
    }
  }

  @Watch('moveProgress')
  onMoveProgressChanged () {
    if (this.followProgress) {
      const fileMovePosition: number = this.$typedGetters['gcodePreview/getMoveIndexByFilePosition'](this.filePosition)

      // In some (yet unclear) cases, fileMovePosition can get out of sync with
      // the component's notion of moveProgress.  This seems to happen during
      // layer changes, but not every time.  Possibly some gcode command is getting
      // misinterpreted.
      // This "fix" simply forces a re-sync of progress if they get out of sync
      if (fileMovePosition !== this.moveProgress) {
        this.syncMoveProgress()
      }
    }
  }

  @Watch('printerFile')
  onPrinterFileChanged (value: AppFileWithMeta | undefined, oldValue: AppFileWithMeta | undefined) {
    if (this.autoLoadOnPrintStart &&
      value != null &&
      (
        oldValue == null ||
        value.path !== oldValue.path ||
        value.filename !== oldValue.filename
      ) &&
      ['paused', 'printing'].includes(this.printerState) &&
      !this.printerFileLoaded
    ) {
      this.loadCurrent()
    }
  }

  @Watch('fileLoaded')
  onFileLoaded () {
    if (
      this.fileLoaded &&
      this.$typedState.config.uiSettings.gcodePreview.autoFollowOnFileLoad &&
      this.printerFileLoaded
    ) {
      this.followProgress = true
    }
  }

  get file (): AppFile | undefined {
    return this.$typedState.gcodePreview.file
  }

  get moves (): Move[] {
    return this.$typedState.gcodePreview.moves
  }

  get fileLoaded (): boolean {
    return this.moves.length > 0
  }

  get parserProgress (): number {
    return this.$typedState.gcodePreview.parserProgress
  }

  get showParserProgressDialog (): boolean {
    return this.file !== undefined && this.parserProgress !== this.file.size
  }

  get filePosition (): number {
    return this.$typedState.printer.printer.virtual_sdcard?.file_position ?? 0
  }

  get fileProgressLayerNr (): number {
    return this.$typedGetters['gcodePreview/getLayerNrByFilePosition'](this.filePosition)
  }

  get layerCount (): number {
    return this.$typedGetters['gcodePreview/getLayers'].length
  }

  get currentLayerHeight (): number {
    return this.$typedGetters['gcodePreview/getLayers'][this.currentLayer]?.z ?? 0
  }

  get followProgress (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.followProgress
  }

  set followProgress (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.followProgress',
      value,
      server: true
    })
  }

  get currentLayerMoveRange (): MinMax {
    const moves = this.moves

    if (moves.length === 0) {
      return {
        min: 0,
        max: 0
      }
    }

    const layers: Layer[] = this.$typedGetters['gcodePreview/getLayers']

    return {
      min: layers[this.currentLayer].move,
      max: layers[this.currentLayer + 1]?.move ?? moves.length - 1
    }
  }

  setCurrentLayer (value: number) {
    if (value >= 0) this.currentLayer = value
  }

  setMoveProgress (value: number) {
    if (value >= 0) this.moveProgress = value
  }

  syncMoveProgress () {
    this.moveProgress = this.$typedGetters['gcodePreview/getMoveIndexByFilePosition'](this.filePosition)
  }

  abortParser () {
    this.$typedDispatch('gcodePreview/terminateParserWorker')
  }

  resetFile () {
    this.$typedDispatch('gcodePreview/reset')
  }

  async loadCurrent () {
    const printerFile = this.printerFile

    if (printerFile) {
      this.loadFile(printerFile)
    }
  }

  async loadFile (file: AppFile) {
    try {
      const response = await this.getGcode(file)

      const gcode = response?.data

      if (!gcode) return

      this.$typedDispatch('gcodePreview/loadGcode', {
        file,
        gcode
      })
    } catch (error: unknown) {
      consola.error('[GcodePreview] load', error)
    }
  }

  get printerFile (): AppFileWithMeta | undefined {
    return this.$typedGetters['printer/getPrinterFile']
  }

  get printerFileLoaded () {
    const file = this.file
    const printerFile = this.printerFile

    if (
      file == null ||
      printerFile == null ||
      file.path !== printerFile.path ||
      file.filename !== printerFile.filename
    ) {
      if (this.followProgress) {
        this.followProgress = false
      }

      return false
    }

    return true
  }

  get autoLoadOnPrintStart (): boolean {
    if (this.isMobileViewport) {
      return this.$typedState.config.uiSettings.gcodePreview.autoLoadMobileOnPrintStart
    }

    return this.$typedState.config.uiSettings.gcodePreview.autoLoadOnPrintStart
  }

  async cancelObject (id: string) {
    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_exclude_object'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      const reqId = id.toUpperCase().replace(/\s/g, '_')

      this.sendGcode(`EXCLUDE_OBJECT NAME=${encodeGcodeParamValue(reqId)}`)
    }
  }

  handleDragOver (event: DragEvent) {
    if (
      event.dataTransfer &&
      hasFileDataTransferTypeInDataTransfer(event.dataTransfer, 'jobs')
    ) {
      event.preventDefault()

      event.dataTransfer.dropEffect = 'link'

      this.overlay = true
    }
  }

  handleDragLeave () {
    this.overlay = false
  }

  handleDrop (event: DragEvent) {
    this.overlay = false

    if (
      event.dataTransfer &&
      hasFileDataTransferTypeInDataTransfer(event.dataTransfer, 'jobs')
    ) {
      const files = getFileDataTransferDataFromDataTransfer(event.dataTransfer, 'jobs')
      const path = files.path ? `gcodes/${files.path}` : 'gcodes'

      const file: AppFile | undefined = this.$typedGetters['files/getFile'](path, files.items[0])

      if (file) {
        this.loadFile(file)
      }
    }
  }

  created () {
    if (this.followProgress) {
      this.currentLayer = this.fileProgressLayerNr
      this.syncMoveProgress()
    } else {
      this.moveProgress = this.currentLayerMoveRange.min
    }
  }
}
</script>
