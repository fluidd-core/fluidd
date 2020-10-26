<template>
  <v-card color="tertiary" class="mb-4">
    <v-card-title class="quaternary py-3">

      <v-col cols="12" lg="auto" class="pa-0">
        <v-icon left>{{ icons.printer3d }}</v-icon>
        <span class="font-weight-light">
          {{ printerState }}
          <span class="font-weight-light text-subtitle-2 ml-4">{{ printerMessage }}</span>
        </span>
      </v-col>

      <v-col class="pa-0 d-inline-flex justify-start justify-md-end flex-wrap">
        <v-btn
          @click="cameraVisible = !cameraVisible"
          v-if="cameraEnabled"
          color="secondary"
          class="ml-0 ml-md-2 mr-2 mr-md-0 my-1">
          <v-icon small class="mr-1">{{ icons.camera }}</v-icon>
          <span>Camera</span>
        </v-btn>

        <v-btn
          @click="pausePrint()"
          :loading="hasWait(waits.onPrintPause)"
          v-if="!printerPaused && printerPrinting"
          color="secondary"
          class="ml-0 ml-md-2 mr-2 mr-md-0 my-1">
          <v-icon small>{{ icons.pause }}</v-icon>
          <span>Pause</span>
        </v-btn>

        <v-btn
          @click="confirmDialog.open = true"
          :loading="hasWait(waits.onPrintCancel)"
          v-if="printerPrinting || printerPaused"
          color="secondary"
          class="ml-0 ml-md-2 mr-2 mr-md-0 my-1">
          <v-icon small>{{ icons.cancel }}</v-icon>
          <span>Cancel</span>
        </v-btn>

        <v-btn
          @click="resumePrint()"
          :loading="hasWait(waits.onPrintResume)"
          v-if="printerPaused"
          color="secondary"
          class="ml-0 ml-md-2 mr-2 mr-md-0 my-1">
          <v-icon small class="mr-1">{{ icons.resume }}</v-icon>
          <span>Resume</span>
        </v-btn>

        <v-btn
          @click="rePrint()"
          v-if="!printerPrinting && !printerPaused && filename"
          color="secondary"
          class="ml-0 ml-md-2 mr-2 mr-md-0 my-1">
          <v-icon small class="mr-1">{{ icons.reprint }}</v-icon>
          <span>Reprint</span>
        </v-btn>
      </v-col>

    </v-card-title>
    <v-divider></v-divider>

    <dialog-confirm
      v-model="confirmDialog.open"
      @confirm="cancelPrint()">
      <p>Are you sure? This will cancel your print.</p>
    </dialog-confirm>

    <print-status-widget></print-status-widget>

  </v-card>
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

  get cameraEnabled (): boolean {
    return this.$store.state.config.fileConfig.camera.enabled
  }

  get cameraVisible (): boolean {
    return this.$store.state.config.localConfig.cameraVisible
  }

  set cameraVisible (val: boolean) {
    this.$store.dispatch('config/saveLocalStorage', { cameraVisible: val })
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
}
</script>
