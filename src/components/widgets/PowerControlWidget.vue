<template>
  <v-card-text class="d-flex flex-wrap align-center justify-start pt-5">
    <v-btn
      v-for="(device, index) in devices"
      :key="index"
      :disabled="(device.status === 'error' || device.status === 'init')"
      @click="toggleDevice(device, `${waits.onDevicePowerToggle}${device.device}`)"
      :loading="hasWait(`${waits.onDevicePowerToggle}${device.device}`)"
      :color="(device.status === 'error') ? 'error' : 'secondary'"
      class="me-2 mb-2">
      {{ buttonText(device) }}
    </v-btn>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'
import { SocketActions } from '@/socketActions'
import { Device } from '@/store/devicePower/types'

@Component({})
export default class PowerControlWidget extends Mixins(UtilsMixin) {
  waits = Waits

  get devices () {
    return this.$store.state.devicePower.devices
  }

  buttonText (device: Device): string {
    switch (device.status) {
      case 'error': {
        return `${device.device} [error]`
      }
      case 'init': {
        return `${device.device} [init]`
      }
      case 'on': {
        return `Toggle ${device.device} off`
      }
      case 'off': {
        return `Toggle ${device.device} on`
      }
    }
  }

  toggleDevice (device: Device, wait?: string) {
    const state = (device.status === 'on') ? 'off' : 'on'
    SocketActions.machineDevicePowerToggle(device.device, state, wait)
  }
}
</script>
