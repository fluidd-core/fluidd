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
        :loading="hasWait($waits.onPrintPause)"
        :disabled="hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
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
        :loading="hasWait($waits.onPrintCancel)"
        :disabled="hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
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
        :loading="hasWait($waits.onPrintResume)"
        :disabled="hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
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

      <btn
        v-if="!supportsHistoryPlugin && !printerPrinting && !printerPaused && filename"
        @click="handleReprint(this.filename)"
        small
        color="secondary"
        class="ma-1">
        <v-icon small class="mr-1">$reprint</v-icon>
        <span>Reprint</span>
      </btn>

      <btn
        v-if="supportsHistoryPlugin && !printerPrinting && !printerPaused && history.length > 0"
        @click="showHistory = !showHistory"
        small
        color="secondary"
        class="ma-1">
        <v-icon small class="mr-1">$reprint</v-icon>
        <span>Reprint</span>
        <v-icon small class="ml-1" v-if="showHistory">$chevronUp</v-icon>
        <v-icon small class="ml-1" v-else>$chevronDown</v-icon>
      </btn>

      <!-- <reprint-menu v-if="supportsHistoryPlugin"></reprint-menu> -->
    </template>

    <v-expand-transition v-if="supportsHistoryPlugin">
      <reprint-menu
        v-show="showHistory"
        @print="handleReprint">
      </reprint-menu>
    </v-expand-transition>
    <print-status-widget v-if="showStatus"></print-status-widget>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import ReprintMenu from '@/components/widgets/history/ReprintMenu.vue'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import { SocketActions } from '@/socketActions'

@Component({
  components: {
    PrintStatusWidget,
    ReprintMenu
  }
})
export default class StatusCard extends Mixins(StateMixin, FilesMixin) {
  showHistory = false

  get hidePrinterMenu () {
    if (!this.supportsHistoryPlugin) {
      return (!this.printerPrinting && !this.printerPaused && !this.filename)
    } else {
      return (!this.printerPrinting && !this.printerPaused && this.history === 0)
    }
  }

  get supportsHistoryPlugin () {
    return this.$store.getters['server/pluginSupport']('history')
  }

  get history () {
    return this.$store.getters['history/getUniqueHistory'](2)
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

  handleReprint (filename: string) {
    this.showHistory = false
    SocketActions.printerPrintStart(filename)
  }

  resetFile () {
    this.sendGcode('SDCARD_RESET_FILE')
  }
}
</script>
