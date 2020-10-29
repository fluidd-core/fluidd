<template>
  <v-container class="py-0">
    <v-row align="center">
      <v-col cols="auto">
        <v-progress-circular
            :rotate="180"
            :size="90"
            :width="5"
            :value="timeEstimates.progress"
            color="primary"
          >
          <span class="percentComplete grey--text text-h5 font-weight-normal">{{ timeEstimates.progress }}%</span>
        </v-progress-circular>
      </v-col>
      <v-col class="d-flex flex-column" style="overflow: hidden;" align="start">
          <div class="mb-1 grey--text text--lighten-1" v-if="printTimeEstimationsType !== 'totals'">
            <v-tooltip left>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" color="grey darken-2">$timer</v-icon>
              </template>
              <span>estimated time left</span>
            </v-tooltip>
            {{ timeEstimates.timeLeft }}
          </div>
          <div class="mb-1 grey--text text--lighten-1">
            <v-tooltip left>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" color="grey darken-2" class="mr-1">$clock</v-icon>
              </template>
              {{ (printTimeEstimationsType !== 'totals') ? 'duration &amp; total' : 'duration' }}
            </v-tooltip>
            <span>{{ timeEstimates.duration }}</span>
            <span class="grey--text text--darken-2" v-if="printTimeEstimationsType !== 'totals'"> / {{ timeEstimates.totalDuration }}</span>
          </div>
          <div class="mb-1 grey--text" v-if="filamentEstimates !== ''">
            <v-tooltip left>
              <template v-slot:activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" color="grey darken-2" class="mr-1">$filamentEstimate</v-icon>
              </template>
              used filament
            </v-tooltip>
            <span class="grey--text text--darken-2">{{ filamentEstimates }}</span>
          </div>
          <div class="d-flex grey--text text--darken-2">
            <v-icon color="grey darken-2">$fileDocument</v-icon>
            <div class="filename ml-1" v-if="filename">gcodes/{{ filename }}</div>
          </div>
      </v-col>
      <v-col cols="auto" class="d-none d-sm-flex" v-if="thumbnail && printerPrinting">
        <img
          class="print-thumb"
          :src="thumbnail.data"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'

@Component({})
export default class PrintStatusWidget extends Mixins(UtilsMixin) {
  buttonWidths = 140
  waits = Waits

  get filename () {
    return this.$store.state.socket.printer.print_stats.filename
  }

  get thumbnail () {
    return this.$store.getters['socket/getPrintImage']
  }

  get printTimeEstimationsType () {
    return this.$store.state.config.fileConfig.general.printTimeEstimationsType
  }

  get timeEstimates () {
    return this.$store.getters['socket/getTimeEstimates'](this.printTimeEstimationsType)
  }

  get filamentEstimates () {
    const filamentUsed = this.$store.state.socket.printer.print_stats.filament_used || 0
    const filamentTotal = this.$store.state.socket.printer.current_file.filament_total || 0
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
