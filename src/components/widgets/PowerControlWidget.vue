<template>
  <v-card-text class="d-flex flex-wrap align-center justify-start pt-5">
    <v-btn
      v-for="(device, index) in devices"
      :key="index"
      @click="toggleDevice(device, `${waits.onGpio}${device.id}`)"
      :loading="hasWait(`${waits.onGpio}${device.id}`)"
      color="secondary"
      class="me-2 mb-2">Toggle {{ device.name }} {{ (device.state === 1) ? 'Off' : 'On' }}</v-btn>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'
import { SocketActions } from '@/socketActions'
import { Device } from '@/store/gpio/types'

@Component({})
export default class PowerControlWidget extends Mixins(UtilsMixin) {
  waits = Waits

  get devices () {
    return this.$store.state.gpio.devices
  }

  toggleDevice (device: Device, wait?: string) {
    const state = (device.state === 1) ? 0 : 1
    if (wait) this.$store.dispatch('socket/addWait', wait)
    SocketActions.machineGpioPowerToggle(device.id, state, wait)
  }
}
</script>
