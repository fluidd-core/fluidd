<template>
  <collapsable-card
    :hide-menu="hidePrinterMenu"
    icon="$printer3d">

    <template v-slot:title>
      <v-icon left>$printer3d</v-icon>
      <span class="font-weight-light">
        {{ printerState }}
        <span class="font-weight-light text-subtitle-2 ml-4">{{ printerMessage }}</span>
      </span>
    </template>

    <template v-slot:menu>
      <v-btn
        @click="pausePrint()"
        v-if="!printerPaused && printerPrinting"
        :loading="hasWait(waits.onPrintPause)"
        small
        color="secondary"
        class="ma-1">
        <v-icon small>$pause</v-icon>
        <span>Pause</span>
      </v-btn>

      <v-btn
        @click="confirmDialog.open = true"
        v-if="printerPrinting || printerPaused"
        :loading="hasWait(waits.onPrintCancel)"
        small
        color="secondary"
        class="ma-1">
        <v-icon small>$cancel</v-icon>
        <span>Cancel</span>
      </v-btn>

      <v-btn
        @click="resumePrint()"
        v-if="printerPaused"
        :loading="hasWait(waits.onPrintResume)"
        small
        color="secondary"
        class="ma-1">
        <v-icon small class="mr-1">$resume</v-icon>
        <span>Resume</span>
      </v-btn>

      <v-btn
        @click="resetFile()"
        v-if="!printerPrinting && !printerPaused && filename"
        small
        color="secondary"
        class="ma-1">
        <v-icon small class="mr-1">$refresh</v-icon>
        <span>Reset File</span>
      </v-btn>

      <v-btn
        @click="rePrint()"
        v-if="!printerPrinting && !printerPaused && filename"
        small
        color="secondary"
        class="ma-1">
        <v-icon small class="mr-1">$reprint</v-icon>
        <span>Reprint</span>
      </v-btn>
    </template>

    <dialog-confirm
      v-model="confirmDialog.open"
      @confirm="cancelPrint">
      <p>Are you sure? This will cancel your print.</p>
    </dialog-confirm>

    <print-status-widget></print-status-widget>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import UtilsMixin from '@/mixins/utils'
import { SocketActions } from '@/socketActions'
import { Waits } from '@/globals'
import DialogConfirm from '@/components/dialogs/dialogConfirm.vue'

@Component({
  components: {
    PrintStatusWidget,
    DialogConfirm
  }
})
export default class StatusCard extends Mixins(UtilsMixin) {
  waits = Waits

  confirmDialog = {
    open: false
  }

  get hidePrinterMenu () {
    return (!this.printerPrinting && !this.printerPaused && !this.filename)
  }

  get printerMessage () {
    return this.$store.state.socket.printer.display_status.message
  }

  get filename () {
    return this.$store.state.socket.printer.current_file.filename || ''
  }

  cancelPrint (val: boolean) {
    if (val) {
      SocketActions.printerPrintCancel()
    }
  }

  pausePrint () {
    SocketActions.printerPrintPause()
  }

  resumePrint () {
    SocketActions.printerPrintResume()
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
