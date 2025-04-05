<template>
  <div>
    <!-- Only show the linear progress for mdAndDown -->
    <v-progress-linear
      v-if="
        progressVisible &&
          $vuetify.breakpoint.smAndDown
      "
      :height="6"
      :value="estimates.progress"
      color="primary"
    />

    <v-card-text v-if="visible">
      <v-row>
        <template v-if="progressVisible">
          <v-col
            v-if="printInProgressLayout === 'default' && $vuetify.breakpoint.lgAndUp"
            cols="auto"
            align-self="center"
          >
            <v-progress-circular
              :rotate="-90"
              :size="90"
              :width="7"
              :value="estimates.progress"
              color="primary"
            >
              <span class="percentComplete focus--text">{{ estimates.progress }}%</span>
            </v-progress-circular>
          </v-col>

          <v-col
            v-else-if="printInProgressLayout === 'compact' && $vuetify.breakpoint.mdAndUp"
            cols="auto"
            align-self="center"
          >
            <v-row>
              <v-btn
                text
                class="progress-button mx-2"
                @click="handleViewThumbnail"
              >
                <v-progress-circular
                  :rotate="-90"
                  :size="90"
                  :width="7"
                  :value="estimates.progress"
                  color="primary"
                >
                  <img
                    class="progress-button-image"
                    :src="thumbnail"
                  >
                </v-progress-circular>
              </v-btn>
            </v-row>
            <v-row justify="center">
              <span class="primary--text">{{ estimates.progress }}%</span>
            </v-row>
          </v-col>
        </template>

        <v-col align-self="center">
          <!-- Visible dependent on knowing the file, message or mdAndDown -->
          <v-row
            v-if="
              message ||
                filename !== '' ||
                (progressVisible && $vuetify.breakpoint.mdAndDown)
            "
            no-gutters
          >
            <v-col>
              <status-label
                v-if="progressVisible && $vuetify.breakpoint.mdAndDown"
                :label="$t('app.general.label.progress')"
              >
                <span>{{ estimates.progress }}%</span>
              </status-label>

              <status-label
                v-if="message"
                :label="$t('app.general.label.m117')"
              >
                <span>{{ message }}</span>
              </status-label>

              <status-label
                v-if="filename !== ''"
                :label="$t('app.general.label.file')"
              >
                <span style="word-break: break-all">{{ filename }}</span>
              </status-label>
            </v-col>
          </v-row>

          <!-- During a print. -->
          <v-row
            v-if="printerPrinting"
            no-gutters
          >
            <v-col
              cols="12"
              sm="6"
            >
              <status-label :label="$t('app.general.label.requested_speed')">
                <span v-if="liveVelocity > 0">{{ liveVelocity.toFixed(1) }} mm/s</span>
              </status-label>

              <status-label :label="$t('app.general.label.flow')">
                <span v-if="liveFlow > 0">{{ liveFlow.toFixed(1) }} mm&sup3;/s</span>
              </status-label>

              <status-label :label="$t('app.general.label.filament')">
                <span v-if="filamentUsed > 0">{{ $filters.getReadableLengthString(filamentUsed) }}</span>
              </status-label>

              <status-label :label="$t('app.general.label.layer')">
                <span v-if="layers > 0">{{ layer }} / {{ layers }}</span>
              </status-label>
            </v-col>

            <v-col
              cols="12"
              sm="6"
            >
              <status-label
                v-if="estimates.actualLeft > 0"
                :label="$t('app.general.label.actual_time')"
              >
                <span>{{ $filters.formatCounterSeconds(estimates.actualLeft) }}</span>
              </status-label>

              <status-label
                v-else
                :label="$t('app.general.label.file_time')"
              >
                <span v-if="estimates.fileLeft > 0">{{ $filters.formatCounterSeconds(estimates.fileLeft) }}</span>
              </status-label>

              <status-label :label="$t('app.general.label.slicer')">
                <span v-if="estimates.slicerLeft > 0">{{ $filters.formatCounterSeconds(estimates.slicerLeft) }}</span>
              </status-label>

              <status-label :label="$t('app.general.label.total')">
                <span v-if="estimates.printDuration > 0">{{ $filters.formatCounterSeconds(estimates.printDuration) }}</span>
              </status-label>

              <status-label :label="$t('app.general.label.finish_time')">
                <span v-if="estimates.eta > 0">{{ $filters.formatAbsoluteDateTime(estimates.eta) }}</span>
              </status-label>
            </v-col>
          </v-row>

          <!-- After a completed print, with file data and potentially history. -->
          <v-row
            v-if="overviewVisible && printerFile"
            no-gutters
          >
            <v-col>
              <status-label
                v-if="printerFile.history && printerFile.history.filament_used > 0"
                :label="$t('app.general.label.filament')"
              >
                <span>{{ $filters.getReadableLengthString(printerFile.history.filament_used) }}</span>
              </status-label>

              <status-label
                v-else-if="printerFile.filament_total"
                :label="$t('app.general.label.filament')"
              >
                <span>{{ $filters.getReadableLengthString(printerFile.filament_total) }}</span>
              </status-label>

              <status-label
                v-if="printerFile.estimated_time"
                :label="$t('app.general.label.slicer')"
              >
                <span>{{ $filters.formatCounterSeconds(printerFile.estimated_time) }}</span>
              </status-label>

              <status-label
                v-if="printerFile.history && printerFile.history.print_duration > 0"
                :label="$t('app.general.label.actual_time')"
              >
                <span>{{ $filters.formatCounterSeconds(printerFile.history.print_duration) }}</span>
              </status-label>

              <status-label
                v-if="printerFile.history && printerFile.history.total_duration > 0"
                :label="$t('app.general.label.total')"
              >
                <span>{{ $filters.formatCounterSeconds(printerFile.history.total_duration) }}</span>
              </status-label>
            </v-col>
          </v-row>
        </v-col>

        <v-col
          v-if="thumbVisible && printInProgressLayout === 'default'"
          cols="auto"
          align-self="center"
          class="pa-0"
        >
          <v-btn
            text
            height="100%"
            @click="handleViewThumbnail"
          >
            <img
              class="print-thumb"
              :src="thumbnail"
            >
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <file-preview-dialog
      v-if="filePreviewState.open"
      v-model="filePreviewState.open"
      :filename="filePreviewState.filename"
      :src="filePreviewState.src"
      type="image/any"
      :width="filePreviewState.width"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StatusLabel from './StatusLabel.vue'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import ToolheadMixin from '@/mixins/toolhead'
import FilePreviewDialog from '../filesystem/FilePreviewDialog.vue'
import type { TimeEstimates } from '@/store/printer/types'
import type { PrintInProgressLayout } from '@/store/config/types'
import type { AppFileWithMeta } from '@/store/files/types'

@Component({
  components: {
    StatusLabel,
    FilePreviewDialog
  }
})
export default class StatusTab extends Mixins(StateMixin, FilesMixin, ToolheadMixin) {
  filePreviewState: any = {
    open: false,
    filename: '',
    src: ''
  }

  get visible () {
    // Content is visible if;
    // We are printing or,
    // We have a message or,
    // We have a current filename or,
    // We have a thumbnail and are lgAndUp or,
    // Progress is visible and we're mdAndDown
    return (
      this.printerPrinting ||
      this.message ||
      this.printerFile != null ||
      this.thumbVisible ||
      (
        this.progressVisible &&
        this.$vuetify.breakpoint.mdAndDown
      )
    )
  }

  get progressVisible (): boolean {
    // Progress is visible if;
    // We are printing or,
    // We have a current filename
    return (
      this.printerPrinting ||
      this.filename !== ''
    )
  }

  get overviewVisible (): boolean {
    // Overview is visible if;
    // We are not printing and,
    // We have a current filename
    return (
      !this.printerPrinting &&
      this.printerFile != null
    )
  }

  get thumbVisible (): boolean {
    return (
      this.printerFile != null &&
      this.thumbnail != null &&
      this.$vuetify.breakpoint.lgAndUp
    )
  }

  get printInProgressLayout (): PrintInProgressLayout {
    return this.$typedState.config.uiSettings.general.printInProgressLayout
  }

  get printerFile (): AppFileWithMeta | undefined {
    return this.$typedGetters['printer/getPrinterFile']
  }

  /**
   * Active filename in print_stats
   */
  get filename (): string {
    return this.$typedState.printer.printer.print_stats?.filename ?? ''
  }

  /**
   * M117 messaging
   */
  get message (): string {
    return this.$typedState.printer.printer.display_status?.message ?? ''
  }

  /**
   * Active thumbnail.
   */
  get thumbnail () {
    if (this.printerFile?.thumbnails) {
      const url = this.getThumbUrl(this.printerFile, 'gcodes', this.printerFile.path, true, this.printerFile.modified)

      return url
    }
  }

  get liveVelocity (): number {
    return this.$typedState.printer.printer.motion_report?.live_velocity ?? 0
  }

  get liveExtruderVelocity (): number {
    return this.$typedState.printer.printer.motion_report?.live_extruder_velocity ?? 0
  }

  get liveFlow (): number {
    return Math.PI / 4 * this.filamentDiameter ** 2 * this.liveExtruderVelocity
  }

  /**
   * Actual estimates for during a print.
   */
  get estimates (): TimeEstimates {
    return this.$typedGetters['printer/getTimeEstimates']
  }

  /**
   * The total estimated layer count.
   */
  get layers (): number {
    return this.$typedGetters['printer/getPrintLayers']
  }

  /**
   * Current estimated layer based on current z pos.
   */
  get layer (): number {
    return this.$typedGetters['printer/getPrintLayer']
  }

  /**
   * Filament used according to print stats.
   */
  get filamentUsed (): number {
    return this.$typedState.printer.printer.print_stats?.filament_used ?? 0
  }

  async handleViewThumbnail () {
    const printerFile = this.printerFile
    const thumb = printerFile && this.getThumb(printerFile, 'gcodes', printerFile.path, true, printerFile.modified)

    if (thumb) {
      this.filePreviewState = {
        open: true,
        filename: printerFile.filename,
        src: thumb.url,
        width: thumb.width
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .print-thumb {
    display: block;
    max-height: 110px;
    pointer-events: none;
  }

  .filename {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    // width: 200px;
    direction: rtl;
    text-align: left;
  }

  .progress-button {
    width: 90px !important;
    height: 90px !important;
    border-radius: 50%;
    overflow: hidden;
  }

  .progress-button-image {
    width: 70px;
    height: 70px;
    object-fit: cover;
    border-radius: 50%;
    overflow: hidden;
    pointer-events: none;
  }
</style>
