<template>
  <v-card-text>
    <v-row class="flex-nowrap">
      <!-- progress & image -->
      <v-col cols="auto">
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

      <v-col>
        <!-- Visible dependent on knowing the fileor message -->
        <v-row no-gutters v-if="message || filename !== ''">
          <v-col>
            <status-label label="M117" v-if="message">
              <span>{{ message }}</span>
            </status-label>

            <status-label label="File" v-if="filename !== ''">
              <span>{{ filename }}</span>
            </status-label>
          </v-col>
        </v-row>

        <!-- During a print. -->
        <v-row no-gutters v-if="printerPrinting">
          <v-col>
            <status-label label="Speed">
              <span v-if="requestedSpeed > 0 && printerPrinting">{{ requestedSpeed }} mm/s</span>
            </status-label>

            <status-label label="Flow">
              <span v-if="flow.value > 0 && printerPrinting">{{ flow.value.toFixed(1) }} mm&sup3;/s</span>
            </status-label>

            <status-label label="Filament">
              <span v-if="filament_used > 0 && printerPrinting">{{ $filters.getReadableLengthString(filament_used) }}</span>
            </status-label>

            <status-label label="Layer">
              <span v-if="layers && printerPrinting">{{ layer }} / {{ layers }}</span>
            </status-label>
          </v-col>

          <v-col>
            <status-label label="Actual" v-if="estimates.actual > 0">
              <span v-if="estimates.actual > 0">{{ $filters.formatCounterTime(estimates.actual) }}</span>
            </status-label>

            <status-label label="File" v-else>
              <span v-if="estimates.file > 0">{{ $filters.formatCounterTime(estimates.file) }}</span>
            </status-label>

            <status-label label="Slicer">
              <span v-if="estimates.slicer > 0 && printerPrinting">{{ $filters.formatCounterTime(estimates.slicer) }}</span>
            </status-label>

            <status-label label="Total">
              <span v-if="estimates.duration > 0 && printerPrinting">{{ $filters.formatCounterTime(estimates.duration) }}</span>
            </status-label>

            <status-label label="Finish">
              <span v-if="estimates.eta > 0 && printerPrinting">{{ $filters.formatAbsoluteDateTime(estimates.eta, 'h:mm A') }}</span>
            </status-label>
          </v-col>
        </v-row>

        <!-- After a completed print, with file data and potentially history. -->
        <v-row no-gutters v-if="current_file && !printerPrinting">
          <v-col>
            <status-label label="Filament" v-if="current_file.history && current_file.history.filament_used">
              <span v-if="current_file.history.filament_used">{{ $filters.getReadableLengthString(current_file.history.filament_used) }}</span>
            </status-label>

            <status-label label="Filament" v-else>
              <span v-if="current_file.filament_total">{{ $filters.getReadableLengthString(current_file.filament_total) }}</span>
            </status-label>

            <status-label label="Slicer">
              <span v-if="current_file.estimated_time > 0">{{ $filters.formatCounterTime(current_file.estimated_time) }}</span>
            </status-label>

            <status-label label="Actual" v-if="current_file.history && current_file.history.print_duration">
              <span v-if="current_file.history.print_duration > 0">{{ $filters.formatCounterTime(current_file.history.print_duration) }}</span>
            </status-label>

            <status-label label="Total" v-if="current_file.history && current_file.history.total_duration">
              <span v-if="current_file.history.total_duration > 0">{{ $filters.formatCounterTime(current_file.history.total_duration) }}</span>
            </status-label>
          </v-col>
        </v-row>

      </v-col>

      <!-- Visible if we have a thumb -->
      <v-col cols="auto" class="pa-0" v-if="thumbnail">
        <img
          class="print-thumb"
          :src="thumbnail"
        />
      </v-col>

    </v-row>
  </v-card-text>
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
    timestamp: new Date().getTime(),
    lastExtruderPosition: 0,
    value: 0,
    max: 0
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
      const url = this.getThumbUrl(this.current_file.thumbnails, this.current_file.path, true, this.current_file.modified)
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
    const current_file = this.$store.state.printer.printer.current_file
    if (
      'first_layer_height' in current_file &&
      'layer_height' in current_file &&
      'object_height' in current_file
    ) {
      const lc = Math.ceil((current_file.object_height - current_file.first_layer_height) / current_file.layer_height + 1)
      if (lc > 0) return lc
    }
    return 0
  }

  /**
   * Current estimated layer based on current z pos.
   */
  get layer () {
    const current_file = this.$store.state.printer.printer.current_file
    const duration = this.$store.state.printer.printer.print_stats.print_duration || 0
    const pos = this.$store.state.printer.printer.gcode_move.gcode_position
    if (
      current_file &&
      duration > 0 &&
      'first_layer_height' in current_file &&
      'layer_height' in current_file &&
      pos &&
      pos.length >= 3
    ) {
      const z = this.$store.state.printer.printer.gcode_move.gcode_position[2]
      const l = Math.ceil((z - current_file.first_layer_height) / current_file.layer_height + 1)
      if (l > 0) return l
    }
    return 0
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
    const timeDelta = (new Date().getTime() - this.flow.timestamp) / 1000
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
      this.flow.timestamp = new Date().getTime()
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
