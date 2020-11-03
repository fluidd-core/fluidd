<template>
  <v-layout column justify-start class="px-2">
    <v-btn small block text class="mt-2" color="warning" :disabled="printerBusy" @click="restartKlippy">Restart</v-btn>
    <v-btn small block text class="mt-1" color="warning" :disabled="printerBusy" @click="firmwareRestartKlippy">Firmware Restart</v-btn>
    <v-btn small block text class="mt-1" color="error" :disabled="printerBusy" @click.stop="confirmRebootDialog.open = true">Host Reboot</v-btn>
    <v-btn small block text class="mt-1 mb-2" color="error" :disabled="printerBusy" @click.stop="confirmShutdownDialog.open = true">Host Shutdown</v-btn>

    <dialog-confirm
      v-model="confirmRebootDialog.open"
      @confirm="hostReboot">
      <p>Are you sure? This will reboot your host system.</p>
    </dialog-confirm>

    <dialog-confirm
      v-model="confirmShutdownDialog.open"
      @confirm="hostShutdown">
      <p>Are you sure? This will shutdown your host system.</p>
    </dialog-confirm>
  </v-layout>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { SocketActions } from '@/socketActions'
import DialogConfirm from '@/components/dialogs/dialogConfirm.vue'

@Component({
  components: {
    DialogConfirm
  }
})
export default class SystemCommandsWidget extends Mixins(UtilsMixin) {
  confirmRebootDialog = {
    open: false
  }

  confirmShutdownDialog = {
    open: false
  }

  hostReboot (val: boolean) {
    if (val) {
      SocketActions.machineReboot()
    }
    // this.menu = false
  }

  hostShutdown (val: boolean) {
    if (val) {
      SocketActions.machineShutdown()
    }
    // this.menu = false
  }

  dialogCancel () {
    // this.menu = false
  }
}
</script>
