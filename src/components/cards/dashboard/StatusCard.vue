<template>
  <collapsable-card
    :hide-menu="hidePrinterMenu"
    :collapsable="printerPrinting"
    :title="$t('app.general.title.status')"
    icon="$printer3d">

    <template v-slot:title>
      <v-icon left>$printer3d</v-icon>
      <span class="font-weight-light">
        {{ $t('app.printer.state.' + printerState) }}
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
        class="ma-1">
        <v-icon small>$pause</v-icon>
        <span>{{ $t('app.general.btn.pause') }}</span>
      </btn>

      <btn
        @click="cancelPrint()"
        v-if="printerPrinting || printerPaused"
        :elevation="2"
        :loading="hasWait($waits.onPrintCancel)"
        :disabled="hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
        small
        class="ma-1">
        <v-icon small>$cancel</v-icon>
        <span>{{ $t('app.general.btn.cancel') }}</span>
      </btn>

      <btn
        @click="resumePrint()"
        v-if="printerPaused"
        :elevation="2"
        :loading="hasWait($waits.onPrintResume)"
        :disabled="hasWait([$waits.onPrintCancel, $waits.onPrintResume, $waits.onPrintPause])"
        small
        class="ma-1">
        <v-icon small class="mr-1">$resume</v-icon>
        <span>{{ $t('app.general.btn.resume') }}</span>
      </btn>

      <btn
        @click="resetFile()"
        :elevation="2"
        v-if="!printerPrinting && !printerPaused && filename"
        small
        class="ma-1">
        <v-icon small class="mr-1">$refresh</v-icon>
        <span>{{ $t('app.general.btn.reset_file') }}</span>
      </btn>

      <btn
        v-if="!supportsHistoryPlugin && !printerPrinting && !printerPaused && filename"
        @click="handleReprint(filename)"
        small
        class="ma-1">
        <v-icon small class="mr-1">$reprint</v-icon>
        <span>{{ $t('app.general.btn.reprint') }}</span>
      </btn>

      <reprint-menu
        v-if="supportsHistoryPlugin && !printerPrinting && !printerPaused && history.length > 0"
        @print="handleReprint"
      ></reprint-menu>
    </template>

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
  get hidePrinterMenu () {
    if (!this.supportsHistoryPlugin) {
      return (!this.printerPrinting && !this.printerPaused && !this.filename)
    } else {
      return (!this.printerPrinting && !this.printerPaused && this.history > 0)
    }
  }

  get supportsHistoryPlugin () {
    return this.$store.getters['server/pluginSupport']('history')
  }

  get history () {
    return this.$store.getters['history/getUniqueHistory'](3)
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

  cancelPrint () {
    this.$tc('app.general.simple_form.msg.confirm')
    this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'secondary', icon: '$error' }
    )
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
    SocketActions.printerPrintStart(filename)
  }

  resetFile () {
    this.sendGcode('SDCARD_RESET_FILE')
  }
}
</script>
