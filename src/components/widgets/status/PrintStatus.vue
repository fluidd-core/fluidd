<template>
  <v-container>
    <v-row align="center">
      <v-col cols="auto">
        <v-progress-circular
            :rotate="-90"
            :size="90"
            :width="7"
            :value="timeEstimates.progress"
            color="primary"
          >
          <span class="percentComplete focus--text">{{ timeEstimates.progress }}%</span>
        </v-progress-circular>
      </v-col>
      <v-col class="d-flex flex-column" style="overflow: hidden;" align="start">
          <div class="mb-1" v-if="printTimeEstimationsType !== 'totals'">
            <v-tooltip left>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" color="secondary">$timer</v-icon>
              </template>
              <span>{{ $t('app.printer.status.time_left') }}</span>
            </v-tooltip>
            <span>{{ timeEstimates.remaining }}</span>
            <span class="secondary--text" v-if="printerPrinting && printTimeEstimationsType !== 'totals'"> / {{ timeEstimates.endTime }}</span>
          </div>
          <div class="mb-1">
            <v-tooltip left>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" color="secondary" class="mr-1">$clock</v-icon>
              </template>
              {{ (printTimeEstimationsType !== 'totals') ? $t('app.printer.status.duration_total') : $t('app.printer.status.duration') }}
            </v-tooltip>
            <span>{{ timeEstimates.current }}</span>
            <span class="secondary--text" v-if="printTimeEstimationsType !== 'totals'"> / {{ timeEstimates.total }}</span>
          </div>
          <div class="mb-1 secondary--text" v-if="filamentEstimates !== ''">
            <v-tooltip left>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" color="secondary" class="mr-1">$formatLineSpacing</v-icon>
              </template>
              {{ $t('app.printer.status.used_filament') }}
            </v-tooltip>
            <span class="secondary--text">{{ filamentEstimates }}</span>
          </div>
          <div class="mb-1" v-if="layers">
            <v-icon color="secondary" class="mr-1">$layersTripleOutline</v-icon>
            <span v-html="layers"></span>
          </div>
          <div class="d-flex secondary--text" v-if="filename">
            <v-icon color="secondary">$fileDocument</v-icon>
            <div class="filename ml-1">gcodes/{{ filename }}</div>
          </div>
      </v-col>
      <v-col cols="auto" class="d-none d-sm-flex" v-if="thumbnail">
        <img
          class="print-thumb"
          :src="thumbnail"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import { Waits } from '@/globals'

@Component({})
export default class PrintStatus extends Mixins(StateMixin, FilesMixin) {
  buttonWidths = 140
  waits = Waits

  get filename () {
    return this.$store.state.printer.printer.print_stats.filename
  }

  get thumbnail () {
    const current_file = this.$store.state.printer.printer.current_file
    if (
      current_file &&
      current_file.thumbnails
    ) {
      const url = this.getThumbUrl(current_file.thumbnails, current_file.path, true, current_file.modified)
      return url
    }
  }

  get printTimeEstimationsType () {
    return this.$store.state.config.uiSettings.general.printTimeEstimationsType
  }

  get timeEstimates () {
    return this.$store.getters['printer/getTimeEstimates']
  }

  get layers () {
    const h = this.$store.state.printer.printer.current_file.object_height
    const flh = this.$store.state.printer.printer.current_file.first_layer_height
    const lh = this.$store.state.printer.printer.current_file.layer_height
    const z = this.$store.state.printer.printer.gcode_move.gcode_position[2]

    const layers = Math.ceil(((h - flh) / lh) + 1) || 0
    const current = Math.ceil((z - flh) / lh + 1) || 0

    if (layers !== 0 && current !== 0) return `${current} / <span class="secondary--text">${layers}</span>`
    return ''
  }

  get filamentEstimates () {
    const filamentUsed = this.$store.state.printer.printer.print_stats.filament_used || 0
    const filamentTotal = this.$store.state.printer.printer.current_file.filament_total || 0
    if (filamentUsed > 0) {
      if (filamentTotal > 0) {
        return `${this.$filters.getReadableLengthString(filamentUsed)} / ${this.$filters.getReadableLengthString(filamentTotal)}`
      } else {
        return this.$filters.getReadableLengthString(filamentUsed)
      }
    } else {
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
  .print-thumb {
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
