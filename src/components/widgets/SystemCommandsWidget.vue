<template>
  <div>
    <v-card-text>
      <v-row>
        <v-col>
          <v-btn block color="warning" :disabled="printerBusy" @click="sendGcode('RESTART')" class="me-2 mb-2">Restart</v-btn>
          <v-btn block color="warning" :disabled="printerBusy" @click="sendGcode('FIRMWARE_RESTART')" class="me-2 mb-2">Firmware Restart</v-btn>
        </v-col>
        <v-col>
          <v-btn block color="error" :disabled="printerBusy" @click="confirmRebootDialog.open = true" class="me-2 mb-2">Host Reboot</v-btn>
          <v-btn block color="error" :disabled="printerBusy" @click="confirmShutdownDialog.open = true" class="me-2 mb-2">Host Shutdown</v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <dialog-confirm
      v-model="confirmRebootDialog.open"
      @confirm="hostReboot()">
      <p>Are you sure? This will reboot your host system.</p>
    </dialog-confirm>

    <dialog-confirm
      v-model="confirmShutdownDialog.open"
      @confirm="hostShutdown()">
      <p>Are you sure? This will shutdown your host system.</p>
    </dialog-confirm>
  </div>
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

  hostReboot () {
    SocketActions.machineReboot()
  }

  hostShutdown () {
    SocketActions.machineShutdown()
  }
}
</script>
