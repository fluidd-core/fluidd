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
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.btn.reboot') }}</v-list-item-title>
        </v-list-item-content>
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
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.btn.shutdown') }}</v-list-item-title>
        </v-list-item-content>
        <v-list-item-icon>
          <v-icon color="error">
            $power
          </v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list-group>

    <v-list-group
      v-if="devicePowerComponentEnabled && powerDevices.length"
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
        <v-list-item-content>
          <v-list-item-title>{{ getPowerButtonText(device) }}</v-list-item-title>
        </v-list-item-content>
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
            <app-btn
              v-if="service.active_state === 'inactive'"
              icon
              @click="checkDialog(serviceStart, service, 'start')"
            >
              <v-icon>$play</v-icon>
            </app-btn>
            <app-btn
              v-else
              icon
              @click="checkDialog(serviceRestart, service, 'restart')"
            >
              <v-icon color="warning">
                $restart
              </v-icon>
            </app-btn>
            <app-btn
              icon
              :disabled="service.active_state === 'inactive'"
              :style="service.name === moonrakerServiceName ? 'visibility: hidden;' : ''"
              @click="checkDialog(serviceStop, service, 'stop')"
            >
              <v-icon color="error">
                $stop
              </v-icon>
            </app-btn>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list-group>

    <v-divider />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import type { Device } from '@/store/power/types'
import StateMixin from '@/mixins/state'
import ServicesMixin from '@/mixins/services'
import { SocketActions } from '@/api/socketActions'
import type { ServerInfo, ServiceInfo, SystemInfo } from '@/store/server/types'

@Component({})
export default class SystemCommands extends Mixins(StateMixin, ServicesMixin) {
  get serverInfo (): ServerInfo {
    return this.$store.getters['server/getInfo'] as ServerInfo
  }

  get hosted (): boolean {
    return this.$store.state.config.hostConfig.hosted
  }

  get powerDevices (): Device[] {
    return this.$store.getters['power/getDevices'] as Device[]
  }

  get devicePowerComponentEnabled (): boolean {
    return this.$store.getters['server/componentSupport']('power') as boolean
  }

  get services (): ServiceInfo[] {
    const services = this.$store.getters['server/getServices'] as ServiceInfo[]

    return services
      .filter(service => service.name !== 'klipper_mcu')
  }

  get systemInfo (): SystemInfo | null {
    return this.$store.getters['server/getSystemInfo'] as SystemInfo | null
  }

  get canControlHost (): boolean {
    return this.systemInfo?.virtualization?.virt_type !== 'container'
  }

  async checkDialog (executableFunction: (service: ServiceInfo) => Promise<unknown>, service: ServiceInfo, action: string) {
    const result = (
      !(
        this.printerPrinting ||
        ['restart', 'stop'].includes(action)
      ) ||
      await this.$confirm(
        this.$t(
          `app.general.simple_form.msg.confirm_service_${action}`,
          { name: service.name })?.toString(),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
    )

    if (result) {
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

  async handleHostReboot () {
    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_reboot_host'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      this.$emit('click')
      this.hostReboot()
    }
  }

  async handleHostShutdown () {
    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_shutdown_host'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      this.$emit('click')
      this.hostShutdown()
    }
  }

  async togglePowerDevice (device: Device, wait?: string) {
    const confirmOnPowerDeviceChange: boolean = this.$store.state.config.uiSettings.general.confirmOnPowerDeviceChange

    const result = (
      !confirmOnPowerDeviceChange ||
      await this.$confirm(
        this.$tc('app.general.simple_form.msg.confirm_power_device_toggle'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
    )

    if (result) {
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
