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
            v-if="overviewVisible"
            no-gutters
          >
            <v-col>
              <status-label
                v-if="current_file.history && current_file.history.filament_used"
                :label="$t('app.general.label.filament')"
              >
                <span>{{ $filters.getReadableLengthString(current_file.history.filament_used) }}</span>
              </status-label>

              <status-label
                v-else-if="current_file.filament_total"
                :label="$t('app.general.label.filament')"
              >
                <span>{{ $filters.getReadableLengthString(current_file.filament_total) }}</span>
              </status-label>

              <status-label
                v-if="current_file.estimated_time"
                :label="$t('app.general.label.slicer')"
              >
                <span>{{ $filters.formatCounterSeconds(current_file.estimated_time) }}</span>
              </status-label>

              <status-label
                v-if="current_file.history && current_file.history.print_duration > 0"
                :label="$t('app.general.label.actual_time')"
              >
                <span>{{ $filters.formatCounterSeconds(current_file.history.print_duration) }}</span>
              </status-label>

              <status-label
                v-if="current_file.history && current_file.history.total_duration > 0"
                :label="$t('app.general.label.total')"
              >
                <span>{{ $filters.formatCounterSeconds(current_file.history.total_duration) }}</span>
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
      (this.current_file && this.current_file.filename) ||
      this.thumbVisible ||
      (this.progressVisible && this.$vuetify.breakpoint.mdAndDown)
    )
  }

  get progressVisible () {
    // Progress is visible if;
    // We are printing or,
    // We have a current filename
    return (
      this.printerPrinting ||
      this.filename !== ''
    )
  }

  get overviewVisible () {
    // Overview is visible if;
    // We are not printing and,
    // We have a current filename
    return (
      !this.printerPrinting &&
      this.current_file &&
      this.current_file.filename
    )
  }

  get thumbVisible () {
    return (
      this.current_file &&
      this.current_file.filename &&
      this.thumbnail &&
      this.$vuetify.breakpoint.lgAndUp
    )
  }

  get printInProgressLayout (): PrintInProgressLayout {
    return this.$store.state.config.uiSettings.general.printInProgressLayout as PrintInProgressLayout
  }

  /**
   * Current file with appended history data if it exists.
   */
  get current_file () {
    let current_file = this.$store.state.printer.printer.current_file
    if (current_file.job_id) {
      const history = this.$store.getters['history/getHistoryById'](current_file.job_id)
      if (history) {
        current_file = {
          ...current_file,
          history
        }
      }
    }
    return current_file
  }

  /**
   * Active filename in print_stats
   */
  get filename () {
    return this.$store.state.printer.printer.print_stats.filename || ''
  }

  /**
   * M117 messaging
   */
  get message () {
    return this.$store.state.printer.printer.display_status.message
  }

  /**
   * Active thumbnail.
   */
  get thumbnail () {
    if (
      this.current_file &&
      this.current_file.thumbnails
    ) {
      const url = this.getThumbUrl(this.current_file, 'gcodes', this.current_file.path, true, this.current_file.modified)
      return url
    }
  }

  get liveVelocity (): number {
    return this.$store.state.printer.printer.motion_report.live_velocity as number
  }

  get liveExtruderVelocity (): number {
    return this.$store.state.printer.printer.motion_report.live_extruder_velocity as number
  }

  get liveFlow (): number {
    return Math.PI / 4 * this.filamentDiameter ** 2 * this.liveExtruderVelocity
  }

  /**
   * Actual estimates for during a print.
   */
  get estimates (): TimeEstimates {
    return this.$store.getters['printer/getTimeEstimates'] as TimeEstimates
  }

  /**
   * If the user has enabled the history component.
   */
  get supportsHistoryComponent (): boolean {
    return this.$store.getters['server/componentSupport']('history') as boolean
  }

  /**
   * The last 3 history items.
   */
  get history () {
    return this.$store.getters['history/getUniqueHistory'](3)
  }

  /**
   * The total estimated layer count.
   */
  get layers (): number {
    return this.$store.getters['printer/getPrintLayers'] as number
  }

  /**
   * Current estimated layer based on current z pos.
   */
  get layer (): number {
    return this.$store.getters['printer/getPrintLayer'] as number
  }

  /**
   * Filament used according to print stats.
   */
  get filamentUsed (): number {
    const filamentUsed = this.$store.state.printer.printer.print_stats.filament_used as number | undefined

    return filamentUsed ?? 0
  }

  /**
   * Total filament according to the current file / slicer.
   */
  get filamentTotal () {
    const filamentTotal = this.$store.state.printer.printer.current_file.filament_total as number | undefined

    return filamentTotal || 0
  }

  async handleViewThumbnail () {
    const file = this.current_file
    const thumb = this.getThumb(file, 'gcodes', file.path, true, file.modified)

    if (thumb) {
      this.filePreviewState = {
        open: true,
        filename: file.filename,
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
    max-width: 70px;
    max-height: 70px;
    border-radius: 50%;
    overflow: hidden;
    pointer-events: none;
  }
</style>
