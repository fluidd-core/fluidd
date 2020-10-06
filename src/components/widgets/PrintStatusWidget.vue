<template>
  <v-sheet color="#262626" class="print-status">
    <v-container class="py-0">
      <v-row align="center">
        <v-col sm="auto">
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
            <div class="mb-1 grey--text" v-if="printTimeEstimationsType !== 'totals'">
              <v-tooltip left>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" color="grey darken-2">mdi-timer-sand</v-icon>
                </template>
                <span>estimated time left</span>
              </v-tooltip>
              {{ timeEstimates.timeLeft }}
            </div>
            <div class="mb-1 grey--text">
              <v-tooltip left>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" color="grey darken-2" class="mr-1">mdi-clock-outline</v-icon>
                </template>
                {{ (printTimeEstimationsType !== 'totals') ? 'duration &amp; total' : 'duration' }}
              </v-tooltip>
              <span>{{ timeEstimates.duration }}</span>
              <span class="grey--text text--darken-2" v-if="printTimeEstimationsType !== 'totals'"> / {{ timeEstimates.totalDuration }}</span>
            </div>
            <div class="mb-1 grey--text" v-if="filamentEstimates !== ''">
              <v-tooltip left>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon v-bind="attrs" v-on="on" color="grey darken-2" class="mr-1">mdi-format-line-spacing</v-icon>
                </template>
                used filament
              </v-tooltip>
              <span class="grey--text text--darken-2">{{ filamentEstimates }}</span>
            </div>
            <div class="d-flex grey--text text--darken-2">
              <v-icon color="grey darken-2">mdi-file-document-outline</v-icon>
              <div class="filename ml-1" v-if="filename">gcodes/{{ filename }}</div>
            </div>
        </v-col>
        <v-col sm="auto" class="d-flex flex-column">
          <v-btn
            @click="pausePrint()"
            :loading="hasWait(waits.onPrintPause)"
            :width="buttonWidths"
            v-if="!printerPaused && printerPrinting"
            color="secondary"
            class="mb-2">
            <v-icon small>mdi-pause</v-icon>
            <span>Pause</span>
          </v-btn>

          <v-btn
            @click="confirmDialog.open = true"
            :loading="hasWait(waits.onPrintCancel)"
            :width="buttonWidths"
            v-if="printerPrinting || printerPaused"
            color="secondary"
            class="mb-2">
            <v-icon small>mdi-window-close</v-icon>
            <span>Cancel</span>
          </v-btn>
          <v-btn
            @click="resumePrint()"
            :loading="hasWait(waits.onPrintResume)"
            :width="buttonWidths"
            v-if="printerPaused"
            color="secondary"
            class="mb-2">
            <v-icon small class="mr-1">mdi-play-box-outline</v-icon>
            <span>Resume</span>
          </v-btn>
          <v-btn
            :width="buttonWidths"
            v-if="!printerPrinting && !printerPaused && filename"
            color="secondary"
            class="mb-2">
            <v-icon small class="mr-1">mdi-printer</v-icon>
            <span>Reprint</span>
          </v-btn>
          <v-btn
            @click="cameraVisible = !cameraVisible"
            :width="buttonWidths"
            color="secondary"
            class="mb-2">
            <v-icon small class="mr-1">mdi-camera</v-icon>
            <span>Camera</span>
          </v-btn>
        </v-col>
      </v-row>
    <v-expand-transition>
      <v-row v-show="cameraVisible">
        <v-col>
        <img :src="cameraUrl" class="webcam" />
        </v-col>
      </v-row>
    </v-expand-transition>
    </v-container>
    <dialog-confirm
      v-model="confirmDialog.open"
      @confirm="cancelPrint()">
      <p>Are you sure? This will cancel your print.</p>
    </dialog-confirm>
  </v-sheet>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'
import { SocketActions } from '@/socketActions'
import DialogConfirm from '@/components/dialogs/dialogConfirm.vue'

@Component({
  components: {
    DialogConfirm
  }
})
export default class PrintStatusWidget extends Mixins(UtilsMixin) {
  buttonWidths = 140
  waits = Waits

  confirmDialog = {
    open: false
  }

  get cameraUrl (): string {
    return this.$store.state.config.fileConfig.camera.url
  }

  get cameraVisible (): boolean {
    return this.$store.state.config.localConfig.cameraVisible
  }

  set cameraVisible (val: boolean) {
    this.$store.dispatch('config/saveLocalStorage', { cameraVisible: val })
  }

  get filename () {
    return this.$store.state.socket.printer.print_stats.filename
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

  cancelPrint () {
    SocketActions.printerPrintCancel()
  }

  pausePrint () {
    SocketActions.printerPrintPause()
  }

  resumePrint () {
    SocketActions.printerPrintResume()
  }
}
</script>

<style lang="scss" scoped>
  .webcam {
    width: 100%;
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
