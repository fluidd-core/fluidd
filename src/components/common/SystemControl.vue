<template>
  <div>
    <template v-if="klippyConnected">
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            block
            color="primary"
            class="mb-2"
            v-on="on"
            @click="restartKlippy"
          >
            {{ $t('app.general.btn.restart_service_klipper') }}
          </app-btn>
        </template>
        <span>{{ $t('app.general.tooltip.reload_klipper') }}</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            block
            color="primary"
            class="mb-2"
            v-on="on"
            @click="firmwareRestartKlippy"
          >
            {{ $t('app.general.btn.restart_firmware') }}
          </app-btn>
        </template>
        <span>{{ $t('app.general.tooltip.reload_restart_klipper') }}</span>
      </v-tooltip>
    </template>

    <template v-else-if="printerPoweredOff">
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            block
            color="primary"
            class="mb-2"
            v-on="on"
            @click="printerPowerOn"
          >
            {{ $t('app.general.btn.power_on_printer') }}
          </app-btn>
        </template>
        <span>{{ $t('app.general.tooltip.power_on_printer') }}</span>
      </v-tooltip>
    </template>

    <template v-else>
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            block
            color="primary"
            class="mb-2"
            v-on="on"
            @click="serviceRestartKlipper"
          >
            {{ $t('app.general.btn.restart_service_klipper') }}
          </app-btn>
        </template>
        <span>{{ $t('app.general.tooltip.restart_klipper') }}</span>
      </v-tooltip>
    </template>

    <app-btn
      block
      class="me-2 mb-2"
      @click="getKlippyLog()"
    >
      <v-icon
        left
        small
      >
        $download
      </v-icon>
      Klippy.log
    </app-btn>

    <app-btn
      block
      class="me-2"
      @click="getMoonrakerLog()"
    >
      <v-icon
        left
        small
      >
        $download
      </v-icon>
      Moonraker.log
    </app-btn>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import StateMixin from '@/mixins/state'
import ServicesMixin from '@/mixins/services'
import { SocketActions } from '@/api/socketActions'

@Component({})
export default class SystemControl extends Mixins(StateMixin, FilesMixin, ServicesMixin) {
  getKlippyLog () {
    this.downloadFile('klippy.log', '')
  }

  getMoonrakerLog () {
    this.downloadFile('moonraker.log', '')
  }

  printerPowerOn () {
    const printerPowerDevice: string = this.$typedState.config.uiSettings.general.printerPowerDevice ?? 'printer'

    SocketActions.machineDevicePowerSetDevice(printerPowerDevice, 'on')
  }
}
</script>
