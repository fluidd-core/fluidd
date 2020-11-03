<template>
  <v-menu bottom left :min-width="150" v-model="menu">
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on"
        text
        min-width="54">
        <v-icon>$menu</v-icon>
      </v-btn>
    </template>

    <v-card color="secondary">
      <v-list dense color="secondary">
        <v-list-item>
          <v-btn block color="warning" :disabled="printerBusy" @click="restartKlippy" class="me-2 mb-2">Restart</v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn block color="warning" :disabled="printerBusy" @click="firmwareRestartKlippy" class="me-2 mb-2">Firmware Restart</v-btn>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list dense color="secondary">
        <v-list-item>
          <v-btn block color="error" :disabled="printerBusy" @click.stop="confirmRebootDialog.open = true" class="me-2 mb-2">Host Reboot</v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn block color="error" :disabled="printerBusy" @click.stop="confirmShutdownDialog.open = true" class="me-2 mb-2">Host Shutdown</v-btn>
        </v-list-item>
      </v-list>

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

    </v-card>
  </v-menu>
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
  menu = false

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
    this.menu = false
  }

  hostShutdown (val: boolean) {
    if (val) {
      SocketActions.machineShutdown()
    }
    this.menu = false
  }

  dialogCancel () {
    this.menu = false
  }
}
</script>
