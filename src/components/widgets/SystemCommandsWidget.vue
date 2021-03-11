<template>
  <div>
    <v-list-group
      prepend-icon="$host"
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
      v-if="devicePowerPluginEnabled"
      prepend-icon="$power"
      no-action>
      <template v-slot:activator>
        <v-list-item-content>
          <v-list-item-title>Power Plugin</v-list-item-title>
        </v-list-item-content>
      </template>

      <v-list-item
        v-for="(device, index) in powerDevices"
        :key="index"
        :disabled="(device.status === 'error' || device.status === 'init' || (printerPrinting && device.locked_while_printing))"
        @click="togglePowerDevice(device, `${waits.onDevicePowerToggle}${device.device}`)"
        :loading="hasWait(`${waits.onDevicePowerToggle}${device.device}`)"
      >
        <v-list-item-title>{{ getPowerButtonText(device) }}</v-list-item-title>
        <v-list-item-icon>
          <v-icon>{{ getPowerIcon(device) }}</v-icon>
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

      <v-list-item @click="serviceRestartMoonraker(); $emit('click')"
        :disabled="printerPrinting">
        <v-list-item-title>Restart Moonraker</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="warning">$restart</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item
        v-if="!klippyConnected"
        @click="serviceRestartKlipper(); $emit('click')"
        :disabled="printerPrinting">
        <v-list-item-title>Restart Klipper</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">$restartAlert</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item
        v-if="klippyConnected"
        @click="restartKlippy(); $emit('click')"
        :disabled="printerPrinting">
        <v-list-item-title>Restart Klipper</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">$restartAlert</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item
        v-if="klippyConnected"
        @click="firmwareRestartKlippy(); $emit('click')"
        :disabled="printerPrinting">
        <v-list-item-title>Firmware Restart Klipper</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">$restartAlert</v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list-group>

    <dialog-confirm
      v-model="confirmRebootDialog.open"
      @confirm="handleHostReboot">
      <p>Are you sure? This will reboot your host system.</p>
    </dialog-confirm>

    <dialog-confirm
      v-model="confirmShutdownDialog.open"
      @confirm="handleHostShutdown">
      <p>Are you sure? This will shutdown your host system.</p>
    </dialog-confirm>

  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ServicesMixin from '@/mixins/services'
import { SocketActions } from '@/socketActions'
import DialogConfirm from '@/components/dialogs/dialogConfirm.vue'
import { Device } from '@/store/devicePower/types'

@Component({
  components: {
    DialogConfirm
  }
})
export default class SystemCommandsWidget extends Mixins(StateMixin, ServicesMixin) {
  confirmRebootDialog = {
    open: false
  }

  confirmShutdownDialog = {
    open: false
  }

  get serverInfo () {
    return this.$store.getters['server/getInfo']
  }

  get hosted () {
    return this.$store.state.config.hostConfig.hosted
  }

  get powerDevices () {
    return this.$store.state.devicePower.devices
  }

  get devicePowerPluginEnabled () {
    return (this.serverInfo.plugins.includes('power'))
  }

  handleHostReboot (val: boolean) {
    if (val) {
      this.$emit('click')
      this.hostReboot()
    }
  }

  handleHostShutdown (val: boolean) {
    if (val) {
      this.$emit('click')
      this.hostShutdown()
    }
  }

  togglePowerDevice (device: Device, wait?: string) {
    const state = (device.status === 'on') ? 'off' : 'on'
    SocketActions.machineDevicePowerToggle(device.device, state, wait)
  }

  getPowerIcon (device: Device) {
    switch (device.status) {
      case 'error': {
        return '$alert'
      }
      case 'init': {
        return '$dots'
      }
      case 'on': {
        return '$powerOn'
      }
      case 'off': {
        return '$powerOff'
      }
    }
  }

  getPowerButtonText (device: Device): string {
    switch (device.status) {
      case 'error': {
        return `${device.device} [error]`
      }
      default: {
        return `${device.device}`
      }
    }
  }
}
</script>
