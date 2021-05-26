<template>
  <div>
    <v-list-group
      prepend-icon="$host"
      no-action>
      <template v-slot:activator>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.label.host') }}</v-list-item-title>
        </v-list-item-content>
      </template>

      <v-list-item
        @click="handleHostReboot"
        :disabled="printerPrinting">
        <v-list-item-title>{{ $t('app.general.btn.reboot') }}</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">$powerCycle</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item
        @click="handleHostShutdown"
        :disabled="printerPrinting">
        <v-list-item-title>{{ $t('app.general.btn.shutdown') }}</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">$power</v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list-group>

    <v-list-group
      v-if="devicePowerComponentEnabled"
      prepend-icon="$power"
      no-action>
      <template v-slot:activator>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.label.power') }}</v-list-item-title>
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
          <v-list-item-title>{{ $t('app.general.label.services') }}</v-list-item-title>
        </v-list-item-content>
      </template>

      <v-list-item @click="serviceRestartMoonraker(); $emit('click')"
        :disabled="printerPrinting">
        <v-list-item-title class="text-wrap">{{ $t('app.general.btn.restart_service_moonraker') }}</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="warning">$restart</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item @click="serviceRestartKlipper(); $emit('click')"
        :disabled="printerPrinting">
        <v-list-item-title class="text-wrap">{{ $t('app.general.btn.restart_service_klipper') }}</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="warning">$restart</v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item @click="serviceRestartWebcam(); $emit('click')">
        <v-list-item-title class="text-wrap">{{ $t('app.general.btn.restart_service_webcamd') }}</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="warning">$restart</v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list-group>

    <v-divider></v-divider>

  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { Device } from '@/store/power/types'
import StateMixin from '@/mixins/state'
import ServicesMixin from '@/mixins/services'
import { SocketActions } from '@/api/socketActions'

@Component({})
export default class SystemCommands extends Mixins(StateMixin, ServicesMixin) {
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
    return this.$store.state.power.devices
  }

  get devicePowerComponentEnabled () {
    return this.$store.getters['server/componentSupport']('power')
  }

  handleHostReboot () {
    this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_reboot_host'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        if (res) {
          this.$emit('click')
          this.hostReboot()
        }
      })
  }

  handleHostShutdown () {
    this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_shutdown_host'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        if (res) {
          this.$emit('click')
          this.hostShutdown()
        }
      })
  }

  togglePowerDevice (device: Device, wait?: string) {
    const state = (device.status === 'on') ? 'off' : 'on'
    SocketActions.machineDevicePowerToggle(device.device, state, wait)
  }

  getPowerIcon (device: Device) {
    switch (device.status) {
      case 'error': {
        return '$error'
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
