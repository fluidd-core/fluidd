<template>
  <div>
    <v-tooltip right
      v-if="!klippyConnected"
    >
      <template v-slot:activator="{ on, attrs }">
        <btn
          v-on="on"
          v-bind="attrs"
          block
          color="primary"
          @click="serviceRestartKlipper"
          class="me-2 mb-2"
        >
          {{ $t('app.general.btn.restart_service_klipper') }}
        </btn>
      </template>
      <span>Restarts the klipper system service.</span>
    </v-tooltip>

    <v-tooltip right
      v-if="klippyConnected"
    >
      <template v-slot:activator="{ on, attrs }">
        <btn
          v-on="on"
          v-bind="attrs"
          block
          color="primary"
          @click="restartKlippy"
          class="me-2 mb-2"
        >
          {{ $t('app.general.btn.restart_service_klipper') }}
        </btn>
      </template>
      <span>Reloads klipper configuration.</span>
    </v-tooltip>

    <v-tooltip right
      v-if="klippyConnected"
    >
      <template v-slot:activator="{ on, attrs }">
        <btn
          v-on="on"
          v-bind="attrs"
          block
          color="primary"
          @click="firmwareRestartKlippy"
          class="me-2 mb-2"
        >
      {{ $t('app.general.btn.restart_firmware') }}
    </btn>
      </template>
      <span>Reloads klipper configuration and restarts MCU's.</span>
    </v-tooltip>

    <btn
      block
      @click="getKlippyLog()"
      class="me-2 mb-2"
    >
      <v-icon left small>$download</v-icon>
      Klippy.log
    </btn>

    <btn
      block
      @click="getMoonrakerLog()"
      class="me-2 mb-2"
    >
      <v-icon left small>$download</v-icon>
      Moonraker.log
    </btn>
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
