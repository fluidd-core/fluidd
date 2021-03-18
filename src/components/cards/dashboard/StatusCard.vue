<template>
  <collapsable-card
    :hide-menu="hidePrinterMenu"
    :collapsable="printerPrinting"
    :title="$t('printer.status.title')"
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
        <span>{{$t('app.btn.pause')}}</span>
      </btn>

      <btn
        @click="confirmDialog.open = true"
        v-if="printerPrinting || printerPaused"
        :elevation="2"
        :loading="hasWait(waits.onPrintCancel)"
        :disabled="hasWait([waits.onPrintCancel, waits.onPrintResume, waits.onPrintPause])"
        small
        color="secondary"
        class="ma-1">
        <v-icon small>$cancel</v-icon>
        <span>{{$t('app.btn.cancel')}}</span>
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
        <span>{{$t('app.btn.resume')}}</span>
      </btn>

      <btn
        @click="resetFile()"
        :elevation="2"
        v-if="!printerPrinting && !printerPaused && filename"
        small
        color="secondary"
        class="ma-1">
        <v-icon small class="mr-1">$refresh</v-icon>
        <span>{{$t('app.btn.resetFile')}}</span>
      </btn>

      <btn
        @click="rePrint()"
        :elevation="2"
        v-if="!printerPrinting && !printerPaused && filename"
        small
        color="secondary"
        class="ma-1">
        <v-icon small class="mr-1">$reprint</v-icon>
        <span>{{$t('app.btn.reprint')}}</span>
      </btn>
    </template>

    <dialog-confirm
      v-model="confirmDialog.open"
      @confirm="cancelPrint">
      <p>{{$t('printer.status.confirmCancel')}}</p>
    </dialog-confirm>

    <print-status-widget v-if="showStatus"></print-status-widget>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrintStatusWidget from '@/components/widgets/PrintStatusWidget.vue'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/socketActions'
import { Waits } from '@/globals'
import DialogConfirm from '@/components/dialogs/dialogConfirm.vue'

@Component({
  components: {
    PrintStatusWidget,
    DialogConfirm
  }
})
export default class StatusCard extends Mixins(StateMixin) {
  waits = Waits

  confirmDialog = {
    open: false
  }

  get hidePrinterMenu () {
    return (!this.printerPrinting && !this.printerPaused && !this.filename)
  }

  get showStatus () {
    return (this.printerPrinting || this.printerPaused || this.filename)
  }

  get printerMessage () {
    return this.$store.state.printer.printer.display_status.message
  }

  get filename () {
    return this.$store.state.printer.printer.print_stats.filename || ''
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
