<template>
  <collapsable-card
    :hide-menu="hidePrinterMenu"
    :collapsable="printerPrinting"
    title="Status"
    icon="$printer3d">

    <template v-slot:title>
      <v-icon left>$printer3d</v-icon>
      <span class="font-weight-light">
        {{ printerState }}
        <span class="font-weight-light text-subtitle-2 ml-sm-4 d-block d-sm-inline-block" v-show="printerMessage">{{ printerMessage }}</span>
      </span>
    </template>

    <template v-slot:menu>
      <btn
        @click="pausePrint()"
        v-if="!printerPaused && printerPrinting"
        :elevation="2"
        :loading="hasWait(waits.onPrintPause)"
        :disabled="hasWait([waits.onPrintCancel, waits.onPrintResume, waits.onPrintPause])"
        small
        color="secondary"
        class="ma-1">
        <v-icon small>$pause</v-icon>
        <span>Pause</span>
      </btn>

      <btn
        @click="cancelPrint()"
        v-if="printerPrinting || printerPaused"
        :elevation="2"
        :loading="hasWait(waits.onPrintCancel)"
        :disabled="hasWait([waits.onPrintCancel, waits.onPrintResume, waits.onPrintPause])"
        small
        color="secondary"
        class="ma-1">
        <v-icon small>$cancel</v-icon>
        <span>Cancel</span>
      </btn>

      <btn
        @click="resumePrint()"
        v-if="printerPaused"
        :elevation="2"
        :loading="hasWait(waits.onPrintResume)"
        :disabled="hasWait([waits.onPrintCancel, waits.onPrintResume, waits.onPrintPause])"
        small
        color="secondary"
        class="ma-1">
        <v-icon small class="mr-1">$resume</v-icon>
        <span>Resume</span>
      </btn>

      <btn
        @click="resetFile()"
        :elevation="2"
        v-if="!printerPrinting && !printerPaused && filename"
        small
        color="secondary"
        class="ma-1">
        <v-icon small class="mr-1">$refresh</v-icon>
        <span>Reset File</span>
      </btn>

      <!-- v-if="!printerPrinting && !printerPaused && filename" -->
      <v-menu
        bottom left
        transition="slide-x-transition"
        offset-y
      >
        <template v-slot:activator="{ on, attrs }">
          <btn
            v-bind="attrs"
            v-on="on"
            small
            color="secondary"
            class="ma-1">
            <v-icon small class="mr-1">$reprint</v-icon>
            <span>Reprint</span>
            <v-icon small class="ml-1">$chevronDown</v-icon>
          </btn>
        </template>
        <reprint-list></reprint-list>
      </v-menu>
    </template>

    <!-- <pre>{{ history }}</pre> -->

    <print-status-widget v-if="showStatus"></print-status-widget>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import ReprintList from '@/components/widgets/history/ReprintList.vue'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import { SocketActions } from '@/socketActions'
import { Waits } from '@/globals'

@Component({
  components: {
    PrintStatusWidget,
    ReprintList
  }
})
export default class StatusCard extends Mixins(StateMixin, FilesMixin) {
  waits = Waits

  get hidePrinterMenu () {
    // return (!this.printerPrinting && !this.printerPaused && !this.filename)
    // console.log('printing?', this.printerPrinting)
    // console.log('paused and printing?', (this.printerPrinting || this.printerPaused))
    return (this.printerPrinting || this.printerPaused)
    // return false
  }

  get showStatus () {
    // return (this.printerPrinting || this.printerPaused || this.filename)
    return true
  }

  get printerMessage () {
    return this.$store.state.printer.printer.display_status.message
  }

  get filename () {
    return this.$store.state.printer.printer.print_stats.filename || ''
  }

  cancelPrint () {
    this.$confirm('Are you sure?')
      .then(res => {
        if (res) {
          SocketActions.printerPrintCancel()
          this.addConsoleEntry('CANCEL_PRINT')
        }
      })
  }

  pausePrint () {
    SocketActions.printerPrintPause()
    this.addConsoleEntry('PAUSE')
  }

  resumePrint () {
    SocketActions.printerPrintResume()
    this.addConsoleEntry('RESUME')
  }

  rePrint () {
    if (this.filename && this.filename.length > 0) {
      SocketActions.printerPrintStart(this.filename)
    }
  }

  resetFile () {
    this.sendGcode('SDCARD_RESET_FILE')
  }
}
</script>
