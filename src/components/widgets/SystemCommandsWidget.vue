<template>
  <div>
    <v-list-group
      prepend-icon="$power"
      no-action>
      <template v-slot:activator>
        <v-list-item-content>
          <v-list-item-title>Host</v-list-item-title>
        </v-list-item-content>
      </template>

      <v-list-item
        @click="confirmRebootDialog.open = true"
        :disabled="printerPrinting">
        <v-list-item-title>Reboot</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">$powerCycle</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item
        @click="confirmShutdownDialog.open = true"
        :disabled="printerPrinting">
        <v-list-item-title>Shutdown</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">$power</v-icon>
        </v-list-item-icon>
      </v-list-item>

    </v-list-group>
    <v-list-group
      prepend-icon="$restart"
      no-action>
      <template v-slot:activator>
        <v-list-item-content>
          <v-list-item-title>Services</v-list-item-title>
        </v-list-item-content>
      </template>
      <v-list-item @click="serviceRestartMoonraker"
        :disabled="printerPrinting">
        <v-list-item-title>Restart Moonraker</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="warning">$restart</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item
        @click="serviceRestartKlipper"
        :disabled="printerPrinting">
        <v-list-item-title>Restart Klipper</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">$restartAlert</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item
        @click="serviceFirmwareRestartKlippy"
        :disabled="printerPrinting">
        <v-list-item-title>Restart MCU(s)</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">$restartAlert</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <!-- <v-list-item @click="serverRestart">
        <v-list-item-title>Server Restart</v-list-item-title>
        <v-list-item-icon>
          <v-icon>$restartAlert</v-icon>
        </v-list-item-icon>
      </v-list-item> -->
    </v-list-group>

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

  hostReboot (val: boolean) {
    if (val) {
      SocketActions.machineReboot()
      this.$emit('click')
    }
  }

  hostShutdown (val: boolean) {
    if (val) {
      SocketActions.machineShutdown()
      this.$emit('click')
    }
  }

  serviceRestartKlipper () {
    SocketActions.printerRestart()
    this.$emit('click')
  }

  serviceFirmwareRestartKlippy () {
    SocketActions.printerFirmwareRestart()
    this.$emit('click')
  }

  serviceRestartMoonraker () {
    SocketActions.serverRestart()
    this.$emit('click')
  }
}
</script>
