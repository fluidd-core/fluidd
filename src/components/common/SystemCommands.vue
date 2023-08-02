<template>
  <div>
    <v-list-group
      v-if="canControlHost"
      prepend-icon="$host"
      no-action
    >
      <template #activator>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.label.host') }}</v-list-item-title>
        </v-list-item-content>
      </template>

      <v-list-item
        :disabled="printerPrinting"
        @click="handleHostReboot"
      >
        <v-list-item-title>{{ $t('app.general.btn.reboot') }}</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">
            $powerCycle
          </v-icon>
        </v-list-item-icon>
      </v-list-item>

      <v-list-item
        :disabled="printerPrinting"
        @click="handleHostShutdown"
      >
        <v-list-item-title>{{ $t('app.general.btn.shutdown') }}</v-list-item-title>
        <v-list-item-icon>
          <v-icon color="error">
            $power
          </v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list-group>

    <v-list-group
      v-if="devicePowerComponentEnabled"
      prepend-icon="$power"
      no-action
    >
      <template #activator>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.label.power') }}</v-list-item-title>
        </v-list-item-content>
      </template>

      <v-list-item
        v-for="(device, index) in powerDevices"
        :key="index"
        :disabled="(device.status === 'error' || device.status === 'init' || (printerPrinting && device.locked_while_printing))"
        :loading="hasWait(`${$waits.onDevicePowerToggle}${device.device}`)"
        @click="togglePowerDevice(device, `${$waits.onDevicePowerToggle}${device.device}`)"
      >
        <v-list-item-title>{{ getPowerButtonText(device) }}</v-list-item-title>
        <v-list-item-icon>
          <v-icon>{{ getPowerIcon(device) }}</v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list-group>

    <v-list-group
      prepend-icon="$restart"
      no-action
    >
      <template #activator>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.label.services') }}</v-list-item-title>
        </v-list-item-content>
      </template>
      <template v-for="service in services">
        <v-list-item
          :key="service.name"
        >
          <v-list-item-content>
            <v-list-item-title>
              <v-tooltip left>
                <template #activator="{ on, attrs }">
                  <span
                    v-bind="attrs"
                    class="text-wrap"
                    style="text-transform: capitalize;"
                    v-on="on"
                  >{{ service.name }}</span>
                </template>
                <span style="text-transform: capitalize;">{{ service.active_state }} ({{ service.sub_state }})</span>
              </v-tooltip>
            </v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn
              v-if="service.active_state === 'inactive'"
              icon
              @click="checkDialog(serviceStart, service, 'start')"
            >
              <v-icon>$play</v-icon>
            </v-btn>
            <v-btn
              v-else
              icon
              @click="checkDialog(serviceRestart, service, 'restart')"
            >
              <v-icon color="warning">
                $restart
              </v-icon>
            </v-btn>
            <v-btn
              icon
              :disabled="service.active_state === 'inactive'"
              :style="service.name === moonrakerServiceName ? 'visibility: hidden;' : ''"
              @click="checkDialog(serviceStop, service, 'stop')"
            >
              <v-icon color="error">
                $stop
              </v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list-group>

    <v-divider />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { Device } from '@/store/power/types'
import StateMixin from '@/mixins/state'
import ServicesMixin from '@/mixins/services'
import { SocketActions } from '@/api/socketActions'
import { ServiceInfo, SystemInfo } from '@/store/server/types'

@Component({})
export default class SystemCommands extends Mixins(StateMixin, ServicesMixin) {
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

  get services () {
    return this.$store.getters['server/getServices'].filter((service: ServiceInfo) => service.name !== 'klipper_mcu')
  }

  get systemInfo (): SystemInfo | null {
    return this.$store.getters['server/getSystemInfo']
  }

  get canControlHost () {
    return this.systemInfo?.virtualization?.virt_type !== 'container'
  }

  async checkDialog (executableFunction: any, service: ServiceInfo, action: string) {
    if (this.printerPrinting || ['restart', 'stop'].includes(action)) {
      const res = await this.$confirm(
        this.$t(
          `app.general.simple_form.msg.confirm_service_${action}`,
          { name: service.name })?.toString(),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
      if (res) {
        this.$emit('click')
        await executableFunction(service)
      }
    } else {
      this.$emit('click')
      await executableFunction(service)
    }
  }

  async serviceRestart (service: ServiceInfo) {
    await this.serviceRestartByName(service.name)
  }

  async serviceStart (service: ServiceInfo) {
    await this.serviceStartByName(service.name)
  }

  async serviceStop (service: ServiceInfo) {
    await this.serviceStopByName(service.name)
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

  async togglePowerDevice (device: Device, wait?: string) {
    const confirmOnPowerDeviceChange = this.$store.state.config.uiSettings.general.confirmOnPowerDeviceChange
    let res: boolean | undefined = true
    if (confirmOnPowerDeviceChange) {
      res = await this.$confirm(
        this.$tc('app.general.simple_form.msg.confirm_power_device_toggle'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
    }
    if (res) {
      const state = (device.status === 'on') ? 'off' : 'on'
      SocketActions.machineDevicePowerToggle(device.device, state, wait)
    }
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

<style lang="scss" scoped>
  :deep(.v-list-item__action--stack ) {
    margin: 2px 0;
    margin-right: -6px;
    flex-direction: row;
    align-items: center;
  }
</style>
