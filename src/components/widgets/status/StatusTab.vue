<template>
  <div>
    <!-- Only show the linear progress for mdAndDown -->
    <v-progress-linear
      v-if="
        progressVisible &&
          $vuetify.breakpoint.mdAndDown
      "
      :height="6"
      :value="estimates.progress"
      color="primary"
    >
      <!-- <small v-if="estimates.progress">{{ estimates.progress }}%</small> -->
    </v-progress-linear>

    <v-card-text v-if="visible">
      <v-row>
        <!-- Only show the circular progress for lgAndUp -->
        <v-col
          v-if="progressVisible && $vuetify.breakpoint.lgAndUp"
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
                <span v-if="requestedSpeed > 0 && printerPrinting">{{ requestedSpeed }} mm/s</span>
              </status-label>

              <status-label :label="$t('app.general.label.flow')">
                <span v-if="flow.value > 0 && printerPrinting">{{ flow.value.toFixed(1) }} mm&sup3;/s</span>
              </status-label>

              <status-label :label="$t('app.general.label.filament')">
                <span v-if="filament_used > 0 && printerPrinting">{{ $filters.getReadableLengthString(filament_used) }}</span>
              </status-label>

              <status-label :label="$t('app.general.label.layer')">
                <span v-if="layers && printerPrinting">{{ layer }} / {{ layers }}</span>
              </status-label>
            </v-col>

            <v-col
              cols="12"
              sm="6"
            >
              <status-label
                v-if="estimates.actual > 0"
                :label="$t('app.general.label.actual_time')"
              >
                <span v-if="estimates.actual > 0">{{ $filters.formatCounterTime(estimates.actual) }}</span>
              </status-label>

              <status-label
                v-else
                :label="$t('app.general.label.file_time')"
              >
                <span v-if="estimates.file > 0">{{ $filters.formatCounterTime(estimates.file) }}</span>
              </status-label>

              <status-label :label="$t('app.general.label.slicer')">
                <span v-if="estimates.slicer > 0 && printerPrinting">{{ $filters.formatCounterTime(estimates.slicer) }}</span>
              </status-label>

              <status-label :label="$t('app.general.label.total')">
                <span v-if="estimates.duration > 0 && printerPrinting">{{ $filters.formatCounterTime(estimates.duration) }}</span>
              </status-label>

              <status-label :label="$t('app.general.label.finish_time')">
                <span v-if="estimates.eta > 0 && printerPrinting">{{ $filters.formatAbsoluteDateTime(estimates.eta * 1000) }}</span>
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
                <span>{{ $filters.formatCounterTime(current_file.estimated_time) }}</span>
              </status-label>

              <status-label
                v-if="current_file.history && current_file.history.print_duration > 0"
                :label="$t('app.general.label.actual_time')"
              >
                <span>{{ $filters.formatCounterTime(current_file.history.print_duration) }}</span>
              </status-label>

              <status-label
                v-if="current_file.history && current_file.history.total_duration > 0"
                :label="$t('app.general.label.total')"
              >
                <span>{{ $filters.formatCounterTime(current_file.history.total_duration) }}</span>
              </status-label>
            </v-col>
          </v-row>
        </v-col>

        <!-- Only show the thumb if we're lgAndUp and have a thumb to show -->
        <v-col
          v-if="thumbVisible"
          cols="auto"
          align-self="center"
          class="pa-0"
        >
          <img
            class="print-thumb"
            :src="thumbnail"
          >
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StatusLabel from './StatusLabel.vue'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'

@Component({
  components: {
    StatusLabel
  }
})
export default class StatusTab extends Mixins(StateMixin, FilesMixin) {
  // Maintains the state of flow
  flow = {
    timestamp: Date.now(),
    lastExtruderPosition: 0,
    value: 0,
    max: 0
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
      const url = this.getThumbUrl(this.current_file.thumbnails, 'gcodes', this.current_file.path, true, this.current_file.modified)
      return url
    }
  }

  /**
   * The known requested speed.
   */
  get requestedSpeed () {
    // Take into account the speed multiplier.
    const multiplier = this.$store.state.printer.printer.gcode_move.speed_factor || 1
    let speed = this.$store.state.printer.printer.gcode_move.speed || 0
    speed = (speed * multiplier) / 60
    return speed.toFixed()
  }

  /**
   * Actual estimates for during a print.
   */
  get estimates () {
    return this.$store.getters['printer/getTimeEstimates']
  }

  /**
   * If the user has enabled the history component.
   */
  get supportsHistoryComponent () {
    return this.$store.getters['server/componentSupport']('history')
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
  get layers () {
    return this.$store.getters['printer/getPrintLayers']
  }

  /**
   * Current estimated layer based on current z pos.
   */
  get layer () {
    return this.$store.getters['printer/getPrintLayer']
  }

  /**
   * Filament used according to print stats.
   */
  get filament_used () {
    return this.$store.state.printer.printer.print_stats.filament_used || 0
  }

  /**
   * Total filament according to the current file / slicer.
   */
  get filament_total () {
    return this.$store.state.printer.printer.current_file.filament_total || 0
  }

  /**
   * Work out flow provided our used filament changed, and we've not calculated
   * within a given delta (2sec).
   */
  @Watch('filament_used')
  onFilamentUsed (filament_used: string) {
    const extruderPosition = parseFloat(filament_used)
    const filament_diameter = this.$store.getters['printer/getPrinterSettings']('extruder.filament_diameter') || 1.75
    const timeDelta = (Date.now() - this.flow.timestamp) / 1000
    if (timeDelta >= 2) {
      if (
        this.flow.lastExtruderPosition &&
        this.flow.lastExtruderPosition < extruderPosition &&
        this.flow.timestamp
      ) {
        // console.log('getting flow', filament_diameter, timeDelta)
        const filamentDiff = extruderPosition - this.flow.lastExtruderPosition
        const filamentCrossSection = Math.pow(filament_diameter / 2, 2) * Math.PI

        this.flow.value = filamentCrossSection * filamentDiff / timeDelta

        if (this.flow.max < this.flow.value) this.flow.max = this.flow.value
      }

      this.flow.lastExtruderPosition = extruderPosition
      this.flow.timestamp = Date.now()
    }
  }
}
</script>

<style lang="scss" scoped>
  .print-thumb {
    display: block;
    max-height: 110px;
  }

  .filename {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    // width: 200px;
    direction: rtl;
    text-align: left;
  }
</style>
