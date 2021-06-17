<template>
  <div>
    <div v-if="klippyConnected">
      <v-tooltip
        bottom
      >
        <template v-slot:activator="{ on, attrs }">
          <app-btn
            v-on="on"
            v-bind="attrs"
            block
            color="primary"
            @click="restartKlippy"
            class="me-2 mb-2"
          >
            {{ $t('app.general.btn.restart_service_klipper') }}
          </app-btn>
        </template>
        <span>{{ $t('app.general.tooltip.reload_klipper') }}</span>
      </v-tooltip>
    </div>

    <div v-else>
      <v-tooltip
        bottom
      >
        <template v-slot:activator="{ on, attrs }">
          <app-btn
            v-on="on"
            v-bind="attrs"
            block
            color="primary"
            @click="serviceRestartKlipper"
            class="me-2 mb-2"
          >
            {{ $t('app.general.btn.restart_service_klipper') }}
          </app-btn>
        </template>
        <span>{{ $t('app.general.tooltip.restart_klipper') }}</span>
      </v-tooltip>
    </div>

    <div v-if="klippyConnected">
      <v-tooltip
        bottom
      >
        <template v-slot:activator="{ on, attrs }">
          <app-btn
            v-on="on"
            v-bind="attrs"
            block
            color="primary"
            @click="firmwareRestartKlippy"
            class="me-2 mb-2"
          >
            {{ $t('app.general.btn.restart_firmware') }}
          </app-btn>
        </template>
        <span>{{ $t('app.general.tooltip.reload_restart_klipper') }}</span>
      </v-tooltip>
    </div>

    <app-btn
      block
      @click="getKlippyLog()"
      class="me-2 mb-2"
    >
      <v-icon left small>$download</v-icon>
      Klippy.log
    </app-btn>

    <app-btn
      block
      @click="getMoonrakerLog()"
      class="me-2 mb-2"
    >
      <v-icon left small>$download</v-icon>
      Moonraker.log
    </app-btn>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import StateMixin from '@/mixins/state'
import ServicesMixin from '@/mixins/services'

@Component({})
export default class SystemControl extends Mixins(StateMixin, FilesMixin, ServicesMixin) {
  getKlippyLog () {
    this.downloadFile('klippy.log', '')
  }

  getMoonrakerLog () {
    this.downloadFile('moonraker.log', '')
  }
}
</script>
